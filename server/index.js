import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { generateAnimationWithAI } from './generator/index.js';
import { getAiConfig } from './generator/aiClient.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Rota básica de verificação de saúde do servidor
app.get('/api/health', (_req, res) => {
  const { baseUrl, apiKey, model } = getAiConfig();
  res.json({
    ok: true,
    service: 'rigmotion-server',
    configured: Boolean(apiKey && apiKey !== 'coloque_sua_chave_aqui'),
    baseUrl,
    model,
  });
});

// Etapa 2: Rota para gerar animação a partir de texto usando IA
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, rig = 'R15', duration = 1.2, loop = false } = req.body || {};

    const result = await generateAnimationWithAI({
      prompt,
      rig,
      duration,
      loop,
    });

    res.json({
      ok: true,
      animation: result.animation,
      attempts: result.attempts,
    });
  } catch (err) {
    const status = err.statusCode || 500;
    console.error('[RigMotion /api/generate]', err.message);
    res.status(status).json({
      ok: false,
      error: err.message || 'Erro interno ao gerar animação.',
    });
  }
});

// TODO (Etapa 4): Rota POST /api/refine para refinar animações existentes
// TODO (Etapa 5): Rotas para salvar/listar animações locais em JSON

app.listen(PORT, () => {
  console.log(`[RigMotion Server] Rodando em http://localhost:${PORT}`);
});
