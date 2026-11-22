// Cliente para API compatível com OpenAI (NVIDIA NIM, OpenAI, etc.)

export function getAiConfig() {
  const baseUrl = (process.env.AI_BASE_URL || 'https://integrate.api.nvidia.com/v1').replace(/\/+$/, '');
  const apiKey = process.env.AI_API_KEY || '';
  const model = process.env.AI_MODEL || 'nvidia/nemotron-3.5-lightning-30b-a3b';

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
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000);

  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature,
        max_tokens: 4096,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      const timeoutErr = new Error('Tempo limite excedido (45s) ao aguardar resposta da IA.');
      timeoutErr.statusCode = 504;
      throw timeoutErr;
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

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
  const message = data?.choices?.[0]?.message;
  const content = message?.content || message?.reasoning_content;

  if (!content) {
    throw new Error('A API de IA não retornou conteúdo na resposta.');
  }

  return content;
}
