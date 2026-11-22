import assert from "node:assert/strict";
import { test, after } from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";
import { loadServerModule } from "./load-server-module.mjs";

const directory = await mkdtemp(path.join(tmpdir(), "jws-media-test-"));
process.env.JWS_MEDIA_DIRECTORY = directory;
const storage = loadServerModule("lib/public-media-storage.ts");
after(async () => {
  const resolved = path.resolve(directory);
  assert.equal(path.dirname(resolved), path.resolve(tmpdir()));
  assert.ok(path.basename(resolved).startsWith("jws-media-test-"));
  await rm(resolved, { recursive: true });
});
const image = await sharp({ create: { width: 2, height: 2, channels: 3, background: "white" } }).png().toBuffer();

test("upload rejects empty, oversized, unsupported and spoofed images", async () => {
  for (const file of [new File([], "empty.png", { type: "image/png" }), new File([Buffer.alloc(5 * 1024 * 1024 + 1)], "large.png", { type: "image/png" }), new File([image], "image.svg", { type: "image/svg+xml" }), new File(["not a PNG"], "spoof.png", { type: "image/png" })]) {
    await assert.rejects(storage.storePublicMedia("activity", file));
  }
});
test("signature-only malformed images also fail decoding", async () => {
  await assert.rejects(storage.storePublicMedia("hero", new File([Buffer.from([137,80,78,71,13,10,26,10])], "bad.png", { type: "image/png" })));
});
test("stored images get random keys and never use the supplied path", async () => {
  const file = new File([image], "../../private.png", { type: "image/png" });
  const key = await storage.storePublicMedia("activity", file);
  assert.match(key, /^[0-9a-f-]{36}\.webp$/);
  const bytes = await storage.readPublicMedia("activity", key);
  assert.equal((await sharp(bytes).metadata()).format, "webp");
  assert.equal(await storage.readPublicMedia("hero", key), null);
  await storage.removePublicMedia("activity", key);
  assert.equal(await storage.readPublicMedia("activity", key), null);
});
test("media path traversal and arbitrary URLs are rejected", async () => {
  for (const key of ["../../.env", "/etc/passwd", "https://example.com/p.png", "..\\secret.jpg"]) {
    assert.equal(storage.mediaMime(key), null);
    assert.equal(await storage.readPublicMedia("activity", key), null);
  }
});
test("public activity delivery requires both selection and publication on every request", async () => {
  let published = false, selected = false, queries = 0;
  const key = await storage.storePublicMedia("activity", new File([image], "photo.png", { type: "image/png" }));
  const route = loadServerModule("app/public-media/[kind]/[id]/route.ts", {
    "@/lib/prisma": { prisma: { activityMedia: { findFirst: async ({ where }) => {
      queries++;
      assert.equal(where.isPublic, true);
      assert.equal(where.operation.isPublished, true);
      assert.equal(where.operation.source, "MANUAL");
      return published && selected ? { storageKey: key } : null;
    } } } }, "@/lib/public-media-storage": storage,
  });
  const get = () => route.GET(new Request("http://localhost/public-media/activity/1"), { params: Promise.resolve({ kind: "activity", id: "1" }) });
  assert.equal((await get()).status, 404);
  selected = true;
  assert.equal((await get()).status, 404);
  published = true;
  const response = await get();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("cache-control"), /no-store/);
  published = false;
  assert.equal((await get()).status, 404);
  assert.equal(queries, 4);
});
test("inactive hero images cannot be served publicly", async () => {
  const route = loadServerModule("app/public-media/[kind]/[id]/route.ts", {
    "@/lib/prisma": { prisma: { heroMedia: { findFirst: async ({ where }) => { assert.equal(where.isActive, true); return null; } } } },
    "@/lib/public-media-storage": storage,
  });
  assert.equal((await route.GET(new Request("http://localhost"), { params: Promise.resolve({ kind: "hero", id: "1" }) })).status, 404);
});
test("hero upload and replacement serve new bytes without restoring a stale storage key", async () => {
  let current;
  const heroMedia = {
    create: async ({ data }) => { current = { ...data, id: 1 }; },
    findUnique: async () => current,
    findFirst: async () => current?.isActive ? current : null,
    updateMany: async ({ where, data }) => {
      assert.equal(where.storageKey, current.storageKey);
      current = { ...current, ...data };
      return { count: 1 };
    },
  };
  const doubles = { "@/lib/prisma": { prisma: { heroMedia } }, "@/lib/public-media-storage": storage };
  const { saveMedia } = loadServerModule("app/admin/(protected)/media-actions.ts", {
    ...doubles, "@/lib/permissions": { requireAdmin: async () => ({}) }, "next/cache": { revalidatePath() {} },
  });
  const { GET } = loadServerModule("app/public-media/[kind]/[id]/route.ts", doubles);
  const get = () => GET(new Request("http://localhost"), { params: Promise.resolve({ kind: "hero", id: "1" }) });
  const data = new FormData();
  data.set("altText", "JWS photograph");
  data.set("enabled", "on");
  data.set("image", new File([image], "first.png", { type: "image/png" }));
  assert.equal((await saveMedia("hero", null, null, {}, data)).success, "Image saved.");
  const first = await (await get()).arrayBuffer();
  const replacement = await sharp({ create: { width: 2, height: 2, channels: 3, background: "red" } }).png().toBuffer();
  data.set("image", new File([replacement], "second.png", { type: "image/png" }));
  assert.equal((await saveMedia("hero", null, 1, {}, data)).success, "Image saved.");
  assert.notDeepEqual(await (await get()).arrayBuffer(), first);
  const replacementKey = current.storageKey;
  data.delete("image");
  data.delete("enabled");
  assert.equal((await saveMedia("hero", null, 1, {}, data)).success, "Image saved.");
  assert.equal(current.storageKey, replacementKey);
  assert.equal((await get()).status, 404);
});
test("admin preview and upload mutations authorize before any database or storage work", async () => {
  const denied = new Error("ADMIN_REQUIRED");
  const doubles = { "@/lib/permissions": { requireAdmin: async () => { throw denied; } }, "@/lib/prisma": { prisma: {} }, "@/lib/public-media-storage": storage, "next/cache": { revalidatePath() {} } };
  const route = loadServerModule("app/admin-media/[kind]/[id]/route.ts", doubles);
  await assert.rejects(route.GET(new Request("http://localhost"), { params: Promise.resolve({ kind: "hero", id: "1" }) }), /ADMIN_REQUIRED/);
  const actions = loadServerModule("app/admin/(protected)/media-actions.ts", doubles);
  await assert.rejects(actions.saveMedia("hero", null, null, {}, new FormData()), /ADMIN_REQUIRED/);
});

