import { useState, useMemo } from 'react';
import { useListCategories, useListProducts } from '@workspace/api-client-react';
import { AppLayout } from '@/components/layout';
import { Link } from 'wouter';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export default function LookbookPage() {
  const { data: categories, isLoading: isCatsLoading } = useListCategories({
    query: { queryKey: ['/api/categories'] }
  });
  
  const [activeTab, setActiveTab] = useState<string | null>(null);

  const categoryQueryParam = useMemo(() => {
    if (!activeTab || activeTab === 'all') return undefined;
    return activeTab;
  }, [activeTab]);

  const { data: feedData, isLoading: isProductsLoading } = useListProducts(
    { category: categoryQueryParam, limit: 50 },
    { query: { queryKey: ['/api/products', { category: categoryQueryParam, limit: 50 }] } }
  );

  return (
    <AppLayout>
      <div className="min-h-[calc(100dvh-64px)] bg-background">
        <header className="px-6 pt-10 pb-6 sticky top-0 bg-background/90 backdrop-blur-xl z-20">
          <h1 className="font-serif text-4xl mb-4">Lookbook</h1>
          
          <div className="flex overflow-x-auto no-scrollbar gap-2 pb-2 -mx-6 px-6">
            <button
              onClick={() => setActiveTab('all')}
              className={cn(
                "px-5 py-2 rounded-full text-xs font-medium uppercase tracking-widest whitespace-nowrap transition-all border",
                (!activeTab || activeTab === 'all') 
                  ? "bg-foreground text-background border-foreground" 
                  : "bg-transparent text-muted-foreground border-border hover:border-foreground/50"
              )}
            >
              All
            </button>
            {isCatsLoading ? (
              [1, 2, 3].map(i => <Skeleton key={i} className="h-9 w-24 rounded-full shrink-0" />)
            ) : (
              categories?.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveTab(cat.slug)}
                  className={cn(
                    "px-5 py-2 rounded-full text-xs font-medium uppercase tracking-widest whitespace-nowrap transition-all border",
                    activeTab === cat.slug 
                      ? "bg-foreground text-background border-foreground" 
                      : "bg-transparent text-muted-foreground border-border hover:border-foreground/50"
                  )}
                >
                  {cat.name}
                </button>
              ))
            )}
          </div>
        </header>

        <div className="px-4 pb-8 pt-2">
          {isProductsLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="space-y-2">
                  <Skeleton className="aspect-[3/4] rounded-xl" />
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              ))}
            </div>
          ) : feedData?.products && feedData.products.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-3 gap-y-6">
              {feedData.products.map(product => (
                <Link key={product.id} href={`/product/${product.id}`} className="group cursor-pointer">
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-3 bg-muted">
                    <img 
                      src={product.imageUrl} 
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    {product.isNew && (
                      <div className="absolute top-2 right-2 bg-background text-foreground text-[9px] uppercase font-bold tracking-widest px-2 py-1 rounded-sm">
                        New
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">{product.brand}</p>
                  <h3 className="font-medium text-sm mb-1 leading-snug line-clamp-1">{product.name}</h3>
                  <p className="font-serif text-sm">${product.price.toFixed(2)}</p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-muted-foreground">
              <p>No products found in this category.</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
