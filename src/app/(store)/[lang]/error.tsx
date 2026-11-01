'use client';

import { Mascot } from '@/components/brand/Mascot';
import { useI18n } from '@/components/I18nProvider';

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  const { t } = useI18n();
  return (
    <div className="container-page flex flex-col items-center gap-4 py-20 text-center">
      <Mascot size={120} />
      <h1 className="text-3xl">{t.error.title}</h1>
      <p className="text-navy-500">{t.error.text}</p>
      <button type="button" onClick={reset} className="btn-primary">{t.common.tryAgain}</button>
    </div>
  );
}
