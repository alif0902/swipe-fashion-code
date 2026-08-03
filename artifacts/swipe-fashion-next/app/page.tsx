import { redirect } from "next/navigation";

// Tidak ada landing page. Aplikasi ini dua hal saja: toko swipe untuk ponsel
// di /feed, dan panel admin untuk layar lebar di /admin.
//
// /welcome sempat ada sebagai halaman pemasaran lalu dihapus — ia menjelaskan
// aplikasi kepada orang yang sudah membukanya, sementara gerakan swipe-nya
// sendiri sudah cukup menjelaskan diri. start_url di manifest.ts pun sejak
// awal menunjuk /feed, jadi pengguna PWA memang tidak pernah melewatinya.
export default function HomePage() {
  redirect("/feed");
}
