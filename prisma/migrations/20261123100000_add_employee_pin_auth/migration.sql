ALTER TABLE `User` ADD COLUMN `employeeSessionVersion` INTEGER NOT NULL DEFAULT 0;

CREATE TABLE `EmployeePinCredential` (
    `userId` INTEGER NOT NULL,
    `phone` VARCHAR(12) NOT NULL,
    `pinHash` VARCHAR(255) NULL,
    `setupDigest` CHAR(64) NULL,
    `setupUntil` DATETIME(3) NULL,
    `setupVersion` INTEGER NOT NULL,
    `issuedById` INTEGER NOT NULL,
    `issuedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `EmployeePinCredential_phone_key`(`phone`),
    UNIQUE INDEX `EmployeePinCredential_setupDigest_key`(`setupDigest`),
    PRIMARY KEY (`userId`),
    CONSTRAINT `EmployeePinCredential_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `EmployeePinSession` (
    `id` CHAR(64) NOT NULL,
    `userId` INTEGER NOT NULL,
    `version` INTEGER NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    INDEX `EmployeePinSession_userId_idx`(`userId`),
    INDEX `EmployeePinSession_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`),
    CONSTRAINT `EmployeePinSession_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `EmployeeAuthThrottle` (
    `id` CHAR(64) NOT NULL,
    `attempts` INTEGER NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    INDEX `EmployeeAuthThrottle_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
