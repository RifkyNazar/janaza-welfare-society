import "server-only";
import type { Prisma } from "@/generated/prisma/client";
export const publicOperationSelect = {
  id: true, title: true, shortDescription: true, description: true,
  serviceType: true, area: true, operationDate: true,
  photos: { where: { taskPhoto: { isApprovedForPublic: true } }, orderBy: [{ displayOrder: "asc" }, { id: "asc" }], select: { id: true, taskPhoto: { select: { caption: true } } } },
  media: { where: { isPublic: true, operation: { source: "MANUAL" } }, orderBy: [{ displayOrder: "asc" }, { id: "asc" }], select: { id: true, altText: true, caption: true } },
} satisfies Prisma.OperationSelect;
export type PublicOperation = Prisma.OperationGetPayload<{ select: typeof publicOperationSelect }>;
export function publicOperationImages(operation: Pick<PublicOperation, "photos" | "media">) {
  return [
    ...operation.photos.map(photo => ({ src: `/operation-photos/${photo.id}`, altText: photo.taskPhoto.caption || "Operation photo", caption: photo.taskPhoto.caption })),
    ...operation.media.map(photo => ({ src: `/public-media/activity/${photo.id}`, altText: photo.altText, caption: photo.caption })),
  ];
}
