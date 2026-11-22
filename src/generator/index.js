// Módulo generator (front-end): comunicação com o servidor para geração em 2 etapas e refinamento.

export async function generateMotionPlan({
  prompt,
  rig = 'R15',
  duration = 1.2,
  loop = false,
}) {
  const response = await fetch('/api/plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, rig, duration, loop }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.ok) {
    throw new Error(data.error || `Erro ao planejar movimento (HTTP ${response.status}).`);
  }

  return data.plan;
}

export async function generateVariations({
  prompt,
  rig = 'R15',
  duration = 1.2,
  loop = false,
  plan = null,
  count = 3,
}) {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, rig, duration, loop, plan, count }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.ok) {
    throw new Error(data.error || `Erro ao gerar animação (HTTP ${response.status}).`);
  }

  return {
    plan: data.plan,
    variations: data.variations || [data.animation],
  };
}

export async function refineAnimation({ animation, instruction }) {
  const response = await fetch('/api/refine', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ animation, instruction }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.ok) {
    throw new Error(data.error || `Erro ao refinar animação (HTTP ${response.status}).`);
  }

  return data.animation;
}
