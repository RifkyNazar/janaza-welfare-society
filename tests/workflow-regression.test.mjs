import assert from "node:assert/strict";
import { test } from "node:test";
import { loadServerModule } from "./load-server-module.mjs";

const cache = { revalidatePath() {} };
const admin = { requireAdmin: async () => ({ user: { id: "1" } }) };
const navigation = { redirect: url => { throw new Error(`REDIRECT:${url}`); } };
function form(values) { const data = new FormData(); for (const [key, value] of Object.entries(values)) data.set(key, value); return data; }

test("tracking uses BOTH credentials and exposes only its existing public projection", async () => {
  const actions = loadServerModule("app/actions/track-request.ts", {
    "@/lib/rate-limit": { consumeRateLimit: async () => ({ allowed: true }) },
    "@/lib/prisma": { prisma: { serviceRequest: { findFirst: async ({ where, select }) => {
      assert.deepEqual(where, { requestCode: "JWS-REQ-TEST", mobileNumber: "0771234567" });
      for (const privateField of ["requesterName", "mobileNumber", "address", "note", "latitude", "longitude"]) assert.equal(select[privateField], undefined);
      return null;
    } } } },
  });
  const result = await actions.trackServiceRequest({}, form({ requestCode: "JWS-REQ-TEST", mobileNumber: "0771234567" }));
  assert.equal(result.result, undefined);
  assert.equal(result.error, "We could not find a request matching those details.");
});
test("public submission still generates unique codes and records NEW requests", async () => {
  const serviceOptions = loadServerModule("lib/service-options.ts");
  const records = [];
  const prisma = { serviceRequest: { create: async ({ data }) => {
    records.push(data);
    return { ...data, id: records.length, createdAt: new Date(), serviceSelections: data.serviceSelections.create };
  } } };
  prisma.$transaction = callback => callback(prisma);
  const actions = loadServerModule("app/actions/service-request.ts", {
    "@/generated/prisma/client": { Prisma: {} }, "@/lib/prisma": { prisma },
    "@/lib/service-options": serviceOptions,
    "@/lib/rate-limit": { consumeRateLimit: async () => ({ allowed: true }) },
    "@/lib/notifications": { notifyStaffOfNewServiceRequest: async () => {} },
    "@/lib/request-confirmation-pdf": { createRequestConfirmationPdf: async () => Buffer.from("test") },
  });
  const data = () => form({ requesterName: "Unit test", mobileNumber: "0771234567", area: "Test area", serviceCategory: "JANAZAH", serviceCodes: "JANAZAH_KAFAN" });
  const first = await actions.submitServiceRequest({}, data());
  const second = await actions.submitServiceRequest({}, data());
  assert.match(first.requestCode, /^JWS-REQ-\d{4}-[A-F0-9]{10}$/);
  assert.notEqual(first.requestCode, second.requestCode);
  assert.ok(records.every(record => record.status === "NEW"));
});
test("manual activity is an admin-only draft with no fabricated task/photos", async () => {
  let created;
  const actions = loadServerModule("app/admin/(protected)/operations/actions.ts", {
    "@/lib/permissions": admin, "next/cache": cache, "next/navigation": navigation,
    "@/lib/prisma": { prisma: { operation: { create: async ({ data }) => { created = data; return { id: 12 }; } } } },
  });
  const data = form({ title: "Test draft", shortDescription: "Test", description: "", serviceType: "Community", area: "Public venue", operationDate: "2026-11-16" });
  await assert.rejects(actions.createManualActivity({}, data), /REDIRECT:\/admin\/operations\/12\?created=1#activity-photos$/);
  assert.equal(created.source, "MANUAL"); assert.equal(created.isPublished, false);
  assert.equal(created.taskAssignmentId, undefined); assert.equal(created.photos, undefined);
});
test("task-based draft eligibility still requires completed task and request with approved photos", async () => {
  const actions = loadServerModule("app/admin/(protected)/operations/actions.ts", {
    "@/lib/permissions": admin, "next/cache": cache, "next/navigation": navigation,
    "@/lib/prisma": { prisma: { taskAssignment: { findFirst: async ({ where, select }) => {
      assert.equal(where.status, "COMPLETED"); assert.equal(where.request.is.status, "COMPLETED");
      assert.equal(select.photos.where.isApprovedForPublic, true); return null;
    } } } },
  });
  const result = await actions.createOperation(5, {}, form({ title: "Title", shortDescription: "Summary", serviceType: "Service", area: "Public area", operationDate: "2026-11-16" }));
  assert.match(result.error, /not eligible/);
});
test("task-based publishing still rejects unapproved selected photos", async () => {
  const actions = loadServerModule("app/admin/(protected)/operations/actions.ts", {
    "@/lib/permissions": admin, "next/cache": cache, "next/navigation": navigation,
    "@/lib/prisma": { prisma: { operation: { findUnique: async () => ({ title: "Title", shortDescription: "Summary", serviceType: "Service", area: "Area", operationDate: new Date(), photos: [{ taskPhoto: { isApprovedForPublic: false } }] }) } } },
  });
  assert.match((await actions.setOperationPublished(1, true, {}, new FormData())).error, /unapproved/);
});
test("existing employee task transitions retain ownership and expected prior state", async () => {
  let status = "ACKNOWLEDGED";
  const prisma = {
    taskAssignment: {
      findFirst: async ({ where }) => { assert.equal(where.employeeId, 7); assert.equal(where.isActive, true); return { requestId: 10, status }; },
      updateMany: async ({ where, data }) => { assert.equal(where.employeeId, 7); assert.equal(where.status, status); status = data.status; return { count: 1 }; },
    },
    serviceRequest: { updateMany: async () => ({ count: 1 }) },
  };
  prisma.$transaction = callback => callback(prisma);
  const actions = loadServerModule("app/employee/(protected)/actions.ts", { "@/lib/prisma": { prisma }, "next/cache": cache, "@/lib/permissions": { requireEmployee: async () => ({ user: { employeeProfileId: 7 } }) } });
  assert.deepEqual(await actions.startTask(1, {}, new FormData()), {}); assert.equal(status, "IN_PROGRESS");
  assert.deepEqual(await actions.completeTask(1, {}, new FormData()), {}); assert.equal(status, "COMPLETED");
  assert.match((await actions.startTask(1, {}, new FormData())).error, /no longer/);
  assert.match((await actions.acceptTask(10, {}, new FormData())).error, /Self-assignment is disabled/);
});
test("public employee approval is restricted to approved employees", async () => {
  const reviewedAt = Date.parse("2026-11-22T12:30:00Z");
  const actions = loadServerModule("app/admin/(protected)/employees/actions.ts", { "@/lib/employee-pin": {}, "@/lib/employee-phone-registration": {}, "@/generated/prisma/client": {}, "@/lib/employee-phone": {}, "@/lib/permissions": admin, "next/cache": cache, "next/navigation": navigation, "@/lib/prisma": { prisma: { employeeProfile: { updateMany: async ({ where, data }) => { assert.deepEqual(where.user, { role: "EMPLOYEE", status: "APPROVED" }); assert.deepEqual(where.updatedAt, new Date(reviewedAt)); assert.equal(data.isPublicProfile, true); return { count: 0 }; } } } } });
  assert.match((await actions.setPublicEmployee(7, true, reviewedAt, {}, new FormData())).error, /Review the current profile/);
});
test("translation changes UI labels without changing request codes or user content", () => {
  const { translate } = loadServerModule("lib/i18n.ts");
  assert.equal(translate("en", "Request Code"), "Request Code");
  assert.notEqual(translate("ta", "Request Code"), "Request Code");
  assert.equal(translate("ta", "JWS-REQ-2026-ABCDEF1234"), "JWS-REQ-2026-ABCDEF1234");
  assert.equal(translate("ta", "Untranslated authored content"), "Untranslated authored content");
});

test("every Tamil dictionary value contains Tamil text without encoding corruption", () => {
  const { tamil } = loadServerModule("lib/i18n.ts");
  for (const [key, value] of Object.entries(tamil)) {
    assert.match(value, /\p{Script=Tamil}/u, key);
    assert.doesNotMatch(value, /\?{2,}|\uFFFD/u, key);
  }
});
