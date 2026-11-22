import { buildSystemPrompt } from './systemPrompt.js';
import { callAiModel } from './aiClient.js';
import { extractJsonFromText, validateAndSanitizeAnimation } from './validator.js';

const MAX_RETRIES = 2;

export async function generateAnimationWithAI({
  prompt,
  rig = 'R15',
  duration = 1.2,
  loop = false,
  temperature = 0.6,
}) {
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    const err = new Error('Descreva o movimento em texto antes de gerar.');
    err.statusCode = 400;
    throw err;
  }

  const normalizedRig = rig === 'R6' ? 'R6' : 'R15';
  const systemPrompt = buildSystemPrompt(normalizedRig);

  let userPrompt = `Movimento desejado: "${prompt.trim()}"
Rig: ${normalizedRig}
Duração alvo: ${Number(duration) || 1.2} segundos
Loop: ${Boolean(loop)}
Gere os keyframes completos em JSON válido.`;

  let lastError = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const rawText = await callAiModel({
        systemPrompt,
        userPrompt,
        temperature,
      });

      const parsed = extractJsonFromText(rawText);
      const animation = validateAndSanitizeAnimation(
        parsed,
        normalizedRig,
        duration,
        loop
      );

      return {
        animation,
        attempts: attempt + 1,
      };
    } catch (err) {
      lastError = err;
      // Se for erro de configuração ou autenticação (400/401/403), não adianta tentar de novo
      if (err.statusCode && err.statusCode >= 400 && err.statusCode < 500) {
        throw err;
      }

      userPrompt = `Sua resposta anterior falhou na validação (${err.message}).
Corrija e responda SOMENTE com JSON válido para o rig ${normalizedRig}, duração ${duration}s, movimento: "${prompt.trim()}".`;
    }
  }

  const finalErr = new Error(
    `Não foi possível gerar um JSON válido após ${MAX_RETRIES + 1} tentativas. Último erro: ${lastError?.message}`
  );
  finalErr.statusCode = 502;
  throw finalErr;
}

export async function generateVariationsWithAI({
  prompt,
  rig = 'R15',
  duration = 1.2,
  loop = false,
  count = 3,
}) {
  const safeCount = Math.max(1, Math.min(3, Number(count) || 3));
  const temperatures = [0.45, 0.65, 0.85].slice(0, safeCount);

  const results = await Promise.all(
    temperatures.map((temperature) =>
      generateAnimationWithAI({
        prompt,
        rig,
        duration,
        loop,
        temperature,
      })
    )
  );

  return results.map((r) => r.animation);
}
