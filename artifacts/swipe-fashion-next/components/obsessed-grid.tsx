"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Star } from "lucide-react";

import { ObsessedDeleteButton } from "@/components/obsessed-delete-button";
import { OrderSheet } from "@/components/order-sheet";
import { formatPrice, type AppProduct } from "@/lib/format";

/**
 * Grid koleksi 一目惚れ, dengan pintasan memasukkan barang ke バッグ.
 *
 * SOAL "muncul saat hover": hover tidak ada di layar sentuh. Di ponsel,
 * sentuhan pertama memicu keadaan hover lalu menempel di sana sampai ada yang
 * disentuh lagi — tombol yang hanya muncul saat hover praktis tidak pernah
 * bisa ditekan. Karena aplikasi ini mobile-only, menyembunyikannya di balik
 * hover berarti menyembunyikannya dari hampir semua penggunanya.
 *
 * Jadi tombolnya SELALU terlihat di layar sentuh, dan baru bersembunyi di
 * balik hover pada layar lebar (md ke atas) tempat kursor memang ada.
 */

export function ObsessedGrid({ products }: { products: AppProduct[] }) {
  const [selected, setSelected] = useState<AppProduct | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const start = (product: AppProduct) => {
    setSelected(product);
    setIsSheetOpen(true);
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-x-3 gap-y-6">
        {products.map((product) => (
          <div
            key={product.id}
            className="group rounded-2xl bg-card border border-border/70 overflow-hidden shadow-sm"
          >
            <div className="relative aspect-[3/4] bg-muted">
              {/* Link hanya membungkus fotonya. Tombol harus berada DI LUAR
                  elemen <a> — tombol di dalam tautan tidak sah secara HTML dan
                  ketukannya bisa ikut membuka halaman produk. */}
              <Link href={`/product/${product.id}`} className="absolute inset-0">
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  sizes="(max-width: 448px) 50vw, 224px"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </Link>

              <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-white/90 backdrop-blur px-2 py-1 shadow-sm pointer-events-none">
                <Star className="w-3 h-3 fill-primary text-primary" />
                <span className="text-[10px] font-bold text-primary">
                  一目惚れ
                </span>
              </span>

              {/* Sudut kanan-atas, berseberangan dengan lencana 一目惚れ dan
                  jauh dari tombol バッグ di kanan-bawah. Menghapus dan
                  memasukkan ke keranjang adalah dua tindakan yang paling tidak
                  boleh tertukar, jadi keduanya diberi jarak sejauh mungkin di
                  dalam kartu.

                  SELALU terlihat, tidak disembunyikan di balik hover — alasan
                  yang sama dengan tombol バッグ di bawah. */}
              <ObsessedDeleteButton productId={product.id} />

              {/* Satu aksi saja: masuk バッグ.
                  Tombol "beli langsung" dihapus karena keduanya tetap melewati
                  lembar pilih ukuran yang sama — bedanya cuma ke mana pengguna
                  dibawa sesudahnya. Dua tombol untuk perbedaan sekecil itu
                  membuat orang berhenti menimbang, padahal pembayaran sudah
                  menunggu satu ketukan lagi di halaman バッグ. */}
              <button
                type="button"
                onClick={() => start(product)}
                data-testid={`button-bag-${product.id}`}
                aria-label="バッグに入れる"
                title="バッグに入れる"
                className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-white/95 backdrop-blur shadow-md flex items-center justify-center text-foreground/80 transition hover:scale-105 hover:text-primary active:scale-95 md:opacity-0 md:group-hover:opacity-100"
              >
                <ShoppingBag className="w-4 h-4" />
              </button>
            </div>

            <Link href={`/product/${product.id}`} className="block p-3">
              <p className="text-[10px] text-muted-foreground tracking-[0.12em] truncate">
                {product.brand}
              </p>
              <h3 className="font-sans font-bold text-[13px] leading-snug line-clamp-2 mt-0.5 min-h-[2.4em]">
                {product.name}
              </h3>
              <p className="font-sans font-bold text-sm text-primary tabular-nums mt-1">
                {formatPrice(product.price)}
              </p>
            </Link>
          </div>
        ))}
      </div>

      <OrderSheet
        product={selected}
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
      />
    </>
  );
}
