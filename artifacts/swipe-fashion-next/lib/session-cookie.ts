// Modul ini sengaja tidak mengimpor apa pun. Middleware berjalan di edge
// runtime sedangkan lib/session.ts ditandai server-only; kalau keduanya
// saling impor, kode edge bisa tertarik ke Server Component. Konstanta
// yang berdiri sendiri aman dipakai kedua sisi.
export const SESSION_COOKIE = "swipefash_session";
