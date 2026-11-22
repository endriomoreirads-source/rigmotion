import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Rota básica de verificação de saúde do servidor
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'rigmotion-server',
    configured: Boolean(process.env.AI_API_KEY && process.env.AI_API_KEY !== 'coloque_sua_chave_aqui'),
  });
});

// TODO (Etapa 2): Rota POST /api/generate para gerar animações via IA
// TODO (Etapa 4): Rota POST /api/refine para refinar animações existentes
// TODO (Etapa 5): Rotas para salvar/listar animações locais em JSON

app.listen(PORT, () => {
  console.log(`[RigMotion Server] Rodando em http://localhost:${PORT}`);
});
