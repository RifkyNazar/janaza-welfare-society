ALTER TABLE `Operation` ADD COLUMN `source` ENUM('TASK_BASED', 'MANUAL') NOT NULL DEFAULT 'TASK_BASED';
-- Existing standalone operations remain standalone; no task/photo relations change.
UPDATE `Operation` SET `source` = 'MANUAL' WHERE `taskAssignmentId` IS NULL;

CREATE TABLE `HeroMedia` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `storageKey` VARCHAR(191) NOT NULL,
  `altText` VARCHAR(180) NOT NULL,
  `caption` VARCHAR(500) NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT false,
  `displayOrder` INTEGER NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `HeroMedia_storageKey_key` (`storageKey`),
  INDEX `HeroMedia_isActive_displayOrder_idx` (`isActive`, `displayOrder`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ActivityMedia` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `operationId` INTEGER NOT NULL,
  `storageKey` VARCHAR(191) NOT NULL,
  `altText` VARCHAR(180) NOT NULL,
  `caption` VARCHAR(500) NULL,
  `isPublic` BOOLEAN NOT NULL DEFAULT false,
  `displayOrder` INTEGER NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `ActivityMedia_storageKey_key` (`storageKey`),
  INDEX `ActivityMedia_operationId_displayOrder_idx` (`operationId`, `displayOrder`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `ActivityMedia` ADD CONSTRAINT `ActivityMedia_operationId_fkey` FOREIGN KEY (`operationId`) REFERENCES `Operation` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
