import type { MetadataRoute } from "next";

/**
 * Manifest PWA.
 *
 * Ditulis sebagai app/manifest.ts, bukan public/manifest.json, supaya Next
 * yang menyajikannya dengan Content-Type yang benar dan nilainya bisa
 * memakai TypeScript — salah ketik pada properti akan tertangkap typecheck,
 * bukan diam-diam diabaikan browser.
 *
 * Inilah yang mengubah situs jadi aplikasi yang bisa dipasang: begitu manifest
 * ini terbaca dan display-nya "standalone", ponsel menawarkan「ホーム画面に追加」
 * dan membukanya tanpa address bar.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HITOME — スワイプで出会う、次の一着",
    short_name: "HITOME",
    description:
      "選ぶのではなく、感じる。スワイプするだけで、あなたの好みに近づいていくファッションストア。",
    lang: "ja",
    // standalone = tanpa address bar dan tombol browser. Inti dari kesan
    // "ini aplikasi, bukan situs".
    display: "standalone",
    orientation: "portrait",
    // Dibuka langsung ke feed, bukan ke halaman pemasaran: begitu ikon di home
    // screen ditekan, orang ingin langsung memakai aplikasinya.
    start_url: "/feed",
    scope: "/",
    // Warna splash screen dan bilah status. background_color memakai latar
    // pink aplikasi supaya peralihan dari splash ke layar pertama tidak
    // berkedip putih.
    background_color: "#ffe9ec",
    theme_color: "#fe6970",
    categories: ["shopping", "lifestyle"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        // "maskable" memberi izin peluncur memotong ikon jadi bentuk apa pun.
        // Tanpa varian ini, Android menempelkan ikon biasa di dalam kotak putih.
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
