import "./load-env";

import fs from "node:fs";
import path from "node:path";

import { eq } from "drizzle-orm";
import { db, productsTable } from "@workspace/db";

// Folder public tempat aset gambar berada.
const PUBLIC_DIR = path.resolve(
  process.cwd(),
  "../artifacts/swipe-fashion-next/public",
);

const FLAT_EXTS = [".jpg", ".jpeg", ".png", ".webp"];

// Dari "/assets/blazer-white-linen.jpg" hasilkan kandidat
// "/assets/blazer-white-linen-flat.jpg" (dan ekstensi lain).
function flatCandidates(imageUrl: string): string[] {
  const dot = imageUrl.lastIndexOf(".");
  const base = dot === -1 ? imageUrl : imageUrl.slice(0, dot);
  return FLAT_EXTS.map((ext) => `${base}-flat${ext}`);
}

function existsInPublic(urlPath: string): boolean {
  return fs.existsSync(path.join(PUBLIC_DIR, urlPath.replace(/^\//, "")));
}

async function main() {
  const products = await db.select().from(productsTable);
  let withFlat = 0;

  for (const p of products) {
    const images = [p.imageUrl];

    const flat = flatCandidates(p.imageUrl).find(existsInPublic);
    if (flat) {
      images.push(flat);
      withFlat++;
    }

    await db
      .update(productsTable)
      .set({ images })
      .where(eq(productsTable.id, p.id));

    console.log(
      `${p.name}: ${images.length} foto${flat ? " (model + flat)" : " (hanya model — belum ada file -flat)"}`,
    );
  }

  console.log(
    `\nSelesai. ${products.length} produk diperbarui, ${withFlat} punya foto flat.`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error("Gagal set product images:", err);
  process.exit(1);
});
