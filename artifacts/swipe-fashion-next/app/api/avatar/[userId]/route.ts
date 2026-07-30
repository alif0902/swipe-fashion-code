import { eq } from "drizzle-orm";
import { db, userAvatarsTable } from "@workspace/db";

/**
 * Menyajikan foto profil sebagai gambar sungguhan, bukan data URL di HTML.
 *
 * Kalau foto ditempel langsung sebagai data URL, ia ikut terkirim ulang di
 * setiap render halaman dan tidak pernah bisa di-cache browser. Sebagai rute
 * tersendiri, browser mengunduhnya sekali lalu menyimpannya.
 *
 * Cache-nya `immutable` karena URL-nya membawa parameter `?v=` yang berubah
 * setiap foto diganti — jadi versi lama boleh disimpan selamanya, dan foto
 * baru muncul seketika karena URL-nya sudah beda.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params;

  const [row] = await db
    .select({ data: userAvatarsTable.data })
    .from(userAvatarsTable)
    .where(eq(userAvatarsTable.userId, userId));

  if (!row) {
    return new Response(null, { status: 404 });
  }

  const bytes = Buffer.from(row.data, "base64");

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "image/jpeg",
      "Content-Length": String(bytes.byteLength),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
