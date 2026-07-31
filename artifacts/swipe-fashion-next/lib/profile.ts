import "server-only";

import { eq } from "drizzle-orm";
import { db, userTable } from "@workspace/db";

export type StoredProfile = {
  name: string;
  email: string;
  image: string | null;
  postalCode: string | null;
  prefecture: string | null;
  city: string | null;
  address: string | null;
  building: string | null;
};

/**
 * Membaca profil langsung dari tabel `user`, bukan dari objek sesi.
 *
 * Dua alasan. Pertama, sesi disalin ke cookie cache selama beberapa menit —
 * setelah mengganti nama atau foto, objek sesi masih memuat nilai lama dan
 * halaman akan terlihat seperti gagal menyimpan. Kedua, `postalCode` dan
 * `address` memang tidak ikut di objek sesi.
 *
 * Ini satu kueri tambahan, jadi hanya dipanggil di halaman yang benar-benar
 * menampilkan profil — bukan di setiap render.
 */
export async function getUserProfile(
  userId: string,
): Promise<StoredProfile | null> {
  const [row] = await db
    .select({
      name: userTable.name,
      email: userTable.email,
      image: userTable.image,
      postalCode: userTable.postalCode,
      prefecture: userTable.prefecture,
      city: userTable.city,
      address: userTable.address,
      building: userTable.building,
    })
    .from(userTable)
    .where(eq(userTable.id, userId));

  if (!row) return null;

  return { ...row, image: normalizeImage(row.image) };
}

/**
 * Membuang URL avatar dari model penyimpanan lama.
 *
 * Sebelum pindah ke Vercel Blob, foto profil disajikan lewat rute
 * `/api/avatar/{id}?v={ts}`. Rute itu sudah tidak ada, tapi barisnya masih
 * menyimpan alamat lamanya — dan next/image menolak jalur lokal bertanda tanya
 * dengan melempar runtime error, bukan sekadar gagal memuat gambar.
 *
 * Dianggap "tidak punya foto" saja: pemiliknya tinggal mengunggah ulang, dan
 * barisnya tertimpa dengan URL Blob yang benar.
 */
function normalizeImage(image: string | null): string | null {
  if (!image) return null;
  if (image.startsWith("/api/avatar/")) return null;
  return image;
}
