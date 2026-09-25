"use client";

import Image from "next/image";
import { useActionState, useEffect, useRef, useState } from "react";
import type { UploadTaskPhotoState } from "@/app/employee/(protected)/my-tasks/[id]/photo-actions";

export function TaskPhotoUpload({ action }: { action: (state: UploadTaskPhotoState, formData: FormData) => Promise<UploadTaskPhotoState> }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  async function upload(state: UploadTaskPhotoState, formData: FormData) { const result = await action(state, formData); if (result.success) { if (preview) URL.revokeObjectURL(preview); setPreview(null); setCaption(""); if (fileRef.current) fileRef.current.value = ""; } return result; }
  const [state, formAction, pending] = useActionState(upload, {});
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  return (
    <form action={formAction} className="mt-5 grid gap-4 rounded-2xl border border-border bg-light-background p-4 sm:grid-cols-2">
      <div><label htmlFor="task-photo" className="text-sm font-semibold">Image</label><input ref={fileRef} id="task-photo" name="image" type="file" accept="image/jpeg,image/png,image/webp" required className="mt-2 block w-full rounded-xl border border-border bg-white p-3 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:font-semibold file:text-foreground" onChange={(e)=>{ if(preview) URL.revokeObjectURL(preview); const file=e.target.files?.[0]; setPreview(file ? URL.createObjectURL(file) : null); }}/>{preview && <button type="button" className="mt-2 min-h-11 text-sm font-semibold underline decoration-primary decoration-2 underline-offset-4" onClick={()=>{if(preview) URL.revokeObjectURL(preview);setPreview(null);if(fileRef.current) fileRef.current.value="";}}>Remove selected image</button>}</div>
      <div><label htmlFor="task-photo-caption" className="text-sm font-semibold">Caption <span className="font-normal text-muted">(optional)</span></label><input id="task-photo-caption" name="caption" maxLength={180} value={caption} onChange={(e)=>setCaption(e.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-border bg-white px-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />{preview && <div className="relative mt-3 aspect-[4/3] overflow-hidden rounded-xl border border-border"><Image unoptimized src={preview} alt="Selected task photo preview" fill sizes="320px" className="object-cover" /></div>}</div>
      <div className="sm:col-span-2"><p className="text-xs text-muted">JPEG, PNG, or WEBP. Maximum 5 MB. Photos remain private unless approved by an admin.</p>{state.error && <p role="alert" aria-live="assertive" className="mt-3 text-sm font-medium text-red-700">{state.error}</p>}{state.success && <p role="status" aria-live="polite" className="mt-3 text-sm font-medium text-emerald-800">{state.success}</p>}<button disabled={pending || !preview} className="mt-4 min-h-12 rounded-full bg-primary px-6 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60">{pending ? "Uploading..." : "Upload Photo"}</button></div>
    </form>
  );
}
