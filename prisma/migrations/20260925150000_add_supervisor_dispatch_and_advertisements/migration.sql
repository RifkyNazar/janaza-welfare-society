-- Add the internal operational role without changing existing role values.
ALTER TABLE `User` MODIFY `role` ENUM('ADMIN', 'SUPERVISOR', 'EMPLOYEE') NOT NULL DEFAULT 'EMPLOYEE';

ALTER TABLE `EmployeeProfile`
  ADD COLUMN `availability` ENUM('AVAILABLE', 'UNAVAILABLE') NOT NULL DEFAULT 'AVAILABLE';

ALTER TABLE `TaskAssignment`
  MODIFY `status` ENUM('ASSIGNED', 'ACKNOWLEDGED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'ASSIGNED',
  ADD COLUMN `activeRequestId` INTEGER NULL,
  ADD COLUMN `assignedByUserId` INTEGER NULL,
  ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  ADD COLUMN `acknowledgedAt` DATETIME(3) NULL,
  ADD COLUMN `unassignedAt` DATETIME(3) NULL;

-- Existing assignments are the current assignments for their requests.
UPDATE `TaskAssignment` SET `activeRequestId` = `requestId`, `assignedAt` = `acceptedAt`;

CREATE INDEX `TaskAssignment_requestId_isActive_idx` ON `TaskAssignment`(`requestId`, `isActive`);
ALTER TABLE `TaskAssignment` DROP INDEX `TaskAssignment_requestId_key`;
CREATE UNIQUE INDEX `TaskAssignment_activeRequestId_key` ON `TaskAssignment`(`activeRequestId`);
CREATE INDEX `TaskAssignment_assignedByUserId_idx` ON `TaskAssignment`(`assignedByUserId`);
ALTER TABLE `TaskAssignment` ADD CONSTRAINT `TaskAssignment_assignedByUserId_fkey`
  FOREIGN KEY (`assignedByUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE `Advertisement` (
  `id` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `imageUrl` VARCHAR(191) NOT NULL,
  `description` VARCHAR(500) NULL,
  `linkUrl` VARCHAR(191) NULL,
  `startsAt` DATETIME(3) NULL,
  `endsAt` DATETIME(3) NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT false,
  `displayOrder` INTEGER NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `Advertisement_isActive_startsAt_endsAt_idx` ON `Advertisement`(`isActive`, `startsAt`, `endsAt`);
CREATE INDEX `Advertisement_displayOrder_idx` ON `Advertisement`(`displayOrder`);
