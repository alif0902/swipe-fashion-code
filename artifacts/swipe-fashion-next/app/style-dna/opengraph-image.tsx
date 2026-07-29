import { ImageResponse } from "next/og";

// Kartu share untuk /style-dna.
//
// Sengaja TIDAK dipersonalisasi. Gambar ini dirender saat orang lain membuka
// tautan yang kamu bagikan, dan mereka punya sesi sendiri yang kosong — profil
// selera tidak ikut menyeberang. Jadi yang ditampilkan adalah kartu bermerek
// yang mengajak orang membuat DNA-nya sendiri.

export const alt = "SwipeFash Style DNA";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Warna disalin dari token --primary / --foreground di app/globals.css. Satori
// tidak membaca CSS variable, jadi nilainya harus literal di sini.
const CORAL = "#fe6970";
const INK = "#3d3436";
const PAPER = "#fffafa";

export default function Image() {
  return new ImageResponse(
    (
      // Satori mewajibkan display:flex eksplisit pada elemen dengan lebih dari
      // satu anak — tanpa itu render gagal, bukan sekadar tampil miring.
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: PAPER,
          padding: 80,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: 999,
              backgroundColor: CORAL,
            }}
          />
          <div
            style={{
              display: "flex",
              fontSize: 26,
              letterSpacing: 8,
              color: INK,
              opacity: 0.6,
            }}
          >
            SWIPEFASH
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 120,
              fontWeight: 700,
              color: INK,
              lineHeight: 1.05,
            }}
          >
            Style DNA
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 40,
              color: INK,
              opacity: 0.65,
              marginTop: 20,
              maxWidth: 820,
            }}
          >
            Every swipe teaches it something — including the ones you pass on.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              display: "flex",
              backgroundColor: CORAL,
              color: PAPER,
              fontSize: 28,
              letterSpacing: 4,
              padding: "20px 44px",
              borderRadius: 999,
            }}
          >
            BUILD YOURS
          </div>
        </div>
      </div>
    ),
    size,
  );
}
