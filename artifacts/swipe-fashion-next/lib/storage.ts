import "server-only";

import { put } from "@vercel/blob";

/**
 * Satu-satunya tempat gambar diunggah.
 *
 * Semua penyimpanan gambar lewat sini — foto profil maupun foto produk —
 * supaya kalau penyedianya berganti (S3, Cloudflare R2), yang perlu diubah
 * cuma berkas ini.
 *
 * Kenapa bukan di Postgres seperti foto profil sebelumnya: foto produk
 * berukuran feed sekitar 150–300 KB, dan satu feed memuat sepuluh kartu.
 * Menyimpannya di database berarti beberapa megabita menyeberang dari Sydney
 * setiap kali feed dibuka. Blob menyajikannya lewat CDN, dekat dengan
 * penggunanya.
 */

// Format yang diterima. SVG sengaja TIDAK ada di daftar: berkas SVG bisa
// memuat skrip, dan menyajikannya dari domain sendiri berarti skrip itu
// berjalan atas nama situsmu.
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

const MAX_BYTES = 2 * 1024 * 1024;

export type StorageResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

/**
 * Mengunggah data URL hasil pengecilan di klien.
 *
 * Klien selalu mengecilkan dulu lewat canvas, jadi ukuran yang sampai ke sini
 * jauh di bawah batas. Batasnya ada untuk menahan kiriman yang dibuat manual,
 * bukan untuk pemakaian normal.
 */
export async function putDataUrl(
  dataUrl: string,
  prefix: string,
): Promise<StorageResult> {
  const match = /^data:(image\/[a-z+]+);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) {
    return { ok: false, error: "画像を読み取れませんでした。" };
  }

  const [, mime, base64] = match;
  if (!ALLOWED.has(mime)) {
    return { ok: false, error: "対応していない画像形式です。" };
  }

  const bytes = Buffer.from(base64, "base64");
  if (bytes.byteLength > MAX_BYTES) {
    return { ok: false, error: "画像のサイズが大きすぎます。" };
  }

  // Diperiksa SEBELUM put(), supaya kegagalannya berupa kalimat yang bisa
  // ditindaklanjuti — bukan error dari dalam SDK yang tidak menyebut nama
  // variabelnya. Nama variabelnya ikut disebut karena itulah satu-satunya
  // informasi yang benar-benar dibutuhkan untuk memperbaikinya.
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return {
      ok: false,
      error:
        "画像の保存先が未設定です。BLOB_READ_WRITE_TOKEN を .env.local に追加してください。（Vercel の Storage タブで Blob ストアを作成すると取得できます）",
    };
  }

  const extension = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";

  // put() MELEMPAR, tidak mengembalikan hasil bertanda, saat token tidak valid
  // atau tipe store-nya salah — dan tanpa try/catch di sini, error itu terus
  // terlempar melewati server action sampai ke catch di klien, yang lalu
  // menampilkan「画像を読み込めませんでした」. Pesan itu menyalahkan berkasnya
  // padahal masalahnya ada di konfigurasi, dan penelusurannya jadi jauh lebih
  // lama daripada seharusnya.
  try {
    const blob = await put(`${prefix}/${crypto.randomUUID()}.${extension}`, bytes, {
      access: "public",
      contentType: mime,
      // Nama berkas sudah memakai UUID, jadi tidak perlu akhiran acak dari
      // Vercel — URL-nya jadi lebih mudah dibaca saat menelusuri masalah.
      addRandomSuffix: false,
    });

    return { ok: true, url: blob.url };
  } catch (error) {
    // Pesan asli dari SDK ikut dibawa. Ia menyebut hal-hal seperti token tidak
    // valid atau store bertipe private — justru itulah yang perlu dibaca.
    const detail = error instanceof Error ? error.message : String(error);
    console.error("[storage] gagal mengunggah ke Vercel Blob:", detail);

    return {
      ok: false,
      error: `画像をアップロードできませんでした: ${detail}`,
    };
  }
}
