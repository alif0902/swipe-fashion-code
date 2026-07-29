#!/usr/bin/env python3
"""Membuat ikon PWA dari palet aplikasi.

Ikon digambar, bukan diambil dari berkas desain, supaya warnanya dijamin sama
dengan token --primary di globals.css dan tidak ada aset yang perlu dititipkan
dari luar repo.

Dibuat empat berkas:
- icon-192.png, icon-512.png  → ikon biasa, sudut membulat sendiri
- icon-maskable-512.png       → Android memotong ikon jadi bentuk apa pun
  (lingkaran, squircle, kotak bulat) tergantung peluncurnya. Ikon "maskable"
  karena itu harus mengisi seluruh bidang dengan margin aman ~20% di tiap sisi,
  supaya logonya tidak ikut terpotong.
- apple-touch-icon.png        → iOS tidak membaca manifest untuk ikon home
  screen; ia mencari tag <link rel="apple-touch-icon"> berukuran 180px.

Jalankan dari root repo:

    python3 scripts/generate-pwa-icons.py
"""

from pathlib import Path

from PIL import Image, ImageDraw

OUT = Path("artifacts/swipe-fashion-next/public")

# Disalin dari --primary dan --primary-foreground di globals.css.
CORAL = (254, 105, 112)
PAPER = (255, 250, 250)


def draw_mark(size: int, inset: float, rounded: bool) -> Image.Image:
    """Kotak coral berisi lambang swipe: kartu miring dengan tanda centang."""
    # Digambar 4x lalu diperkecil — cara termurah mendapat tepi yang halus
    # tanpa menggambar anti-alias sendiri.
    scale = 4
    s = size * scale
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    if rounded:
        d.rounded_rectangle([0, 0, s, s], radius=int(s * 0.22), fill=CORAL)
    else:
        # Maskable: bidang penuh, peluncur yang akan memotongnya.
        d.rectangle([0, 0, s, s], fill=CORAL)

    # Dua kartu bertumpuk, miring — bahasa visual "swipe".
    pad = s * inset
    w, h = s - pad * 2, (s - pad * 2) * 0.92
    cx, cy = s / 2, s / 2

    back = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    ImageDraw.Draw(back).rounded_rectangle(
        [cx - w * 0.44, cy - h * 0.50, cx + w * 0.44, cy + h * 0.50],
        radius=int(s * 0.07),
        fill=(*PAPER, 90),
    )
    img.alpha_composite(back.rotate(-14, resample=Image.BICUBIC, center=(cx, cy)))

    front = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    ImageDraw.Draw(front).rounded_rectangle(
        [cx - w * 0.40, cy - h * 0.46, cx + w * 0.40, cy + h * 0.46],
        radius=int(s * 0.07),
        fill=PAPER,
    )
    img.alpha_composite(front.rotate(8, resample=Image.BICUBIC, center=(cx, cy)))

    # Centang coral di tengah kartu depan.
    d2 = ImageDraw.Draw(img)
    lw = int(s * 0.062)
    d2.line(
        [
            (cx - s * 0.115, cy + s * 0.012),
            (cx - s * 0.028, cy + s * 0.098),
            (cx + s * 0.132, cy - s * 0.095),
        ],
        fill=CORAL,
        width=lw,
        joint="curve",
    )

    return img.resize((size, size), Image.LANCZOS)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    targets = [
        ("icon-192.png", 192, 0.14, True),
        ("icon-512.png", 512, 0.14, True),
        # Margin lebih besar: bagian luar akan terpotong oleh peluncur.
        ("icon-maskable-512.png", 512, 0.28, False),
        ("apple-touch-icon.png", 180, 0.14, True),
    ]

    for name, size, inset, rounded in targets:
        icon = draw_mark(size, inset, rounded)
        # PNG home screen tidak boleh transparan di iOS — dilatari warna kertas.
        flat = Image.new("RGB", icon.size, PAPER)
        flat.paste(icon, mask=icon.split()[3])
        flat.save(OUT / name, "PNG", optimize=True)
        print(f"  public/{name}  ({size}px)")

    print(f"Selesai: {len(targets)} ikon di {OUT}")


if __name__ == "__main__":
    main()
