import { buildSystemPrompt } from './systemPrompt.js';
import { callAiModel } from './aiClient.js';
import { extractJsonFromText, validateAndSanitizeAnimation } from './validator.js';

const MAX_RETRIES = 2;

// Mescla um patch parcial de keyframes sobre a animação anterior
function applyCorrectionPatch(previousAnimation, patch) {
  if (!patch || typeof patch !== 'object') {
    throw new Error('Correção retornada em formato inválido.');
  }

  // Se o modelo devolveu a animação completa, usa direto
  if (Array.isArray(patch.keyframes) && patch.keyframes.length >= 2 && patch.name) {
    return patch;
  }

  // Se devolveu apenas um objeto de correções por índice de keyframe (ex: { "updates": [ { "index": 1, "joints": {...} } ] })
  const updated = JSON.parse(JSON.stringify(previousAnimation));

  if (typeof patch.duration === 'number' && patch.duration >= 0.2) {
    updated.duration = patch.duration;
  }

  if (Array.isArray(patch.updates)) {
    for (const item of patch.updates) {
      const idx = Number(item?.index);
      if (Number.isInteger(idx) && idx >= 0 && idx < updated.keyframes.length) {
        if (typeof item.time === 'number') updated.keyframes[idx].time = item.time;
        if (typeof item.easing === 'string') updated.keyframes[idx].easing = item.easing;
        if (item.joints && typeof item.joints === 'object') {
          updated.keyframes[idx].joints = {
            ...updated.keyframes[idx].joints,
            ...item.joints,
          };
        }
      }
    }
    return updated;
  }

  // Se devolveu apenas { "keyframes": [...] }
  if (Array.isArray(patch.keyframes) && patch.keyframes.length >= 2) {
    updated.keyframes = patch.keyframes;
    return updated;
  }

  throw new Error('A correção não contém "updates" nem "keyframes" válidos.');
}

export async function refineAnimationWithAI({
  previousAnimation,
  instruction,
  temperature = 0.45,
}) {
  if (!previousAnimation || !Array.isArray(previousAnimation.keyframes)) {
    const err = new Error('Nenhuma animação prévia fornecida para refinamento.');
    err.statusCode = 400;
    throw err;
  }

  if (!instruction || typeof instruction !== 'string' || !instruction.trim()) {
    const err = new Error('Descreva o problema que deseja corrigir (ex: "o braço gira demais").');
    err.statusCode = 400;
    throw err;
  }

  const rig = previousAnimation.rig === 'R6' ? 'R6' : 'R15';
  const systemPrompt = buildSystemPrompt(rig);

  let userPrompt = `ANIMAÇÃO ATUAL (JSON):
${JSON.stringify(previousAnimation, null, 2)}

PROBLEMA RELATADO / AJUSTE DESEJADO:
"${instruction.trim()}"

Devolva SOMENTE um JSON com a correção necessária no formato:
{
  "duration": ${previousAnimation.duration},
  "updates": [
    { "index": 0, "easing": "Linear", "joints": { "ArticulacaoAlterada": [rx, ry, rz] } }
  ]
}
Inclua em "updates" apenas os índices dos keyframes e articulações que precisam ser corrigidos.`;

  let lastError = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const rawText = await callAiModel({
        systemPrompt,
        userPrompt,
        temperature,
      });

      const parsedPatch = extractJsonFromText(rawText);
      const merged = applyCorrectionPatch(previousAnimation, parsedPatch);
      const animation = validateAndSanitizeAnimation(
        merged,
        rig,
        merged.duration,
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
      userPrompt = `Sua correção anterior falhou na validação (${err.message}).
Responda SOMENTE com JSON válido contendo "updates" para corrigir o problema "${instruction.trim()}" no rig ${rig}.`;
    }
  }

  const finalErr = new Error(
    `Não foi possível refinar a animação após ${MAX_RETRIES + 1} tentativas. Último erro: ${lastError?.message}`
  );
  finalErr.statusCode = 502;
  throw finalErr;
}
