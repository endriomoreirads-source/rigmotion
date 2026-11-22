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
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  return JSON.parse(cleaned);
}

// Evita saltos bruscos > 180 graus escolhendo o menor caminho angular entre keyframes consecutivos
function unwrapAndSmoothJumps(keyframes) {
  for (let i = 1; i < keyframes.length; i++) {
    const prevJoints = keyframes[i - 1].joints;
    const currJoints = keyframes[i].joints;

    for (const [jointName, rot] of Object.entries(currJoints)) {
      const prevRot = prevJoints[jointName];
      if (!prevRot) continue;

      const limits = JOINT_LIMITS[jointName] || {
        x: [-180, 180],
        y: [-180, 180],
        z: [-180, 180],
      };
      const axes = ['x', 'y', 'z'];

      for (let axis = 0; axis < 3; axis++) {
        let diff = rot[axis] - prevRot[axis];
        if (Math.abs(diff) > 180) {
          // Traz para o menor caminho angular (-180..180)
          while (diff > 180) diff -= 360;
          while (diff < -180) diff += 360;
          const candidate = prevRot[axis] + diff;
          const [minLim, maxLim] = limits[axes[axis]];
          rot[axis] = Number(clamp(candidate, minLim, maxLim).toFixed(2));
        }
      }
    }
  }
}

// Impede que os pés atravessem o chão compensando a inclinação dos tornozelos e limitando flexão extrema
function preventFloorPenetration(keyframes, rig) {
  if (rig !== 'R15') return;

  for (const kf of keyframes) {
    const j = kf.joints;
    if (j.LeftKnee) {
      const kneeBend = Math.max(0, j.LeftKnee[0]);
      const hipPitch = j.LeftHip ? j.LeftHip[0] : 0;
      if (kneeBend > 5) {
        const currentAnkle = j.LeftAnkle || [0, 0, 0];
        j.LeftAnkle = [
          Number(clamp(-kneeBend * 0.75 + hipPitch * 0.3, -45, 45).toFixed(2)),
          currentAnkle[1],
          currentAnkle[2],
        ];
      }
    }
    if (j.RightKnee) {
      const rKneeBend = Math.max(0, j.RightKnee[0]);
      const rHipPitch = j.RightHip ? j.RightHip[0] : 0;
      if (rKneeBend > 5) {
        const currentAnkle = j.RightAnkle || [0, 0, 0];
        j.RightAnkle = [
          Number(clamp(-rKneeBend * 0.75 + rHipPitch * 0.3, -45, 45).toFixed(2)),
          currentAnkle[1],
          currentAnkle[2],
        ];
      }
    }
  }
}

export function validateAndSanitizeAnimation(
  rawData,
  expectedRig = 'R15',
  requestedDuration = null,
  requestedLoop = null
) {
  if (!rawData || typeof rawData !== 'object' || Array.isArray(rawData)) {
    throw new Error('O JSON retornado não é um objeto válido.');
  }

  if (!Array.isArray(rawData.keyframes) || rawData.keyframes.length < 2) {
    throw new Error('A animação precisa ter pelo menos 2 keyframes válidos.');
  }

  const rig = expectedRig === 'R6' ? 'R6' : 'R15';
  const allowedJoints = new Set(getJointList(rig));

  const duration = Number(
    clamp(toFiniteNumber(requestedDuration ?? rawData.duration, 1.2), 0.2, 10.0).toFixed(2)
  );
  const fps = clamp(Math.round(toFiniteNumber(rawData.fps, 30)), 15, 60);
  const loop = typeof requestedLoop === 'boolean' ? requestedLoop : Boolean(rawData.loop);

  const rawName =
    typeof rawData.name === 'string' && rawData.name.trim() ? rawData.name.trim() : 'animacao_ia';
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
  sanitizedKeyframes[0].time = 0;

  // Correções automáticas pós-geração:
  // 1. Suaviza saltos bruscos > 180°
  unwrapAndSmoothJumps(sanitizedKeyframes);

  // 2. Evita pés atravessando o chão
  preventFloorPenetration(sanitizedKeyframes, rig);

  // 3. Se for loop, garante que a pose final retorne exatamente para a pose inicial
  if (loop) {
    const firstPose = JSON.parse(JSON.stringify(sanitizedKeyframes[0].joints));
    const lastKf = sanitizedKeyframes[sanitizedKeyframes.length - 1];
    if (Math.abs(lastKf.time - duration) < 0.05) {
      lastKf.time = duration;
      lastKf.joints = firstPose;
    } else {
      sanitizedKeyframes.push({
        time: duration,
        easing: 'CubicInOut',
        joints: firstPose,
      });
    }
  }

  return {
    name,
    rig,
    fps,
    duration,
    loop,
    keyframes: sanitizedKeyframes,
  };
}
