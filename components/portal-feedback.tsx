"use client";

import { T } from "@/components/public-language";

export function PortalLoading() {
  return <p role="status" aria-busy="true" className="jws-card p-4 text-sm text-muted"><T text="Loading…" /></p>;
}

export function PortalError({ reset }: { reset: () => void }) {
  return (
    <section className="jws-card space-y-3 p-4">
      <h1 role="alert" className="text-lg font-semibold"><T text="Something went wrong." /></h1>
      <button type="button" className="jws-button jws-button-outline" onClick={reset}><T text="Try again" /></button>
    </section>
  );
}
