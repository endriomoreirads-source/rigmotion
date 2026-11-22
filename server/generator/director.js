import { callAiModel } from './aiClient.js';
import { extractJsonFromText } from './validator.js';

const MAX_RETRIES = 2;

function buildDirectorSystemPrompt(rigType, duration) {
  return `Você é o "Diretor de Movimento" de um estúdio de animação para Roblox (${rigType}).
Sua função NÃO é gerar ângulos nem keyframes ainda — sua função é planejar a biomecânica e o ritmo do movimento antes do Animador gerar o JSON.

REGRAS ESTRITAS:
1. Responda SOMENTE com JSON válido (sem markdown, crases ou texto fora do JSON).
2. A soma das durações das fases deve ser próxima de ${duration}s.
3. LEMBRETE OBRIGATÓRIO DE RITMO: O impacto deve ser rápido (curto) e a antecipação deve ser mais lenta para construir peso e leitura!
4. Inclua as 5 fases: "antecipacao", "aceleracao", "impacto", "follow_through", "recuperacao".

FORMATO OBRIGATÓRIO DO PLANO JSON:
{
  "resumo": "descrição curta do movimento",
  "duracao_total": ${duration},
  "transferencia_peso": "ex: do pé traseiro para o pé dianteiro",
  "direcao_golpe": "ex: diagonal de cima para baixo (direita para esquerda)",
  "lembrete_ritmo": "O impacto deve ser rápido e a antecipação mais lenta.",
  "fases": [
    {
      "nome": "antecipacao",
      "duracao": 0.35,
      "easing": "CubicOut",
      "acoes": {
        "tronco": "gira para trás/direita preparando o impulso",
        "quadril": "recua peso na perna direita",
        "ombros": "ombro direito ergue e recua, esquerdo em guarda",
        "cotovelos": "cotovelo direito flexiona, esquerdo protege o peito",
        "joelhos": "joelhos flexionados para baixar o centro de massa",
        "pes": "pés firmes no chão em base larga"
      }
    }
  ]
}`;
}

function validatePlan(rawPlan, targetDuration) {
  if (!rawPlan || typeof rawPlan !== 'object' || Array.isArray(rawPlan)) {
    throw new Error('O plano do Diretor de Movimento não é um objeto JSON válido.');
  }

  if (!Array.isArray(rawPlan.fases) || rawPlan.fases.length < 2) {
    throw new Error('O plano precisa conter a lista de fases do movimento.');
  }

  const sanitizedPhases = rawPlan.fases.map((fase, index) => {
    const dur = Math.max(0.05, Math.min(5.0, Number(fase?.duracao) || targetDuration / rawPlan.fases.length));
    const acoes = fase?.acoes && typeof fase.acoes === 'object' ? fase.acoes : {};
    return {
      nome: String(fase?.nome || `fase_${index + 1}`),
      duracao: Number(dur.toFixed(2)),
      easing: String(fase?.easing || 'Linear'),
      acoes: {
        tronco: String(acoes.tronco || 'estabiliza'),
        quadril: String(acoes.quadril || 'mantém base'),
        ombros: String(acoes.ombros || 'acompanha movimento'),
        cotovelos: String(acoes.cotovelos || 'flexão natural'),
        joelhos: String(acoes.joelhos || 'semiflexionados'),
        pes: String(acoes.pes || 'plantados no chão'),
      },
    };
  });

  return {
    resumo: String(rawPlan.resumo || 'Plano de movimento'),
    duracao_total: Number(targetDuration) || 1.2,
    transferencia_peso: String(rawPlan.transferencia_peso || 'equilibrada entre os pés'),
    direcao_golpe: String(rawPlan.direcao_golpe || 'frontal'),
    lembrete_ritmo: 'O impacto deve ser rápido e a antecipação mais lenta.',
    fases: sanitizedPhases,
  };
}

export async function generateMotionPlan({
  prompt,
  rig = 'R15',
  duration = 1.2,
  loop = false,
}) {
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    const err = new Error('Descreva o movimento em texto antes de planejar.');
    err.statusCode = 400;
    throw err;
  }

  const normalizedRig = rig === 'R6' ? 'R6' : 'R15';
  const targetDuration = Math.max(0.3, Math.min(5.0, Number(duration) || 1.2));
  const systemPrompt = buildDirectorSystemPrompt(normalizedRig, targetDuration);

  let userPrompt = `Movimento solicitado: "${prompt.trim()}"
Rig: ${normalizedRig}
Duração total alvo: ${targetDuration}s
Loop: ${Boolean(loop)}
Crie o plano biomecânico completo em JSON.`;

  let lastError = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const rawText = await callAiModel({
        systemPrompt,
        userPrompt,
        temperature: 0.4,
      });

      const parsed = extractJsonFromText(rawText);
      const plan = validatePlan(parsed, targetDuration);
      return { plan, attempts: attempt + 1 };
    } catch (err) {
      lastError = err;
      if (err.statusCode && err.statusCode >= 400 && err.statusCode < 500) {
        throw err;
      }
      userPrompt = `Sua resposta anterior falhou (${err.message}). Responda SOMENTE com o JSON válido do plano de movimento.`;
    }
  }

  const finalErr = new Error(
    `Não foi possível gerar o plano de movimento após ${MAX_RETRIES + 1} tentativas: ${lastError?.message}`
  );
  finalErr.statusCode = 502;
  throw finalErr;
}
