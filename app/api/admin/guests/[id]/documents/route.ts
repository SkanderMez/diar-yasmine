import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
import { uploadGuestDocument } from "@/lib/storage";

const KIND_VALUES = [
  "ID_CARD",
  "PASSPORT",
  "DRIVING_LICENSE",
  "OTHER",
] as const;
const kindSchema = z.enum(KIND_VALUES);

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
]);

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id: guestId } = await context.params;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const guest = await prisma.guest.findUnique({
    where: { id: guestId },
    select: { id: true, deletedAt: true },
  });
  if (!guest || guest.deletedAt) {
    return NextResponse.json({ error: "Guest not found" }, { status: 404 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Bad form data" }, { status: 400 });
  }

  const file = form.get("file");
  const rawKind = form.get("kind");
  const docNumber = form.get("docNumber");
  const expiresAt = form.get("expiresAt");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `Fichier trop volumineux (max ${MAX_BYTES / 1024 / 1024} Mo)` },
      { status: 413 },
    );
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: `Type non autorisé: ${file.type}` },
      { status: 415 },
    );
  }

  const kindParse = kindSchema.safeParse(rawKind);
  const kind = kindParse.success ? kindParse.data : "ID_CARD";

  const arrayBuffer = await file.arrayBuffer();

  let storageKey: string;
  try {
    const uploaded = await uploadGuestDocument({
      guestId,
      filename: file.name,
      contentType: file.type,
      body: arrayBuffer,
    });
    storageKey = uploaded.storageKey;
  } catch (err) {
    console.error("[guest-documents] upload failed", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 },
    );
  }

  const expires =
    typeof expiresAt === "string" && expiresAt
      ? new Date(`${expiresAt}T00:00:00Z`)
      : null;

  const doc = await prisma.guestDocument.create({
    data: {
      guestId,
      kind,
      storageKey,
      mimeType: file.type,
      filename: file.name,
      sizeBytes: file.size,
      docNumber:
        typeof docNumber === "string" && docNumber.trim()
          ? docNumber.trim().slice(0, 60)
          : null,
      expiresAt: expires,
      uploadedById: session.user.id,
    },
  });

  await writeAudit({
    userId: session.user.id,
    action: "guest_document.uploaded",
    entity: "GuestDocument",
    entityId: doc.id,
    diff: { after: { guestId, kind: doc.kind, sizeBytes: doc.sizeBytes } },
  });

  return NextResponse.json({ ok: true, documentId: doc.id }, { status: 201 });
}
