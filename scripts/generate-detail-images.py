#!/usr/bin/env python3
"""Membuat satu foto detail dari tiap foto produk.

Kenapa diturunkan dari foto aslinya, bukan memakai foto acak dari internet:
carousel yang menampilkan gambar produk lain (atau foto stok yang tidak
berhubungan) akan langsung terlihat palsu begitu seseorang menggeser dua produk
berturut-turut. Crop dari foto asli tetap menampilkan barang yang benar.

Soal pemilihan posisi crop — tiga pendekatan otomatis dicoba dan semuanya
gagal, jadi jangan diulang:

1. Offset acak: sering mendarat di dinding atau langit di belakang model.
2. Energi tepi tertinggi: justru memilih batu paving dan pagar besi, karena
   tekstur latar lebih "tajam" daripada kain yang halus.
3. Pencocokan warna pakaian: gagal saat model tidak di tengah bingkai,
   karena contoh warnanya sendiri terambil dari latar.

Yang dipakai sekarang sengaja bodoh dan bisa diprediksi: zoom tetap ke bagian
tengah-atas. Tidak ada pencarian, tidak ada keacakan. Cropnya cukup longgar
(65% sisi) sehingga pakaian tetap masuk bingkai berapa pun komposisi fotonya —
kesalahan framing paling parah justru muncul pada crop yang ketat.

Hanya SATU varian yang dibuat. Close-up bahan sempat dicoba tapi dibuang:
pada crop seketat itu, meleset sedikit saja hasilnya jadi foto trotoar.

Jalankan dari root repo:

    python3 scripts/generate-detail-images.py
"""

from pathlib import Path

from PIL import Image

ASSETS = Path("artifacts/swipe-fashion-next/public/assets")
OUT = ASSETS / "details"
SIZE = 1024

# Porsi sisi yang diambil, lalu posisi bingkai sebagai fraksi ruang tersisa.
# 0.5 di sumbu x = tepat di tengah; 0.15 di sumbu y = condong ke atas, tempat
# kerah, bahu, dan lengan berada.
PORTION = 0.65
FRAME_X = 0.5
FRAME_Y = 0.15


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    sources = sorted(p for p in ASSETS.glob("*.jpg"))
    if not sources:
        raise SystemExit(f"Tidak ada .jpg di {ASSETS}")

    for src in sources:
        image = Image.open(src).convert("RGB")
        width, height = image.size

        crop_w, crop_h = int(width * PORTION), int(height * PORTION)
        left = int((width - crop_w) * FRAME_X)
        top = int((height - crop_h) * FRAME_Y)

        out_path = OUT / f"{src.stem}-detail.jpg"
        (
            image.crop((left, top, left + crop_w, top + crop_h))
            .resize((SIZE, SIZE), Image.LANCZOS)
            .save(out_path, "JPEG", quality=88, optimize=True)
        )
        print(f"  {out_path.relative_to(ASSETS.parent)}")

    print(f"Selesai: {len(sources)} berkas di {OUT}")


if __name__ == "__main__":
    main()
