-- =============================================================================
-- Phase D — Reviews, InternalNotes, GuestDocuments, PromoCodes, Supplements
-- + Guest.isVip + Guest.tags
-- =============================================================================

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'PUBLISHED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ReviewSource" AS ENUM ('DIRECT', 'BOOKING', 'AIRBNB', 'EXPEDIA', 'MANUAL');

-- CreateEnum
CREATE TYPE "GuestDocumentKind" AS ENUM ('ID_CARD', 'PASSPORT', 'DRIVING_LICENSE', 'OTHER');

-- CreateEnum
CREATE TYPE "PromoCodeKind" AS ENUM ('PERCENT', 'FIXED');

-- AlterTable — Guest.isVip + Guest.tags
ALTER TABLE "Guest"
  ADD COLUMN "isVip" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "tags"  TEXT[]  NOT NULL DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE INDEX "Guest_isVip_idx" ON "Guest"("isVip");

-- =============================================================================
-- Review
-- =============================================================================
CREATE TABLE "Review" (
  "id"             TEXT          NOT NULL,
  "reservationId"  TEXT,
  "propertyId"     TEXT          NOT NULL,
  "guestId"        TEXT,
  "rating"         INTEGER       NOT NULL,
  "comment"        TEXT,
  "locale"         TEXT          NOT NULL DEFAULT 'fr',
  "source"         "ReviewSource" NOT NULL DEFAULT 'DIRECT',
  "status"         "ReviewStatus" NOT NULL DEFAULT 'PENDING',
  "hostReply"      TEXT,
  "hostReplyAt"    TIMESTAMPTZ(3),
  "moderatedById"  TEXT,
  "moderatedAt"    TIMESTAMPTZ(3),
  "publishedAt"    TIMESTAMPTZ(3),
  "submitterIp"    TEXT,
  "externalId"     TEXT,
  "createdAt"      TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMPTZ(3) NOT NULL,

  CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- one published review per reservation max
CREATE UNIQUE INDEX "Review_reservationId_key" ON "Review"("reservationId");
CREATE INDEX "Review_propertyId_status_publishedAt_idx" ON "Review"("propertyId", "status", "publishedAt");
CREATE INDEX "Review_status_createdAt_idx" ON "Review"("status", "createdAt");
CREATE INDEX "Review_source_externalId_idx" ON "Review"("source", "externalId");

ALTER TABLE "Review"
  ADD CONSTRAINT "Review_reservationId_fkey"
    FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id")
    ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "Review_propertyId_fkey"
    FOREIGN KEY ("propertyId") REFERENCES "Property"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "Review_guestId_fkey"
    FOREIGN KEY ("guestId") REFERENCES "Guest"("id")
    ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "Review_moderatedById_fkey"
    FOREIGN KEY ("moderatedById") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "Review_rating_range" CHECK ("rating" BETWEEN 1 AND 5);

-- =============================================================================
-- InternalNote
-- =============================================================================
CREATE TABLE "InternalNote" (
  "id"             TEXT          NOT NULL,
  "reservationId"  TEXT,
  "guestId"        TEXT,
  "authorId"       TEXT,
  "body"           TEXT          NOT NULL,
  "category"       TEXT,
  "createdAt"      TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMPTZ(3) NOT NULL,

  CONSTRAINT "InternalNote_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "InternalNote_scope_set" CHECK (
    "reservationId" IS NOT NULL OR "guestId" IS NOT NULL
  )
);

CREATE INDEX "InternalNote_reservationId_createdAt_idx" ON "InternalNote"("reservationId", "createdAt");
CREATE INDEX "InternalNote_guestId_createdAt_idx" ON "InternalNote"("guestId", "createdAt");

ALTER TABLE "InternalNote"
  ADD CONSTRAINT "InternalNote_reservationId_fkey"
    FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "InternalNote_guestId_fkey"
    FOREIGN KEY ("guestId") REFERENCES "Guest"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "InternalNote_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- =============================================================================
