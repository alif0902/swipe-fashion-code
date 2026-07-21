import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import SwipeFeed from '@/pages/feed';
import OrdersPage from '@/pages/orders';
import LookbookPage from '@/pages/lookbook';
import ProductPage from '@/pages/product';
import LandingPage from '@/pages/landing';
import { Route, Switch, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/welcome" component={LandingPage} />
      <Route path="/" component={SwipeFeed} />
      <Route path="/orders" component={OrdersPage} />
      <Route path="/lookbook" component={LookbookPage} />
      <Route path="/product/:id" component={ProductPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
