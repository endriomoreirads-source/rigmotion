import { buildSystemPrompt } from './systemPrompt.js';
import { callAiModel } from './aiClient.js';
import { extractJsonFromText, validateAndSanitizeAnimation } from './validator.js';

const MAX_RETRIES = 2;

export async function refineAnimationWithAI({
  previousAnimation,
  instruction,
  temperature = 0.5,
}) {
  if (!previousAnimation || !Array.isArray(previousAnimation.keyframes)) {
    const err = new Error('Nenhuma animação prévia fornecida para refinamento.');
    err.statusCode = 400;
    throw err;
  }

  if (!instruction || typeof instruction !== 'string' || !instruction.trim()) {
    const err = new Error('Descreva o que deseja ajustar (ex: "mais rápido", "braço mais alto").');
    err.statusCode = 400;
    throw err;
  }

  const rig = previousAnimation.rig === 'R6' ? 'R6' : 'R15';
  const systemPrompt = buildSystemPrompt(rig);

  let userPrompt = `Aqui está o JSON da animação atual:
${JSON.stringify(previousAnimation, null, 2)}

INSTRUÇÃO DE AJUSTE / REFINAMENTO:
"${instruction.trim()}"

Aplique esse ajuste mantendo a coerência da animação e dos eixos do rig ${rig}.
Responda SOMENTE com o novo JSON completo e válido da animação atualizada.`;

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
        rig,
        previousAnimation.duration,
        previousAnimation.loop
      );

      return {
        animation,
        attempts: attempt + 1,
      };
    } catch (err) {
      lastError = err;
      if (err.statusCode && err.statusCode >= 400 && err.statusCode < 500) {
        throw err;
      }
      userPrompt = `Sua tentativa falhou na validação (${err.message}).
Corrija e responda SOMENTE com o JSON válido atualizado para o rig ${rig}.`;
    }
  }

  const finalErr = new Error(
    `Não foi possível refinar a animação após ${MAX_RETRIES + 1} tentativas. Último erro: ${lastError?.message}`
  );
  finalErr.statusCode = 502;
  throw finalErr;
}
