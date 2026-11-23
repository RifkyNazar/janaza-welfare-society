import assert from "node:assert/strict";
import test from "node:test";
import { loadServerModule } from "./load-server-module.mjs";

const schedule = loadServerModule("lib/advertisement-schedule.ts");

test("advertisement dates include the entire Colombo calendar day", () => {
  const start = schedule.advertisementDateBoundary("2028-02-29");
  const end = schedule.advertisementDateBoundary("2028-02-29", true);
  assert.equal(start.toISOString(), "2028-02-28T18:30:00.000Z");
  assert.equal(end.toISOString(), "2028-02-29T18:29:59.999Z");
  assert.equal(schedule.advertisementDateInput(start), "2028-02-29");
  assert.equal(schedule.advertisementDateInput(end), "2028-02-29");
  const { AND } = schedule.liveAdvertisementFilter(end);
  assert.equal(AND[0].OR[1].startsAt.lte, end);
  assert.equal(AND[1].OR[1].endsAt.gte, end);
  for (const invalid of ["2027-02-29", "2028-02-30", "2028-13-01", "2028-2-01", "2028-02-29T12:00"]) {
    assert.equal(schedule.advertisementDateBoundary(invalid), undefined);
  }
  assert.equal(schedule.advertisementDateBoundary(""), null);
});

test("advertisement edits preserve existing schedule times and ordering unless a date changes", async () => {
  const existing = { imageUrl: "banner.webp", startsAt: new Date("2026-11-23T12:00Z"), endsAt: new Date("2026-11-24T12:00Z") };
  let saved;
  const { saveAdvertisement } = loadServerModule("app/admin/(protected)/advertisements/actions.ts", {
    "next/cache": { revalidatePath() {} },
    "@/lib/advertisement-schedule": schedule,
    "@/lib/permissions": { requireAdmin: async () => {} },
    "@/lib/advertisement-image-storage": { advertisementImageExists: async () => true },
    "@/lib/prisma": { prisma: { advertisement: {
      findUnique: async () => existing,
      update: async ({ data }) => { saved = data; return { id: "banner" }; },
    } } },
  });
  const form = new FormData();
  form.set("title", "Banner");
  form.set("startsAt", "2026-11-23");
  form.set("endsAt", "2026-11-24");
  form.set("displayOrder", "999");
  assert.ok((await saveAdvertisement("banner", {}, form)).success);
  assert.equal(saved.startsAt, existing.startsAt);
  assert.equal(saved.endsAt, existing.endsAt);
  assert.equal(Object.hasOwn(saved, "displayOrder"), false);
  form.set("endsAt", "2026-11-25");
  assert.ok((await saveAdvertisement("banner", {}, form)).success);
  assert.equal(saved.endsAt.toISOString(), "2026-11-25T18:29:59.999Z");
  form.set("endsAt", "2026-11-22");
  assert.ok((await saveAdvertisement("banner", {}, form)).error);
});
