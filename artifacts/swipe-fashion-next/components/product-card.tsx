'use client';

import { useState } from 'react';
import {
  motion,
  useMotionValue,
  useTransform,
  useAnimation,
  useDragControls,
  type PanInfo,
} from 'framer-motion';
import { categoryLabel, formatPrice, type AppProduct } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight, Star, ThumbsUp, X } from 'lucide-react';

interface ProductCardProps {
  product: AppProduct;
  onSwipeRight: (product: AppProduct) => void;
  onSwipeLeft: (product: AppProduct) => void;
  onSuperLike: (product: AppProduct) => void;
  isFront: boolean;
}

// Satu baris di blok 基本情報: label abu-abu di kiri, nilai berwarna aksen di
// kanan. Mengikuti pola tabel profil aplikasi Jepang.
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-4 py-3 border-b border-border/60 last:border-0">
      <span className="w-28 shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="flex-1 text-sm text-primary">{value}</span>
    </div>
  );
}

export function ProductCard({
  product,
  onSwipeRight,
  onSwipeLeft,
  onSuperLike,
  isFront,
}: ProductCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const controls = useAnimation();
  const rotate = useTransform(x, [-200, 200], [-8, 8]);
  const likeOpacity = useTransform(x, [0, 50, 100], [0, 0, 1]);
  const nopeOpacity = useTransform(x, [0, -50, -100], [0, 0, 1]);
  const superOpacity = useTransform(y, [0, -50, -100], [0, 0, 1]);

  // Kartu kini punya badan yang bisa di-scroll, sementara drag framer-motion
  // ikut menangkap gerakan vertikal. Kalau drag dipasang pada seluruh kartu,
  // menggulir daftar spesifikasi malah menyeret kartunya.
  //
  // dragListener={false} mematikan penangkapan otomatis, lalu drag hanya
  // dimulai manual dari area foto lewat dragControls. Hasilnya: foto untuk
  // swipe, badan untuk scroll.
  const dragControls = useDragControls();

  const images = product.images.length > 0 ? product.images : [product.imageUrl];
  const [photoIndex, setPhotoIndex] = useState(0);
  const currentImage = images[photoIndex] ?? images[0];

  const goTo = (i: number) =>
    setPhotoIndex(((i % images.length) + images.length) % images.length);

  const swipeThreshold = 100;

  const handleDragEnd = async (_e: unknown, info: PanInfo) => {
    const { offset, velocity } = info;

    if (offset.y < -swipeThreshold && Math.abs(offset.y) > Math.abs(offset.x)) {
      await controls.start({ y: -700, transition: { duration: 0.3 } });
      onSuperLike(product);
      return;
    }

    if (offset.x > swipeThreshold || velocity.x > 500) {
      await controls.start({ x: 500, transition: { duration: 0.3 } });
      onSwipeRight(product);
    } else if (offset.x < -swipeThreshold || velocity.x < -500) {
      await controls.start({ x: -500, transition: { duration: 0.3 } });
      onSwipeLeft(product);
    } else {
      controls.start({
        x: 0,
        y: 0,
        rotate: 0,
        transition: { type: 'spring', stiffness: 300, damping: 20 },
      });
    }
  };

  const forceSwipeRight = async () => {
    await controls.start({ x: 500, transition: { duration: 0.3 } });
    onSwipeRight(product);
  };

  const forceSwipeLeft = async () => {
    await controls.start({ x: -500, transition: { duration: 0.3 } });
    onSwipeLeft(product);
  };

  const forceSuperLike = async () => {
    await controls.start({ y: -700, transition: { duration: 0.3 } });
    onSuperLike(product);
  };

  const dimensionEntries = Object.entries(product.dimensions);

  return (
    <motion.div
      className="absolute inset-0 pt-2"
      drag={isFront}
      dragListener={false}
      dragControls={dragControls}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={handleDragEnd}
      animate={controls}
      style={{ x, y, rotate }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {/* Wadah kartu kini transparan. Foto, strip thumbnail, dan panel teks
          jadi tiga blok terpisah yang mengambang di atas latar pink — bukan
          satu kotak putih penuh seperti sebelumnya. */}
      <div className="relative w-full h-full flex flex-col">
        {/* Stempel arah swipe */}
        <motion.div
          className="absolute top-8 left-8 z-40 border-4 border-green-500 rounded-lg px-4 py-1.5 rotate-[-15deg] pointer-events-none"
          style={{ opacity: likeOpacity }}
        >
          <span className="text-green-500 font-black text-3xl tracking-widest">買う</span>
        </motion.div>
        <motion.div
          className="absolute top-8 right-8 z-40 border-4 border-red-500 rounded-lg px-4 py-1.5 rotate-[15deg] pointer-events-none"
          style={{ opacity: nopeOpacity }}
        >
          <span className="text-red-500 font-black text-3xl tracking-widest">パス</span>
        </motion.div>
        <motion.div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 z-40 border-4 border-violet-500 rounded-lg px-5 py-1.5 pointer-events-none"
          style={{ opacity: superOpacity }}
        >
          <span className="text-violet-500 font-black text-2xl tracking-widest flex items-center gap-2">
            <Star className="w-6 h-6 fill-current" /> スーパー
          </span>
        </motion.div>

        {/* ---- Foto: satu-satunya zona gestur swipe ---- */}
        <div
          className="relative h-[42%] shrink-0 touch-none"
          onPointerDown={(e) => {
            if (isFront) dragControls.start(e);
          }}
        >
          <div className="relative h-full mx-6 rounded-[1.75rem] overflow-hidden bg-muted shadow-lg">
            <img
              src={currentImage}
              alt={product.name}
              className="w-full h-full object-cover select-none"
              draggable={false}
            />

            <div className="absolute top-4 right-4 flex gap-2 z-30">
              {product.isNew && (
                <Badge className="bg-white text-black hover:bg-white border-0 shadow">NEW</Badge>
              )}
              {product.isSale && (
                <Badge variant="destructive" className="shadow">
                  SALE
                </Badge>
              )}
            </div>
          </div>

          {/* Panah setengah lingkaran TERJEPIT DI TEPI LAYAR seperti aplikasi
              rujukan — bukan lingkaran kecil di tepi foto. -translate-x-1/2
              mendorong separuhnya keluar kartu; overflow-hidden pada wadah
              feed yang memotongnya jadi setengah lingkaran. */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                aria-label="前の写真"
                data-testid="button-photo-prev"
                // stopPropagation di pointerDown penting: tanpa ini tombol ikut
                // memicu dragControls.start dan tap-nya terbaca sebagai swipe.
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => goTo(photoIndex - 1)}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-30 w-16 h-16 rounded-full bg-white/45 backdrop-blur-sm flex items-center justify-center text-white"
              >
                <ChevronLeft className="w-6 h-6 ml-6" />
              </button>
              <button
                type="button"
                aria-label="次の写真"
                data-testid="button-photo-next"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => goTo(photoIndex + 1)}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-30 w-16 h-16 rounded-full bg-white/45 backdrop-blur-sm flex items-center justify-center text-white"
              >
                <ChevronRight className="w-6 h-6 mr-6" />
              </button>
            </>
          )}
        </div>

        {/* ---- Gelembung ucapan dengan ekor segitiga, seperti caption foto di
             aplikasi rujukan. Diisi material karena itu satu-satunya fakta
             produk yang cukup pendek untuk jadi caption. ---- */}
        {product.material && (
          // flex justify-center membuat lebar gelembung mengikuti teksnya,
          // bukan membentang selebar layar untuk isi sependek「シルク100%」.
          <div className="relative z-10 mt-2 flex justify-center pointer-events-none">
            <div className="relative bg-pink-50/95 rounded-full px-7 py-2.5 shadow-sm">
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-pink-50/95 rotate-45" />
              <span className="text-sm text-foreground/80">{product.material}</span>
            </div>
          </div>
        )}

        {/* ---- Strip thumbnail besar di atas gradasi ---- */}
        {images.length > 1 && (
          // gap-5 dan tanpa scale: ring digambar DI LUAR kotak tanpa
          // memengaruhi tata letak, jadi ring + scale pada thumbnail aktif
          // sebelumnya menimpa thumbnail di sebelahnya. Ring dikecilkan ke
          // 3px dan jaraknya dilebarkan supaya tiap preview bernapas.
          <div
            className="shrink-0 flex gap-5 px-6 py-4 overflow-x-auto"
            onPointerDown={(e) => e.stopPropagation()}
          >
            {images.map((src, i) => (
              <button
                key={`${src}-${i}`}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`写真 ${i + 1}`}
                className={cn(
                  'relative shrink-0 w-20 h-20 rounded-2xl overflow-hidden transition',
                  i === photoIndex
                    ? 'ring-[3px] ring-white shadow-lg'
                    : 'opacity-85',
                )}
              >
                <img src={src} alt="" className="w-full h-full object-cover" draggable={false} />
              </button>
            ))}
          </div>
        )}

        {/* ---- Panel teks putih, bisa di-scroll, tidak memicu swipe ----
             Tata letak header meniru aplikasi rujukan: nama tebal sans (bukan
             serif — heading di globals.css otomatis serif, jadi di-override),
             baris status dengan titik hijau, lalu harga besar berwarna aksen. */}
        <div
          // overscroll-none (bukan -contain): "contain" hanya mencegah scroll
          // merambat ke luar, tapi masih mengizinkan efek pantul pada panel
          // ini sendiri. "none" mematikan keduanya — panel berhenti mati di
          // ujung konten.
          className="flex-1 min-h-0 overflow-y-auto overscroll-none bg-card rounded-t-[2rem] px-6 pt-7 pb-32"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-sans font-bold text-2xl leading-snug tracking-normal">
              {product.name}
            </h2>
            {(product.isNew || product.isSale) && (
              <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold px-3 py-1.5">
                ✦ {product.isSale ? 'セール中' : '新着'}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground tracking-[0.15em] mt-0.5 mb-2">
            {product.brand}
          </p>

          <div className="flex items-center gap-1.5 mb-3">
            <span
              className={cn(
                'w-2.5 h-2.5 rounded-full',
                product.stock > 0 ? 'bg-green-500' : 'bg-muted-foreground/40',
              )}
            />
            <span className="text-sm text-muted-foreground">
              {product.stock > 0 ? `在庫あり・残り${product.stock}点` : '在庫切れ'}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="font-sans font-bold text-3xl text-primary tabular-nums">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>

          {/* Pemisah tipis antar blok. Warnanya diambil dari --border dengan
              opasitas rendah supaya terbaca sebagai jeda, bukan sebagai garis
              tabel. */}
          <div className="h-px bg-border/70 my-6" />

          <h3 className="font-sans font-bold text-lg tracking-normal mb-2">
            商品説明
          </h3>
          <p className="text-[15px] leading-relaxed text-foreground/80">
            {product.description}
          </p>

          <div className="h-px bg-border/70 my-6" />

          <h3 className="font-sans font-bold text-lg tracking-normal mb-1">
            基本情報
          </h3>
          <div>
            <InfoRow label="カテゴリー" value={categoryLabel(product.category)} />
            <InfoRow label="ブランド" value={product.brand} />
            {product.material && <InfoRow label="素材" value={product.material} />}
            {product.colors.length > 0 && (
              <InfoRow label="カラー" value={product.colors.join('・')} />
            )}
            {product.sizes.length > 0 && (
              <InfoRow label="サイズ展開" value={product.sizes.join('・')} />
            )}
            {dimensionEntries.map(([label, value]) => (
              <InfoRow key={label} label={label} value={value} />
            ))}
            {product.rating !== null && (
              <InfoRow
                label="評価"
                value={`${product.rating.toFixed(1)}（${product.reviewCount}件）`}
              />
            )}
            <InfoRow
              label="在庫"
              value={product.stock > 0 ? `残り${product.stock}点` : '在庫切れ'}
            />
          </div>
        </div>

        {/* ---- Tombol ala aplikasi rujukan: satu pil coral besar mengambang
             di atas panel, dengan ikon jempol di ujung kiri. Pass dan super
             jadi lingkaran kecil di sisinya — hierarkinya disengaja, like
             adalah aksi utama. Tanpa gradasi latar: pil dibiarkan melayang
             dengan bayangan, seperti di referensi. ---- */}
        {isFront && (
          <div
            className="absolute bottom-4 left-4 right-4 z-30 flex items-center gap-3"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <Button
              size="icon"
              variant="outline"
              className="w-12 h-12 shrink-0 rounded-full border-0 bg-card shadow-lg hover:bg-red-50 text-red-400"
              onClick={forceSwipeLeft}
              data-testid="button-skip"
              aria-label="パス"
            >
              <X className="w-5 h-5" />
            </Button>
            {/* Pil dibatasi max-w agar tidak membentang penuh di layar lebar;
                mx-auto menjaganya tetap di tengah setelah dibatasi. */}
            <Button
              className="relative flex-1 max-w-[220px] mx-auto h-12 rounded-full bg-primary text-primary-foreground text-base font-bold shadow-lg shadow-primary/30 hover:bg-primary/90 transition"
              onClick={forceSwipeRight}
              data-testid="button-buy"
            >
              <span className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center">
                <ThumbsUp className="w-5 h-5 fill-current" />
              </span>
              いいね！
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="w-12 h-12 shrink-0 rounded-full border-0 bg-card shadow-lg hover:bg-violet-50 text-violet-500"
              onClick={forceSuperLike}
              data-testid="button-super"
              aria-label="スーパーライク"
            >
              <Star className="w-5 h-5 fill-current" />
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
