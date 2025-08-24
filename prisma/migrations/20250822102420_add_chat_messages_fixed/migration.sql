/*
  Warnings:

  - You are about to drop the column `content` on the `chatmessage` table. All the data in the column will be lost.
  - You are about to drop the column `isRead` on the `chatmessage` table. All the data in the column will be lost.
  - You are about to drop the column `senderId` on the `chatmessage` table. All the data in the column will be lost.
  - Added the required column `chatRoomId` to the `ChatMessage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `message` to the `ChatMessage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userName` to the `ChatMessage` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `chatmessage` DROP FOREIGN KEY `ChatMessage_senderId_fkey`;

-- DropIndex
DROP INDEX `ChatMessage_isRead_idx` ON `chatmessage`;

-- DropIndex
DROP INDEX `ChatMessage_senderId_createdAt_idx` ON `chatmessage`;

-- AlterTable
ALTER TABLE `chatmessage` DROP COLUMN `content`,
    DROP COLUMN `isRead`,
    DROP COLUMN `senderId`,
    ADD COLUMN `chatRoomId` VARCHAR(191) NOT NULL,
    ADD COLUMN `isAdmin` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isSystem` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `message` TEXT NOT NULL,
    ADD COLUMN `userAvatar` VARCHAR(191) NULL,
    ADD COLUMN `userId` INTEGER NULL,
    ADD COLUMN `userName` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE INDEX `ChatMessage_chatRoomId_createdAt_idx` ON `ChatMessage`(`chatRoomId`, `createdAt`);

-- CreateIndex
CREATE INDEX `ChatMessage_isAdmin_idx` ON `ChatMessage`(`isAdmin`);

-- CreateIndex
CREATE INDEX `ChatMessage_userId_idx` ON `ChatMessage`(`userId`);

-- AddForeignKey
ALTER TABLE `ChatMessage` ADD CONSTRAINT `ChatMessage_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
