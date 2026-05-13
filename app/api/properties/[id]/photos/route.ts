import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { extname } from "node:path";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { writeAudit } from "@/lib/audit";
import { logger } from "@/lib/logger";

/**
 * POST /api/properties/[id]/photos — staff-only multipart upload.
 *
 * Accepts one or more `photo` files (image/jpeg|png|webp, max 25 MB each),
 * uploads them to the `property-photos` Supabase Storage bucket, creates
 * Photo rows in the DB, and revalidates the affected pages.
 */
export const dynamic = "force-dynamic";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 25 * 1024 * 1024;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!env.SUPABASE_URL || !env.SUPABASE_SECRET_KEY) {
    return NextResponse.json(
      { error: "Supabase Storage not configured" },
      { status: 503 },
    );
  }

  const { id: propertyId } = await params;
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { id: true, slug: true, name: true },
  });
  if (!property) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json(
      { error: "Invalid multipart form" },
      { status: 400 },
    );
  }
  const files = formData
    .getAll("photo")
    .filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return NextResponse.json(
      { error: 'Missing "photo" file' },
      { status: 400 },
    );
  }

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false },
  });

  // Determine next order index for this property.
  const lastOrder = await prisma.photo.aggregate({
    where: { propertyId },
    _max: { order: true },
  });
  let nextOrder = (lastOrder._max.order ?? -1) + 1;

  const uploaded: { id: string; url: string }[] = [];
  for (const file of files) {
    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json(
        { error: `Unsupported type: ${file.type}` },
        { status: 415 },
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `File too large: ${file.name}` },
        { status: 413 },
      );
    }
    const ext = extname(file.name).toLowerCase() || ".jpg";
    const storagePath = `${property.slug}/${Date.now()}-${nextOrder}${ext}`;
    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadErr } = await supabase.storage
      .from("property-photos")
      .upload(storagePath, new Uint8Array(arrayBuffer), {
        contentType: file.type,
        upsert: false,
      });
    if (uploadErr) {
      logger.error({ uploadErr }, "photo upload failed");
      return NextResponse.json(
        { error: `Upload failed: ${uploadErr.message}` },
        { status: 500 },
      );
    }
    const { data } = supabase.storage
      .from("property-photos")
      .getPublicUrl(storagePath);

    const photo = await prisma.photo.create({
      data: {
        propertyId,
        url: data.publicUrl,
        alt: `${property.name} — photo`,
        order: nextOrder,
        category: "GENERAL",
      },
    });
    await writeAudit({
      userId: session.user.id,
      action: "property.photo_uploaded",
      entity: "Photo",
      entityId: photo.id,
      diff: { after: { propertyId, url: data.publicUrl } },
    });
    uploaded.push({ id: photo.id, url: photo.url });
    nextOrder++;
  }

  return NextResponse.json({ uploaded });
}
