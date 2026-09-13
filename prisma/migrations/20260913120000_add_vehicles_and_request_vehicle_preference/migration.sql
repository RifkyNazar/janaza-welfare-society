-- CreateTable
CREATE TABLE `Vehicle` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `vehicleNumber` VARCHAR(191) NOT NULL,
    `vehicleType` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `imageUrl` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isPublic` BOOLEAN NOT NULL DEFAULT false,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Vehicle_vehicleNumber_key`(`vehicleNumber`),
    INDEX `Vehicle_isActive_isPublic_idx`(`isActive`, `isPublic`),
    INDEX `Vehicle_displayOrder_idx`(`displayOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `ServiceRequest` ADD COLUMN `preferredVehicleId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `ServiceRequest_preferredVehicleId_idx` ON `ServiceRequest`(`preferredVehicleId`);

-- AddForeignKey
ALTER TABLE `ServiceRequest` ADD CONSTRAINT `ServiceRequest_preferredVehicleId_fkey` FOREIGN KEY (`preferredVehicleId`) REFERENCES `Vehicle`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
