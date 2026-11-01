'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin, requireOwner } from '@/lib/admin-auth';
import { toWhatsAppNumber } from '@/lib/phone';
import { slugify } from '@/lib/slug';
import { serviceClient, sessionClient } from '@/lib/supabase/clients';
import { ORDER_STATUSES, type OrderStatus } from '@/lib/types';

/* eslint-disable @typescript-eslint/no-explicit-any */

// ---------- helpers ----------
const S = (fd: FormData, k: string): string => (typeof fd.get(k) === 'string' ? (fd.get(k) as string).trim() : '');
const B = (fd: FormData, k: string): boolean => fd.get(k) === 'on' || fd.get(k) === 'true';
function N(fd: FormData, k: string, label: string, min = 0, max = 100_000_000): number {
  const raw = S(fd, k).replace(/[, ]/g, '');
  const n = Number(raw);
  if (raw === '' || !Number.isInteger(n) || n < min || n > max) throw new UserError(`${label} must be a whole number${min > 0 ? ` of at least ${min}` : ''}.`);
  return n;
}
class UserError extends Error {}

function go(path: string, kind: 'ok' | 'error', msg: string): never {
  redirect(`${path}${path.includes('?') ? '&' : '?'}${kind}=${encodeURIComponent(msg)}`);
}
function friendly(e: unknown): string {
  const m = e instanceof Error ? e.message : String(e);
  const map: [RegExp, string][] = [
    [/deposit_not_received/, 'This order needs its deposit marked as received before it can be prepared or sent.'],
    [/order_not_approved/, 'Approve (confirm) the order first.'],
    [/invalid_status_transition/, 'That status change is not allowed from the current status.'],
    [/violates foreign key/, 'This item is still used elsewhere and cannot be deleted. Hide it instead.'],
    [/duplicate key/, 'That already exists.'],
    [/check constraint/, 'One of the values is not allowed (for example a sale price that is not lower than the normal price).'],
    [/row-level security|permission denied/, 'You do not have permission to do that.'],
  ];
  return map.find(([re]) => re.test(m))?.[1] ?? (e instanceof UserError ? m : `Could not save: ${m}`);
}
function refresh() {
  revalidateTag('catalog');
  revalidateTag('reviews');
  revalidatePath('/', 'layout');
}
/** Runs an admin action: checks the user is an admin, runs the work, then redirects back with a message. */
async function run(
  back: string,
  okMsg: string,
  work: (sb: Awaited<ReturnType<typeof sessionClient>>, admin: Awaited<ReturnType<typeof requireAdmin>>) => Promise<string | void>,
  opts: { owner?: boolean; refresh?: boolean } = {}
): Promise<never> {
  const admin = opts.owner ? await requireOwner() : await requireAdmin();
  const sb = await sessionClient();
  let msg = okMsg;
  try {
    const r = await work(sb, admin);
    if (typeof r === 'string') msg = r;
    if (opts.refresh) refresh();
  } catch (e) {
    return go(back, 'error', friendly(e));
  }
  return go(back, 'ok', msg);
}
const must = (r: { error: { message: string } | null }) => {
  if (r.error) throw new Error(r.error.message);
};

