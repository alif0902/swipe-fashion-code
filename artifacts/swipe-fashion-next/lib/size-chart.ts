/**
 * Padanan ukuran huruf ke ukuran BADAN.
 *
 * Berbeda dengan `product.dimensions`, yang berisi 実寸 — ukuran fisik garmen
 * saat dibentangkan datar. Keduanya sama-sama berguna tapi menjawab pertanyaan
 * yang berbeda:
 *
 *   実寸           "seberapa besar bajunya?"      → blok 基本情報 di kartu
 *   tabel ini      "ukuran mana yang muat aku?"   → lembar pemesanan
 *
 * Lembar pemesanan memakai yang ini karena tugasnya membantu memutuskan dalam
 * hitungan detik. 実寸 menuntut orang mengukur baju lamanya dengan meteran —
 * akurat, tapi bertentangan dengan janji 数タップで注文, dan datanya toh sudah
 * tampil di kartu produk.
 *
 * ANGKANYA rentang ritel Jepang yang lazim, bukan hasil ukur produksi. Kalau
 * nanti ada spesifikasi pabrik yang sebenarnya, ganti dari sini — satu tempat,
 * dipakai seluruh katalog.
 */

export type SizeRow = {
  size: string;
  /** Tinggi badan, cm. */
  height: string;
  /** Lingkar dada untuk atasan, atau lingkar pinggang untuk bawahan. */
  chest: string;
  waist: string;
};

const WOMEN: SizeRow[] = [
  { size: "XS", height: "150–158", chest: "74–80", waist: "56–62" },
  { size: "S", height: "155–163", chest: "79–87", waist: "60–66" },
  { size: "M", height: "158–166", chest: "86–94", waist: "64–70" },
  { size: "L", height: "161–169", chest: "93–101", waist: "69–75" },
  { size: "XL", height: "164–172", chest: "100–108", waist: "74–80" },
];

const MEN: SizeRow[] = [
  { size: "XS", height: "155–165", chest: "80–88", waist: "68–74" },
  { size: "S", height: "160–168", chest: "84–92", waist: "71–77" },
  { size: "M", height: "165–175", chest: "88–96", waist: "76–84" },
  { size: "L", height: "170–180", chest: "96–104", waist: "84–94" },
  { size: "XL", height: "175–185", chest: "104–112", waist: "94–104" },
];

/**
 * Baris tabel untuk produk tertentu.
 *
 * Hanya mengembalikan ukuran yang BENAR-BENAR dijual produk itu. Menampilkan
 * baris XL pada produk yang berhenti di L membuat orang mencari ukuran yang
 * tidak bisa dibeli — tabelnya jadi janji, bukan panduan.
 */
export function sizeChartFor(
  gender: "women" | "men",
  sizes: string[],
): SizeRow[] {
  const table = gender === "men" ? MEN : WOMEN;
  return table.filter((row) => sizes.includes(row.size));
}
