import "server-only";

import { eq } from "drizzle-orm";
import { db, userTable } from "@workspace/db";

export type StoredProfile = {
  name: string;
  email: string;
  image: string | null;
  postalCode: string | null;
  address: string | null;
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
      address: userTable.address,
    })
    .from(userTable)
    .where(eq(userTable.id, userId));

  return row ?? null;
}
