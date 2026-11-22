// Módulo generator (front-end): comunicação com o servidor para geração de animações.

export async function generateVariations({
  prompt,
  rig = 'R15',
  duration = 1.2,
  loop = false,
  count = 3,
}) {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, rig, duration, loop, count }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.ok) {
    throw new Error(data.error || `Erro ao gerar animação (HTTP ${response.status}).`);
  }

  return data.variations || [data.animation];
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
