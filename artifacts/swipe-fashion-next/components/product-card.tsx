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
import { ChevronLeft, ChevronRight, Heart, Star, X } from 'lucide-react';

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
      className="absolute inset-0 px-3 pt-2 pb-3"
      drag={isFront}
      dragListener={false}
      dragControls={dragControls}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={handleDragEnd}
      animate={controls}
      style={{
        x,
        y,
        rotate,
        opacity: isFront ? 1 : 0.8,
        scale: isFront ? 1 : 0.95,
        zIndex: isFront ? 10 : 0,
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <div className="relative w-full h-full rounded-3xl overflow-hidden bg-card border border-card-border shadow-2xl flex flex-col">
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

        {/* ---- Area foto: satu-satunya tempat gestur swipe aktif ---- */}
        <div
          className="relative h-[46%] shrink-0 bg-muted touch-none"
          onPointerDown={(e) => {
            if (isFront) dragControls.start(e);
          }}
        >
          {images.length > 1 && (
            <div className="absolute top-2.5 left-3 right-3 z-30 flex gap-1.5 pointer-events-none">
              {images.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'h-1 flex-1 rounded-full transition-colors',
                    i === photoIndex ? 'bg-white' : 'bg-white/40',
                  )}
                />
              ))}
            </div>
          )}

          <img
            src={currentImage}
            alt={product.name}
            className="w-full h-full object-cover select-none"
            draggable={false}
          />

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
                className="absolute left-2 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-black/30 backdrop-blur flex items-center justify-center text-white"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                aria-label="次の写真"
                data-testid="button-photo-next"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => goTo(photoIndex + 1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-black/30 backdrop-blur flex items-center justify-center text-white"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

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

        {/* ---- Strip thumbnail ---- */}
        {images.length > 1 && (
          <div
            className="shrink-0 flex gap-2 px-3 py-2.5 overflow-x-auto border-b border-border"
            onPointerDown={(e) => e.stopPropagation()}
          >
            {images.map((src, i) => (
              <button
                key={`${src}-${i}`}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`写真 ${i + 1}`}
                className={cn(
                  'relative shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition',
                  i === photoIndex ? 'border-primary' : 'border-transparent opacity-60',
                )}
              >
                <img src={src} alt="" className="w-full h-full object-cover" draggable={false} />
              </button>
            ))}
          </div>
        )}

        {/* ---- Badan kartu: bisa di-scroll, tidak memicu swipe ---- */}
        <div
          className="flex-1 overflow-y-auto overscroll-contain px-5 pt-4 pb-28"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <p className="text-[10px] text-muted-foreground tracking-[0.2em] mb-1">
            {product.brand}
          </p>
          <h2 className="font-serif text-2xl leading-snug mb-1">{product.name}</h2>
          <div className="flex items-baseline gap-2 mb-6">
            <span className="font-serif text-2xl">{formatPrice(product.price)}</span>
            {product.originalPrice && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>

          <h3 className="text-base font-medium mb-2">商品説明</h3>
          <p className="text-sm leading-relaxed text-foreground/80 mb-7">
            {product.description}
          </p>

          <h3 className="text-base font-medium mb-1">基本情報</h3>
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

        {/* ---- Tombol aksi, menempel di dasar kartu ---- */}
        {isFront && (
          <div
            className="absolute bottom-0 left-0 right-0 z-30 flex justify-center items-center gap-5 py-4 bg-gradient-to-t from-card via-card/95 to-transparent"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <Button
              size="icon"
              variant="outline"
              className="w-14 h-14 rounded-full border-red-500/50 bg-background/80 backdrop-blur hover:bg-red-500/20 hover:border-red-500 text-red-500"
              onClick={forceSwipeLeft}
              data-testid="button-skip"
              aria-label="パス"
            >
              <X className="w-7 h-7" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="w-12 h-12 rounded-full border-violet-500/50 bg-background/80 backdrop-blur hover:bg-violet-500/20 hover:border-violet-500 text-violet-500"
              onClick={forceSuperLike}
              data-testid="button-super"
              aria-label="スーパー"
            >
              <Star className="w-5 h-5 fill-current" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="w-14 h-14 rounded-full border-green-500/50 bg-background/80 backdrop-blur hover:bg-green-500/20 hover:border-green-500 text-green-500"
              onClick={forceSwipeRight}
              data-testid="button-buy"
              aria-label="買う"
            >
              <Heart className="w-7 h-7 fill-current" />
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
