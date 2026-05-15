"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "./prisma";
import { writeAudit } from "./audit";

class InternalNoteActionError extends Error {
  constructor(
    message: string,
    public errCode:
      | "UNAUTHENTICATED"
      | "FORBIDDEN"
      | "NOT_FOUND"
      | "INVALID_INPUT",
    public status = 400,
  ) {
    super(message);
    this.name = "InternalNoteActionError";
  }
}

async function requireStaff(): Promise<{ id: string; role: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new InternalNoteActionError(
      "Authentification requise",
      "UNAUTHENTICATED",
      401,
    );
  }
  // VIEWER can read but not write.
  if (!["ADMIN", "MANAGER", "RECEPTION"].includes(session.user.role)) {
    throw new InternalNoteActionError(
      "Permissions insuffisantes",
      "FORBIDDEN",
      403,
    );
  }
  return { id: session.user.id, role: session.user.role };
}

const addNoteSchema = z
  .object({
    reservationId: z.string().min(1).optional(),
    guestId: z.string().min(1).optional(),
    body: z.string().trim().min(1).max(2000),
    category: z.string().trim().max(60).optional(),
  })
  .refine((v) => !!v.reservationId || !!v.guestId, {
    message: "reservationId ou guestId est obligatoire",
  });

export async function addInternalNote(
  input: z.infer<typeof addNoteSchema>,
): Promise<{ ok: true; noteId: string }> {
  const parsed = addNoteSchema.parse(input);
  const staff = await requireStaff();

  const note = await prisma.internalNote.create({
    data: {
      reservationId: parsed.reservationId ?? null,
      guestId: parsed.guestId ?? null,
      body: parsed.body,
      category: parsed.category?.length ? parsed.category : null,
      authorId: staff.id,
    },
  });

  await writeAudit({
    userId: staff.id,
    action: "internal_note.created",
    entity: "InternalNote",
    entityId: note.id,
    diff: {
      after: {
        reservationId: parsed.reservationId,
        guestId: parsed.guestId,
        category: note.category,
      },
    },
  });

  if (parsed.reservationId) {
    const reservation = await prisma.reservation.findUnique({
      where: { id: parsed.reservationId },
      select: { code: true },
    });
    if (reservation) {
      revalidatePath(`/admin/reservations/${reservation.code}`);
    }
  }
  if (parsed.guestId) {
    revalidatePath(`/admin/clients`);
  }

  return { ok: true, noteId: note.id };
}

const deleteNoteSchema = z.object({ noteId: z.string().min(1) });

export async function deleteInternalNote(
  input: z.infer<typeof deleteNoteSchema>,
): Promise<{ ok: true }> {
  const parsed = deleteNoteSchema.parse(input);
  const staff = await requireStaff();

  const before = await prisma.internalNote.findUnique({
    where: { id: parsed.noteId },
    select: {
      authorId: true,
      reservationId: true,
      guestId: true,
      reservation: { select: { code: true } },
    },
  });
  if (!before) {
    throw new InternalNoteActionError("Note introuvable", "NOT_FOUND", 404);
  }
  // Author or ADMIN/MANAGER can delete; RECEPTION can only delete their own.
  if (staff.role === "RECEPTION" && before.authorId !== staff.id) {
    throw new InternalNoteActionError(
      "Vous ne pouvez supprimer que vos propres notes",
      "FORBIDDEN",
      403,
    );
  }

  await prisma.internalNote.delete({ where: { id: parsed.noteId } });

  await writeAudit({
    userId: staff.id,
    action: "internal_note.deleted",
    entity: "InternalNote",
    entityId: parsed.noteId,
    diff: {
      before: {
        reservationId: before.reservationId,
        guestId: before.guestId,
      },
    },
  });

  if (before.reservation?.code) {
    revalidatePath(`/admin/reservations/${before.reservation.code}`);
  }
  if (before.guestId) {
    revalidatePath(`/admin/clients`);
  }

  return { ok: true };
}
