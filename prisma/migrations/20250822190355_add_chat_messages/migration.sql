/*
  Warnings:

  - You are about to drop the column `chatRoomId` on the `chatmessage` table. All the data in the column will be lost.
  - You are about to drop the column `isSystem` on the `chatmessage` table. All the data in the column will be lost.
  - You are about to drop the column `userAvatar` on the `chatmessage` table. All the data in the column will be lost.
  - You are about to drop the column `userName` on the `chatmessage` table. All the data in the column will be lost.
  - Added the required column `roomId` to the `ChatMessage` table without a default value. This is not possible if the table is not empty.
  - Made the column `userId` on table `chatmessage` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `chatmessage` DROP FOREIGN KEY `ChatMessage_userId_fkey`;

-- DropIndex
DROP INDEX `ChatMessage_chatRoomId_createdAt_idx` ON `chatmessage`;

-- AlterTable
ALTER TABLE `chatmessage` DROP COLUMN `chatRoomId`,
    DROP COLUMN `isSystem`,
    DROP COLUMN `userAvatar`,
    DROP COLUMN `userName`,
    ADD COLUMN `roomId` VARCHAR(191) NOT NULL,
    MODIFY `userId` INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX `ChatMessage_roomId_createdAt_idx` ON `ChatMessage`(`roomId`, `createdAt`);

-- AddForeignKey
ALTER TABLE `ChatMessage` ADD CONSTRAINT `ChatMessage_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
