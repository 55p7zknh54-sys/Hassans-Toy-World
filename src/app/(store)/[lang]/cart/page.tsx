import type { Metadata } from 'next';
import { CartView } from '@/components/cart/CartView';
import { getDict } from '@/i18n';
import type { Lang } from '@/lib/types';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const lang = (await params).lang as Lang;
  return { title: getDict(lang).cart.title, robots: { index: false } };
}

export default async function CartPage({ params }: { params: Promise<{ lang: string }> }) {
  const lang = (await params).lang as Lang;
  return (
    <div className="container-page py-8 sm:py-12">
      <h1 className="mb-6 text-3xl sm:text-5xl">{getDict(lang).cart.title}</h1>
      <CartView />
    </div>
  );
}
