-- AlterTable
ALTER TABLE "Amenity" ADD COLUMN     "filterable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 100;

-- CreateIndex
CREATE INDEX "Amenity_filterable_sortOrder_idx" ON "Amenity"("filterable", "sortOrder");
