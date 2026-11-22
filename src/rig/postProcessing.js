import { JOINT_LIMITS } from './definitions.js';

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

// Limita ângulo dentro do range definido
function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

// Suavização exponencial simples entre rotações consecutivas para evitar "saltos" angulares
export function smoothAnimationKeyframes(keyframes, factor = 0.25) {
  if (!Array.isArray(keyframes) || keyframes.length <= 2) {
    return keyframes;
  }

  const smoothed = JSON.parse(JSON.stringify(keyframes));

  // Aplica média ponderada temporal nos frames intermediários
  for (let i = 1; i < smoothed.length - 1; i++) {
    const prev = smoothed[i - 1].joints;
    const curr = smoothed[i].joints;
    const next = smoothed[i + 1].joints;

    if (!curr) continue;

    for (const joint of Object.keys(curr)) {
      if (prev && prev[joint] && next && next[joint]) {
        for (let axis = 0; axis < 3; axis++) {
          const neighborAvg = (prev[joint][axis] + next[joint][axis]) / 2;
          // Interpola o valor atual na direção da média dos vizinhos para remover ruído
          curr[joint][axis] = curr[joint][axis] * (1 - factor) + neighborAvg * factor;
        }
      }
    }
  }

  return smoothed;
}

// Correção de cinemática de pernas e pés (Foot Grounding / Plantar os pés):
// Quando os joelhos dobram (ex.: agachamento de combate), a perna "encurta".
// Se o Root continuar estático na mesma altura, os pés ou o corpo ficam desconectados.
// Calculamos a queda aproximada da pelve e ajustamos a rotação dos tornozelos para manter a sola alinhada ao chão.
export function applyFootGrounding(jointsPose, rigType = 'R15') {
  if (!jointsPose || typeof jointsPose !== 'object') return jointsPose;
  const pose = { ...jointsPose };

  if (rigType === 'R15') {
    // Left leg
    const leftHipRot = pose.LeftHip || [0, 0, 0];
    const leftKneeRot = pose.LeftKnee || [0, 0, 0];
    // Se o joelho está flexionado para trás (+X), o tornozelo deve compensar para a sola ficar horizontal
    const kneeBend = Math.max(0, leftKneeRot[0]);
    const hipPitch = leftHipRot[0];

    // O tornozelo compensa a soma dos ângulos da perna
    if (kneeBend > 5) {
      const currentAnkle = pose.LeftAnkle || [0, 0, 0];
      const targetPitch = clamp(-kneeBend + hipPitch * 0.4, -45, 45);
      pose.LeftAnkle = [targetPitch, currentAnkle[1], currentAnkle[2]];
    }

    // Right leg
    const rightHipRot = pose.RightHip || [0, 0, 0];
    const rightKneeRot = pose.RightKnee || [0, 0, 0];
    const rKneeBend = Math.max(0, rightKneeRot[0]);
    const rHipPitch = rightHipRot[0];

    if (rKneeBend > 5) {
      const currentAnkle = pose.RightAnkle || [0, 0, 0];
      const targetPitch = clamp(-rKneeBend + rHipPitch * 0.4, -45, 45);
      pose.RightAnkle = [targetPitch, currentAnkle[1], currentAnkle[2]];
    }
  }

  return pose;
}

// Aplica sanitização completa e refinamento de qualidade em uma animação inteira
export function enhanceAnimationQuality(animation) {
  if (!animation || !Array.isArray(animation.keyframes)) {
    return animation;
  }

  // 1. Suaviza os keyframes contra ruídos bruscos
  const smoothedKeyframes = smoothAnimationKeyframes(animation.keyframes, 0.2);

  // 2. Aplica grounding nos keyframes
  for (const kf of smoothedKeyframes) {
    if (kf.joints) {
      kf.joints = applyFootGrounding(kf.joints, animation.rig);
    }
  }

  return {
    ...animation,
    keyframes: smoothedKeyframes,
  };
}
