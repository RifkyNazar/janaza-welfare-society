-- CreateTable
CREATE TABLE `Operation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `taskAssignmentId` INTEGER NULL,
    `title` VARCHAR(191) NOT NULL,
    `shortDescription` VARCHAR(500) NOT NULL,
    `description` TEXT NULL,
    `serviceType` VARCHAR(191) NOT NULL,
    `area` VARCHAR(191) NOT NULL,
    `operationDate` DATETIME(3) NOT NULL,
    `isPublished` BOOLEAN NOT NULL DEFAULT false,
    `publishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Operation_taskAssignmentId_key`(`taskAssignmentId`),
    INDEX `Operation_isPublished_operationDate_idx`(`isPublished`, `operationDate`),
    INDEX `Operation_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OperationPhoto` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `operationId` INTEGER NOT NULL,
    `taskPhotoId` INTEGER NOT NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `OperationPhoto_operationId_taskPhotoId_key`(`operationId`, `taskPhotoId`),
    INDEX `OperationPhoto_operationId_displayOrder_idx`(`operationId`, `displayOrder`),
    INDEX `OperationPhoto_taskPhotoId_idx`(`taskPhotoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Operation` ADD CONSTRAINT `Operation_taskAssignmentId_fkey` FOREIGN KEY (`taskAssignmentId`) REFERENCES `TaskAssignment`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OperationPhoto` ADD CONSTRAINT `OperationPhoto_operationId_fkey` FOREIGN KEY (`operationId`) REFERENCES `Operation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OperationPhoto` ADD CONSTRAINT `OperationPhoto_taskPhotoId_fkey` FOREIGN KEY (`taskPhotoId`) REFERENCES `TaskPhoto`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
