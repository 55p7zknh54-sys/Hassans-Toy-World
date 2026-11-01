import type { Metadata } from 'next';
import { CheckoutClient } from '@/components/checkout/CheckoutClient';
import { getDict } from '@/i18n';
import { getDeliveryFees, getSettings } from '@/lib/data';
import { canPlaceOrders } from '@/lib/supabase/clients';
import type { Lang } from '@/lib/types';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const lang = (await params).lang as Lang;
  return { title: getDict(lang).checkout.title, robots: { index: false } };
}

export default async function CheckoutPage({ params }: { params: Promise<{ lang: string }> }) {
  const lang = (await params).lang as Lang;
  const [fees, settings] = await Promise.all([getDeliveryFees(), getSettings()]);
  return (
    <div className="container-page py-8 sm:py-12">
      <h1 className="mb-6 text-3xl sm:text-5xl">{getDict(lang).checkout.title}</h1>
      <CheckoutClient fees={fees} whatsapp={settings.whatsapp_number} ordersOpen={canPlaceOrders() && settings.orders_enabled} />
    </div>
  );
}
