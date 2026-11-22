"use client";

import Image from "next/image";
import { useState } from "react";
import { T } from "@/components/public-language";
import type { LeadershipMember } from "@/lib/leadership-team";

type LeadershipCardProps = {
  member: LeadershipMember;
  compact?: boolean;
};

function initials(name: string) {
  return name
    .replaceAll(".", "")
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

export function LeadershipCard({ member, compact = false }: LeadershipCardProps) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <article id={`leader-${member.position.toLowerCase()}`} className="jws-leadership-card group h-full overflow-hidden rounded-2xl border border-border bg-white shadow-[0_10px_30px_rgba(16,42,42,0.06)] transition duration-300 hover:-translate-y-1 hover:border-primary/60 hover:shadow-[0_16px_40px_rgba(8,127,35,0.16)] motion-reduce:transform-none motion-reduce:transition-none">
      <div className="jws-leadership-portrait relative aspect-[4/3] overflow-hidden border-b border-border bg-light-background">
        {member.photoSrc && !imageFailed ? (
          <Image
            src={member.photoSrc}
            alt={`${member.name}, ${member.position}`}
            fill
            className="object-cover object-center"
            loading="lazy"
            sizes="(min-width: 1280px) 280px, 30vw"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-[linear-gradient(145deg,#f3f8f3,#FFFFFF)]" role="img" aria-label={`${member.name} initials placeholder`}>
            <span className="flex size-24 items-center justify-center rounded-full border border-primary/45 bg-white text-2xl font-semibold tracking-wide text-foreground shadow-sm">
              {initials(member.name)}
            </span>
          </div>
        )}
      </div>
      <div className={compact ? "p-5" : "p-6"}>
        <span className="inline-flex rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-foreground">
          <T text={member.position} />
        </span>
        <h3 className="mt-4 text-xl font-semibold tracking-tight text-foreground">{member.name}</h3>
        <a className="jws-leadership-contact mt-2 inline-flex items-center gap-2 text-sm font-semibold text-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary" href={`tel:${member.contact}`} aria-label={`Call ${member.name} at ${member.contact}`}>
          <bdi dir="ltr">{member.contact}</bdi>
          <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="size-4 text-primary"><path d="M5.2 2.8 7.4 6 6 8c1.2 2.4 3 4.2 5.4 5.4l2-1.4 3.2 2.2c.4.3.6.8.4 1.3-.5 1.3-1.8 2.1-3.2 2-6-.7-10.7-5.4-11.4-11.4-.1-1.4.7-2.7 2-3.2.3-.2.6-.2.8-.1Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </a>
        {!compact && <details className="jws-leadership-details"><summary><T text="View Details" /></summary><p lang="en" className="jws-leadership-description mt-2 leading-7 text-muted">{member.responsibility}</p></details>}
      </div>
    </article>
  );
}
