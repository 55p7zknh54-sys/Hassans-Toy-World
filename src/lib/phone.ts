/**
 * Iraqi phone helpers. `normalizeIqPhone` mirrors the SQL function normalize_iq_phone()
 * in supabase/schema.sql — keep both in sync (tests/phone.test.ts checks the same vectors).
 */

const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹';
const LATIN_DIGITS = '01234567890123456789';

function toLatinDigits(s: string): string {
  let out = '';
  for (const ch of s) {
    const i = ARABIC_DIGITS.indexOf(ch);
    out += i >= 0 ? LATIN_DIGITS[i] : ch;
  }
  return out;
}

/** Returns "07XXXXXXXXX" for a valid Iraqi mobile number, otherwise null. */
export function normalizeIqPhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let s = toLatinDigits(raw).replace(/[^0-9+]/g, '');
  if (s.startsWith('+964')) s = '0' + s.slice(4);
  else if (s.startsWith('00964')) s = '0' + s.slice(5);
  else if (s.startsWith('964')) s = '0' + s.slice(3);
  else if (/^7[0-9]{9}$/.test(s)) s = '0' + s;
  return /^07[3-9][0-9]{8}$/.test(s) ? s : null;
}

/** "07701234567" → "0770 123 4567" for display. */
export function formatPhone(p: string): string {
  return /^07[0-9]{9}$/.test(p) ? `${p.slice(0, 4)} ${p.slice(4, 7)} ${p.slice(7)}` : p;
}

/**
 * Converts what an admin types (07…, +964…, 00964…) into the digits-only international
 * form WhatsApp links need (e.g. 9647701234567). Returns null if it does not look like a number.
 */
export function toWhatsAppNumber(input: string | null | undefined): string | null {
  if (!input) return null;
  let s = toLatinDigits(input).replace(/[^0-9+]/g, '');
  if (s.startsWith('+')) s = s.slice(1);
  else if (s.startsWith('00')) s = s.slice(2);
  else if (/^0[0-9]{9,10}$/.test(s)) s = '964' + s.slice(1);
  else if (/^7[0-9]{9}$/.test(s)) s = '964' + s;
  return /^[0-9]{10,15}$/.test(s) && !s.startsWith('0') ? s : null;
}

export function whatsappLink(number: string, text?: string): string {
  const base = `https://wa.me/${number}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
