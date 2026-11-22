import { JOINT_LIMITS, getJointList } from '../../src/rig/definitions.js';

const VALID_EASINGS = new Set([
  'Linear',
  'Constant',
  'CubicIn',
  'CubicOut',
  'CubicInOut',
  'Cubic',
  'Bounce',
  'Elastic',
]);

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function toFiniteNumber(val, fallback = 0) {
  const num = Number(val);
  return Number.isFinite(num) ? num : fallback;
}

export function extractJsonFromText(rawText) {
  if (typeof rawText !== 'string' || !rawText.trim()) {
    throw new Error('A IA retornou uma resposta vazia.');
  }

  let cleaned = rawText.trim();
  // Remove blocos markdown ```json ... ``` se o modelo ainda assim enviar
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }

  // Tenta localizar o primeiro '{' e o último '}'
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  return JSON.parse(cleaned);
}

export function validateAndSanitizeAnimation(rawData, expectedRig = 'R15', requestedDuration = null, requestedLoop = null) {
  if (!rawData || typeof rawData !== 'object' || Array.isArray(rawData)) {
    throw new Error('O JSON retornado não é um objeto válido.');
  }

  if (!Array.isArray(rawData.keyframes) || rawData.keyframes.length < 2) {
    throw new Error('A animação precisa ter pelo menos 2 keyframes válidos.');
  }

  const rig = expectedRig === 'R6' ? 'R6' : 'R15';
  const allowedJoints = new Set(getJointList(rig));

  const duration = clamp(
    toFiniteNumber(requestedDuration ?? rawData.duration, 1.2),
    0.2,
    10.0
  );

  const fps = clamp(Math.round(toFiniteNumber(rawData.fps, 30)), 15, 60);
  const loop = typeof requestedLoop === 'boolean' ? requestedLoop : Boolean(rawData.loop);

  const rawName = typeof rawData.name === 'string' && rawData.name.trim()
    ? rawData.name.trim()
    : 'animacao_ia';
  const name = rawName.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 48);

  const sanitizedKeyframes = [];

  for (const kf of rawData.keyframes) {
    if (!kf || typeof kf !== 'object' || !kf.joints || typeof kf.joints !== 'object') {
      continue;
    }

    const time = Number(clamp(toFiniteNumber(kf.time, 0), 0, duration).toFixed(3));
    const easing = VALID_EASINGS.has(kf.easing) ? kf.easing : 'Linear';
    const joints = {};

    for (const [jointName, rot] of Object.entries(kf.joints)) {
      if (!allowedJoints.has(jointName) || !Array.isArray(rot) || rot.length < 3) {
        continue;
      }

      const limits = JOINT_LIMITS[jointName] || {
        x: [-180, 180],
        y: [-180, 180],
        z: [-180, 180],
      };

      const rx = Number(clamp(toFiniteNumber(rot[0], 0), limits.x[0], limits.x[1]).toFixed(2));
      const ry = Number(clamp(toFiniteNumber(rot[1], 0), limits.y[0], limits.y[1]).toFixed(2));
      const rz = Number(clamp(toFiniteNumber(rot[2], 0), limits.z[0], limits.z[1]).toFixed(2));

      joints[jointName] = [rx, ry, rz];
    }

    if (Object.keys(joints).length > 0) {
      sanitizedKeyframes.push({ time, easing, joints });
    }
  }

  if (sanitizedKeyframes.length < 2) {
    throw new Error(`Nenhum keyframe válido encontrado para o rig ${rig}.`);
  }

  sanitizedKeyframes.sort((a, b) => a.time - b.time);

  // Garante que o primeiro keyframe comece em 0.0
  sanitizedKeyframes[0].time = 0;

  return {
    name,
    rig,
    fps,
    duration,
    loop,
    keyframes: sanitizedKeyframes,
  };
}
