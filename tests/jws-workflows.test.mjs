import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import sharp from "sharp";
import { loadServerModule } from "./load-server-module.mjs";

test("desktop generic MIME and mobile image MIME work for each supported format", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "jws-ad-test-"));
  const original = process.env.JWS_ADVERTISEMENT_DIRECTORY;
  process.env.JWS_ADVERTISEMENT_DIRECTORY = directory;
  try {
    const ads = loadServerModule("lib/advertisement-image-storage.ts");
    const { prepareMemberPhoto } = loadServerModule("lib/operational-member-photo.ts");
    const source = sharp({ create: { width: 16, height: 12, channels: 3, background: "green" } });
    for (const format of ["jpeg", "png", "webp"]) {
      const bytes = await source.clone().toFormat(format).toBuffer();
      for (const type of ["", "application/octet-stream", "image/" + format]) {
        const file = new File([bytes], "photo." + format, { type });
        assert.equal((await sharp(await prepareMemberPhoto(file)).metadata()).format, "webp");
        const key = await ads.storeAdvertisementImage(file);
        assert.equal((await sharp(await ads.readAdvertisementImage(key)).metadata()).format, "webp");
        await ads.removeAdvertisementImage(key);
      }
    }
    await assert.rejects(ads.storeAdvertisementImage(new File(["malformed"], "photo.jpg")));
    assert.equal(await ads.readAdvertisementImage("../other-file.webp"), null);
  } finally {
    if (original === undefined) delete process.env.JWS_ADVERTISEMENT_DIRECTORY;
    else process.env.JWS_ADVERTISEMENT_DIRECTORY = original;
    await rm(directory, { recursive: true });
  }
});

test("expired cleanup retains shared images and rechecks the end date under lock", async () => {
  const cutoff = new Date("2026-11-24T18:30:00Z");
  const removed = [], files = [];
  let owners;
  const tx = {
    $queryRaw: async (chunks, id) => {
      assert.match(chunks.join("?"), /FOR UPDATE/);
      assert.equal(id, "target");
      return owners;
    },
    advertisement: { delete: async ({ where }) => {
      assert.equal(where.endsAt.lt, cutoff);
      removed.push(where.id);
    } },
  };
  const { deleteAdvertisementRecord } = loadServerModule("lib/advertisement-cleanup.ts", {
    "@/lib/prisma": { prisma: { $transaction: callback => callback(tx) } },
    "@/lib/advertisement-image-storage": { removeAdvertisementImage: async key => files.push(key) },
  });
  const expired = { id: "target", imageUrl: "owned.webp", endsAt: new Date(cutoff.getTime() - 1) };
  owners = [{ ...expired, endsAt: cutoff }];
  assert.equal(await deleteAdvertisementRecord("target", cutoff), false);
  owners = [expired, { id: "other", imageUrl: expired.imageUrl, endsAt: null }];
  assert.equal(await deleteAdvertisementRecord("target", cutoff), true);
  assert.deepEqual(files, []);
  owners = [expired];
  assert.equal(await deleteAdvertisementRecord("target", cutoff), true);
  assert.deepEqual(files, ["owned.webp"]);
  assert.deepEqual(removed, ["target", "target"]);
});

test("tracking maps completed assignments and returns only assigned employee data after authorization", async () => {
  let status = "IN_PROGRESS";
  const date = new Date("2026-11-24T19:00:00Z");
  const record = {
    requestCode: "JWS-REQ-TEST", serviceType: "Janazah", serviceSelections: [], area: "Area",
    createdAt: date, taskAssignments: [{
      status: "COMPLETED", isActive: true, completedAt: date,
      employee: { fullName: "Assigned employee", position: "Coordinator", phone: "0771234567", photoUrl: null },
    }],
  };
  const { trackServiceRequest } = loadServerModule("app/actions/track-request.ts", {
    "@/lib/prisma": { prisma: { serviceRequest: { findFirst: async ({ where, select }) => {
      assert.equal(select.taskAssignments.take, 1);
      return where.mobileNumber === "0771234567" ? { ...record, status } : null;
    } } } },
    "@/lib/profile-photo-storage": { readProfilePhoto: async () => assert.fail("photo read without a key") },
    "@/lib/rate-limit": { consumeRateLimit: async () => ({ allowed: true }) },
  });
  const form = new FormData();
  form.set("requestCode", record.requestCode);
  form.set("mobileNumber", "0770000000");
  assert.equal((await trackServiceRequest({}, form)).result, undefined);
  form.set("mobileNumber", "0771234567");
  const { result } = await trackServiceRequest({}, form);
  assert.equal(result.status, "COMPLETED");
  assert.equal(result.completedDate, date.toISOString());
  assert.deepEqual(result.employee, { fullName: "Assigned employee", position: "Coordinator", phone: "0771234567", photo: null });
  status = "CANCELLED";
  assert.equal((await trackServiceRequest({}, form)).result.employee, null);
});


test("notice expiry wakes only at known deadlines and removes elapsed notices locally", () => {
  let effect, timeout, expiredThrough = 0, now = 1000;
  const previous = { window: globalThis.window, now: Date.now };
  globalThis.window = { setTimeout: (run, delay) => { timeout = { run, delay }; return 1; }, clearTimeout() {} };
  Date.now = () => now;
  try {
    const { useAdvertisementExpiry } = loadServerModule("components/advertisement-expiry.tsx", {
      react: { useEffect: run => { effect = run; }, useState: () => [expiredThrough, time => { expiredThrough = time; }] },
    });
    const deadlines = [null, now + 90_000, now + 125_000];
    assert.equal(useAdvertisementExpiry(deadlines), 0);
    const cleanup = effect();
    assert.equal(timeout.delay, 90_000);
    now += 90_000;
    timeout.run();
    assert.equal(useAdvertisementExpiry(deadlines), now);
    cleanup();
    const stop = effect();
    assert.equal(timeout.delay, 35_000);
    now += 35_000;
    timeout.run();
    assert.equal(useAdvertisementExpiry(deadlines), now);
    assert.equal(effect(), undefined);
    stop();
  } finally {
    Date.now = previous.now;
    if (previous.window === undefined) delete globalThis.window;
    else globalThis.window = previous.window;
  }
});
