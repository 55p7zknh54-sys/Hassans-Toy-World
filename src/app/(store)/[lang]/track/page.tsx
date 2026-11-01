import type { Metadata } from 'next';
import { TrackForm } from '@/components/track/TrackForm';
import { getDict } from '@/i18n';
import type { Lang } from '@/lib/types';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const lang = (await params).lang as Lang;
  return { title: getDict(lang).track.title, robots: { index: false } };
}

export default async function TrackPage({ params }: { params: Promise<{ lang: string }> }) {
  const t = getDict((await params).lang as Lang);
  return (
    <div className="container-page py-8 sm:py-12">
      <header className="mb-6 text-center">
        <h1 className="text-3xl sm:text-5xl">{t.track.title}</h1>
        <p className="mt-2 text-navy-500">{t.track.text}</p>
      </header>
      <TrackForm />
    </div>
  );
}