-- GuestDocument
-- =============================================================================
CREATE TABLE "GuestDocument" (
  "id"             TEXT          NOT NULL,
  "guestId"        TEXT          NOT NULL,
  "kind"           "GuestDocumentKind" NOT NULL DEFAULT 'ID_CARD',
  "storageKey"     TEXT          NOT NULL,
  "mimeType"       TEXT          NOT NULL,
  "filename"       TEXT          NOT NULL,
  "sizeBytes"      INTEGER       NOT NULL,
  "docNumber"      TEXT,
  "expiresAt"      DATE,
  "notes"          TEXT,
  "uploadedById"   TEXT,
  "createdAt"      TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMPTZ(3) NOT NULL,

  CONSTRAINT "GuestDocument_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GuestDocument_guestId_createdAt_idx" ON "GuestDocument"("guestId", "createdAt");

ALTER TABLE "GuestDocument"
  ADD CONSTRAINT "GuestDocument_guestId_fkey"
    FOREIGN KEY ("guestId") REFERENCES "Guest"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "GuestDocument_uploadedById_fkey"
    FOREIGN KEY ("uploadedById") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- =============================================================================
-- PromoCode
-- =============================================================================
CREATE TABLE "PromoCode" (
  "id"             TEXT          NOT NULL,
  "code"           TEXT          NOT NULL,
  "label"          TEXT,
  "kind"           "PromoCodeKind" NOT NULL DEFAULT 'PERCENT',
  "value"          INTEGER       NOT NULL,
  "minNights"      INTEGER       NOT NULL DEFAULT 0,
  "propertyType"   "PropertyType",
  "maxUses"        INTEGER       NOT NULL DEFAULT 0,
  "usedCount"      INTEGER       NOT NULL DEFAULT 0,
  "validFrom"      DATE,
  "validTo"        DATE,
  "active"         BOOLEAN       NOT NULL DEFAULT true,
  "createdById"    TEXT,
  "createdAt"      TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMPTZ(3) NOT NULL,

  CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PromoCode_value_nonneg" CHECK ("value" >= 0),
  CONSTRAINT "PromoCode_minNights_nonneg" CHECK ("minNights" >= 0),
  CONSTRAINT "PromoCode_maxUses_nonneg" CHECK ("maxUses" >= 0)
);

CREATE UNIQUE INDEX "PromoCode_code_key" ON "PromoCode"("code");
CREATE INDEX "PromoCode_active_validFrom_validTo_idx" ON "PromoCode"("active", "validFrom", "validTo");

ALTER TABLE "PromoCode"
  ADD CONSTRAINT "PromoCode_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- =============================================================================
-- PromoRedemption — one row per reservation that consumed a PromoCode
-- =============================================================================
CREATE TABLE "PromoRedemption" (
  "id"             TEXT          NOT NULL,
  "promoCodeId"    TEXT          NOT NULL,
  "reservationId"  TEXT          NOT NULL,
  "amountApplied"  INTEGER       NOT NULL,
  "createdAt"      TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PromoRedemption_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PromoRedemption_reservationId_key" ON "PromoRedemption"("reservationId");
CREATE INDEX "PromoRedemption_promoCodeId_createdAt_idx" ON "PromoRedemption"("promoCodeId", "createdAt");

ALTER TABLE "PromoRedemption"
  ADD CONSTRAINT "PromoRedemption_promoCodeId_fkey"
    FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "PromoRedemption_reservationId_fkey"
    FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- =============================================================================
-- PricingSupplement — admin catalog of reusable extras
-- =============================================================================
CREATE TABLE "PricingSupplement" (
  "id"             TEXT          NOT NULL,
  "slug"           TEXT          NOT NULL,
  "labelFr"        TEXT          NOT NULL,
  "labelEn"        TEXT,
  "labelAr"        TEXT,
  "priceMillimes"  INTEGER       NOT NULL,
  "category"       TEXT,
  "icon"           TEXT,
  "sortOrder"      INTEGER       NOT NULL DEFAULT 100,
  "active"         BOOLEAN       NOT NULL DEFAULT true,
  "createdAt"      TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMPTZ(3) NOT NULL,

  CONSTRAINT "PricingSupplement_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PricingSupplement_priceMillimes_nonneg" CHECK ("priceMillimes" >= 0)
);

CREATE UNIQUE INDEX "PricingSupplement_slug_key" ON "PricingSupplement"("slug");
CREATE INDEX "PricingSupplement_active_sortOrder_idx" ON "PricingSupplement"("active", "sortOrder");
