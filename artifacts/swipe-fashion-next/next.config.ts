import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // lib/db adalah paket workspace berisi TypeScript mentah, jadi Next
  // harus mentranspilasinya alih-alih memperlakukannya sebagai dependency siap pakai.
  transpilePackages: ["@workspace/db"],
};

export default nextConfig;
