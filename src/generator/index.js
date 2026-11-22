// Módulo generator (front-end): comunicação com o servidor para geração de animações.

export async function generateAnimation({ prompt, rig = 'R15', duration = 1.2, loop = false }) {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, rig, duration, loop }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.ok) {
    throw new Error(data.error || `Erro ao gerar animação (HTTP ${response.status}).`);
  }

  return data;
}
