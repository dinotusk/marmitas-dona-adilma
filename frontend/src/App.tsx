import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { CarrinhoProvider } from '@/contexts/CarrinhoContext';
import { ClienteAuthProvider } from '@/contexts/ClienteAuthContext';
import { RotaProtegida } from '@/components/RotaProtegida';
import { AdminLayout } from '@/components/layout/AdminLayout';

import { PaginaCardapio } from '@/pages/cliente/PaginaCardapio';
import { PaginaCheckout } from '@/pages/cliente/PaginaCheckout';
import { PaginaAcompanhamento } from '@/pages/cliente/PaginaAcompanhamento';
import { PaginaLoginCliente } from '@/pages/cliente/PaginaLoginCliente';
import { PaginaMeusPedidos } from '@/pages/cliente/PaginaMeusPedidos';
import { PaginaPlanos } from '@/pages/cliente/PaginaPlanos';
import { PaginaLoginAdmin } from '@/pages/admin/PaginaLoginAdmin';
import { PaginaPedidosAdmin } from '@/pages/admin/PaginaPedidosAdmin';
import { PaginaCardapioAdmin } from '@/pages/admin/PaginaCardapioAdmin';
import { PaginaProducaoAdmin } from '@/pages/admin/PaginaProducaoAdmin';
import { PaginaFinanceiroAdmin } from '@/pages/admin/PaginaFinanceiroAdmin';
import { PaginaPerfilAdmin } from '@/pages/admin/PaginaPerfilAdmin';
import { PaginaClientesAdmin } from '@/pages/admin/PaginaClientesAdmin';
import { PaginaNegocioAdmin } from '@/pages/admin/PaginaNegocioAdmin';
import { PaginaEquipeAdmin } from '@/pages/admin/PaginaEquipeAdmin';
import { PaginaAceitarConvite } from '@/pages/admin/PaginaAceitarConvite';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ClienteAuthProvider>
          <CarrinhoProvider>
            <Routes>
              {/* Área do cliente */}
              <Route path="/" element={<PaginaCardapio />} />
              <Route path="/checkout" element={<PaginaCheckout />} />
              <Route path="/pedido/:id" element={<PaginaAcompanhamento />} />
              <Route path="/login" element={<PaginaLoginCliente />} />
              <Route path="/meus-pedidos" element={<PaginaMeusPedidos />} />
              <Route path="/planos" element={<PaginaPlanos />} />

              {/* Área admin */}
              <Route path="/admin/login" element={<PaginaLoginAdmin />} />
              <Route path="/equipe/convite/:token" element={<PaginaAceitarConvite />} />
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
              <Route
                path="/admin/perfil"
                element={
                  <RotaProtegida>
                    <AdminLayout>
                      <PaginaPerfilAdmin />
                    </AdminLayout>
                  </RotaProtegida>
                }
              />
              <Route
                path="/admin/clientes"
                element={
                  <RotaProtegida>
                    <AdminLayout>
                      <PaginaClientesAdmin />
                    </AdminLayout>
                  </RotaProtegida>
                }
              />
              <Route
                path="/admin/negocio"
                element={
                  <RotaProtegida>
                    <AdminLayout>
                      <PaginaNegocioAdmin />
                    </AdminLayout>
                  </RotaProtegida>
                }
              />
              <Route
                path="/admin/equipe"
                element={
                  <RotaProtegida>
                    <AdminLayout>
                      <PaginaEquipeAdmin />
                    </AdminLayout>
                  </RotaProtegida>
                }
              />
              <Route path="/admin" element={<Navigate to="/admin/pedidos" replace />} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </CarrinhoProvider>
        </ClienteAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
