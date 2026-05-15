"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "./prisma";
import { writeAudit } from "./audit";
import { deleteGuestDocumentObject, signGuestDocumentUrl } from "./storage";

class GuestDocumentActionError extends Error {
  constructor(
    message: string,
    public errCode: "UNAUTHENTICATED" | "FORBIDDEN" | "NOT_FOUND",
    public status = 400,
  ) {
    super(message);
    this.name = "GuestDocumentActionError";
  }
}

async function requireAdminOrManager(): Promise<{ id: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new GuestDocumentActionError(
      "Authentification requise",
      "UNAUTHENTICATED",
      401,
    );
  }
  if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
    throw new GuestDocumentActionError(
      "Réservé à l'administration",
      "FORBIDDEN",
      403,
    );
  }
  return { id: session.user.id };
}

const updateMetaSchema = z.object({
  documentId: z.string().min(1),
  docNumber: z.string().trim().max(60).optional(),
  expiresAt: z.string().optional(),
  notes: z.string().trim().max(500).optional(),
});

export async function updateGuestDocumentMeta(
  input: z.infer<typeof updateMetaSchema>,
): Promise<{ ok: true }> {
  const parsed = updateMetaSchema.parse(input);
  const staff = await requireAdminOrManager();

  const before = await prisma.guestDocument.findUnique({
    where: { id: parsed.documentId },
    select: {
      guestId: true,
      docNumber: true,
      expiresAt: true,
      notes: true,
    },
  });
  if (!before) {
    throw new GuestDocumentActionError(
      "Document introuvable",
      "NOT_FOUND",
      404,
    );
  }

  const expiresAt = parsed.expiresAt
    ? new Date(`${parsed.expiresAt}T00:00:00Z`)
    : null;

  await prisma.guestDocument.update({
    where: { id: parsed.documentId },
    data: {
      docNumber: parsed.docNumber?.length ? parsed.docNumber : null,
      expiresAt,
      notes: parsed.notes?.length ? parsed.notes : null,
    },
  });

  await writeAudit({
    userId: staff.id,
    action: "guest_document.updated",
    entity: "GuestDocument",
    entityId: parsed.documentId,
    diff: {
      before,
      after: {
        docNumber: parsed.docNumber,
        expiresAt,
        notes: parsed.notes,
      },
    },
  });

  revalidatePath("/admin/clients");
  return { ok: true };
}

const deleteSchema = z.object({ documentId: z.string().min(1) });

export async function deleteGuestDocument(
  input: z.infer<typeof deleteSchema>,
): Promise<{ ok: true }> {
  const parsed = deleteSchema.parse(input);
  const staff = await requireAdminOrManager();

  const before = await prisma.guestDocument.findUnique({
    where: { id: parsed.documentId },
    select: { storageKey: true, guestId: true, filename: true },
  });
  if (!before) {
    throw new GuestDocumentActionError(
      "Document introuvable",
      "NOT_FOUND",
      404,
    );
  }

  // Best-effort delete the underlying file. If the file is already gone
  // (manual cleanup, bucket reset), keep going — the DB row is the source
  // of truth for the admin UI.
  try {
    await deleteGuestDocumentObject(before.storageKey);
  } catch (err) {
    console.error("[guest-documents] storage delete failed", err);
  }

  await prisma.guestDocument.delete({ where: { id: parsed.documentId } });

  await writeAudit({
    userId: staff.id,
    action: "guest_document.deleted",
    entity: "GuestDocument",
    entityId: parsed.documentId,
    diff: { before: { filename: before.filename, guestId: before.guestId } },
  });

  revalidatePath("/admin/clients");
  return { ok: true };
}

const signSchema = z.object({ documentId: z.string().min(1) });

/**
 * Mints a 1-hour signed URL for the underlying object. Audit-logged so
 * we can trace every download in case of a data-protection enquiry.
 */
export async function getGuestDocumentSignedUrl(
  input: z.infer<typeof signSchema>,
): Promise<{ url: string }> {
  const parsed = signSchema.parse(input);
  const staff = await requireAdminOrManager();

  const doc = await prisma.guestDocument.findUnique({
    where: { id: parsed.documentId },
    select: { storageKey: true, guestId: true, filename: true },
  });
  if (!doc) {
    throw new GuestDocumentActionError(
      "Document introuvable",
      "NOT_FOUND",
      404,
    );
  }

  const url = await signGuestDocumentUrl(doc.storageKey);

  await writeAudit({
    userId: staff.id,
    action: "guest_document.viewed",
    entity: "GuestDocument",
    entityId: parsed.documentId,
    diff: { after: { filename: doc.filename, guestId: doc.guestId } },
  });

  return { url };
}
