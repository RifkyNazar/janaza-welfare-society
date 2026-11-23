"use client";
import { T, useTranslation } from "@/components/public-language";
import { useActionState } from "react";
import Image from "next/image";
import { saveMedia } from "@/app/admin/(protected)/media-actions";

export function MediaForm({ kind, operationId = null, media }: { kind: "hero" | "activity"; operationId?: number | null; media?: { id: number; altText: string; caption: string | null; displayOrder: number; enabled: boolean; previewVersion?: string } }) {
  const { t } = useTranslation();
  const [state, action, pending] = useActionState(saveMedia.bind(null, kind, operationId, media?.id ?? null), {});
  const field = "block w-full rounded-lg border border-border p-3 mt-1";
  const previewUrl = media ? `/admin-media/${kind}/${media.id}${media.previewVersion ? `?v=${media.previewVersion}` : ""}` : "";
  return <form action={action} className="my-5 space-y-4 rounded-2xl border border-border bg-white p-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-lg font-semibold"><T text={media ? "Photo details" : kind === "activity" ? "Upload Photos" : "Add image"} /></h3>{kind === "activity" && media && <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${media.enabled ? "bg-primary/10 text-primary" : "bg-light-background text-muted"}`}><T text={media.enabled ? kind === "activity" ? "Selected for publication" : "Active" : kind === "activity" ? "Not selected for publication" : "Inactive"} /></span>}</div>
    {media && <figure className="overflow-hidden rounded-xl border border-border bg-light-background"><a className="block" target="_blank" rel="noreferrer" href={previewUrl} aria-label={t("Open full photo in a new tab")}><Image unoptimized src={previewUrl} alt={media.altText} width={720} height={480} className="max-h-64 w-full object-contain" /></a>{kind === "activity" && <figcaption className="border-t border-border bg-white px-4 py-3 text-sm text-muted">{media.caption || <T text="No caption added." />}</figcaption>}</figure>}
    <label className="block font-medium"><T text={media ? kind === "hero" ? "Choose replacement image" : "Replacement image (optional)" : "Choose a photo"} /><input className={field} required={kind === "hero" || !media} type="file" name="image" accept="image/jpeg,image/png,image/webp" /></label>
    <p className="text-sm leading-6 text-muted"><T text="JPEG, PNG or WEBP, up to 5 MB per image." /> <T text={kind === "activity" ? "Upload one photo at a time; repeat to add more photos to this activity." : "Upload one image per submission."} /></p>
    {kind === "activity" && <>
    <label className="block"><T text="Alt text" /><input className={field} required name="altText" maxLength={180} defaultValue={media?.altText} /></label>
    <label className="block"><T text="Caption" /><input className={field} name="caption" maxLength={500} defaultValue={media?.caption ?? ""} /></label>
    <label className="block"><T text="Display order" /><input className={field} type="number" name="displayOrder" min={-100000} max={100000} defaultValue={media?.displayOrder ?? 0} /></label>
    <label className="flex items-start gap-3 rounded-xl border border-border bg-light-background p-4 text-sm leading-6"><input className="mt-1 size-4 shrink-0 accent-primary" type="checkbox" name="enabled" defaultChecked={media?.enabled ?? false} /><T text="Select for publication. This photo is public only while the activity is published. Uncheck and save to deselect it." /></label>
    </>}
    {state.error && <p role="alert" className="text-red-700"><T text={state.error} /></p>}{state.success && <p role="status"><T text={state.success} /></p>}
    <div className="flex flex-wrap gap-3"><button disabled={pending} className="rounded-xl bg-primary px-5 py-3 font-semibold disabled:opacity-60" name="intent" value="save"><T text={pending ? "Saving…" : media ? kind === "hero" ? "Replace image" : "Save photo changes" : kind === "activity" ? "Upload photo" : "Save image"} /></button>{media && <button formNoValidate disabled={pending} className="rounded-xl border border-highlight/35 px-5 py-3 text-highlight hover:bg-highlight/5 disabled:opacity-60" name="intent" value="remove"><T text={kind === "hero" ? "Delete image" : "Remove photo"} /></button>}</div>
  </form>;
}
