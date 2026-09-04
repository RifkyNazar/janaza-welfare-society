"use client";

import { useActionState } from "react";
import type { UploadTaskPhotoState } from "@/app/employee/(protected)/my-tasks/[id]/photo-actions";

export function TaskPhotoUpload({ action }: { action: (state: UploadTaskPhotoState, formData: FormData) => Promise<UploadTaskPhotoState> }) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className="mt-5 grid gap-4 rounded-2xl border border-border bg-light-background p-4 sm:grid-cols-2">
      <div><label htmlFor="task-photo" className="text-sm font-semibold">Image</label><input id="task-photo" name="image" type="file" accept="image/jpeg,image/png,image/webp" required className="mt-2 block w-full rounded-xl border border-border bg-white p-3 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:font-semibold file:text-foreground" /></div>
      <div><label htmlFor="task-photo-caption" className="text-sm font-semibold">Caption <span className="font-normal text-muted">(optional)</span></label><input id="task-photo-caption" name="caption" maxLength={180} className="mt-2 min-h-12 w-full rounded-xl border border-border bg-white px-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" /></div>
      <div className="sm:col-span-2"><p className="text-xs text-muted">JPEG, PNG, or WEBP. Maximum 5 MB. Photos remain private unless approved by an admin.</p>{state.error && <p role="alert" className="mt-3 text-sm font-medium text-red-700">{state.error}</p>}{state.success && <p role="status" className="mt-3 text-sm font-medium text-emerald-800">{state.success}</p>}<button disabled={pending} className="mt-4 rounded-full bg-primary px-6 py-3 text-sm font-semibold disabled:opacity-60">{pending ? "Uploading..." : "Add Photo"}</button></div>
    </form>
  );
}
