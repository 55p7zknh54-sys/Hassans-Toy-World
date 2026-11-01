/** "Mini Squishy – Mochi Blob!" → "mini-squishy-mochi-blob". Falls back to a random id for non-Latin names. */
export function slugify(input: string): string {
  const s = input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
  return s || `item-${Math.random().toString(36).slice(2, 8)}`;
}
