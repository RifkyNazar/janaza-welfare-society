ALTER TABLE `ServiceRequest`
    ADD COLUMN `serviceCategory` ENUM('JANAZAH', 'VEHICLE') NULL;

CREATE TABLE `RequestServiceSelection` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `requestId` INTEGER NOT NULL,
    `serviceCode` VARCHAR(64) NOT NULL,
    `serviceLabel` VARCHAR(120) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `RequestServiceSelection_requestId_serviceCode_key`(`requestId`, `serviceCode`),
    INDEX `RequestServiceSelection_requestId_idx`(`requestId`),
    INDEX `RequestServiceSelection_serviceCode_idx`(`serviceCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `RequestServiceSelection`
    ADD CONSTRAINT `RequestServiceSelection_requestId_fkey`
    FOREIGN KEY (`requestId`) REFERENCES `ServiceRequest`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
