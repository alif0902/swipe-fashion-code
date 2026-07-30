import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Foto profil dan foto produk yang diunggah admin tinggal di Vercel Blob.
    // Tanpa pola ini next/image menolak memuatnya dan gambarnya tidak muncul —
    // daftar putih ini disengaja oleh Next supaya situsmu tidak bisa dipakai
    // orang lain sebagai pengoptimal gambar gratis.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