// ---------- products ----------
async function uploadImages(sb: Awaited<ReturnType<typeof sessionClient>>, files: FormDataEntryValue[]): Promise<string[]> {
  const real = files.filter((f): f is File => typeof f !== 'string' && f.size > 0);
  if (real.length === 0) return [];
  const sharp = (await import('sharp')).default;
  const urls: string[] = [];
  for (const f of real.slice(0, 8)) {
    if (f.size > 8 * 1024 * 1024) throw new UserError(`"${f.name}" is larger than 8 MB.`);
    if (!f.type.startsWith('image/')) throw new UserError(`"${f.name}" is not an image.`);
    const out = await sharp(Buffer.from(await f.arrayBuffer())).rotate().resize(1200, 1200, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
    const up = await sb.storage.from('product-images').upload(name, out, { contentType: 'image/webp' });
    if (up.error) throw new UserError(`Photo upload failed: ${up.error.message}. Did you run supabase/schema.sql (it creates the "product-images" bucket)?`);
    urls.push(sb.storage.from('product-images').getPublicUrl(name).data.publicUrl);
  }
  return urls;
}

export async function saveProduct(fd: FormData) {
  const id = S(fd, 'id');
  const back = id ? `/admin/products/${id}` : '/admin/products/new';
  await run(back, 'Product saved.', async (sb) => {
    const name_en = S(fd, 'name_en');
    const name_ar = S(fd, 'name_ar');
    if (!name_en || !name_ar) throw new UserError('Please enter the product name in English and in Arabic.');
    if (!S(fd, 'category_id')) throw new UserError('Please choose a category.');
    const price = N(fd, 'price_iqd', 'Price');
    const sale = S(fd, 'sale_price_iqd') === '' ? null : N(fd, 'sale_price_iqd', 'Sale price');
    if (sale !== null && sale >= price) throw new UserError('The sale price must be lower than the normal price.');
    const endsRaw = S(fd, 'sale_ends_at');
    const row: Record<string, unknown> = {
      category_id: S(fd, 'category_id'),
      name_en, name_ar,
      description_en: S(fd, 'description_en'),
      description_ar: S(fd, 'description_ar'),
      price_iqd: price,
      sale_price_iqd: sale,
      sale_ends_at: sale !== null && endsRaw ? new Date(`${endsRaw}T23:59:59+03:00`).toISOString() : null,
      stock: N(fd, 'stock', 'Stock'),
      featured: B(fd, 'featured'),
      best_seller: B(fd, 'best_seller'),
      is_active: B(fd, 'is_active'),
      promo_label_en: S(fd, 'promo_label_en') || null,
      promo_label_ar: S(fd, 'promo_label_ar') || null,
    };
    const cost = N(fd, 'cost_iqd', 'Cost');
    const keep = fd.getAll('keep_image').filter((x): x is string => typeof x === 'string');
    const added = await uploadImages(sb, fd.getAll('new_images'));
    row.images = [...keep, ...added];

    let productId = id;
    if (id) {
      must(await sb.from('products').update(row).eq('id', id));
    } else {
      let slug = slugify(name_en);
      for (let attempt = 0; attempt < 3; attempt++) {
        const r = await sb.from('products').insert({ ...row, slug }).select('id').single();
        if (!r.error) { productId = r.data.id; break; }
        if (!/duplicate key/.test(r.error.message)) throw new Error(r.error.message);
        slug = `${slugify(name_en)}-${Math.random().toString(36).slice(2, 6)}`;
      }
      if (!productId) throw new UserError('Could not create a unique web address for this product. Try a different name.');
    }
    must(await sb.from('product_costs').upsert({ product_id: productId, cost_iqd: cost }));
    if (!id) go(`/admin/products/${productId}`, 'ok', 'Product created.');
  }, { refresh: true });
}

export async function quickEditProduct(fd: FormData) {
  await run('/admin/products', 'Saved.', async (sb) => {
    const price = N(fd, 'price_iqd', 'Price');
    const sale = S(fd, 'sale_price_iqd') === '' ? null : N(fd, 'sale_price_iqd', 'Sale price');
    if (sale !== null && sale >= price) throw new UserError('The sale price must be lower than the normal price.');
    must(await sb.from('products').update({ price_iqd: price, sale_price_iqd: sale, stock: N(fd, 'stock', 'Stock') }).eq('id', S(fd, 'id')));
  }, { refresh: true });
}

export async function deleteProduct(fd: FormData) {
  await run('/admin/products', 'Product deleted.', async (sb) => {
    must(await sb.from('products').delete().eq('id', S(fd, 'id')));
  }, { refresh: true });
}

// ---------- categories ----------
export async function saveCategory(fd: FormData) {
  await run('/admin/categories', 'Category saved.', async (sb) => {
    const id = S(fd, 'id');
    const name_en = S(fd, 'name_en');
    const name_ar = S(fd, 'name_ar');
    if (!name_en || !name_ar) throw new UserError('Please enter the category name in English and Arabic.');
    const row = {
      name_en, name_ar,
      description_en: S(fd, 'description_en') || null,
      description_ar: S(fd, 'description_ar') || null,
      color: ['pink', 'yellow', 'blue', 'purple'].includes(S(fd, 'color')) ? S(fd, 'color') : 'pink',
      sort_order: N(fd, 'sort_order', 'Order', 0, 1000),
      is_active: id ? B(fd, 'is_active') : true,
    };
    if (id) must(await sb.from('categories').update(row).eq('id', id));
    else must(await sb.from('categories').insert({ ...row, slug: slugify(name_en) }));
  }, { refresh: true });
}
export async function deleteCategory(fd: FormData) {
  await run('/admin/categories', 'Category deleted.', async (sb) => {
    must(await sb.from('categories').delete().eq('id', S(fd, 'id')));
  }, { refresh: true });
}

// ---------- orders ----------
export async function setOrderStatus(fd: FormData) {
  const id = S(fd, 'id');
  const status = S(fd, 'status') as OrderStatus;
  await run(`/admin/orders/${id}`, 'Order updated.', async (sb) => {
    if (!ORDER_STATUSES.includes(status)) throw new UserError('Unknown status.');
    must(await sb.from('orders').update({ status }).eq('id', id));
  }, { refresh: true });
}

export async function saveOrderDetails(fd: FormData) {
  const id = S(fd, 'id');
  await run(`/admin/orders/${id}`, 'Saved.', async (sb) => {
    const depositRequired = B(fd, 'deposit_required');
    must(await sb.from('orders').update({
      courier_id: S(fd, 'courier_id') || null,
      tracking_note: S(fd, 'tracking_note') || null,
      admin_notes: S(fd, 'admin_notes') || null,
      deposit_required: depositRequired,
      deposit_amount_iqd: depositRequired ? N(fd, 'deposit_amount_iqd', 'Deposit', 0) : 0,
      deposit_received: depositRequired && B(fd, 'deposit_received'),
    }).eq('id', id));
  });
}

export async function recordFailedDelivery(fd: FormData) {
  const id = S(fd, 'id');
  await run(`/admin/orders/${id}`, 'Failed delivery recorded.', async (sb, admin) => {
    const o = await sb.from('orders').select('courier_id').eq('id', id).single();
    must(o);
    must(await sb.from('delivery_attempts').insert({ order_id: id, courier_id: o.data?.courier_id ?? null, outcome: 'failed', reason: S(fd, 'reason') || null, created_by: admin.userId }));
  });
}

// ---------- customers ----------
export async function saveCustomer(fd: FormData) {
  const id = S(fd, 'id');
  await run(`/admin/customers/${id}`, 'Customer saved.', async (sb) => {
    const flagged = B(fd, 'is_flagged');
    must(await sb.from('customers').update({
      is_flagged: flagged,
      flag_reason: flagged ? S(fd, 'flag_reason') || 'Flagged by admin' : null,
      is_blocked: B(fd, 'is_blocked'),
      admin_notes: S(fd, 'admin_notes') || null,
    }).eq('id', id));
  });
}

// ---------- delivery ----------
export async function saveDeliveryFee(fd: FormData) {
  await run('/admin/delivery', 'Delivery fee saved.', async (sb) => {
    must(await sb.from('delivery_fees').update({ fee_iqd: N(fd, 'fee_iqd', 'Fee'), is_active: B(fd, 'is_active') }).eq('code', S(fd, 'code')));
  }, { refresh: true });
}
export async function addDeliveryFee(fd: FormData) {
  await run('/admin/delivery', 'Governorate added.', async (sb) => {
    const en = S(fd, 'name_en'), ar = S(fd, 'name_ar');
    if (!en || !ar) throw new UserError('Enter the name in English and Arabic.');
    must(await sb.from('delivery_fees').insert({ code: slugify(en), name_en: en, name_ar: ar, fee_iqd: N(fd, 'fee_iqd', 'Fee'), sort_order: 100 }));
  }, { refresh: true });
}
export async function saveCourier(fd: FormData) {
  await run('/admin/delivery', 'Courier saved.', async (sb) => {
    const id = S(fd, 'id');
    if (!S(fd, 'name')) throw new UserError('Enter the courier name.');
    const row = { name: S(fd, 'name'), phone: S(fd, 'phone') || null, notes: S(fd, 'notes') || null, ...(id ? { is_active: B(fd, 'is_active') } : {}) };
    if (id) must(await sb.from('couriers').update(row).eq('id', id));
    else must(await sb.from('couriers').insert(row));
  });
}

// ---------- reviews ----------
export async function moderateReview(fd: FormData) {
  await run('/admin/reviews', 'Review updated.', async (sb) => {
    const id = S(fd, 'id');
    const action = S(fd, 'action');
    if (action === 'delete') must(await sb.from('reviews').delete().eq('id', id));
    else if (action === 'approved' || action === 'rejected' || action === 'pending') must(await sb.from('reviews').update({ status: action }).eq('id', id));
  }, { refresh: true });
}

// ---------- settings ----------
export async function saveSettings(fd: FormData) {
  await run('/admin/settings', 'Settings saved.', async (sb) => {
    const waRaw = S(fd, 'whatsapp_number');
    const wa = waRaw ? toWhatsAppNumber(waRaw) : null;
    if (waRaw && !wa) throw new UserError('That WhatsApp number does not look right. Example: 0770 123 4567 or +964 770 123 4567.');
    const url = (k: string, label: string) => {
      const v = S(fd, k);
      if (v && !/^https?:\/\//i.test(v)) throw new UserError(`${label} must start with https://`);
      return v || null;
    };
    must(await sb.from('store_settings').update({
      whatsapp_number: wa,
      contact_phone: S(fd, 'contact_phone') || null,
      contact_email: S(fd, 'contact_email') || null,
      address_en: S(fd, 'address_en') || null,
      address_ar: S(fd, 'address_ar') || null,
      instagram_url: url('instagram_url', 'Instagram link'),
      tiktok_url: url('tiktok_url', 'TikTok link'),
      facebook_url: url('facebook_url', 'Facebook link'),
      orders_enabled: B(fd, 'orders_enabled'),
      promo_active: B(fd, 'promo_active'),
      promo_title_en: S(fd, 'promo_title_en') || 'Little Toys. BIG Happiness!',
      promo_title_ar: S(fd, 'promo_title_ar') || 'ألعاب صغيرة. سعادة كبيرة!',
      promo_text_en: S(fd, 'promo_text_en'),
      promo_text_ar: S(fd, 'promo_text_ar'),
    }).eq('id', 1));
  }, { refresh: true });
}

export async function saveRules(fd: FormData) {
  await run('/admin/settings', 'Order protection rules saved.', async (sb) => {
    must(await sb.from('order_rules').update({
      max_qty_per_item: N(fd, 'max_qty_per_item', 'Max per product', 1, 1000),
      max_items_per_order: N(fd, 'max_items_per_order', 'Max items per order', 1, 10000),
      large_order_value_iqd: N(fd, 'large_order_value_iqd', 'Large order value', 1),
      large_order_items: N(fd, 'large_order_items', 'Large order items', 1, 10000),
      deposit_required_above_iqd: N(fd, 'deposit_required_above_iqd', 'Deposit threshold', 0),
      deposit_on_flagged: B(fd, 'deposit_on_flagged'),
      deposit_percent: N(fd, 'deposit_percent', 'Deposit percent', 1, 100),
      duplicate_window_minutes: N(fd, 'duplicate_window_minutes', 'Duplicate window', 0, 10080),
      max_orders_per_hour: N(fd, 'max_orders_per_hour', 'Orders per hour', 1, 100),
      many_pending_count: N(fd, 'many_pending_count', 'Pending orders warning', 1, 100),
    }).eq('id', 1));
  });
}

// ---------- team (owner only) ----------
export async function addStaff(fd: FormData) {
  await run('/admin/team', 'Staff account created. Share the email and password with them privately.', async (sb) => {
    const email = S(fd, 'email').toLowerCase();
    const password = S(fd, 'password');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new UserError('Enter a valid email address.');
    if (password.length < 10) throw new UserError('Use a password of at least 10 characters.');
    const created = await serviceClient().auth.admin.createUser({ email, password, email_confirm: true });
    if (created.error || !created.data.user) throw new UserError(created.error?.message ?? 'Could not create the account.');
    must(await sb.from('admin_users').insert({ user_id: created.data.user.id, email, role: 'staff' }));
  }, { owner: true });
}
export async function removeStaff(fd: FormData) {
  await run('/admin/team', 'Staff access removed.', async (sb, admin) => {
    const id = S(fd, 'user_id');
    if (id === admin.userId) throw new UserError('You cannot remove yourself.');
    must(await sb.from('admin_users').delete().eq('user_id', id));
  }, { owner: true });
}
