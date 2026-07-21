'use client';

import { motion, useMotionValue, useTransform, useAnimation, PanInfo } from 'framer-motion';
import type { AppProduct } from '@/lib/format';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { X, Heart, Info } from 'lucide-react';
import Link from 'next/link';

interface ProductCardProps {
  product: AppProduct;
  onSwipeRight: (product: AppProduct) => void;
  onSwipeLeft: (product: AppProduct) => void;
  isFront: boolean;
}

export function ProductCard({ product, onSwipeRight, onSwipeLeft, isFront }: ProductCardProps) {
  const x = useMotionValue(0);
  const controls = useAnimation();
  const rotate = useTransform(x, [-200, 200], [-10, 10]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);
  const likeOpacity = useTransform(x, [0, 50, 100], [0, 0, 1]);
  const nopeOpacity = useTransform(x, [0, -50, -100], [0, 0, 1]);

  const swipeThreshold = 100;

  const handleDragEnd = async (e: any, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    if (offset > swipeThreshold || velocity > 500) {
      await controls.start({ x: 500, transition: { duration: 0.3 } });
      onSwipeRight(product);
    } else if (offset < -swipeThreshold || velocity < -500) {
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

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center p-4 pb-24"
      drag={isFront ? "x" : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={handleDragEnd}
      animate={controls}
      style={{
        x,
        rotate,
        opacity: isFront ? 1 : 0.8,
        scale: isFront ? 1 : 0.95,
        zIndex: isFront ? 10 : 0,
      }}
      whileTap={isFront ? { scale: 1.02 } : {}}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <div className="relative w-full h-[70vh] rounded-3xl overflow-hidden bg-card border border-card-border shadow-2xl flex flex-col">
        {/* Like/Nope Overlays */}
        <motion.div
          className="absolute top-10 left-10 z-20 border-4 border-green-500 rounded-lg px-4 py-2 rotate-[-15deg]"
          style={{ opacity: likeOpacity }}
        >
          <span className="text-green-500 font-black text-4xl tracking-widest uppercase">BUY</span>
        </motion.div>
        
        <motion.div
          className="absolute top-10 right-10 z-20 border-4 border-red-500 rounded-lg px-4 py-2 rotate-[15deg]"
          style={{ opacity: nopeOpacity }}
        >
          <span className="text-red-500 font-black text-4xl tracking-widest uppercase">PASS</span>
        </motion.div>

        {/* Image */}
        <div className="relative flex-1 w-full bg-muted">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover pointer-events-none"
            draggable={false}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/80 pointer-events-none" />
          
          <div className="absolute top-4 right-4 flex gap-2">
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
            <span className="text-2xl font-light font-serif">${product.price.toFixed(2)}</span>
            {product.originalPrice && (
              <span className="text-sm text-white/50 line-through">${product.originalPrice.toFixed(2)}</span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {isFront && (
        <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center gap-6 z-20">
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
