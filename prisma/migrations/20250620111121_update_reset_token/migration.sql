/*
  Warnings:

  - The values [BIOLOGICAL_PARENT,ADOPTIVE_PARENT,STEP_PARENT,GUARDIAN] on the enum `RelationshipType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `childId` on the `relationships` table. All the data in the column will be lost.
  - You are about to drop the column `parentId` on the `relationships` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[personOneId,personTwoId,type]` on the table `relationships` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[resetToken]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `personOneId` to the `relationships` table without a default value. This is not possible if the table is not empty.
  - Added the required column `personTwoId` to the `relationships` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "RelationshipType_new" AS ENUM ('PARENT', 'MARRIED');
ALTER TABLE "relationships" ALTER COLUMN "type" TYPE "RelationshipType_new" USING ("type"::text::"RelationshipType_new");
ALTER TYPE "RelationshipType" RENAME TO "RelationshipType_old";
ALTER TYPE "RelationshipType_new" RENAME TO "RelationshipType";
DROP TYPE "RelationshipType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "relationships" DROP CONSTRAINT "relationships_childId_fkey";

-- DropForeignKey
ALTER TABLE "relationships" DROP CONSTRAINT "relationships_parentId_fkey";

-- DropIndex
DROP INDEX "relationships_parentId_childId_type_key";

-- AlterTable
ALTER TABLE "relationships" DROP COLUMN "childId",
DROP COLUMN "parentId",
ADD COLUMN     "personOneId" TEXT NOT NULL,
ADD COLUMN     "personTwoId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "resetToken" TEXT,
ADD COLUMN     "resetTokenExpiry" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "relationships_personOneId_personTwoId_type_key" ON "relationships"("personOneId", "personTwoId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "users_resetToken_key" ON "users"("resetToken");

-- AddForeignKey
ALTER TABLE "relationships" ADD CONSTRAINT "relationships_personOneId_fkey" FOREIGN KEY ("personOneId") REFERENCES "persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relationships" ADD CONSTRAINT "relationships_personTwoId_fkey" FOREIGN KEY ("personTwoId") REFERENCES "persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
