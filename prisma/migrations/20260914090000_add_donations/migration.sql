-- CreateTable
CREATE TABLE `Donation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `referenceCode` VARCHAR(191) NOT NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `mobileNumber` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `transferDate` DATETIME(3) NOT NULL,
    `bankReference` VARCHAR(191) NULL,
    `note` TEXT NULL,
    `receiptFileName` VARCHAR(191) NOT NULL,
    `receiptStorageKey` VARCHAR(191) NOT NULL,
    `receiptMimeType` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'VERIFIED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `reviewedAt` DATETIME(3) NULL,
    `reviewedByUserId` INTEGER NULL,
    `reviewNote` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Donation_referenceCode_key`(`referenceCode`),
    INDEX `Donation_status_idx`(`status`),
    INDEX `Donation_createdAt_idx`(`createdAt`),
    INDEX `Donation_mobileNumber_idx`(`mobileNumber`),
    INDEX `Donation_reviewedByUserId_idx`(`reviewedByUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Donation` ADD CONSTRAINT `Donation_reviewedByUserId_fkey` FOREIGN KEY (`reviewedByUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
