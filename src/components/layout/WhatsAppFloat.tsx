import { WhatsAppIcon } from '@/components/Icons';
import { getDict } from '@/i18n';
import { buildSupportMessage } from '@/lib/order-message';
import { whatsappLink } from '@/lib/phone';
import type { Lang } from '@/lib/types';

/** Floating WhatsApp button. Only shown when the shop owner has entered a WhatsApp number (Admin → Settings). */
export function WhatsAppFloat({ lang, number }: { lang: Lang; number: string | null }) {
  if (!number) return null;
  const label = getDict(lang).whatsapp.float;
  return (
    <a
      href={whatsappLink(number, buildSupportMessage(lang))}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className="fixed bottom-4 end-4 z-30 grid h-14 w-14 place-items-center rounded-full bg-[#1FAF54] text-white shadow-lift ring-4 ring-white/70 transition hover:scale-110 sm:h-16 sm:w-16"
    >
      <WhatsAppIcon size={30} />
    </a>
  );
}
