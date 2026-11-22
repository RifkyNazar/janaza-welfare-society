import { T } from "@/components/public-language";
import { createHash } from "node:crypto";
import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { MediaForm } from "@/components/admin/media-form";
export default async function HeroMediaPage() {
  await requireAdmin();
  const images = await prisma.heroMedia.findMany({ orderBy: [{ displayOrder: "asc" }, { id: "asc" }] });
  return <div className="mx-auto max-w-3xl"><h1 className="text-3xl font-semibold"><T text="Hero slider images" /></h1><p className="mt-3 text-muted"><T text="Only active images appear publicly. The existing JWS hero remains the fallback." /></p><MediaForm kind="hero" />{!images.length && <p><T text="No hero images uploaded yet." /></p>}{images.map(({ id, altText, caption, displayOrder, isActive, storageKey }) => <MediaForm key={id} kind="hero" media={{ id, altText, caption, displayOrder, enabled: isActive, previewVersion: createHash("sha256").update(storageKey).digest("hex").slice(0, 16) }} />)}</div>;
}
