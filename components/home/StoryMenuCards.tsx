import Image from "next/image";
import Link from "next/link";
import { storyMenuCards } from "@/content/home";

export function StoryMenuCards() {
  return (
    <section className="flex flex-col gap-4 bg-bg px-8 pb-[72px] tablet:flex-row">
      {storyMenuCards.map((card) => (
        <Link
          key={card.title}
          href={card.href}
          className="relative block h-[450px] w-full overflow-hidden rounded-2xl tablet:flex-1"
        >
          <Image
            src={card.image}
            alt={card.alt}
            fill
            sizes="(min-width: 810px) 50vw, 100vw"
            className="object-cover"
            unoptimized={card.image.endsWith(".svg")}
          />
          <h2 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-center font-wordmark text-5xl leading-[48px] tracking-[-1.44px] text-white">
            {card.title}
          </h2>
        </Link>
      ))}
    </section>
  );
}
