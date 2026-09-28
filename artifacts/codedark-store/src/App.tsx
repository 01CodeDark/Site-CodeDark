import { Route, Router as WouterRouter, Switch } from 'wouter';
import { AuthProvider } from '@/lib/auth';
import Home from '@/pages/Home';
import Product from '@/pages/Product';
import Auth from '@/pages/Auth';
import Conta from '@/pages/Account';
import PaginaPedido from '@/pages/Order';
import Admin from '@/pages/Admin';
import NotFound from '@/pages/not-found';

const basePath = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');

export default function App() {
  return (
    <AuthProvider>
      <WouterRouter base={basePath}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/produto/:id" component={Product} />
          <Route path="/entrar" component={Auth} />
          <Route path="/conta" component={Conta} />
          <Route path="/pedido" component={PaginaPedido} />
          <Route path="/admin" component={Admin} />
          <Route component={NotFound} />
        </Switch>
      </WouterRouter>
    </AuthProvider>
  );
}
