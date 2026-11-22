import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EXAMPLES_DIR = path.resolve(__dirname, '../../exemplos');

function loadExampleFile(filename) {
  try {
    const filePath = path.join(EXAMPLES_DIR, filename);
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function selectFewShotExamples(promptText = '') {
  const lower = String(promptText).toLowerCase();
  const chosen = [];

  if (lower.includes('idle') || lower.includes('respir') || lower.includes('parado')) {
    const ex = loadExampleFile('idle.json');
    if (ex) chosen.push(ex);
  }
  if (lower.includes('escudo') || lower.includes('bloq') || lower.includes('defes') || lower.includes('parry')) {
    const ex = loadExampleFile('bloqueio_escudo.json');
    if (ex) chosen.push(ex);
  }
  if (chosen.length < 2) {
    const golpe = loadExampleFile('golpe_simples.json');
    if (golpe && !chosen.some((c) => c.name === golpe.name)) {
      chosen.push(golpe);
    }
  }
  if (chosen.length === 1) {
    const idle = loadExampleFile('idle.json');
    if (idle && !chosen.some((c) => c.name === idle.name)) {
      chosen.push(idle);
    }
  }

  return chosen.slice(0, 2);
}

const R15_PROMPT_INFO = `
RIG R15 (15 articulações Motor6D):
- Root (quadril/centro do corpo): X=[-60,60], Y=[-180,180], Z=[-60,60]
- Waist (cintura/tronco superior): X=[-45,55], Y=[-60,60], Z=[-35,35]
- Neck (pescoço/cabeça): X=[-45,45], Y=[-70,70], Z=[-30,30]
- LeftShoulder: X=[-175,175], Y=[-90,90], Z=[-175,45]
- LeftElbow: X=[-145,10], Y=[-30,30], Z=[-20,20] (valores negativos dobram o cotovelo para frente)
- LeftWrist: X=[-70,70], Y=[-45,45], Z=[-45,45]
- RightShoulder: X=[-175,175], Y=[-90,90], Z=[-45,175]
- RightElbow: X=[-145,10], Y=[-30,30], Z=[-20,20] (valores negativos dobram o cotovelo para frente)
- RightWrist: X=[-70,70], Y=[-45,45], Z=[-45,45]
- LeftHip: X=[-120,80], Y=[-45,45], Z=[-60,30]
- LeftKnee: X=[-10,145], Y=[-15,15], Z=[-10,10] (valores positivos dobram o joelho para trás)
- LeftAnkle: X=[-50,50], Y=[-25,25], Z=[-25,25]
- RightHip: X=[-120,80], Y=[-45,45], Z=[-30,60]
- RightKnee: X=[-10,145], Y=[-15,15], Z=[-10,10] (valores positivos dobram o joelho para trás)
- RightAnkle: X=[-50,50], Y=[-25,25], Z=[-25,25]
`.trim();

const R6_PROMPT_INFO = `
RIG R6 (6 articulações Motor6D — atenção aos espaços nos nomes):
- RootJoint (centro do torso): X=[-60,60], Y=[-180,180], Z=[-60,60]
- Neck (pescoço/cabeça): X=[-45,45], Y=[-70,70], Z=[-30,30]
- "Left Shoulder": X=[-175,175], Y=[-90,90], Z=[-175,45]
- "Right Shoulder": X=[-175,175], Y=[-90,90], Z=[-45,175]
- "Left Hip": X=[-120,80], Y=[-45,45], Z=[-60,30]
- "Right Hip": X=[-120,80], Y=[-45,45], Z=[-30,60]
`.trim();

export function buildSystemPrompt(rigType = 'R15', promptText = '') {
  const rigInfo = rigType === 'R6' ? R6_PROMPT_INFO : R15_PROMPT_INFO;
  const examples = selectFewShotExamples(promptText);
  const examplesBlock = examples.length > 0
    ? `\nEXEMPLOS DE REFERÊNCIA DE ALTA QUALIDADE (use como modelo de postura, base larga e ritmo):\n${examples
        .map((ex, i) => `Exemplo ${i + 1} (${ex.name}):\n${JSON.stringify(ex)}`)
        .join('\n\n')}\n`
    : '';

  return `Você é o "Animador" especialista em Roblox Studio (${rigType}).
Você recebe a descrição do movimento e o plano detalhado do Diretor de Movimento, e gera os keyframes exatos em JSON.

REGRAS ESTRITAS DE SAÍDA:
1. Responda SOMENTE com JSON válido. Não inclua markdown, crases (\`\`\`), explicações ou texto antes/depois.
2. Formato obrigatório do JSON:
{
  "name": "nome_curto_sem_espacos",
  "rig": "${rigType}",
  "fps": 30,
  "duration": 1.2,
  "loop": false,
  "keyframes": [
    {
      "time": 0.0,
      "easing": "Linear",
      "joints": {
        "NomeDaArticulacao": [rx, ry, rz]
      }
    }
  ]
}

SISTEMA DE COORDENADAS E EIXOS (graus Euler, relativos à pose neutra em pé):
- +X: inclina/rotaciona para frente (ex.: ombro +X levanta o braço para frente/cima; tronco +X inclina para frente).
- -X: inclina/rotaciona para trás.
- +Y: gira para a esquerda do personagem.
- -Y: gira para a direita do personagem.
- +Z / -Z: inclinação lateral / abertura lateral dos braços e pernas.

${rigInfo}

PRINCÍPIOS DE QUALIDADE:
- Siga rigorosamente as fases e durações do plano do Diretor de Movimento (antecipação mais lenta, impacto rápido).
- Mantenha base larga nas pernas e joelhos semiflexionados para não parecer boneco rígido.
- Nunca dê saltos angulares maiores que 180° entre keyframes consecutivos.
- Valores de "easing" permitidos: "Linear", "Constant", "CubicIn", "CubicOut", "CubicInOut", "Bounce", "Elastic".
- O primeiro keyframe deve começar em time: 0.0 e o último deve terminar exatamente em duration.
${examplesBlock}`;
}
