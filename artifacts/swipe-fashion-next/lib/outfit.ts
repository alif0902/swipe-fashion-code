// Perakit outfit "Complete the Look".
//
// Sama seperti lib/taste.ts, modul ini MURNI: masuk daftar produk, keluar
// daftar look. Tidak ada DB, tidak ada async, jadi aturan penyusunannya bisa
// diuji unit sampai ke kasus pinggirnya.

// Kategori yang dipakai katalog. Nilainya harus sama dengan kolom
// products.category (lihat scripts/src/seed.ts).
export const TOPS = "tops";
export const BOTTOMS = "bottoms";
export const OUTERWEAR = "outerwear";
export const DRESSES = "dresses";

// Cukup punya id dan kategori untuk bisa dirakit. Sengaja longgar supaya modul
// ini tidak terikat pada tipe AppProduct.
export type OutfitPiece = {
  id: number;
  category: string;
};

export type Look<T extends OutfitPiece> = {
  // Stabil dan deterministik — aman dipakai sebagai React key.
  id: string;
  title: string;
  pieces: T[];
};

function byCategory<T extends OutfitPiece>(pieces: T[], category: string): T[] {
  // Urut id supaya hasilnya deterministik apa pun urutan masukannya.
  return pieces
    .filter((p) => p.category === category)
    .sort((a, b) => a.id - b.id);
}

/**
 * Merakit look dari koleksi yang disimpan pengguna.
 *
 * Aturannya sederhana dan sengaja konservatif — lebih baik menampilkan sedikit
 * padanan yang masuk akal daripada banyak yang aneh:
 *
 * - Satu look butuh alas yang lengkap: sepotong dress, ATAU atasan + bawahan.
 * - Luaran bersifat opsional dan ditumpuk di atas alas yang sudah lengkap.
 * - Tiap potong dipakai paling banyak sekali, supaya look tidak terasa daur ulang.
 */
export function buildLooks<T extends OutfitPiece>(pieces: T[]): Look<T>[] {
  const tops = byCategory(pieces, TOPS);
  const bottoms = byCategory(pieces, BOTTOMS);
  const outerwear = byCategory(pieces, OUTERWEAR);
  const dresses = byCategory(pieces, DRESSES);

  const bases: T[][] = [];

  // Dress berdiri sendiri sebagai alas yang sudah lengkap.
  for (const dress of dresses) {
    bases.push([dress]);
  }

  // Atasan dipasangkan dengan bawahan secara berpasangan menurut urutan id.
  // Sisa yang tidak kebagian pasangan tidak dijadikan look — potongan tunggal
  // bukan outfit.
  const pairCount = Math.min(tops.length, bottoms.length);
  for (let i = 0; i < pairCount; i += 1) {
    bases.push([tops[i], bottoms[i]]);
  }

  // Luaran dibagikan ke alas paling awal lebih dulu, satu per look.
  return bases.map((base, index) => {
    const layer = outerwear[index];
    const all = layer ? [...base, layer] : base;

    return {
      id: all.map((p) => p.id).join("-"),
      title: `Look ${String(index + 1).padStart(2, "0")}`,
      pieces: all,
    };
  });
}

/**
 * Menjelaskan apa yang kurang untuk membentuk look pertama. Dipakai empty state
 * supaya pengguna tahu langkah berikutnya, bukan sekadar melihat layar kosong.
 * Mengembalikan null bila sudah ada look yang bisa dirakit.
 */
export function describeLookGap(pieces: OutfitPiece[]): string | null {
  const hasTop = pieces.some((p) => p.category === TOPS);
  const hasBottom = pieces.some((p) => p.category === BOTTOMS);
  const hasDress = pieces.some((p) => p.category === DRESSES);

  if (hasDress || (hasTop && hasBottom)) return null;

  if (hasTop) return "Save a pair of bottoms to complete your first look.";
  if (hasBottom) return "Save a top to complete your first look.";

  return "Save a top and bottoms — or a dress — to build your first look.";
}
