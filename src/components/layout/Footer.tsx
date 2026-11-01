import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import { CashIcon, FacebookIcon, InstagramIcon, TikTokIcon, TruckIcon, WhatsAppIcon } from '@/components/Icons';
import { fmt, getDict, localePath } from '@/i18n';
import { formatPhone } from '@/lib/phone';
import { pick, type Category, type Lang, type StoreSettings } from '@/lib/types';

const safeUrl = (u: string | null) => (u && /^https?:\/\//i.test(u) ? u : null);

export function Footer({ lang, categories, settings }: { lang: Lang; categories: Category[]; settings: StoreSettings }) {
  const t = getDict(lang);
  const f = t.footer;
  const social = [
    { href: safeUrl(settings.instagram_url), label: f.instagram, Icon: InstagramIcon },
    { href: safeUrl(settings.tiktok_url), label: f.tiktok, Icon: TikTokIcon },
    { href: safeUrl(settings.facebook_url), label: f.facebook, Icon: FacebookIcon },
    {
      href: settings.whatsapp_number ? `https://wa.me/${settings.whatsapp_number}` : null,
      label: f.whatsapp,
      Icon: WhatsAppIcon,
    },
  ].filter((s) => s.href);
  const address = lang === 'ar' ? settings.address_ar ?? settings.address_en : settings.address_en ?? settings.address_ar;
  const hasContact = !!(settings.contact_phone || settings.contact_email || address);
  const linkCls = 'block py-1.5 text-navy-700 transition hover:text-pink-600';

  return (
    <footer className="mt-20 bg-navy text-white">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <span className="inline-block rounded-3xl bg-cream px-4 py-3">
            <Logo lang={lang} />
          </span>
          <p className="max-w-xs text-sm leading-relaxed text-navy-100">{f.aboutText}</p>
          <p className="font-display font-semibold text-yellow">{t.brand.slogan}</p>
        </div>

        <nav aria-label={f.shopHeading}>
          <h2 className="mb-3 font-display text-lg !text-white">{f.shopHeading}</h2>
          <ul className="text-navy-100">
            <li><Link className="block py-1.5 hover:text-yellow" href={localePath(lang, '/shop')}>{t.nav.shop}</Link></li>
            {categories.map((c) => (
              <li key={c.slug}>
                <Link className="block py-1.5 hover:text-yellow" href={localePath(lang, `/category/${c.slug}`)}>{pick(c, 'name', lang)}</Link>
              </li>
            ))}
            <li><Link className="block py-1.5 hover:text-yellow" href={localePath(lang, '/new-arrivals')}>{t.nav.newArrivals}</Link></li>
          </ul>
        </nav>

        <nav aria-label={f.helpHeading}>
          <h2 className="mb-3 font-display text-lg !text-white">{f.helpHeading}</h2>
          <ul className="text-navy-100">
            {[
              ['/about', f.about],
              ['/delivery', f.deliveryInfo],
              ['/returns', f.returnPolicy],
              ['/privacy', f.privacy],
              ['/terms', f.terms],
              ['/contact', f.contactUs],
              ['/track', t.nav.track],
            ].map(([p, label]) => (
              <li key={p}>
                <Link className="block py-1.5 hover:text-yellow" href={localePath(lang, p)}>{label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="mb-3 font-display text-lg !text-white">{f.contactHeading}</h2>
          {hasContact ? (
            <ul className="space-y-1.5 text-navy-100">
              {settings.contact_phone && (
                <li><a className="ltr-iso hover:text-yellow" href={`tel:${settings.contact_phone.replace(/\s/g, '')}`}>{formatPhone(settings.contact_phone)}</a></li>
              )}
              {settings.contact_email && (
                <li><a className="break-all hover:text-yellow" href={`mailto:${settings.contact_email}`}>{settings.contact_email}</a></li>
              )}
              {address && <li>{address}</li>}
            </ul>
          ) : (
            <p className="text-sm text-navy-300">{f.contactEmpty}</p>
          )}
          {social.length > 0 && (
            <>
              <h3 className="mb-2 mt-6 font-display text-base !text-white">{f.followHeading}</h3>
              <ul className="flex flex-wrap gap-2">
                {social.map(({ href, label, Icon }) => (
                  <li key={label}>
                    <a
                      href={href as string}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="grid h-12 w-12 place-items-center rounded-full bg-white/10 transition hover:bg-pink-600"
                    >
                      <Icon size={22} />
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-5 text-sm text-navy-300 sm:flex-row">
          <p>{fmt(f.rights, { year: new Date().getFullYear() })}</p>
          <p className="flex flex-wrap items-center justify-center gap-4">
            <span className="inline-flex items-center gap-1.5"><CashIcon size={18} /> {f.payment}</span>
            <span className="inline-flex items-center gap-1.5"><TruckIcon size={18} /> {f.deliveryAll}</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
