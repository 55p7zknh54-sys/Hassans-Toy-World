import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeIqPhone, toWhatsAppNumber, whatsappLink } from '../src/lib/phone';
import { effectivePrice, isOnSale, discountPercent, computeTotals, clampQty, stockState } from '../src/lib/pricing';
import { validateCheckout, parseCartPayload } from '../src/lib/validation';
import { formatIQD, formatNumber } from '../src/lib/format';
import { buildOrderMessage } from '../src/lib/order-message';
import { slugify } from '../src/lib/slug';
import { NEXT_STATUSES, pick } from '../src/lib/types';

test('phone normalisation (same vectors as tests/db/test.sql)', () => {
  const ok: [string, string][] = [
    ['0770 123 4567', '07701234567'],
    ['+964 770 123 4567', '07701234567'],
    ['00964-770-123-4567', '07701234567'],
    ['9647701234567', '07701234567'],
    ['7701234567', '07701234567'],
    ['٠٧٧٠١٢٣٤٥٦٧', '07701234567'],
    ['07801234567', '07801234567'],
  ];
  for (const [input, want] of ok) assert.equal(normalizeIqPhone(input), want, input);
  for (const bad of ['12345', '0721234567', '077012345678', 'abc', '', null, undefined])
    assert.equal(normalizeIqPhone(bad as string), null, String(bad));
});

test('WhatsApp number conversion', () => {
  assert.equal(toWhatsAppNumber('0770 123 4567'), '9647701234567');
  assert.equal(toWhatsAppNumber('+964 770 123 4567'), '9647701234567');
  assert.equal(toWhatsAppNumber('00964 770 123 4567'), '9647701234567');
  assert.equal(toWhatsAppNumber('7701234567'), '9647701234567');
  assert.equal(toWhatsAppNumber('+44 7700 900123'), '447700900123');
  assert.equal(toWhatsAppNumber('hello'), null);
  assert.equal(toWhatsAppNumber(''), null);
  assert.equal(whatsappLink('9647701234567', 'Hi there & you'), 'https://wa.me/9647701234567?text=Hi%20there%20%26%20you');
});

test('pricing: sale price, expiry, discount percent', () => {
  const now = Date.parse('2026-10-31T12:00:00Z');
  const normal = { price_iqd: 5000, sale_price_iqd: null };
  const sale = { price_iqd: 5500, sale_price_iqd: 4500, sale_ends_at: null };
  const expired = { price_iqd: 5500, sale_price_iqd: 4500, sale_ends_at: '2026-10-01T00:00:00Z' };
  const future = { price_iqd: 5500, sale_price_iqd: 4500, sale_ends_at: '2026-12-01T00:00:00Z' };
  const bogus = { price_iqd: 5000, sale_price_iqd: 6000 };
  assert.equal(effectivePrice(normal, now), 5000);
  assert.equal(effectivePrice(sale, now), 4500);
  assert.equal(isOnSale(expired, now), false);
  assert.equal(effectivePrice(expired, now), 5500);
  assert.equal(effectivePrice(future, now), 4500);
  assert.equal(effectivePrice(bogus, now), 5000, 'a "sale" price above the normal price is ignored');
  assert.equal(discountPercent(sale, now), 18);
  assert.equal(discountPercent(normal, now), 0);
});

test('totals: the example from the brief (15,000 + 5,000 = 20,000)', () => {
  const t = computeTotals([{ unit: 5000, qty: 2 }, { unit: 5000, qty: 1 }], 5000);
  assert.deepEqual(t, { subtotal: 15000, deliveryFee: 5000, total: 20000 });
  assert.equal(computeTotals([{ unit: 5000, qty: 1 }], null).total, null);
});

test('quantity clamping and stock state', () => {
  assert.equal(clampQty(5, 3, 10), 3);
  assert.equal(clampQty(0, 3, 10), 1);
  assert.equal(clampQty(20, 50, 10), 10);
  assert.equal(clampQty(2, 0, 10), 0);
  assert.equal(clampQty(NaN, 5, 10), 1);
  assert.equal(stockState(0), 'out');
  assert.equal(stockState(3), 'low');
  assert.equal(stockState(40), 'in_stock');
});

test('checkout validation', () => {
  const good = { name: 'Ali Hassan', phone: '0770 123 4567', governorate: 'baghdad', city: 'Karrada', address: 'Street 12, near the market', notes: '' };
  assert.equal(validateCheckout(good).ok, true);
  const bad = validateCheckout({ name: 'A', phone: '123', governorate: '', city: '', address: 'short', notes: '' });
  assert.deepEqual(bad.errors, { name: 'too_short', phone: 'invalid_phone', governorate: 'required', city: 'required', address: 'too_short' });
  assert.equal(validateCheckout({ ...good, phone: '' }).errors.phone, 'required');
});

test('cart payload parsing', () => {
  const id = '3f2b8c1e-5d4a-4e8f-9a7b-1c2d3e4f5a6b';
  assert.deepEqual(parseCartPayload(JSON.stringify([{ product_id: id, quantity: 2 }, { product_id: id, quantity: 1 }])), [{ product_id: id, quantity: 3 }]);
  for (const bad of ['', '[]', '{}', 'not json', JSON.stringify([{ product_id: 'x', quantity: 1 }]), JSON.stringify([{ product_id: id, quantity: 0 }]), JSON.stringify([{ product_id: id, quantity: 1.5 }]), JSON.stringify([null])])
    assert.equal(parseCartPayload(bad), null, bad);
  assert.equal(parseCartPayload(undefined), null);
});

test('formatting', () => {
  assert.equal(formatNumber(1234567), '1,234,567');
  assert.equal(formatIQD(15000), '15,000 IQD');
  assert.equal(formatIQD(15000, 'ar'), '15,000 د.ع');
});

test('order message (English and Arabic)', () => {
  const base = { orderNumber: 'HTW-261031-1001', name: 'Ali', phone: '07701234567', governorate: 'Baghdad', city: 'Karrada', address: 'Street 12', items: [{ name: 'Mini Squishy', qty: 2, lineTotal: 10000 }], subtotal: 10000, deliveryFee: 5000, total: 15000 };
  const en = buildOrderMessage({ ...base, lang: 'en' });
  assert.match(en, /HTW-261031-1001/);
  assert.match(en, /Total \(cash on delivery\): 15,000 IQD/);
  const ar = buildOrderMessage({ ...base, lang: 'ar', depositAmount: 4500 });
  assert.match(ar, /عالم حسن للألعاب/);
  assert.match(ar, /15,000 د\.ع/);
  assert.match(ar, /العربون/);
});

test('slugify', () => {
  assert.equal(slugify('Mini Squishy – Mochi Blob!'), 'mini-squishy-mochi-blob');
  assert.match(slugify('سكويشي'), /^item-/);
});

test('status workflow matches the database trigger', () => {
  assert.deepEqual(NEXT_STATUSES.pending, ['confirmed', 'cancelled']);
  assert.deepEqual(NEXT_STATUSES.shipped, ['delivered', 'returned']);
  assert.deepEqual(NEXT_STATUSES.cancelled, []);
  assert.equal(pick({ name_en: 'Hi', name_ar: '' }, 'name', 'ar'), 'Hi');
  assert.equal(pick({ name_en: 'Hi', name_ar: 'مرحبا' }, 'name', 'ar'), 'مرحبا');
});
