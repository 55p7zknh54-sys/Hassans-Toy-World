import { Card, Check, Field, Notice, PageHeader } from '@/components/admin/ui';
import { saveRules, saveSettings } from '@/lib/actions/admin';
import { sessionClient } from '@/lib/supabase/clients';

export const metadata = { title: 'Settings' };

export default async function SettingsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const sb = await sessionClient();
  const [{ data: s, error }, { data: r }] = await Promise.all([
    sb.from('store_settings').select('*').eq('id', 1).single(),
    sb.from('order_rules').select('*').eq('id', 1).single(),
  ]);
  if (!s || !r) return <Notice error={error?.message ?? 'Settings are missing. Run supabase/schema.sql first.'} />;
  const waDisplay = s.whatsapp_number ? `+${s.whatsapp_number}` : '';

  return (
    <>
      <PageHeader title="Settings" sub="Contact details, WhatsApp, the homepage banner and order protection." />
      <Notice ok={sp.ok} error={sp.error} />

      <form action={saveSettings} className="space-y-6">
        <Card title="Orders">
          <Check name="orders_enabled" label="Accept new orders" defaultChecked={s.orders_enabled} />
          <p className="text-sm text-navy-500">Untick this to pause ordering (for example during a holiday). Customers can still browse.</p>
        </Card>

        <Card title="WhatsApp, contact and social links">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="WhatsApp number" name="whatsapp_number" defaultValue={waDisplay} placeholder="+964 7XX XXX XXXX" hint="Shows the floating WhatsApp button and the “send my order on WhatsApp” option. Leave empty to hide them." dir="ltr" />
            <Field label="Contact phone (shown on the contact page)" name="contact_phone" defaultValue={s.contact_phone ?? ''} dir="ltr" />
            <Field label="Contact email" name="contact_email" type="email" defaultValue={s.contact_email ?? ''} dir="ltr" />
            <span />
            <Field label="Address / pickup point (English)" name="address_en" defaultValue={s.address_en ?? ''} />
            <Field label="Address (Arabic)" name="address_ar" dir="rtl" defaultValue={s.address_ar ?? ''} />
            <Field label="Instagram link" name="instagram_url" defaultValue={s.instagram_url ?? ''} placeholder="https://instagram.com/…" dir="ltr" />
            <Field label="TikTok link" name="tiktok_url" defaultValue={s.tiktok_url ?? ''} placeholder="https://tiktok.com/@…" dir="ltr" />
            <Field label="Facebook link" name="facebook_url" defaultValue={s.facebook_url ?? ''} placeholder="https://facebook.com/…" dir="ltr" />
          </div>
          <p className="mt-3 text-sm text-navy-500">Empty fields are simply hidden in the store — nothing fake is shown.</p>
        </Card>

        <Card title="Homepage promo banner">
          <Check name="promo_active" label="Show the banner" defaultChecked={s.promo_active} />
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Field label="Title (English)" name="promo_title_en" defaultValue={s.promo_title_en} />
            <Field label="Title (Arabic)" name="promo_title_ar" dir="rtl" defaultValue={s.promo_title_ar} />
            <Field label="Text (English)" name="promo_text_en" defaultValue={s.promo_text_en} />
            <Field label="Text (Arabic)" name="promo_text_ar" dir="rtl" defaultValue={s.promo_text_ar} />
          </div>
        </Card>
        <button type="submit" className="btn-primary min-h-14 text-lg">Save settings</button>
      </form>

      <form action={saveRules} className="mt-10 space-y-6">
        <Card title="Order protection (fake-order control)">
          <p className="mb-4 text-sm text-navy-500">Every order starts as <b>Pending</b> and cannot be prepared or shipped until you approve it. These rules decide what gets blocked or flagged for a closer look.</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Max of one product per order" name="max_qty_per_item" type="number" min={1} defaultValue={r.max_qty_per_item} />
            <Field label="Max items in one order" name="max_items_per_order" type="number" min={1} defaultValue={r.max_items_per_order} />
            <Field label="Max orders per phone per hour" name="max_orders_per_hour" type="number" min={1} defaultValue={r.max_orders_per_hour} />
            <Field label="Flag orders worth more than (IQD)" name="large_order_value_iqd" type="number" min={1} defaultValue={r.large_order_value_iqd} />
            <Field label="Flag orders with more items than" name="large_order_items" type="number" min={1} defaultValue={r.large_order_items} />
            <Field label="Warn when a phone has this many pending orders" name="many_pending_count" type="number" min={1} defaultValue={r.many_pending_count} />
            <Field label="Block identical repeat orders within (minutes)" name="duplicate_window_minutes" type="number" min={0} defaultValue={r.duplicate_window_minutes} hint="0 turns this off." />
          </div>
          <div className="mt-5 rounded-2xl bg-cream-dark p-4">
            <h3 className="font-display font-bold">Optional deposit</h3>
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Ask a deposit for orders above (IQD)" name="deposit_required_above_iqd" type="number" min={0} defaultValue={r.deposit_required_above_iqd} hint="0 = never." />
              <Field label="Deposit size (% of the total)" name="deposit_percent" type="number" min={1} max={100} defaultValue={r.deposit_percent} />
              <div className="pt-7"><Check name="deposit_on_flagged" label="Always ask a deposit from flagged customers" defaultChecked={r.deposit_on_flagged} /></div>
            </div>
          </div>
        </Card>
        <button type="submit" className="btn-navy min-h-14 text-lg">Save protection rules</button>
      </form>
    </>
  );
}
