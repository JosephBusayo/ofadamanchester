import type { Metadata } from "next";
import Image from "next/image";
import { contactPage } from "@/content/contact";
import { site } from "@/content/site";
import { formatOpeningHours } from "@/lib/schedule";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Contact",
  description: "Opening hours, pickup address and how to reach Ofada Manchester.",
};

const cardClass = "flex flex-col gap-2 rounded-2xl bg-bg-alt p-8";
const cardTitle = "text-xl font-semibold leading-[22px] text-ink";
const cardLine = "text-xl font-light leading-[29px] text-ink/65";

export default async function ContactPage() {
  const settings = await getSettings();
  const hours = formatOpeningHours(settings.openingHours);
  const { cta } = contactPage;

  return (
    <div className="flex flex-col gap-16 pt-16">
      <section className="flex flex-col items-center gap-6 px-8 pt-8">
        <p className="text-center text-lg font-semibold leading-none tracking-[1.44px] text-highlight">{contactPage.eyebrow}</p>
        <h1 className="max-w-[1000px] text-center font-wordmark text-[44px] leading-[0.95] tracking-[-0.04em] text-ink tablet:text-[85px] desktop:text-[88px]">
          {contactPage.title}
        </h1>
        <p className="max-w-[600px] text-center text-lg font-light leading-[1.45] text-ink">{contactPage.intro}</p>
      </section>

      <section className="grid grid-cols-1 items-start gap-4 px-8 tablet:grid-cols-3">
        <div className={cardClass}>
          <h2 className={cardTitle}>{contactPage.cards.visit}</h2>
          <p className={cardLine}>{settings.pickupAddress}</p>
        </div>
        <div className={cardClass}>
          <h2 className={cardTitle}>{contactPage.cards.hours}</h2>
          {hours.map((line) => (
            <p key={line} className={cardLine}>
              {line}
            </p>
          ))}
        </div>
        <div className={cardClass}>
          <h2 className={cardTitle}>{contactPage.cards.hello}</h2>
          <a className="text-xl font-light leading-[29px] text-ink hover:underline" href={site.whatsapp.href}>
            WhatsApp {site.whatsapp.display}
          </a>
          <a className="text-xl font-light leading-[29px] text-ink hover:underline" href={`mailto:${site.email}`}>
            {site.email}
          </a>
          <a
            className="text-xl font-light leading-[29px] text-ink hover:underline"
            href={site.instagram.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            Instagram {site.instagram.handle}
          </a>
        </div>
      </section>

      <section className="px-8 pb-8">
        <div className="relative h-[460px] overflow-hidden rounded-2xl bg-bg-alt">
          <Image
            src={contactPage.image.src}
            alt={contactPage.image.alt}
            fill
            sizes="100vw"
            className="object-cover"
            unoptimized={contactPage.image.src.endsWith(".svg")}
          />
        </div>
      </section>

      <section className="px-8 pb-20 [container-type:inline-size]">
        <div className="flex flex-col items-start gap-8 rounded-3xl bg-primary px-6 py-10 text-on-primary tablet:flex-row tablet:items-center tablet:justify-between tablet:px-16 tablet:py-14">
          <div>
            <p className="mb-3 text-sm font-bold tracking-[0.12em]">{cta.kicker}</p>
            <h2 className="font-wordmark text-[32px] leading-none [text-wrap:balance] tablet:text-[clamp(32px,6cqw,64px)]">
              {cta.title}
            </h2>
            <p className="mt-3 max-w-[520px] text-lg leading-normal opacity-90">{cta.body}</p>
          </div>
          <a
            href={cta.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex min-h-[52px] flex-none items-center gap-2 rounded-full bg-on-primary px-7 text-sm font-bold text-ink transition-colors hover:bg-accent"
          >
            {cta.label} <span className="transition-transform group-hover:translate-x-1">→</span>
          </a>
        </div>
      </section>
    </div>
  );
}
