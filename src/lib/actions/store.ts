'use server';

import { revalidateTag } from 'next/cache';
import { canPlaceOrders, serviceClient } from '@/lib/supabase/clients';
import { normalizeIqPhone } from '@/lib/phone';
import { parseCartPayload, validateCheckout } from '@/lib/validation';
import type { PlaceOrderState, Receipt, ReviewState, TrackState } from '@/lib/action-types';

/* eslint-disable @typescript-eslint/no-explicit-any */

const str = (v: FormDataEntryValue | null): string => (typeof v === 'string' ? v : '');

/**
 * Places a Cash-on-Delivery order. Runs ONLY on the server:
 *  1. validates the form again (never trust the browser),
 *  2. calls the database function place_order(), which re-prices everything from the product table,
 *     checks stock, quantity limits, duplicates and fraud rules, and saves the order as "pending".
 * Nothing is ever pretended: if the database call fails, the customer is told the order was NOT placed.
 */
export async function placeOrderAction(_prev: PlaceOrderState, formData: FormData): Promise<PlaceOrderState> {
  if (!canPlaceOrders()) return { status: 'error', code: 'not_configured' };
  if (str(formData.get('website')).trim() !== '') return { status: 'error', code: 'generic' }; // honeypot (bots fill hidden fields)

  const checked = validateCheckout({
    name: str(formData.get('name')),
    phone: str(formData.get('phone')),
    governorate: str(formData.get('governorate')),
    city: str(formData.get('city')),
    address: str(formData.get('address')),
    notes: str(formData.get('notes')),
  });
  if (!checked.ok) return { status: 'error', code: 'validation', errors: checked.errors };

  const cart = parseCartPayload(formData.get('cart'));
  if (!cart) return { status: 'error', code: 'empty_cart' };
  const lang = str(formData.get('language')) === 'ar' ? 'ar' : 'en';

  try {
    const sb = serviceClient();
    const { data, error } = await sb.rpc('place_order', {
      p: { ...checked.value, language: lang, items: cart },
    });
    if (error) {
      console.error('[place_order] database error:', error.message);
      return { status: 'error', code: 'generic' };
    }
    const res = data as any;
    if (!res?.ok) {
      const params: Record<string, string | number> = {};
      const product = lang === 'ar' ? res?.product_ar ?? res?.product : res?.product;
      if (product != null) params.product = String(product);
      if (res?.available != null) params.available = Number(res.available);
      if (res?.limit != null) params.limit = Number(res.limit);
      if (res?.order_number != null) params.order = String(res.order_number);
      return { status: 'error', code: String(res?.error ?? 'generic'), params };
    }

    // Read the saved order back so the confirmation shows exactly what is in the database.
    const phone = normalizeIqPhone(checked.value.phone) as string;
    const saved = await sb.rpc('track_order', { p_order_number: res.order_number, p_phone: phone });
    const o = saved.data as any;
    revalidateTag('catalog'); // stock changed
    const receipt: Receipt = {
      number: res.order_number,
      name: checked.value.name,
      phone,
      governorate_en: o?.governorate_en ?? '',
      governorate_ar: o?.governorate_ar ?? '',
      city: checked.value.city,
      address: checked.value.address,
      items: (o?.items ?? []).map((i: any) => ({
        name_en: i.name_en,
        name_ar: i.name_ar,
        quantity: i.quantity,
        line_total: i.line_total,
      })),
      subtotal: res.subtotal,
      delivery_fee: res.delivery_fee,
      total: res.total,
      deposit_required: !!res.deposit_required,
      deposit_amount: Number(res.deposit_amount ?? 0),
    };
    return { status: 'success', receipt };
  } catch (e) {
    console.error('[place_order] unexpected error:', e);
    return { status: 'error', code: 'generic' };
  }
}

/** Order tracking: needs BOTH the order number and the phone number used. */
export async function trackOrderAction(_prev: TrackState, formData: FormData): Promise<TrackState> {
  if (!canPlaceOrders()) return { status: 'error' };
  const number = str(formData.get('order')).trim().toUpperCase().slice(0, 30);
  const phone = normalizeIqPhone(str(formData.get('phone')));
  if (!number || !phone) return { status: 'not_found' };
  try {
    const { data, error } = await serviceClient().rpc('track_order', { p_order_number: number, p_phone: phone });
    if (error) {
      console.error('[track_order] database error:', error.message);
      return { status: 'error' };
    }
    const o = data as any;
    if (!o?.ok) return { status: 'not_found' };
    return {
      status: 'found',
      order: {
        number: o.order_number,
        state: o.status,
        created_at: o.created_at,
        subtotal: o.subtotal,
        delivery_fee: o.delivery_fee,
        total: o.total,
        governorate_en: o.governorate_en,
        governorate_ar: o.governorate_ar,
        deposit_required: !!o.deposit_required,
        deposit_amount: Number(o.deposit_amount ?? 0),
        deposit_received: !!o.deposit_received,
        items: (o.items ?? []).map((i: any) => ({
          name_en: i.name_en,
          name_ar: i.name_ar,
          quantity: i.quantity,
          line_total: i.line_total,
        })),
      },
    };
  } catch (e) {
    console.error('[track_order] unexpected error:', e);
    return { status: 'error' };
  }
}

/** Saves a customer review as "pending". It only appears on the site after an admin approves it. */
export async function submitReviewAction(_prev: ReviewState, formData: FormData): Promise<ReviewState> {
  if (!canPlaceOrders()) return { status: 'error', code: 'not_configured' };
  if (str(formData.get('website')).trim() !== '') return { status: 'error', code: 'generic' };
  try {
    const { data, error } = await serviceClient().rpc('submit_review', {
      p: {
        product_id: str(formData.get('product_id')),
        name: str(formData.get('name')),
        phone: str(formData.get('phone')),
        rating: str(formData.get('rating')),
        body: str(formData.get('body')),
      },
    });
    if (error) {
      console.error('[submit_review] database error:', error.message);
      return { status: 'error', code: 'generic' };
    }
    const res = data as any;
    if (!res?.ok) return { status: 'error', code: String(res?.error ?? 'generic') };
    return { status: 'success', verified: !!res.verified };
  } catch (e) {
    console.error('[submit_review] unexpected error:', e);
    return { status: 'error', code: 'generic' };
  }
}
