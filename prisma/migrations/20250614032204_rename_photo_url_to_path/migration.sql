/*
  Warnings:

  - You are about to drop the column `photoUrl` on the `persons` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "persons" DROP COLUMN "photoUrl",
ADD COLUMN     "photoPath" TEXT;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;
