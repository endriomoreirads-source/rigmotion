// Cliente para API compatível com OpenAI (NVIDIA NIM, OpenAI, etc.)

export function getAiConfig() {
  const baseUrl = (process.env.AI_BASE_URL || 'https://integrate.api.nvidia.com/v1').replace(/\/+$/, '');
  const apiKey = process.env.AI_API_KEY || '';
  const model = process.env.AI_MODEL || 'mistralai/mistral-large-4-1t-a52b';

  return { baseUrl, apiKey, model };
}

export async function callAiModel({ systemPrompt, userPrompt, temperature = 0.6 }) {
  const { baseUrl, apiKey, model } = getAiConfig();

  if (!apiKey || apiKey === 'coloque_sua_chave_aqui') {
    const err = new Error(
      'Chave da API não configurada. Defina AI_API_KEY no arquivo .env na raiz do projeto e reinicie o servidor.'
    );
    err.statusCode = 400;
    throw err;
  }

  const endpoint = `${baseUrl}/chat/completions`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature,
      max_tokens: 2048,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const bodyText = await response.text().catch(() => '');
    let detail = bodyText.slice(0, 300);
    try {
      const parsed = JSON.parse(bodyText);
      detail = parsed?.error?.message || parsed?.detail || detail;
    } catch {
      // mantém texto bruto
    }

    const err = new Error(`Erro na API de IA (${response.status}): ${detail || response.statusText}`);
    err.statusCode = response.status >= 500 ? 502 : response.status;
    throw err;
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('A API de IA não retornou conteúdo na resposta.');
  }

  return content;
}
