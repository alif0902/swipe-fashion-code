import { useState } from 'react';
import { useGetProduct } from '@workspace/api-client-react';
import { getGetProductQueryKey } from '@workspace/api-client-react';
import { useParams, Link } from 'wouter';
import { AppLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Star, Loader2, Info } from 'lucide-react';
import { OrderSheet } from '@/components/order-sheet';

export default function ProductPage() {
  const params = useParams();
  const id = params.id ? parseInt(params.id, 10) : null;
  const [isOrderSheetOpen, setIsOrderSheetOpen] = useState(false);

  const { data: product, isLoading } = useGetProduct(
    id as number,
    { query: { enabled: !!id, queryKey: getGetProductQueryKey(id as number) } }
  );

  if (isLoading || !product) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground flex flex-col relative max-w-md mx-auto">
      {/* Absolute Back Button */}
      <Link href="/lookbook" className="absolute top-safe-8 left-4 z-50 rounded-full w-10 h-10 bg-background/50 backdrop-blur-md border-0 text-foreground flex items-center justify-center hover:bg-background/70 transition-colors">
        <ChevronLeft className="w-6 h-6" />
      </Link>

      <div className="flex-1 overflow-y-auto pb-28 no-scrollbar">
        {/* Header Image */}
        <div className="relative w-full h-[65vh] bg-muted">
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/0 to-transparent pointer-events-none" />
        </div>

        {/* Content */}
        <div className="px-6 -mt-12 relative z-10">
          <div className="bg-card border border-card-border p-6 rounded-3xl shadow-xl space-y-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">{product.brand}</p>
              <h1 className="font-serif text-3xl leading-tight mb-3">{product.name}</h1>
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-3">
                  <span className="font-serif text-2xl">${product.price.toFixed(2)}</span>
                  {product.originalPrice && (
                    <span className="text-muted-foreground line-through text-sm">
                      ${product.originalPrice.toFixed(2)}
                    </span>
                  )}
                </div>
                {product.rating && (
                  <div className="flex items-center gap-1 text-sm text-yellow-500">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="font-medium text-foreground">{product.rating}</span>
                    <span className="text-muted-foreground">({product.reviewCount})</span>
                  </div>
                )}
              </div>
            </div>

            <div className="h-px w-full bg-border" />

            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider">Details</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {product.description}
              </p>
            </div>

            <div className="pt-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted p-3 rounded-xl">
                <Info className="w-4 h-4 shrink-0" />
                <p>Free standard shipping on orders over $200. Free returns within 30 days.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-xl border-t border-border pb-safe">
        <div className="max-w-md mx-auto p-4 flex gap-4">
          <Button 
            className="flex-1 h-14 rounded-full text-lg font-medium"
            onClick={() => setIsOrderSheetOpen(true)}
            data-testid="button-open-order-sheet"
          >
            Add to Bag
          </Button>
        </div>
      </div>

      <OrderSheet 
        product={product} 
        isOpen={isOrderSheetOpen} 
        onOpenChange={setIsOrderSheetOpen} 
      />
    </div>
  );
}
