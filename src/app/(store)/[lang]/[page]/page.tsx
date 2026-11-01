import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { WhatsAppIcon } from '@/components/Icons';
import { INFO_PAGES } from '@/content/pages';
import { getDict } from '@/i18n';
import { getDeliveryFees, getSettings } from '@/lib/data';
import { formatIQD } from '@/lib/format';
import { buildSupportMessage } from '@/lib/order-message';
import { formatPhone, whatsappLink } from '@/lib/phone';
import { alternatesFor } from '@/lib/site';
import { pick, type Lang } from '@/lib/types';

type Props = { params: Promise<{ lang: string; page: string }> };

export const dynamicParams = false;
export function generateStaticParams() {
  return Object.keys(INFO_PAGES).map((page) => ({ page }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, page } = await params;
  const info = INFO_PAGES[page];
  if (!info) return {};
  return {
    title: info.title[lang as Lang],
    description: info.intro?.[lang as Lang] ?? info.sections[0]?.p[lang as Lang].slice(0, 160),
    alternates: alternatesFor(lang as Lang, `/${page}`),
  };
}

export default async function InfoPage({ params }: Props) {
  const { lang: l, page } = await params;
  const lang = l as Lang;
  const info = INFO_PAGES[page];
  if (!info) notFound();
  const t = getDict(lang);
  const [fees, settings] = await Promise.all([page === 'delivery' ? getDeliveryFees() : Promise.resolve([]), getSettings()]);
  const address = lang === 'ar' ? settings.address_ar ?? settings.address_en : settings.address_en ?? settings.address_ar;

  return (
    <div className="container-page max-w-3xl py-8 sm:py-12">
      <h1 className="text-3xl sm:text-5xl">{info.title[lang]}</h1>
      {info.intro && <p className="mt-3 text-lg text-navy-700">{info.intro[lang]}</p>}

      <div className="mt-8 space-y-6">
        {info.sections.map((s) => (
          <section key={s.h.en} className="card p-6">
            <h2 className="mb-2 text-xl">{s.h[lang]}</h2>
            <p className="leading-relaxed text-navy-700">{s.p[lang]}</p>
          </section>
        ))}

        {page === 'delivery' && fees.length > 0 && (
          <section className="card overflow-hidden">
            <table className="w-full text-start">
              <caption className="sr-only">{info.title[lang]}</caption>
              <thead className="bg-pink-100 text-sm"><tr><th scope="col" className="p-3 text-start">{t.checkout.governorate}</th><th scope="col" className="p-3 text-end">{t.checkout.deliveryFee}</th></tr></thead>
              <tbody className="divide-y divide-navy/10">
                {fees.map((f) => (
                  <tr key={f.code}><th scope="row" className="p-3 text-start font-semibold">{pick(f, 'name', lang)}</th><td className="ltr-iso p-3 text-end">{formatIQD(f.fee_iqd, lang)}</td></tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {page === 'contact' && (
          <section className="card space-y-3 p-6">
            {settings.whatsapp_number && (
              <a href={whatsappLink(settings.whatsapp_number, buildSupportMessage(lang))} target="_blank" rel="noopener noreferrer" className="btn min-h-14 w-full bg-[#1FAF54] text-lg text-white hover:bg-[#188a43]">
                <WhatsAppIcon size={24} /> {t.footer.whatsapp}
              </a>
            )}
            {settings.contact_phone && <p><span className="font-semibold">{t.checkout.phone}: </span><a className="ltr-iso text-pink-700 underline" href={`tel:${settings.contact_phone.replace(/\s/g, '')}`}>{formatPhone(settings.contact_phone)}</a></p>}
            {settings.contact_email && <p><span className="font-semibold">Email: </span><a className="text-pink-700 underline" href={`mailto:${settings.contact_email}`}>{settings.contact_email}</a></p>}
            {address && <p>{address}</p>}
            {!settings.whatsapp_number && !settings.contact_phone && !settings.contact_email && !address && <p className="text-navy-500">{t.footer.contactEmpty}</p>}
          </section>
        )}
      </div>
    </div>
  );
}
