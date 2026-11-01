'use client';

import { useState } from 'react';
import { useI18n } from '@/components/I18nProvider';
import { AddToCartButton } from './AddToCartButton';
import { QuantityPicker } from './QuantityPicker';

/** Quantity selector + Add to cart on the product page. */
export function BuyBox({ productId, stock }: { productId: string; stock: number }) {
  const { t } = useI18n();
  const [qty, setQty] = useState(1);
  if (stock <= 0) return <AddToCartButton productId={productId} stock={0} size="lg" />;
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div>
        <p className="mb-1.5 text-sm font-semibold text-navy-500">{t.common.quantity}</p>
        <QuantityPicker value={qty} onChange={setQty} max={Math.min(stock, 99)} />
      </div>
      <div className="flex-1 sm:pt-6">
        <AddToCartButton productId={productId} stock={stock} qty={qty} size="lg" />
      </div>
    </div>
  );
}
