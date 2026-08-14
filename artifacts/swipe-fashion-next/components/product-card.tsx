'use client';

import { useRef, useState } from 'react';
import {
  motion,
  useMotionValue,
  useTransform,
  useAnimation,
  useDragControls,
  useScroll,
  type PanInfo,
} from 'framer-motion';
import { categoryLabel, formatPrice, type AppProduct } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ReviewSheet } from '@/components/review-sheet';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ShoppingBag, ThumbsUp, X } from 'lucide-react';

export const FEED_BACKDROP =
  'bg-gradient-to-b from-sky-200 via-purple-200 to-pink-400';

interface ProductCardProps {
  product: AppProduct;
  onSwipeRight: (product: AppProduct) => void;
  onSwipeLeft: (product: AppProduct) => void;
  onSuperLike: (product: AppProduct) => void;
  isFront: boolean;
}

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
  const likeScale = useTransform(x, [0, 50, 100], [0.7, 0.8, 1]);
  const nopeScale = useTransform(x, [0, -50, -100], [0.7, 0.8, 1]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ container: scrollRef });

  const photoOpacity = useTransform(scrollYProgress, [0, 0.35], [1, 0.35]);
  const photoScale = useTransform(scrollYProgress, [0, 0.35], [1, 0.94]);

  const dragControls = useDragControls();

  const gesture = useRef<{ x: number; y: number; decided: boolean } | null>(
    null,
  );

  const onPhotoPointerDown = (e: React.PointerEvent) => {
    if (!isFront) return;
    gesture.current = { x: e.clientX, y: e.clientY, decided: false };
  };

  const onPhotoPointerMove = (e: React.PointerEvent) => {
    const g = gesture.current;
    if (!g || g.decided) return;

    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;

    g.decided = true;
    if (Math.abs(dx) > Math.abs(dy)) dragControls.start(e);
  };

  const onPhotoPointerEnd = () => {
    gesture.current = null;
  };

  const images = product.images.length > 0 ? product.images : [product.imageUrl];
  const [photoIndex, setPhotoIndex] = useState(0);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const currentImage = images[photoIndex] ?? images[0];

  const goTo = (i: number) =>
    setPhotoIndex(((i % images.length) + images.length) % images.length);

  const swipeThreshold = 100;

  const handleDragEnd = async (_e: unknown, info: PanInfo) => {
    const { offset, velocity } = info;

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

  const forceSuperLike = async () => {
    await controls.start({
      scale: 0.88,
      opacity: 0,
      transition: { duration: 0.2, ease: "easeIn" },
    });
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
      <div className="relative w-full h-full flex flex-col">
        <div className="absolute top-1/2 -translate-y-1/2 right-6 z-40 pointer-events-none">
          <motion.div
            className="flex flex-col items-center gap-2"
            style={{ opacity: likeOpacity, scale: likeScale }}
          >
            <span className="w-16 h-16 rounded-full bg-white/85 backdrop-blur-md border border-white/70 shadow-lg flex items-center justify-center">
              <ShoppingBag className="w-7 h-7 text-primary" />
            </span>
            <span className="px-3 py-1 rounded-full bg-white/85 backdrop-blur-md text-primary text-xs font-bold shadow-sm">
              購入へ
            </span>
          </motion.div>
        </div>
        <div className="absolute top-1/2 -translate-y-1/2 left-6 z-40 pointer-events-none">
          <motion.div
            className="flex flex-col items-center gap-2"
            style={{ opacity: nopeOpacity, scale: nopeScale }}
          >
            <span className="w-16 h-16 rounded-full bg-white/85 backdrop-blur-md border border-white/70 shadow-lg flex items-center justify-center">
              <X className="w-7 h-7 text-muted-foreground" />
            </span>
            <span className="px-3 py-1 rounded-full bg-white/85 backdrop-blur-md text-muted-foreground text-xs font-bold shadow-sm">
              見送る
            </span>
          </motion.div>
        </div>
        <div
          ref={scrollRef}
          className="h-full overflow-y-auto overflow-x-hidden overscroll-none scrollbar-none"
        >
        <motion.div
          className="relative shrink-0 touch-pan-y"
          style={{ opacity: photoOpacity, scale: photoScale }}
          onPointerDown={onPhotoPointerDown}
          onPointerMove={onPhotoPointerMove}
          onPointerUp={onPhotoPointerEnd}
          onPointerCancel={onPhotoPointerEnd}
        >
          <div className="relative mx-6 aspect-[3/4] rounded-[1.75rem] overflow-hidden bg-muted shadow-lg">
            <Image
              src={currentImage}
              alt={product.name}
              fill
              sizes="(max-width: 448px) 100vw, 448px"
              priority
              className="object-cover select-none"
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

          {images.length > 1 && (
            <>
              <button
                type="button"
                aria-label="前の写真"
                data-testid="button-photo-prev"
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
        </motion.div>

        {(product.feel || product.material) && (
          <div className="relative z-10 mt-2 flex justify-center pointer-events-none">
            <div className="relative bg-pink-50/95 rounded-full px-7 py-2.5 shadow-sm max-w-[88%]">
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-pink-50/95 rotate-45" />
              <span className="block text-sm text-foreground/80 text-center leading-snug">
                {product.feel ?? product.material}
              </span>
            </div>
          </div>
        )}

        {images.length > 1 && (
          <div
            className="shrink-0 flex justify-center gap-4 px-6 py-3.5 overflow-x-auto"
            onPointerDown={(e) => e.stopPropagation()}
          >
            {images.map((src, i) => (
              <button
                key={`${src}-${i}`}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`写真 ${i + 1}`}
                className={cn(
                  'relative shrink-0 w-14 h-14 rounded-xl overflow-hidden transition',
                  i === photoIndex
                    ? 'ring-2 ring-white shadow-md'
                    : 'opacity-85',
                )}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="56px"
                  className="object-cover"
                  draggable={false}
                />
              </button>
            ))}
          </div>
        )}

        <div
          className="relative min-h-full bg-card rounded-t-[2rem] px-6 pt-7 pb-[calc(var(--nav-clearance)+5rem)]"
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
            <button
              type="button"
              onClick={() => setIsReviewOpen(true)}
              data-testid="button-open-reviews"
              className="w-full flex items-start gap-4 py-3 border-b border-border/60 text-left group"
            >
              <span className="w-28 shrink-0 text-sm text-muted-foreground">
                評価
              </span>
              <span className="flex-1 text-sm text-primary inline-flex items-center gap-1.5">
                {product.rating !== null
                  ? `${product.rating.toFixed(1)}（${product.reviewCount}件）`
                  : "レビューはまだありません"}
                <ChevronRight className="w-3.5 h-3.5 opacity-50 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </button>
            <InfoRow
              label="在庫"
              value={product.stock > 0 ? `残り${product.stock}点` : '在庫切れ'}
            />
          </div>
        </div>
        </div>

        {isFront && (
          <div
            className="absolute bottom-[var(--nav-clearance)] left-4 right-4 z-30 flex justify-center"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <Button
              className="relative w-full max-w-[260px] h-12 rounded-full bg-primary text-primary-foreground text-base font-bold shadow-lg shadow-primary/30 hover:bg-primary/90 transition"
              onClick={forceSuperLike}
              data-testid="button-like"
              aria-label="一目惚れに保存"
            >
              <span className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center">
                <ThumbsUp className="w-5 h-5 fill-current" />
              </span>
              いいね！
            </Button>
          </div>
        )}
      </div>

      <ReviewSheet
        productId={product.id}
        productName={product.name}
        rating={product.rating}
        reviewCount={product.reviewCount}
        isOpen={isReviewOpen}
        onOpenChange={setIsReviewOpen}
      />
    </motion.div>
  );
}
