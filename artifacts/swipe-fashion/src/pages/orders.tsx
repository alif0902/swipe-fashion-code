import { useState, useRef, useEffect } from 'react';
import { useListOrders, useConfirmOrder, useCancelOrder, Order } from '@workspace/api-client-react';
import { useSession } from '@/hooks/use-session';
import { AppLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Package, ChevronRight, ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { getListOrdersQueryKey } from '@workspace/api-client-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

function CheckoutDrawer({ order, isOpen, onOpenChange }: { order: Order | null, isOpen: boolean, onOpenChange: (o: boolean) => void }) {
  const { toast } = useToast();
  const confirmOrder = useConfirmOrder();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    payment: 'Credit Card'
  });

  const mutateRef = useRef(confirmOrder.mutate);
  mutateRef.current = confirmOrder.mutate;

  const handleCheckout = () => {
    if (!order) return;
    if (!formData.name || !formData.email || !formData.address) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }

    mutateRef.current(
      {
        id: order.id,
        data: {
          customerName: formData.name,
          customerEmail: formData.email,
          shippingAddress: formData.address,
          paymentMethod: formData.payment
        }
      },
      {
        onSuccess: () => {
          toast({ title: "Order Confirmed", description: "Your item will be shipped soon." });
          queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey({ session_id: order.sessionId }) });
          onOpenChange(false);
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to confirm order.", variant: "destructive" });
        }
      }
    );
  };

  if (!order) return null;

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-card">
        <DrawerHeader className="text-left">
          <DrawerTitle className="text-2xl font-serif mb-2">Checkout</DrawerTitle>
          <div className="flex items-center gap-4 py-4 border-b border-border">
            <img src={order.product.imageUrl} alt={order.product.name} className="w-16 h-16 object-cover rounded-md" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground uppercase">{order.product.brand}</p>
              <p className="font-medium truncate">{order.product.name}</p>
              <p className="text-sm text-muted-foreground">
                {order.selectedSize} | {order.selectedColor} | Qty: {order.quantity}
              </p>
            </div>
            <p className="font-serif text-lg">${order.totalPrice.toFixed(2)}</p>
          </div>
        </DrawerHeader>
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input 
              value={formData.name} 
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="Jane Doe"
              className="bg-background border-border"
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input 
              type="email"
              value={formData.email} 
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              placeholder="jane@example.com"
              className="bg-background border-border"
            />
          </div>
          <div className="space-y-2">
            <Label>Shipping Address</Label>
            <Input 
              value={formData.address} 
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              placeholder="123 Fashion Ave, NY"
              className="bg-background border-border"
            />
          </div>
        </div>
        <DrawerFooter className="pt-2 pb-8">
          <Button 
            className="w-full h-14 rounded-full text-lg"
            onClick={handleCheckout}
            disabled={confirmOrder.isPending}
            data-testid="button-confirm-checkout"
          >
            {confirmOrder.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : `Pay $${order.totalPrice.toFixed(2)}`}
          </Button>
          <DrawerClose asChild>
            <Button variant="ghost" className="w-full">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

export default function OrdersPage() {
  const sessionId = useSession();
  const { data: orders, isLoading } = useListOrders(
    { session_id: sessionId || undefined },
    { query: { enabled: !!sessionId, queryKey: getListOrdersQueryKey({ session_id: sessionId || '' }) } }
  );
  const cancelOrder = useCancelOrder();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [checkoutOrder, setCheckoutOrder] = useState<Order | null>(null);

  const handleCancel = (id: number) => {
    cancelOrder.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Order Cancelled" });
        queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey({ session_id: sessionId || '' }) });
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20';
      case 'confirmed': return 'bg-green-500/10 text-green-500 hover:bg-green-500/20';
      case 'cancelled': return 'bg-red-500/10 text-red-500 hover:bg-red-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading || !sessionId) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-[calc(100vh-80px)]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  const hasOrders = orders && orders.length > 0;

  return (
    <AppLayout>
      <div className="min-h-[calc(100dvh-64px)] bg-background pb-8">
        <header className="px-6 py-8">
          <h1 className="font-serif text-3xl mb-2">Your Bag</h1>
          <p className="text-muted-foreground text-sm">Review your curated selections.</p>
        </header>

        {!hasOrders ? (
          <div className="flex flex-col items-center justify-center px-6 mt-20 text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
              <Package className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="font-serif text-2xl mb-3">Your bag is empty.</h2>
            <p className="text-muted-foreground mb-8">Ready to find your next look?</p>
            <Link href="/" className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full h-12 px-8">
              Start Swiping
            </Link>
          </div>
        ) : (
          <div className="px-4 space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-card rounded-2xl p-4 border border-card-border">
                <div className="flex gap-4">
                  <div className="w-24 h-32 bg-muted rounded-xl overflow-hidden shrink-0">
                    <img src={order.product.imageUrl} alt={order.product.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col flex-1 py-1">
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{order.product.brand}</p>
                        <h3 className="font-medium text-sm leading-tight mt-1 line-clamp-2">{order.product.name}</h3>
                      </div>
                      <Badge variant="outline" className={`border-0 uppercase tracking-widest text-[9px] px-2 py-0.5 rounded-sm ${getStatusColor(order.status)}`}>
                        {order.status}
                      </Badge>
                    </div>
                    
                    <div className="text-xs text-muted-foreground mt-2 space-y-1">
                      <p>Size: {order.selectedSize}</p>
                      <p>Color: {order.selectedColor}</p>
                      <p>Qty: {order.quantity}</p>
                    </div>

                    <div className="mt-auto flex items-end justify-between">
                      <p className="font-serif text-lg">${order.totalPrice.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {order.status === 'pending' && (
                  <div className="mt-4 flex gap-2 pt-4 border-t border-border">
                    <Button 
                      variant="ghost" 
                      className="flex-1 text-muted-foreground hover:text-destructive transition-colors"
                      onClick={() => handleCancel(order.id)}
                      disabled={cancelOrder.isPending}
                      data-testid={`button-cancel-order-${order.id}`}
                    >
                      Remove
                    </Button>
                    <Button 
                      className="flex-1"
                      onClick={() => setCheckoutOrder(order)}
                      data-testid={`button-checkout-order-${order.id}`}
                    >
                      Checkout
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <CheckoutDrawer 
        order={checkoutOrder} 
        isOpen={!!checkoutOrder} 
        onOpenChange={(open) => !open && setCheckoutOrder(null)} 
      />
    </AppLayout>
  );
}
