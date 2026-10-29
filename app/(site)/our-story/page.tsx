import type { Metadata } from "next";
import Image from "next/image";
import { Manifesto } from "@/components/home/Manifesto";
import { StoryChapters } from "@/components/story/StoryChapters";
import styles from "@/components/story/Story.module.css";
import { storyBanner, storyChapters, storyManifesto } from "@/content/our-story";

export const metadata: Metadata = {
  title: "Our Story",
  description: "How Ofada Manchester started — Ofada rice wrapped in leaf, our classic sauce, cooked fresh in Manchester.",
};

export default function OurStoryPage() {
  return (
    <>
      <section className={styles.sb}>
        <div className={styles.sbBox}>
          {/* Blurred copy fills the sides on wide screens; the sharp photo sits on top. */}
          <Image src={storyBanner.image.src} alt="" aria-hidden fill sizes="40vw" className={styles.sbBlur} />
          <Image
            src={storyBanner.image.src}
            alt={storyBanner.image.alt}
            fill
            priority
            sizes="(min-width: 600px) 640px, 100vw"
            className={styles.sbPhoto}
            unoptimized={storyBanner.image.src.endsWith(".svg")}
          />
          <h1 className={styles.sbLabel}>{storyBanner.title}</h1>
        </div>
      </section>
      <Manifesto content={storyManifesto} layout="scatter" />
      <StoryChapters chapters={storyChapters} />
    </>
  );
}
