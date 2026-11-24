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

test("an open notices page schedules a known boundary even when it is more than one poll away", () => {
  let effect, timeout, refreshed = 0, now = 1000;
  const previous = { window: globalThis.window, document: globalThis.document, now: Date.now };
  globalThis.window = {
    setTimeout: (run, delay) => { timeout = { run, delay }; return 1; },
    clearTimeout() {}, setInterval: () => 2, clearInterval() {},
  };
  globalThis.document = { hidden: false, addEventListener() {}, removeEventListener() {} };
  Date.now = () => now;
  try {
    const { AdvertisementRefresh } = loadServerModule("components/advertisement-refresh.tsx", {
      react: { useEffect: run => { effect = run; }, useState: () => [undefined, () => {}] },
      "next/navigation": { useRouter: () => ({ refresh() { refreshed++; } }) },
    });
    AdvertisementRefresh({ nextChange: now + 90_000 });
    const cleanup = effect();
    assert.equal(timeout.delay, 90_000);
    assert.equal(refreshed, 0);
    now += 90_000;
    timeout.run();
    assert.equal(refreshed, 1);
    cleanup();
  } finally {
    Date.now = previous.now;
    if (previous.window === undefined) delete globalThis.window;
    else globalThis.window = previous.window;
    if (previous.document === undefined) delete globalThis.document;
    else globalThis.document = previous.document;
  }
});

test("advertisement mutations notify open views and the refresh listener releases its channel", () => {
  const oldWindow = globalThis.window;
  const oldDocument = globalThis.document;
  const open = new Set();
  const pendingEffects = [];
  const published = { current: undefined };
  let refreshes = 0;
  let messages = 0;
  class Channel {
    constructor(name) { this.name = name; open.add(this); }
    postMessage(data) {
      messages++;
      for (const peer of open) {
        if (peer !== this && peer.name === this.name) peer.listener?.({ data });
      }
    }
    addEventListener(_event, listener) { this.listener = listener; }
    close() { open.delete(this); }
  }
  globalThis.window = { BroadcastChannel: Channel, setInterval: () => 1, clearInterval() {}, clearTimeout() {} };
  globalThis.document = { hidden: false, addEventListener() {}, removeEventListener() {} };
  try {
    const { AdvertisementRefresh, AdvertisementMutationNotice } = loadServerModule("components/advertisement-refresh.tsx", {
      react: { useEffect: effect => pendingEffects.push(effect), useState: () => [], useRef: () => published },
      "next/navigation": { useRouter: () => ({ refresh() { refreshes++; } }) },
    });
    AdvertisementRefresh({ nextChange: null });
    const stop = pendingEffects.shift()();
    AdvertisementMutationNotice({});
    pendingEffects.shift()();
    assert.equal(messages, 0);
    AdvertisementMutationNotice({ mutation: "saved" });
    const notify = pendingEffects.shift();
    notify();
    notify();
    assert.equal(messages, 1);
    assert.equal(refreshes, 1);
    globalThis.document.hidden = true;
    AdvertisementMutationNotice({ mutation: "deleted" });
    pendingEffects.shift()();
    assert.equal(messages, 2);
    assert.equal(refreshes, 1);
    stop();
    assert.equal(open.size, 0);
  } finally {
    if (oldWindow === undefined) delete globalThis.window;
    else globalThis.window = oldWindow;
    if (oldDocument === undefined) delete globalThis.document;
    else globalThis.document = oldDocument;
  }
});
