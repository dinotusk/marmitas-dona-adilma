import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';

import authRoutes from './routes/auth';
import cardapioRoutes from './routes/cardapio';
import pedidosRoutes from './routes/pedidos';
import producaoRoutes from './routes/producao';
import financeiroRoutes from './routes/financeiro';
import clientesRoutes from './routes/clientes';
import cuponsRoutes from './routes/cupons';
import configuracaoRoutes from './routes/configuracao';
import equipeRoutes from './routes/equipe';
import assinaturasRoutes from './routes/assinaturas';
import { iniciarAgendadorAssinaturas } from './services/assinaturaScheduler';

const app = express();
const PORT = process.env.PORT || 3333;

// CSP desligada: o frontend carrega fontes do Google Fonts (fonts.googleapis.com/
// fonts.gstatic.com) e configurar uma política restritiva pra isso é um passo
// separado. As demais proteções do helmet (X-Frame-Options, X-Content-Type-Options
// etc.) continuam ativas.
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/cardapio', cardapioRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/producao', producaoRoutes);
app.use('/api/financeiro', financeiroRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/cupons', cuponsRoutes);
app.use('/api/configuracao', configuracaoRoutes);
app.use('/api/equipe', equipeRoutes);
app.use('/api/assinaturas', assinaturasRoutes);

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
  iniciarAgendadorAssinaturas();
});
