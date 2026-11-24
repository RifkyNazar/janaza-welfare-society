"use client";

import { useFormSubmission } from "@/components/use-form-submission";
import { validateImageSelection } from "@/lib/image-upload-limits";
import { T, useTranslation } from "@/components/public-language";

import { useActionState } from "react";
import Image from "next/image";
import Link from "next/link";
import { saveOperationalMember, deleteOperationalMember } from "@/app/admin/(protected)/operational-team/actions";

export type EditableMember = { id: number; fullName: string; version: number };
export function OperationalMemberForm({ member, visibleMemberIds = [] }: { member?: EditableMember; visibleMemberIds?: number[] }) {
  const [state, action, pending] = useActionState(saveOperationalMember.bind(null, member?.id ?? null, member?.version ?? null), {});
  const submission = useFormSubmission(state, pending);
  const { t } = useTranslation();
  const suffix = member?.id ?? "new";
  const added = state.addedMember;
  const showPreview = added && !visibleMemberIds.includes(added.id);
  return <form action={action} onSubmit={submission.onSubmit} onChange={submission.onChange} className="space-y-5 rounded-2xl border border-border bg-white p-5 sm:p-6">
    <div><label htmlFor={`member-name-${suffix}`} className="block text-sm font-semibold"><T text="Full Name" /> <span aria-hidden="true">*</span></label><input disabled={pending} id={`member-name-${suffix}`} name="fullName" required maxLength={150} autoComplete="name" defaultValue={state.fullName ?? member?.fullName ?? ""} className="mt-2 min-h-11 w-full rounded-xl border border-border p-3" /></div>
    <div><label htmlFor={`member-photo-${suffix}`} className="block text-sm font-semibold"><T text="Member Photo" /> <span aria-hidden="true">*</span></label>
      {member && <Image unoptimized src={`/team-member-photos/${member.id}?v=${member.version}`} alt={member.fullName} width={240} height={300} className="mt-2 max-h-48 w-auto rounded-xl object-contain" />}
      <input disabled={pending} id={`member-photo-${suffix}`} name="photo" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={event => validateImageSelection(event.currentTarget, t("Image must be 5 MB or smaller."))} required={!member} aria-describedby={`member-photo-help-${suffix}`} className="mt-2 block min-h-11 w-full rounded-xl border border-border p-3 text-sm" />
      <p id={`member-photo-help-${suffix}`} className="mt-2 text-sm text-muted"><T text="JPEG, PNG or WebP, up to 5 MB." /> <T text={member ? "Your current required photo is retained unless you choose a replacement." : "A photo is required."} /></p>
    </div>
    {submission.showFeedback && state.error && <p role="alert" className="text-sm text-red-700"><T text={state.error} /></p>}{submission.showFeedback && state.success && <p role="status" className="text-sm font-medium"><T text={state.success} /></p>}
    {submission.showFeedback && showPreview && <Link href={`/admin/operational-team/${added.id}`} className="flex items-center gap-3 font-semibold underline">
      <Image unoptimized src={`/team-member-photos/${added.id}?v=0`} alt="" width={64} height={80} className="rounded-lg" />
      {added.fullName}
    </Link>}
    <button type="submit" disabled={pending} className="min-h-11 rounded-xl bg-primary px-5 py-3 font-semibold disabled:opacity-60"><T text={pending ? "Saving…" : member ? "Save member" : "Add member"} /></button>
  </form>;
}

export function DeleteOperationalMember({ member }: { member: EditableMember }) {
  const { t } = useTranslation();
  const [state, action, pending] = useActionState(deleteOperationalMember.bind(null, member.id, member.version), {});
  const submission = useFormSubmission(state, pending);
  return <form action={action} onSubmit={event => { if (!window.confirm(t("Delete {name} and their public photo? This cannot be undone.").replace("{name}", () => member.fullName))) event.preventDefault(); submission.onSubmit(event); }}>
    <button type="submit" name="confirmation" value="DELETE" disabled={pending} className="min-h-11 rounded-xl border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-60"><T text={pending ? "Deleting…" : "Delete member"} /></button>
    {state.error && <p role="alert" className="mt-2 text-sm text-red-700"><T text={state.error} /></p>}{state.success && <p role="status" className="mt-2 text-sm"><T text={state.success} /></p>}
  </form>;
}
