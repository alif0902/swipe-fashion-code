import { useState, useEffect } from 'react';
import { useListProducts, Product } from '@workspace/api-client-react';
import { AppLayout } from '@/components/layout';
import { ProductCard } from '@/components/product-card';
import { OrderSheet } from '@/components/order-sheet';
import { Loader2, PackageSearch } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SwipeFeed() {
  const { data: feedData, isLoading, isError } = useListProducts({ limit: 10 });
  const [products, setProducts] = useState<Product[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isOrderSheetOpen, setIsOrderSheetOpen] = useState(false);
  
  // Sync products when data loads
  useEffect(() => {
    if (feedData?.products) {
      setProducts(feedData.products);
      setCurrentIndex(0);
    }
  }, [feedData]);

  const handleSwipeRight = (product: Product) => {
    setSelectedProduct(product);
    setIsOrderSheetOpen(true);
    // Move to next product after a tiny delay to allow animation
    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
    }, 200);
  };

  const handleSwipeLeft = () => {
    // Just move to next product
    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
    }, 200);
  };

  const handleOrderSuccess = () => {
    // Already moved to next index on swipe
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)]">
          <Loader2 className="w-10 h-10 animate-spin text-muted-foreground mb-4" />
          <p className="text-muted-foreground font-serif text-lg animate-pulse">Curating your feed...</p>
        </div>
      </AppLayout>
    );
  }

  if (isError || !products) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] px-6 text-center">
          <p className="text-destructive font-serif text-xl mb-2">Failed to load collections.</p>
          <p className="text-muted-foreground text-sm">Please pull down to refresh or try again later.</p>
        </div>
      </AppLayout>
    );
  }

  const hasMoreProducts = currentIndex < products.length;

  return (
    <AppLayout>
      <div className="relative w-full h-[calc(100dvh-64px)] overflow-hidden bg-background">
        
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-6 z-30 flex justify-between items-center pointer-events-none">
          <h1 className="font-serif text-2xl font-bold tracking-tight">SWIPE<span className="text-muted-foreground font-normal italic">Fash</span></h1>
        </div>

        {/* Cards Container */}
        <div className="relative w-full h-full pt-16">
          <AnimatePresence>
            {hasMoreProducts ? (
              products.slice(currentIndex, currentIndex + 2).map((product, index) => (
                <ProductCard
                  key={`${product.id}-${currentIndex}`} // force re-mount if needed
                  product={product}
                  isFront={index === 0}
                  onSwipeRight={handleSwipeRight}
                  onSwipeLeft={handleSwipeLeft}
                />
              )).reverse() // Render next card first so front card is on top
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center pb-24"
              >
                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6">
                  <PackageSearch className="w-10 h-10 text-muted-foreground" />
                </div>
                <h2 className="font-serif text-3xl mb-3">You're all caught up.</h2>
                <p className="text-muted-foreground text-lg max-w-[250px]">
                  Check back later for new arrivals or browse the lookbook.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Order Sheet */}
        <OrderSheet 
          product={selectedProduct}
          isOpen={isOrderSheetOpen}
          onOpenChange={setIsOrderSheetOpen}
          onSuccess={handleOrderSuccess}
        />
      </div>
    </AppLayout>
  );
}
