"use client";
import Image from "next/image";
import { useShowcaseMotion } from "@/components/use-showcase-motion";
import { useTranslation } from "@/components/public-language";
export type HeroSlide = { src: string; altText: string; caption: string | null };
export function HeroCarousel({ images }: { images: HeroSlide[] }) {
  const slides = images.length ? images : [{ src: "/images/jws/home-hero.png", altText: "Janaza Welfare Society service vehicles", caption: null }];
  const m = useShowcaseMotion(slides.length, 7000);
  const { t } = useTranslation();
  return <div className="relative" onFocusCapture={m.interaction.onFocusCapture} onBlurCapture={m.interaction.onBlurCapture} role="region" aria-roledescription="carousel" aria-label={t("Hero images")} tabIndex={0} onKeyDown={e => {
    if (e.target !== e.currentTarget) return;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); m.move(e.key === "ArrowLeft" ? -1 : 1); }
  }}>
    <div className="hero-photograph relative aspect-[4/3] overflow-hidden rounded-[2rem] border border-primary/30 bg-white shadow-lg">
      {slides.map((slide, index) => <div key={slide.src} aria-hidden={index !== m.index} className={`absolute inset-0 transition-opacity duration-[1200ms] ease-in-out motion-reduce:transition-none ${index === m.index ? "opacity-100" : "opacity-0"}`}>
        <Image unoptimized={slide.src.startsWith('/public-media/')} src={slide.src} alt={slide.altText} fill preload={index === 0} sizes="(min-width: 1024px) 45vw, 100vw" className="object-contain p-3 sm:p-5" />
      </div>)}
    </div>
    <p className="mt-3 min-h-6 text-sm text-muted">{slides[m.index].caption || "\u00a0"}</p>
  </div>;
}
