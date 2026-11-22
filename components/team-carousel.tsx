"use client";
import Image from "next/image";
import { useSyncExternalStore } from "react";
import { useShowcaseMotion } from "@/components/use-showcase-motion";
import { useTranslation } from "@/components/public-language";
export type PublicTeamMember = { name: string; position: string; photo: string | null };
function subscribe(callback: () => void) { window.addEventListener("resize", callback); return () => window.removeEventListener("resize", callback); }
const getCount = () => window.innerWidth >= 1024 ? 3 : window.innerWidth >= 640 ? 2 : 1;
export function TeamCarousel({ members }: { members: PublicTeamMember[] }) {
  const visible = useSyncExternalStore(subscribe, getCount, () => 3);
  // A page advances by exactly three members on desktop, once per second.
  const pages = Math.ceil(members.length / visible);
  const m = useShowcaseMotion(pages, 1000); const { t } = useTranslation();
  if (!members.length) return <p className="team-empty glass-panel">{t("Our approved operational team profiles will appear here as they become available.")}</p>;
  const shown = members.slice(m.index * visible, m.index * visible + visible);
  return <div {...m.interaction} role="region" aria-roledescription="carousel" aria-label={t("Operation team")} tabIndex={0} onKeyDown={e => { if (e.target === e.currentTarget && (e.key === "ArrowLeft" || e.key === "ArrowRight")) { e.preventDefault(); m.move(e.key === "ArrowLeft" ? -1 : 1); } }}>
    <div className="grid min-h-96 grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">{shown.map((person, index) => <article key={m.index * visible + index} className={`employee-profile-card min-h-96 overflow-hidden rounded-2xl border bg-white ${index === 1 ? "hidden sm:block" : index === 2 ? "hidden lg:block" : ""}`}><div className="employee-profile-photo relative h-60 bg-light-background">{person.photo ? <Image unoptimized src={person.photo} alt={person.name} fill sizes="(min-width:1024px) 30vw,(min-width:640px) 45vw,90vw" className="object-cover" /> : <div className="flex h-full items-center justify-center text-3xl font-semibold text-primary" aria-hidden="true">{person.name.split(/\s+/).slice(0,2).map(part => part[0]).join("")}</div>}</div><div className="employee-profile-copy p-5"><h3 className="line-clamp-2 font-semibold">{person.name}</h3><p className="mt-2 line-clamp-2 text-sm text-muted">{person.position}</p></div></article>)}</div>
    {pages > 1 && <div className="motion-controls mt-4"><button type="button" aria-label={t("Previous")} onClick={() => m.move(-1)}>←</button><button type="button" disabled={m.reduced} aria-pressed={m.paused || m.reduced} onClick={() => m.setPaused(!m.paused)}>{t(m.paused || m.reduced ? "Play" : "Pause")}</button><span className="text-sm">{m.index + 1} / {pages}</span><button type="button" aria-label={t("Next")} onClick={() => m.move(1)}>→</button></div>}
  </div>;
}
