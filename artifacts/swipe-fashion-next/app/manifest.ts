import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HITOME — スワイプで出会う、次の一着",
    short_name: "HITOME",
    description:
      "選ぶのではなく、感じる。スワイプするだけで、あなたの好みに近づいていくファッションストア。",
    lang: "ja",
    display: "standalone",
    orientation: "portrait",
    start_url: "/feed",
    scope: "/",
    background_color: "#ffe9ec",
    theme_color: "#fe6970",
    categories: ["shopping", "lifestyle"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
