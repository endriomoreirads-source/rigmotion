# RigMotion

Aplicativo web para gerar rascunhos de animações de Roblox (**R15** e **R6**) a partir de descrições em texto usando IA, visualizar em 3D no navegador e exportar para o Roblox Studio.

> **Nota:** O resultado gerado pela IA é um **rascunho** inicial. Você pode abrir a animação no **Animation Editor** do Roblox Studio para refinar e publicar.

## Stack

- **Front-end:** Vite + React + Three.js
- **Back-end:** Node.js + Express (proxy seguro para a API de IA e salvamento local em JSON)

## Estrutura de Módulos

- `src/rig/` — Definições dos rigs R15 (15 articulações) e R6 (6 articulações) e limites
- `src/preview/` — Cena Three.js, câmera orbital, boneco em blocos e player de keyframes
- `src/generator/` — Comunicação com o servidor de geração e refinamento
- `src/export/` — Exportação em JSON, plugin Luau para Roblox Studio e XML (`.rbxmx`)
- `src/ui/` — Componentes de interface do usuário
- `server/` — Servidor Express, prompt de sistema, validação de JSON e persistência local
- `animations/` — Animações salvas localmente em arquivos `.json`

## Configuração

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Copie `.env.example` para `.env` e preencha sua chave da API:
   ```bash
   cp .env.example .env
   ```
3. Inicie o ambiente de desenvolvimento (front-end + servidor):
   ```bash
   npm run dev
   ```
   - Front-end: `http://localhost:5173`
   - Servidor: `http://localhost:3001`
