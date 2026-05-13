import { readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { type SupabaseClient, createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * One-shot photo seeder.
 *
 * Walks the local `diar yasmine assets/` directory, matches each unit
 * folder to a Property by slug, uploads its images to the Supabase
 * Storage bucket `property-photos`, and replaces the `Photo` rows for
 * that property.
 *
 * Idempotent: re-running deletes existing Photo rows for matched
 * properties and re-uploads.
 *
 * Requires SUPABASE_URL + SUPABASE_SECRET_KEY + DATABASE_URL. Run via:
 *   npm run db:seed:photos
 */

const ASSETS_ROOT =
  "/Users/skandermeziane/Desktop/redesign work/perso/diar yasmine assets";
const CHALETS_DIR = join(ASSETS_ROOT, "Diar Yasmine Les Chalets");
const BUNGALOWS_DIR = join(ASSETS_ROOT, "Bungalows");
const BUCKET = "property-photos";
const MAX_PHOTOS_PER_UNIT = 12; // cap to keep storage reasonable
const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB upload ceiling

const ALLOWED_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

// Folders that are not actual rental units — ignored during the walk.
const NON_UNIT_FOLDERS = new Set([
  "Bureau Administratif",
  "Facade and Jardins",
  "les Halls",
  "Cheminé Albattros",
  "webprod images DY",
]);

// Asset folder → DB property slug. Handles the AMBER → amber, NEROLI → neroli,
// "Orchidé" duplicate → orchidee, "Océan" / "Ocean" → ocean cases.
function folderToSlug(folder: string): string {
  return folder
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function pickPhotos(dir: string): string[] {
  const entries = readdirSync(dir);
  const files = entries
    .filter((name) => ALLOWED_EXTS.has(extname(name).toLowerCase()))
    .map((name) => join(dir, name))
    .filter((p) => {
      const s = statSync(p);
      if (!s.isFile()) return false;
      if (s.size > MAX_FILE_BYTES) {
        console.log(
          `  · skip ${p.split("/").pop()} (${(s.size / 1024 / 1024).toFixed(1)} MB > 25 MB)`,
        );
        return false;
      }
      return true;
    })
    .sort();
  return files.slice(0, MAX_PHOTOS_PER_UNIT);
}

async function ensureBucket(supabase: SupabaseClient): Promise<void> {
  const { data: buckets, error: listErr } =
    await supabase.storage.listBuckets();
  if (listErr) throw new Error(`listBuckets: ${listErr.message}`);
  if (buckets?.some((b) => b.name === BUCKET)) {
    // Existing bucket — bump the size limit in case it was created lower.
    const { error: updateErr } = await supabase.storage.updateBucket(BUCKET, {
      public: true,
      fileSizeLimit: MAX_FILE_BYTES,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    });
    if (updateErr) {
      console.log(
        `  ! updateBucket warning: ${updateErr.message} (continuing)`,
      );
    } else {
      console.log(
        `  ✓ Bucket "${BUCKET}" already exists; size limit set to ${MAX_FILE_BYTES / 1024 / 1024} MB.`,
      );
    }
    return;
  }
  const { error } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: MAX_FILE_BYTES,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  });
  if (error) throw new Error(`createBucket: ${error.message}`);
  console.log(`  ✓ Bucket "${BUCKET}" created (public).`);
}

async function uploadOne(
  supabase: SupabaseClient,
  filePath: string,
  storagePath: string,
): Promise<string> {
  const buffer = readFileSync(filePath);
  const contentType =
    extname(filePath).toLowerCase() === ".png"
      ? "image/png"
      : extname(filePath).toLowerCase() === ".webp"
        ? "image/webp"
        : "image/jpeg";
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType, upsert: true });
  if (error) throw new Error(`upload ${storagePath}: ${error.message}`);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

async function processFolder(
  baseDir: string,
  prisma: PrismaClient,
  supabase: SupabaseClient,
): Promise<{ matched: number; uploaded: number; skipped: string[] }> {
  const folders = readdirSync(baseDir).filter((name) => {
    if (NON_UNIT_FOLDERS.has(name)) return false;
    return statSync(join(baseDir, name)).isDirectory();
  });

  let matched = 0;
  let uploaded = 0;
  const skipped: string[] = [];

  for (const folder of folders) {
    const slug = folderToSlug(folder);
    const property = await prisma.property.findUnique({
      where: { slug },
      select: { id: true, name: true },
    });
    if (!property) {
      skipped.push(`${folder} (slug=${slug})`);
      continue;
    }
    matched++;
    const files = pickPhotos(join(baseDir, folder));
    if (files.length === 0) {
      console.log(`  · ${property.name}: aucune image dans ${folder}`);
      continue;
    }

    // Idempotent: drop existing photos for this property before re-uploading.
    await prisma.photo.deleteMany({ where: { propertyId: property.id } });

    const uploads = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i]!;
      const ext = extname(file).toLowerCase();
      const storagePath = `${slug}/${String(i).padStart(2, "0")}${ext}`;
      const url = await uploadOne(supabase, file, storagePath);
      uploads.push({
        propertyId: property.id,
        url,
        alt: `${property.name} — photo ${i + 1}`,
        order: i,
        category: "GENERAL" as const,
      });
    }
    await prisma.photo.createMany({ data: uploads });
    uploaded += uploads.length;
    console.log(`  ✓ ${property.name}: ${uploads.length} photo(s)`);
  }

  return { matched, uploaded, skipped };
}

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;
  if (!databaseUrl || !supabaseUrl || !supabaseSecretKey) {
    throw new Error(
      "DATABASE_URL, SUPABASE_URL and SUPABASE_SECRET_KEY are required",
    );
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  });
  const supabase = createClient(supabaseUrl, supabaseSecretKey, {
    auth: { persistSession: false },
  });

  console.log("🖼️  Seeding property photos to Supabase Storage…");
  await ensureBucket(supabase);

  console.log("\n  Chalets:");
  const chalets = await processFolder(CHALETS_DIR, prisma, supabase);
  console.log("\n  Bungalows:");
  const bungalows = await processFolder(BUNGALOWS_DIR, prisma, supabase);

  console.log("\n────────────────────────");
  console.log(
    `Matched: ${chalets.matched + bungalows.matched} properties · ` +
      `Uploaded: ${chalets.uploaded + bungalows.uploaded} photos`,
  );
  const skipped = [...chalets.skipped, ...bungalows.skipped];
  if (skipped.length > 0) {
    console.log(`Skipped (no matching property in DB):`);
    skipped.forEach((s) => console.log(`  · ${s}`));
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("❌ Photo seed failed:", err);
  process.exit(1);
});
