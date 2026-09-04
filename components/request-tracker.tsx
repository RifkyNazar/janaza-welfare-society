"use client";

import { useActionState } from "react";
import { trackServiceRequest, type TrackRequestActionState } from "@/app/actions/track-request";

const inputClass = "mt-2 min-h-12 w-full rounded-xl border border-border bg-white px-4 py-3 text-base text-foreground outline-none transition placeholder:text-muted/60 focus:border-primary focus:ring-4 focus:ring-primary/20 motion-reduce:transition-none";
const stages = [
  { status: "NEW", label: "Request Received" },
  { status: "ASSIGNED", label: "Team Assigned" },
  { status: "IN_PROGRESS", label: "Service In Progress" },
  { status: "COMPLETED", label: "Service Completed" },
] as const;

export function RequestTracker() {
  const [state, formAction, isPending] = useActionState<TrackRequestActionState, FormData>(trackServiceRequest, {});

  return (
    <div className="space-y-7">
      <form action={formAction} className="rounded-3xl border border-border bg-white p-5 shadow-[0_20px_60px_rgba(16,42,42,0.08)] sm:p-8" noValidate>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="requestCode" className="block text-sm font-semibold text-foreground">Request Code</label>
            <input id="requestCode" name="requestCode" className={inputClass} maxLength={64} autoCapitalize="characters" autoComplete="off" placeholder="JWS-REQ-..." required />
          </div>
          <div>
            <label htmlFor="mobileNumber" className="block text-sm font-semibold text-foreground">Mobile Number</label>
            <input id="mobileNumber" name="mobileNumber" type="tel" inputMode="tel" autoComplete="tel" className={inputClass} maxLength={30} placeholder="Use the number you submitted" required />
          </div>
        </div>
        {state.error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{state.error}</p>}
        <button type="submit" disabled={isPending} className="mt-6 min-h-12 w-full rounded-full bg-primary px-6 py-3 font-semibold text-foreground shadow-[0_8px_24px_rgba(69,232,205,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(69,232,205,0.35)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transform-none motion-reduce:transition-none sm:w-auto">
          {isPending ? "Checking..." : "Track Request"}
        </button>
      </form>
      {state.result && <TrackingResult result={state.result} />}
    </div>
  );
}

function TrackingResult({ result }: { result: NonNullable<TrackRequestActionState["result"]> }) {
  const date = (value: string) => new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(value));
  const details = [
    ["Request Code", result.requestCode],
    ["Service Type", result.serviceType],
    ["Required Date", date(result.requiredDate)],
    ...(result.requiredTime ? [["Required Time", result.requiredTime]] : []),
    ["Area", result.area],
    ["Current Status", statusLabel(result.status)],
    ["Submitted Date", date(result.submittedDate)],
  ];

  return (
    <section aria-live="polite" aria-labelledby="tracking-result-title" className="rounded-3xl border border-border bg-white p-5 shadow-[0_20px_60px_rgba(16,42,42,0.08)] sm:p-8">
      <h2 id="tracking-result-title" className="text-2xl font-semibold text-foreground">Request Status</h2>
      <dl className="mt-5 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2">
        {details.map(([label, value]) => <div key={label} className="bg-white p-4"><dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt><dd className="mt-1 break-words text-sm font-medium text-foreground">{value}</dd></div>)}
      </dl>
      {result.status === "CANCELLED" ? <CancelledNotice /> : <StatusTimeline status={result.status} />}
    </section>
  );
}

function StatusTimeline({ status }: { status: Exclude<NonNullable<TrackRequestActionState["result"]>["status"], "CANCELLED"> }) {
  const currentIndex = stages.findIndex((stage) => stage.status === status);
  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold text-foreground">Progress</h3>
      <ol className="mt-5 grid gap-0 sm:grid-cols-4" aria-label="Request progress">
        {stages.map((stage, index) => {
          const completed = index < currentIndex;
          const current = index === currentIndex;
          return <li key={stage.status} aria-current={current ? "step" : undefined} className="relative flex gap-4 pb-7 last:pb-0 sm:block sm:pb-0 sm:text-center">
            {index < stages.length - 1 && <span aria-hidden="true" className={`absolute left-[1.1rem] top-9 h-[calc(100%-1.6rem)] w-0.5 sm:left-[calc(50%+1.1rem)] sm:top-[1.1rem] sm:h-0.5 sm:w-[calc(100%-2.2rem)] ${completed ? "bg-primary" : "bg-border"}`} />}
            <span aria-hidden="true" className={`relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border-2 font-bold ${completed ? "border-primary bg-primary text-foreground" : current ? "border-primary bg-white text-foreground ring-4 ring-primary/20" : "border-border bg-light-background text-muted"}`}>{completed ? "✓" : index + 1}</span>
            <div className="sm:mt-3"><p className={`text-sm font-semibold ${current || completed ? "text-foreground" : "text-muted"}`}>{stage.label}</p><p className="mt-1 text-xs text-muted">{stage.status}</p></div>
          </li>;
        })}
      </ol>
    </div>
  );
}

function CancelledNotice() {
  return <div className="mt-8 rounded-2xl border border-border bg-light-background p-5"><h3 className="text-lg font-semibold text-foreground">Request Cancelled</h3><p className="mt-2 text-sm leading-6 text-muted">This request is no longer active. Please contact Janaza Welfare Society if you need further assistance.</p></div>;
}

function statusLabel(status: NonNullable<TrackRequestActionState["result"]>["status"]) {
  return status === "NEW" ? "Request Received" : status === "ASSIGNED" ? "Team Assigned" : status === "IN_PROGRESS" ? "Service In Progress" : status === "COMPLETED" ? "Service Completed" : "Request Cancelled";
}
