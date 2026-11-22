// Funções de easing compatíveis com o estilo do Roblox (Enum.PoseEasingStyle / PoseEasingDirection)
// Suporta: Linear, Constant, Cubic, CubicIn, CubicOut, CubicInOut, Bounce, Elastic

function cubicIn(t) {
  return t * t * t;
}

function cubicOut(t) {
  const f = 1 - t;
  return 1 - f * f * f;
}

function cubicInOut(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function bounceOut(t) {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (t < 1 / d1) {
    return n1 * t * t;
  } else if (t < 2 / d1) {
    return n1 * (t -= 1.5 / d1) * t + 0.75;
  } else if (t < 2.5 / d1) {
    return n1 * (t -= 2.25 / d1) * t + 0.9375;
  } else {
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  }
}

function elasticOut(t) {
  if (t === 0 || t === 1) return t;
  const c4 = (2 * Math.PI) / 3;
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
}

export function applyRobloxEasing(t, easingName = 'Linear') {
  const clamped = Math.max(0, Math.min(1, t));
  const key = String(easingName || 'Linear').trim();

  switch (key) {
    case 'Constant':
      return clamped >= 1 ? 1 : 0;
    case 'CubicIn':
      return cubicIn(clamped);
    case 'CubicOut':
      return cubicOut(clamped);
    case 'Cubic':
    case 'CubicInOut':
      return cubicInOut(clamped);
    case 'Bounce':
    case 'BounceOut':
      return bounceOut(clamped);
    case 'Elastic':
    case 'ElasticOut':
      return elasticOut(clamped);
    case 'Linear':
    default:
      return clamped;
  }
}

// Avalia todas as articulações da animação em um instante t (segundos)
export function evaluateAnimationAtTime(animation, time) {
  if (!animation || !Array.isArray(animation.keyframes) || animation.keyframes.length === 0) {
    return {};
  }

  const keyframes = [...animation.keyframes].sort((a, b) => a.time - b.time);
  const clampedTime = Math.max(0, Math.min(animation.duration || 0, time));

  // Coleta todos os nomes de articulações presentes nos keyframes
  const jointNames = new Set();
  for (const kf of keyframes) {
    if (kf.joints) {
      for (const name of Object.keys(kf.joints)) {
        jointNames.add(name);
      }
    }
  }

  const result = {};

  for (const joint of jointNames) {
    // Filtra keyframes que definem esta articulação (ou assume [0,0,0] antes do primeiro)
    const framesWithJoint = keyframes.filter((kf) => kf.joints && kf.joints[joint]);
    if (framesWithJoint.length === 0) continue;

    if (clampedTime <= framesWithJoint[0].time) {
      result[joint] = [...framesWithJoint[0].joints[joint]];
      continue;
    }

    const last = framesWithJoint[framesWithJoint.length - 1];
    if (clampedTime >= last.time) {
      result[joint] = [...last.joints[joint]];
      continue;
    }

    // Encontra o par [prev, next] que envolve clampedTime
    let prev = framesWithJoint[0];
    let next = last;
    for (let i = 0; i < framesWithJoint.length - 1; i++) {
      if (clampedTime >= framesWithJoint[i].time && clampedTime <= framesWithJoint[i + 1].time) {
        prev = framesWithJoint[i];
        next = framesWithJoint[i + 1];
        break;
      }
    }

    const span = next.time - prev.time;
    const rawAlpha = span > 0 ? (clampedTime - prev.time) / span : 1;
    // No Roblox, o EasingStyle de um Pose controla a transição até ele (ou do anterior para ele)
    const alpha = applyRobloxEasing(rawAlpha, next.easing || prev.easing || 'Linear');

    const a = prev.joints[joint];
    const b = next.joints[joint];
    result[joint] = [
      a[0] + (b[0] - a[0]) * alpha,
      a[1] + (b[1] - a[1]) * alpha,
      a[2] + (b[2] - a[2]) * alpha,
    ];
  }

  return result;
}
