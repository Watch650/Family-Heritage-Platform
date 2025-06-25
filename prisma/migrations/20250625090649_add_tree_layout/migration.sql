-- CreateTable
CREATE TABLE "TreeLayout" (
    "id" TEXT NOT NULL,
    "familyTreeId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TreeLayout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TreeLayout_familyTreeId_key" ON "TreeLayout"("familyTreeId");

-- AddForeignKey
ALTER TABLE "TreeLayout" ADD CONSTRAINT "TreeLayout_familyTreeId_fkey" FOREIGN KEY ("familyTreeId") REFERENCES "FamilyTree"("id") ON DELETE CASCADE ON UPDATE CASCADE;
