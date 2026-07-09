import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';

import authRoutes from './routes/auth';
import cardapioRoutes from './routes/cardapio';
import pedidosRoutes from './routes/pedidos';
import producaoRoutes from './routes/producao';
import financeiroRoutes from './routes/financeiro';

const app = express();
const PORT = process.env.PORT || 3333;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/cardapio', cardapioRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/producao', producaoRoutes);
app.use('/api/financeiro', financeiroRoutes);

// Serve o build do frontend (SPA) na mesma origem da API, evitando CORS
// e configuração de URL separada em produção.
const frontendDist = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));
app.get(/^\/(?!api\/).*/, (_req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

// Tratamento genérico de erros
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ erro: 'Erro interno do servidor' });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
