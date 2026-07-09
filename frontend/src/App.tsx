import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { CarrinhoProvider } from '@/contexts/CarrinhoContext';
import { RotaProtegida } from '@/components/RotaProtegida';
import { AdminLayout } from '@/components/layout/AdminLayout';

import { PaginaCardapio } from '@/pages/cliente/PaginaCardapio';
import { PaginaCheckout } from '@/pages/cliente/PaginaCheckout';
import { PaginaAcompanhamento } from '@/pages/cliente/PaginaAcompanhamento';
import { PaginaLoginAdmin } from '@/pages/admin/PaginaLoginAdmin';
import { PaginaPedidosAdmin } from '@/pages/admin/PaginaPedidosAdmin';
import { PaginaCardapioAdmin } from '@/pages/admin/PaginaCardapioAdmin';
import { PaginaProducaoAdmin } from '@/pages/admin/PaginaProducaoAdmin';
import { PaginaFinanceiroAdmin } from '@/pages/admin/PaginaFinanceiroAdmin';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CarrinhoProvider>
          <Routes>
            {/* Área do cliente */}
            <Route path="/" element={<PaginaCardapio />} />
            <Route path="/checkout" element={<PaginaCheckout />} />
            <Route path="/pedido/:id" element={<PaginaAcompanhamento />} />

            {/* Área admin */}
            <Route path="/admin/login" element={<PaginaLoginAdmin />} />
            <Route
              path="/admin/pedidos"
              element={
                <RotaProtegida>
                  <AdminLayout>
                    <PaginaPedidosAdmin />
                  </AdminLayout>
                </RotaProtegida>
              }
            />
            <Route
              path="/admin/cardapio"
              element={
                <RotaProtegida>
                  <AdminLayout>
                    <PaginaCardapioAdmin />
                  </AdminLayout>
                </RotaProtegida>
              }
            />
            <Route
              path="/admin/producao"
              element={
                <RotaProtegida>
                  <AdminLayout>
                    <PaginaProducaoAdmin />
                  </AdminLayout>
                </RotaProtegida>
              }
            />
            <Route
              path="/admin/financeiro"
              element={
                <RotaProtegida>
                  <AdminLayout>
                    <PaginaFinanceiroAdmin />
                  </AdminLayout>
                </RotaProtegida>
              }
            />
            <Route path="/admin" element={<Navigate to="/admin/pedidos" replace />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </CarrinhoProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
