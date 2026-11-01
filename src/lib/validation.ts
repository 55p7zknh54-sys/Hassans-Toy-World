import { normalizeIqPhone } from './phone';

/** Server-side + client-side checkout validation. The database re-checks everything again. */

export type CheckoutField = 'name' | 'phone' | 'governorate' | 'city' | 'address' | 'notes' | 'cart';
export type ErrorCode = 'required' | 'too_short' | 'too_long' | 'invalid_phone';
export type CheckoutErrors = Partial<Record<CheckoutField, ErrorCode>>;

export type CheckoutInput = {
  name: string;
  phone: string;
  governorate: string;
  city: string;
  address: string;
  notes: string;
};

const clean = (v: unknown, max = 1000): string =>
  typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '';

function text(
  value: string,
  min: number,
  max: number
): ErrorCode | undefined {
  if (!value) return 'required';
  if (value.length < min) return 'too_short';
  if (value.length > max) return 'too_long';
  return undefined;
}

export function validateCheckout(raw: Record<string, unknown>): {
  ok: boolean;
  errors: CheckoutErrors;
  value: CheckoutInput;
} {
  const rawNotes = typeof raw.notes === 'string' ? raw.notes.trim().slice(0, 500) : '';
  const value: CheckoutInput = {
    name: clean(raw.name, 120),
    phone: clean(raw.phone, 40),
    governorate: clean(raw.governorate, 60),
    city: clean(raw.city, 120),
    address: clean(raw.address, 400),
    notes: rawNotes,
  };
  const errors: CheckoutErrors = {};

  const e1 = text(value.name, 2, 80);
  if (e1) errors.name = e1;
  if (!value.phone) errors.phone = 'required';
  else if (!normalizeIqPhone(value.phone)) errors.phone = 'invalid_phone';
  if (!value.governorate) errors.governorate = 'required';
  const e2 = text(value.city, 2, 80);
  if (e2) errors.city = e2;
  const e3 = text(value.address, 8, 300);
  if (e3) errors.address = e3;

  return { ok: Object.keys(errors).length === 0, errors, value };
}

export type CartLine = { product_id: string; quantity: number };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Parses the cart JSON sent by the checkout form. Merges repeated products. Returns null if malformed. */
export function parseCartPayload(json: unknown): CartLine[] | null {
  if (typeof json !== 'string' || json.length > 20000) return null;
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    return null;
  }
  if (!Array.isArray(data) || data.length === 0 || data.length > 100) return null;
  const merged = new Map<string, number>();
  for (const row of data) {
    if (!row || typeof row !== 'object') return null;
    const { product_id, quantity } = row as Record<string, unknown>;
    if (typeof product_id !== 'string' || !UUID.test(product_id)) return null;
    if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 1 || quantity > 9999) return null;
    merged.set(product_id, (merged.get(product_id) ?? 0) + quantity);
  }
  return [...merged].map(([product_id, quantity]) => ({ product_id, quantity }));
}

export const isUuid = (v: unknown): v is string => typeof v === 'string' && UUID.test(v);
