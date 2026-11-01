'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useI18n } from '@/components/I18nProvider';
import { fmt } from '@/i18n';

/** Large photo + thumbnails. Works with touch, mouse and keyboard. */
export function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const { t } = useI18n();
  const [i, setI] = useState(0);
  const list = images.length ? images : [];
  if (!list.length) {
    return <div className="aspect-square rounded-blob bg-cream-dark" role="img" aria-label={alt} />;
  }
  return (
    <div className="space-y-3" aria-label={t.product.gallery} role="group">
      <div className="relative aspect-square overflow-hidden rounded-blob bg-white shadow-soft">
        <Image
          key={list[i]}
          src={list[i]}
          alt={`${alt} — ${fmt(t.product.photo, { n: i + 1 })}`}
          fill
          priority
          sizes="(min-width: 1024px) 560px, 100vw"
          className="animate-pop object-cover"
        />
      </div>
      {list.length > 1 && (
        <ul className="grid grid-cols-4 gap-3 sm:grid-cols-5">
          {list.map((src, n) => (
            <li key={src}>
              <button
                type="button"
                onClick={() => setI(n)}
                aria-label={fmt(t.product.photo, { n: n + 1 })}
                aria-current={n === i}
                className={`relative block aspect-square w-full overflow-hidden rounded-2xl bg-white transition ${n === i ? 'ring-4 ring-pink' : 'opacity-80 ring-2 ring-navy/10 hover:opacity-100'}`}
              >
                <Image src={src} alt="" fill sizes="120px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