test("removing an activity photo returns to its draft with visible success feedback", async () => {
  let deleted = false, removedFile = false;
  const actions = loadServerModule("app/admin/(protected)/media-actions.ts", {
    "@/lib/permissions": { requireAdmin: async () => ({ user: { id: "1" } }) },
    "next/cache": { revalidatePath() {} },
    "next/navigation": { redirect: url => { throw new Error(`REDIRECT:${url}`); } },
    "@/lib/prisma": { prisma: {
      operation: { findFirst: async ({ where }) => { assert.equal(where.source, "MANUAL"); return { id: 8 }; } },
      activityMedia: {
        findFirst: async ({ where }) => { assert.deepEqual(where, { id: 3, operationId: 8 }); return { id: 3, storageKey: "test-key" }; },
        delete: async ({ where }) => { assert.equal(where.id, 3); deleted = true; },
      },
    } },
    "@/lib/public-media-storage": { removePublicMedia: async (kind, key) => { assert.equal(kind, "activity"); assert.equal(key, "test-key"); removedFile = true; } },
  });
  const data = new FormData(); data.set("intent", "remove");
  await assert.rejects(actions.saveMedia("activity", 8, 3, {}, data), /REDIRECT:\/admin\/operations\/8\?photoRemoved=1#activity-photos$/);
  assert.ok(deleted && removedFile);
});
test("task photo endpoint rejects anonymous requests before querying private data", async () => {
  const route = loadServerModule("app/task-photos/[id]/route.ts", { "@/auth": { auth: async () => null }, "@/lib/prisma": { prisma: {} }, "@/lib/task-photo-storage": {} });
  assert.equal((await route.GET(new Request("http://localhost"), { params: Promise.resolve({ id: "1" }) })).status, 404);
});
test("existing operation-photo endpoint still requires publication and individual approval", async () => {
  const route = loadServerModule("app/operation-photos/[id]/route.ts", {
    "@/lib/prisma": { prisma: { operationPhoto: { findFirst: async ({ where }) => { assert.equal(where.operation.is.isPublished, true); assert.equal(where.taskPhoto.is.isApprovedForPublic, true); return null; } } } },
    "@/lib/task-photo-storage": {},
  });
  assert.equal((await route.GET(new Request("http://localhost"), { params: Promise.resolve({ id: "1" }) })).status, 404);
});
