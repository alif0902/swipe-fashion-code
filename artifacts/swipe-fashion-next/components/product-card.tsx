'use client';

import { useState } from 'react';
import { motion, useMotionValue, useTransform, useAnimation, PanInfo } from 'framer-motion';
import { formatPrice, type AppProduct } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { X, Heart, Info, Star } from 'lucide-react';
import Link from 'next/link';

interface ProductCardProps {
  product: AppProduct;
  onSwipeRight: (product: AppProduct) => void;
  onSwipeLeft: (product: AppProduct) => void;
  onSuperLike: (product: AppProduct) => void;
  isFront: boolean;
}

export function ProductCard({ product, onSwipeRight, onSwipeLeft, onSuperLike, isFront }: ProductCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const controls = useAnimation();
  const rotate = useTransform(x, [-200, 200], [-10, 10]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);
  const likeOpacity = useTransform(x, [0, 50, 100], [0, 0, 1]);
  const nopeOpacity = useTransform(x, [0, -50, -100], [0, 0, 1]);
  const superOpacity = useTransform(y, [0, -50, -100], [0, 0, 1]);

  // Carousel foto: model + product-only, dst.
  const images = product.images.length > 0 ? product.images : [product.imageUrl];
  const [photoIndex, setPhotoIndex] = useState(0);
  const currentImage = images[photoIndex] ?? images[0];
  const nextPhoto = () => setPhotoIndex((i) => (i + 1) % images.length);
  const prevPhoto = () =>
    setPhotoIndex((i) => (i - 1 + images.length) % images.length);

  const swipeThreshold = 100;

  const handleDragEnd = async (e: any, info: PanInfo) => {
    const offset = info.offset;
    const velocity = info.velocity;

    // Swipe atas = Super Like (prioritas bila gerak vertikal lebih dominan).
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
      controls.start({ x: 0, y: 0, rotate: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } });
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

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center p-4 pb-24"
      drag={isFront}
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
      whileTap={isFront ? { scale: 1.02 } : {}}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <div className="relative w-full h-[70vh] rounded-3xl overflow-hidden bg-card border border-card-border shadow-2xl flex flex-col">
        {/* Like/Nope/Super Overlays */}
        <motion.div
          className="absolute top-10 left-10 z-20 border-4 border-green-500 rounded-lg px-4 py-2 rotate-[-15deg] pointer-events-none"
          style={{ opacity: likeOpacity }}
        >
          <span className="text-green-500 font-black text-4xl tracking-widest uppercase">買う</span>
        </motion.div>

        <motion.div
          className="absolute top-10 right-10 z-20 border-4 border-red-500 rounded-lg px-4 py-2 rotate-[15deg] pointer-events-none"
          style={{ opacity: nopeOpacity }}
        >
          <span className="text-red-500 font-black text-4xl tracking-widest uppercase">パス</span>
        </motion.div>

        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 border-4 border-violet-500 rounded-lg px-5 py-2 pointer-events-none"
          style={{ opacity: superOpacity }}
        >
          <span className="text-violet-500 font-black text-3xl tracking-widest uppercase flex items-center gap-2">
            <Star className="w-7 h-7 fill-current" /> スーパー
          </span>
        </motion.div>

        {/* Image + carousel */}
        <div className="relative flex-1 w-full bg-muted overflow-hidden">
          {/* Indikator titik per foto (ala Tinder) */}
          {images.length > 1 && (
            <div className="absolute top-2.5 left-3 right-3 z-30 flex gap-1.5 pointer-events-none">
              {images.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-colors",
                    i === photoIndex ? "bg-white" : "bg-white/40",
                  )}
                />
              ))}
            </div>
          )}

          <img
            src={currentImage}
            alt={product.name}
            className="w-full h-full object-cover pointer-events-none select-none"
            draggable={false}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/80 pointer-events-none" />

          {/* Tap kiri/kanan untuk ganti foto (tidak mengganggu drag swipe) */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                aria-label="前の写真"
                onClick={(e) => {
                  e.stopPropagation();
                  prevPhoto();
                }}
                className="absolute left-0 top-0 bottom-24 w-1/3 z-20"
                data-testid="button-photo-prev"
              />
              <button
                type="button"
                aria-label="次の写真"
                onClick={(e) => {
                  e.stopPropagation();
                  nextPhoto();
                }}
                className="absolute right-0 top-0 bottom-24 w-1/3 z-20"
                data-testid="button-photo-next"
              />
            </>
          )}

          <div className="absolute top-5 right-4 flex gap-2 z-30">
            {product.isNew && (
              <Badge variant="default" className="bg-white text-black hover:bg-white border-0 shadow-lg">NEW</Badge>
            )}
            {product.isSale && (
              <Badge variant="destructive" className="shadow-lg">SALE</Badge>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="absolute bottom-0 w-full p-6 text-white pointer-events-none flex flex-col justify-end">
          <p className="text-white/70 font-sans uppercase tracking-widest text-xs font-semibold mb-1">
            {product.brand}
          </p>
          <div className="flex justify-between items-end gap-4 mb-2">
            <h2 className="font-serif text-3xl leading-none flex-1 truncate">{product.name}</h2>
            <Link href={`/product/${product.id}`} className="pointer-events-auto">
              <Button size="icon" variant="secondary" className="rounded-full w-8 h-8 bg-white/20 hover:bg-white/40 text-white backdrop-blur-md border-0">
                <Info className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl font-light font-serif">{formatPrice(product.price)}</span>
            {product.originalPrice && (
              <span className="text-sm text-white/50 line-through">{formatPrice(product.originalPrice)}</span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {isFront && (
        <div className="absolute bottom-[calc(2rem+env(safe-area-inset-bottom))] left-0 right-0 flex justify-center items-center gap-5 z-20">
          <Button
            size="icon"
            variant="outline"
            className="w-16 h-16 rounded-full border-red-500/50 bg-background/50 backdrop-blur-md hover:bg-red-500/20 hover:border-red-500 transition-all text-red-500"
            onClick={forceSwipeLeft}
            data-testid="button-skip"
          >
            <X className="w-8 h-8" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="w-14 h-14 rounded-full border-violet-500/50 bg-background/50 backdrop-blur-md hover:bg-violet-500/20 hover:border-violet-500 transition-all text-violet-500"
            onClick={forceSuperLike}
            data-testid="button-super"
          >
            <Star className="w-6 h-6 fill-current" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="w-16 h-16 rounded-full border-green-500/50 bg-background/50 backdrop-blur-md hover:bg-green-500/20 hover:border-green-500 transition-all text-green-500"
            onClick={forceSwipeRight}
            data-testid="button-buy"
          >
            <Heart className="w-8 h-8 fill-current" />
          </Button>
        </div>
      )}
    </motion.div>
  );
}
