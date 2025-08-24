-- AlterTable
ALTER TABLE `post` ADD COLUMN `authorName` VARCHAR(191) NULL,
    ADD COLUMN `authorUrl` VARCHAR(191) NULL,
    ADD COLUMN `blocks` JSON NULL,
    ADD COLUMN `excerpt` TEXT NULL,
    ADD COLUMN `heroImage` VARCHAR(191) NULL,
    ADD COLUMN `lead` TEXT NULL,
    ADD COLUMN `publishedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `avatar` VARCHAR(191) NULL;
