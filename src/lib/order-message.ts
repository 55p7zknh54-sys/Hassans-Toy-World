import { formatIQD } from './format';
import type { Lang } from './types';

export const BRAND = { en: "Hassan's Toys World", ar: 'عالم حسن للألعاب' } as const;

export type OrderMessageInput = {
  lang: Lang;
  orderNumber: string;
  name: string;
  phone: string;
  governorate: string;
  city: string;
  address: string;
  items: { name: string; qty: number; lineTotal: number }[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  depositAmount?: number;
};

/** Plain-text order summary the customer can send to the shop on WhatsApp. */
export function buildOrderMessage(o: OrderMessageInput): string {
  const f = (n: number) => formatIQD(n, o.lang);
  const lines: string[] = [];
  if (o.lang === 'ar') {
    lines.push(`مرحباً ${BRAND.ar} 👋`, `أرغب بتأكيد طلبي رقم ${o.orderNumber}`, '');
    lines.push('🛍️ المنتجات:');
    o.items.forEach((i) => lines.push(`• ${i.name} × ${i.qty} = ${f(i.lineTotal)}`));
    lines.push('', `المجموع: ${f(o.subtotal)}`, `التوصيل: ${f(o.deliveryFee)}`, `الإجمالي عند الاستلام: ${f(o.total)}`);
    if (o.depositAmount) lines.push(`العربون المطلوب: ${f(o.depositAmount)}`);
    lines.push('', `👤 ${o.name}`, `📞 ${o.phone}`, `📍 ${o.governorate} - ${o.city}`, `🏠 ${o.address}`);
  } else {
    lines.push(`Hello ${BRAND.en} 👋`, `I'd like to confirm my order ${o.orderNumber}`, '');
    lines.push('🛍️ Items:');
    o.items.forEach((i) => lines.push(`• ${i.name} × ${i.qty} = ${f(i.lineTotal)}`));
    lines.push('', `Products: ${f(o.subtotal)}`, `Delivery: ${f(o.deliveryFee)}`, `Total (cash on delivery): ${f(o.total)}`);
    if (o.depositAmount) lines.push(`Deposit requested: ${f(o.depositAmount)}`);
    lines.push('', `👤 ${o.name}`, `📞 ${o.phone}`, `📍 ${o.governorate} - ${o.city}`, `🏠 ${o.address}`);
  }
  return lines.join('\n');
}

export function buildSupportMessage(lang: Lang, productName?: string): string {
  if (lang === 'ar') {
    return productName
      ? `مرحباً ${BRAND.ar} 👋 عندي سؤال عن: ${productName}`
      : `مرحباً ${BRAND.ar} 👋 أحتاج مساعدة بخصوص طلب أو منتج.`;
  }
  return productName
    ? `Hello ${BRAND.en} 👋 I have a question about: ${productName}`
    : `Hello ${BRAND.en} 👋 I need help with an order or a product.`;
}
