-- CreateTable
CREATE TABLE `TaskPhoto` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `taskAssignmentId` INTEGER NOT NULL,
    `imageUrl` VARCHAR(191) NOT NULL,
    `caption` VARCHAR(191) NULL,
    `isApprovedForPublic` BOOLEAN NOT NULL DEFAULT false,
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reviewedAt` DATETIME(3) NULL,
    `reviewedByAdminId` INTEGER NULL,

    INDEX `TaskPhoto_taskAssignmentId_uploadedAt_idx`(`taskAssignmentId`, `uploadedAt`),
    INDEX `TaskPhoto_isApprovedForPublic_idx`(`isApprovedForPublic`),
    INDEX `TaskPhoto_reviewedByAdminId_idx`(`reviewedByAdminId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TaskPhoto` ADD CONSTRAINT `TaskPhoto_taskAssignmentId_fkey` FOREIGN KEY (`taskAssignmentId`) REFERENCES `TaskAssignment`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TaskPhoto` ADD CONSTRAINT `TaskPhoto_reviewedByAdminId_fkey` FOREIGN KEY (`reviewedByAdminId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
