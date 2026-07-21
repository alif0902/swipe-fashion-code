import { useState, useRef } from 'react';
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerFooter, 
  DrawerClose,
  DrawerDescription
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Product } from "@workspace/api-client-react";
import { useCreateOrder } from "@workspace/api-client-react";
import { useSession } from "@/hooks/use-session";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderSheetProps {
  product: Product | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function OrderSheet({ product, isOpen, onOpenChange, onSuccess }: OrderSheetProps) {
  const sessionId = useSession();
  const { toast } = useToast();
  const createOrder = useCreateOrder();
  
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  
  const mutateFnRef = useRef(createOrder.mutate);
  mutateFnRef.current = createOrder.mutate;

  // Reset selections when product changes
  if (product && isOpen && !selectedSize && product.sizes.length > 0) {
    setSelectedSize(product.sizes[0]);
  }
  if (product && isOpen && !selectedColor && product.colors.length > 0) {
    setSelectedColor(product.colors[0]);
  }

  const handleConfirm = () => {
    if (!product || !sessionId) return;
    if (!selectedSize && product.sizes.length > 0) {
      toast({ title: "Please select a size", variant: "destructive" });
      return;
    }
    if (!selectedColor && product.colors.length > 0) {
      toast({ title: "Please select a color", variant: "destructive" });
      return;
    }

    mutateFnRef.current({
      data: {
        sessionId,
        productId: product.id,
        selectedSize: selectedSize || 'N/A',
        selectedColor: selectedColor || 'N/A',
        quantity: 1
      }
    }, {
      onSuccess: () => {
        toast({
          title: "Added to Bag",
          description: `${product.name} is waiting for you.`,
        });
        onOpenChange(false);
        if (onSuccess) onSuccess();
        // Reset selections
        setTimeout(() => {
          setSelectedSize('');
          setSelectedColor('');
        }, 300);
      },
      onError: () => {
        toast({
          title: "Error adding to bag",
          description: "Please try again later.",
          variant: "destructive"
        });
      }
    });
  };

  if (!product) return null;

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-card border-t border-card-border rounded-t-3xl text-card-foreground">
        <DrawerHeader className="text-left pt-6 pb-2">
          <div className="flex gap-4 mb-4">
            <img 
              src={product.imageUrl} 
              alt={product.name} 
              className="w-20 h-24 object-cover rounded-md"
            />
            <div className="flex flex-col justify-center">
              <p className="text-xs text-muted-foreground uppercase tracking-widest">{product.brand}</p>
              <DrawerTitle className="text-xl mb-1">{product.name}</DrawerTitle>
              <p className="font-serif text-lg">${product.price.toFixed(2)}</p>
            </div>
          </div>
          <DrawerDescription className="sr-only">
            Select size and color for {product.name}
          </DrawerDescription>
        </DrawerHeader>

        <div className="p-4 space-y-6">
          {product.sizes.length > 0 && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Select Size</h4>
                <button className="text-xs underline text-muted-foreground hover:text-foreground">Size Guide</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={cn(
                      "w-12 h-12 rounded-full border border-border flex items-center justify-center text-sm font-medium transition-all",
                      selectedSize === size 
                        ? "bg-foreground text-background border-foreground scale-110" 
                        : "hover:border-foreground/50"
                    )}
                    data-testid={`size-${size}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.colors.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Select Color</h4>
              <div className="flex flex-wrap gap-3">
                {product.colors.map((color) => {
                  // Basic color mapping for visual display, fallback to CSS color name
                  const colorMap: Record<string, string> = {
                    'Black': '#000000',
                    'White': '#ffffff',
                    'Beige': '#f5f5dc',
                    'Navy': '#000080',
                    'Grey': '#808080',
                    'Red': '#ff0000',
                    'Blue': '#0000ff',
                    'Green': '#008000',
                    'Brown': '#a52a2a',
                    'Pink': '#ffc0cb',
                    'Yellow': '#ffff00',
                    'Purple': '#800080'
                  };
                  const hex = colorMap[color] || color.toLowerCase();
                  
                  return (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={cn(
                        "group relative w-10 h-10 rounded-full flex items-center justify-center transition-all",
                        selectedColor === color ? "ring-2 ring-foreground ring-offset-2 ring-offset-background scale-110" : ""
                      )}
                      title={color}
                      data-testid={`color-${color}`}
                    >
                      <span 
                        className="w-full h-full rounded-full border border-border" 
                        style={{ backgroundColor: hex }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <DrawerFooter className="pt-2 pb-8">
          <Button 
            className="w-full h-14 rounded-full text-lg font-medium" 
            onClick={handleConfirm}
            disabled={createOrder.isPending}
            data-testid="button-confirm-add"
          >
            {createOrder.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Add to Bag'}
          </Button>
          <DrawerClose asChild>
            <Button variant="ghost" className="w-full text-muted-foreground">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
