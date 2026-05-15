"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { prisma } from "./prisma";
import { writeAudit } from "./audit";
import { isValidReservationCode } from "./code";

class ReviewActionError extends Error {
  constructor(
    message: string,
    public code:
      | "UNAUTHENTICATED"
      | "FORBIDDEN"
      | "NOT_FOUND"
      | "ALREADY_REVIEWED"
      | "INVALID_INPUT"
      | "TOO_EARLY"
      | "RATE_LIMITED",
    public status = 400,
  ) {
    super(message);
    this.name = "ReviewActionError";
  }
}

async function requireModerator(): Promise<{ id: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new ReviewActionError(
      "Authentification requise",
      "UNAUTHENTICATED",
      401,
    );
  }
  if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
    throw new ReviewActionError("Réservé à l'administration", "FORBIDDEN", 403);
  }
  return { id: session.user.id };
}

async function getClientIp(): Promise<string | null> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    null
  );
}

// =============================================================================
// PUBLIC — guest-submitted review via /review/[code]
// =============================================================================

const submitReviewSchema = z.object({
  code: z
    .string()
    .refine(isValidReservationCode, "Code de réservation invalide"),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(2000).optional(),
  locale: z.enum(["fr", "en", "ar"]).default("fr"),
});

export async function submitReview(
  input: z.infer<typeof submitReviewSchema>,
): Promise<{ ok: true; reviewId: string }> {
  const parsed = submitReviewSchema.parse(input);

  const reservation = await prisma.reservation.findUnique({
    where: { code: parsed.code },
    select: {
      id: true,
      propertyId: true,
      guestId: true,
      checkOut: true,
      status: true,
      deletedAt: true,
      review: { select: { id: true } },
    },
  });

  if (!reservation || reservation.deletedAt) {
    throw new ReviewActionError("Réservation introuvable", "NOT_FOUND", 404);
  }
  if (reservation.review) {
    throw new ReviewActionError(
      "Un avis a déjà été déposé pour ce séjour",
      "ALREADY_REVIEWED",
      409,
    );
  }
  if (["CANCELLED", "NO_SHOW", "PENDING"].includes(reservation.status)) {
    throw new ReviewActionError(
      "Vous pourrez déposer un avis après votre séjour",
      "TOO_EARLY",
      403,
    );
  }
  // Allow review starting from check-out date (Tunisia tz).
  if (reservation.checkOut.getTime() > Date.now()) {
    throw new ReviewActionError(
      "Vous pourrez déposer un avis dès la fin de votre séjour",
      "TOO_EARLY",
      403,
    );
  }

  const ip = await getClientIp();

  // Naive rate limit: same IP can't submit > 5 reviews / hour.
  if (ip) {
    const recent = await prisma.review.count({
      where: {
        submitterIp: ip,
        createdAt: { gt: new Date(Date.now() - 60 * 60 * 1000) },
      },
    });
    if (recent >= 5) {
      throw new ReviewActionError(
        "Trop de soumissions récentes. Réessayez plus tard.",
        "RATE_LIMITED",
        429,
      );
    }
  }

  const review = await prisma.review.create({
    data: {
      reservationId: reservation.id,
      propertyId: reservation.propertyId,
      guestId: reservation.guestId,
      rating: parsed.rating,
      comment: parsed.comment?.length ? parsed.comment : null,
      locale: parsed.locale,
      source: "DIRECT",
      status: "PENDING",
      submitterIp: ip,
    },
  });

  await writeAudit({
    userId: null,
    action: "review.submitted",
    entity: "Review",
    entityId: review.id,
    diff: {
      after: {
        propertyId: review.propertyId,
        rating: review.rating,
        source: review.source,
      },
    },
  });

  return { ok: true, reviewId: review.id };
}

// =============================================================================
// ADMIN — moderation
// =============================================================================

const moderateSchema = z.object({
  reviewId: z.string().min(1),
  decision: z.enum(["PUBLISH", "REJECT", "UNPUBLISH"]),
  hostReply: z.string().trim().max(2000).optional(),
});

export async function moderateReview(
  input: z.infer<typeof moderateSchema>,
): Promise<{ ok: true }> {
  const parsed = moderateSchema.parse(input);
  const staff = await requireModerator();

  const before = await prisma.review.findUnique({
    where: { id: parsed.reviewId },
    select: { status: true, hostReply: true },
  });
  if (!before) {
    throw new ReviewActionError("Avis introuvable", "NOT_FOUND", 404);
  }

  const now = new Date();
  const after = await prisma.review.update({
    where: { id: parsed.reviewId },
    data: {
      status:
        parsed.decision === "PUBLISH"
          ? "PUBLISHED"
          : parsed.decision === "REJECT"
            ? "REJECTED"
            : "PENDING",
      publishedAt: parsed.decision === "PUBLISH" ? now : null,
      moderatedById: staff.id,
      moderatedAt: now,
      hostReply: parsed.hostReply?.length ? parsed.hostReply : before.hostReply,
      hostReplyAt: parsed.hostReply?.length ? now : null,
    },
  });

  await writeAudit({
    userId: staff.id,
    action: "review.moderated",
    entity: "Review",
    entityId: after.id,
    diff: {
      before,
      after: { status: after.status, decision: parsed.decision },
    },
  });

  revalidatePath("/admin/reviews");
  // Property fiche caches will refresh on next read.

  return { ok: true };
}

// =============================================================================
// ADMIN — manual entry / OTA import
// =============================================================================

const createManualSchema = z.object({
  propertyId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(2000).optional(),
  authorName: z.string().trim().max(120).optional(),
  source: z.enum(["MANUAL", "BOOKING", "AIRBNB", "EXPEDIA"]).default("MANUAL"),
  externalId: z.string().trim().max(120).optional(),
  publish: z.boolean().default(true),
});

export async function createManualReview(
  input: z.infer<typeof createManualSchema>,
): Promise<{ ok: true; reviewId: string }> {
  const parsed = createManualSchema.parse(input);
  const staff = await requireModerator();

  const now = new Date();
  const review = await prisma.review.create({
    data: {
      propertyId: parsed.propertyId,
      rating: parsed.rating,
      comment: parsed.comment?.length
        ? parsed.authorName
          ? `${parsed.authorName} — ${parsed.comment}`
          : parsed.comment
        : (parsed.authorName ?? null),
      source: parsed.source,
      externalId: parsed.externalId?.length ? parsed.externalId : null,
      status: parsed.publish ? "PUBLISHED" : "PENDING",
      publishedAt: parsed.publish ? now : null,
      moderatedById: staff.id,
      moderatedAt: now,
    },
  });

  await writeAudit({
    userId: staff.id,
    action: "review.manual_created",
    entity: "Review",
    entityId: review.id,
    diff: { after: { source: review.source, rating: review.rating } },
  });

  revalidatePath("/admin/reviews");

  return { ok: true, reviewId: review.id };
}
