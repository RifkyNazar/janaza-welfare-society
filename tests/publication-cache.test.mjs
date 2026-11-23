import assert from "node:assert/strict";
import test from "node:test";
import { loadServerModule } from "./load-server-module.mjs";

test("public vehicle and advertisement images require a fresh visibility check after being hidden", async () => {
  let visible = true;
  const bytes = new Uint8Array([1, 2, 3]);
  const auth = { auth: async () => null };
  const { GET: vehicle } = loadServerModule("app/vehicle-images/[id]/route.ts", {
    "@/auth": auth,
    "@/lib/prisma": { prisma: { vehicle: { findUnique: async () => ({ imageUrl: "photo", isActive: true, isPublic: visible }) } } },
    "@/lib/vehicle-image-storage": { isVehicleImageKey: () => true, readVehicleImage: async () => bytes, vehicleImageMime: () => "image/webp" },
  });
  const { GET: advertisement } = loadServerModule("app/advertisement-images/[key]/route.ts", {
    "@/auth": auth,
    "@/lib/prisma": { prisma: { advertisement: { findFirst: async ({ where }) => {
      assert.equal(where.isActive, true);
      assert.equal(where.AND.length, 2);
      return visible ? { id: "ad" } : null;
    } } } },
    "@/lib/advertisement-schedule": loadServerModule("lib/advertisement-schedule.ts"),
    "@/lib/advertisement-image-storage": { readAdvertisementImage: async () => bytes, advertisementImageMime: () => "image/webp" },
  });
  const request = new Request("http://localhost");
  const getVehicle = () => vehicle(request, { params: Promise.resolve({ id: "vehicle" }) });
  const getAd = () => advertisement(request, { params: Promise.resolve({ key: "photo" }) });
  const published = await Promise.all([getVehicle(), getAd()]);
  visible = false;
  assert.deepEqual((await Promise.all([getVehicle(), getAd()])).map(response => response.status), [404, 404]);
  assert.deepEqual(published.map(response => response.status), [200, 200]);
  assert.deepEqual(published.map(response => response.headers.get("cache-control")), ["private, no-store", "private, no-store"]);
});

test("the public homepage supplies scheduled advertisements and active hero images", async () => {
  const EmeraldSanctuary = () => null;
  const AdvertisementBanners = () => null;
  const HeroCarousel = () => null;
  const { default: page } = loadServerModule("app/(public)/page.tsx", {
    "@/components/emerald-sanctuary": { EmeraldSanctuary },
    "@/components/advertisement-banners": { AdvertisementBanners },
    "@/components/hero-carousel": { HeroCarousel },
    "@/lib/prisma": { prisma: { operationalTeamMember: { findMany: async ({ select, take }) => {
      assert.deepEqual(select, { id: true, fullName: true });
      assert.equal(take, undefined);
      return [{ id: 21, fullName: "Test operational member" }];
    } }, heroMedia: { findMany: async ({ where, orderBy }) => {
      assert.deepEqual(where, { isActive: true });
      assert.deepEqual(orderBy, [{ displayOrder: "asc" }, { id: "asc" }]);
      return [{ id: 7, altText: "JWS fleet", caption: "Fleet" }];
    } } } },
  });
  const home = await page();
  assert.equal(home.type, EmeraldSanctuary);
  assert.deepEqual(home.props.operationalMembers, [{ id: 21, fullName: "Test operational member" }]);
  assert.equal(home.props.announcements.type, AdvertisementBanners);
  assert.equal(home.props.heroMedia.type, HeroCarousel);
  assert.deepEqual(home.props.heroMedia.props.images, [{ src: "/public-media/hero/7", altText: "JWS fleet", caption: "Fleet" }]);
});

test("donation receipt authorization uses the current database role before reading private data", async () => {
  for (const account of [{ role: "EMPLOYEE", status: "APPROVED" }, { role: "ADMIN", status: "DISABLED" }]) {
    const { GET } = loadServerModule("app/donation-receipts/[id]/route.ts", {
      "@/auth": { auth: async () => ({ user: { id: "4", role: "ADMIN" } }) },
      "@/lib/prisma": { prisma: {
        user: { findUnique: async () => account },
        donation: { findUnique: async () => assert.fail("private receipt lookup") },
      } },
      "@/lib/donation-receipt-storage": { readDonationReceipt: async () => assert.fail("private file read") },
    });
    const response = await GET(new Request("http://localhost/donation-receipts/1"), {
      params: Promise.resolve({ id: "1" }),
    });
    assert.equal(response.status, 404);
  }
});
