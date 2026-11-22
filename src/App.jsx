import { useEffect, useRef, useState } from 'react';
import { RigPreview, TEST_ANIMATIONS } from './preview/index.js';
import { generateVariations, refineAnimation } from './generator/index.js';
import { enhanceAnimationQuality } from './rig/index.js';
import { PromptPanel } from './ui/index.js';

export default function App() {
  const [rigType, setRigType] = useState('R15');
  const [prompt, setPrompt] = useState('');
  const [durationInput, setDurationInput] = useState(1.2);
  const [loop, setLoop] = useState(false);

  const [variations, setVariations] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [animation, setAnimation] = useState(null);

  const [refineInstruction, setRefineInstruction] = useState('');
  const [isRefining, setIsRefining] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const lastTickRef = useRef(null);
  const activeDuration = animation?.duration || durationInput || 1.2;

  // Loop de reprodução da linha do tempo
  useEffect(() => {
    if (!isPlaying || !animation) {
      lastTickRef.current = null;
      return;
    }

    let frameId;
    const step = (now) => {
      if (lastTickRef.current === null) {
        lastTickRef.current = now;
      }
      const dt = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      setCurrentTime((prev) => {
        const next = prev + dt;
        if (next >= activeDuration) {
          if (loop) {
            return next % activeDuration;
          }
          setIsPlaying(false);
          return activeDuration;
        }
        return next;
      });

      frameId = requestAnimationFrame(step);
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [isPlaying, animation, activeDuration, loop]);

  function handleRigChange(nextRig) {
    setRigType(nextRig);
    // Uma animação não troca de rig depois de criada
    if (animation && animation.rig !== nextRig) {
      setIsPlaying(false);
      setAnimation(null);
      setVariations([]);
      setCurrentTime(0);
    }
  }

  async function handleGenerate() {
    setError('');
    setIsGenerating(true);
    try {
      const rawResults = await generateVariations({
        prompt,
        rig: rigType,
        duration: durationInput,
        loop,
        count: 3,
      });

      const enhancedResults = rawResults.map((v) => enhanceAnimationQuality(v));

      setVariations(enhancedResults);
      setSelectedIndex(0);
      setAnimation(enhancedResults[0]);
      setCurrentTime(0);
      setIsPlaying(true);
    } catch (err) {
      setError(err.message || 'Erro ao gerar animação.');
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleRefine() {
    if (!animation || !refineInstruction.trim()) return;
    setError('');
    setIsRefining(true);
    try {
      const refined = await refineAnimation({
        animation,
        instruction: refineInstruction,
      });

      const enhanced = enhanceAnimationQuality(refined);

      // Atualiza a variação atual e o player
      setAnimation(enhanced);
      setVariations((prev) => {
        const next = [...prev];
        next[selectedIndex] = enhanced;
        return next;
      });
      setRefineInstruction('');
      setCurrentTime(0);
      setIsPlaying(true);
    } catch (err) {
      setError(err.message || 'Erro ao refinar animação.');
    } finally {
      setIsRefining(false);
    }
  }

  function handleSelectVariation(idx) {
    const chosen = variations[idx];
    if (!chosen) return;
    setSelectedIndex(idx);
    setAnimation(chosen);
    setCurrentTime(0);
    setIsPlaying(true);
  }

  function handleRunTestAnimation() {
    const testAnim = enhanceAnimationQuality(TEST_ANIMATIONS[rigType]);
    setVariations([]);
    setAnimation(testAnim);
    setLoop(Boolean(testAnim.loop));
    setCurrentTime(0);
    setIsPlaying(true);
  }

  function handleResetPose() {
    setIsPlaying(false);
    setAnimation(null);
    setCurrentTime(0);
  }

  function handleTogglePlay() {
    if (!animation) {
      handleRunTestAnimation();
      return;
    }
    if (!isPlaying && currentTime >= activeDuration) {
      setCurrentTime(0);
    }
    setIsPlaying((prev) => !prev);
  }

  function handleScrub(e) {
    setIsPlaying(false);
    setCurrentTime(parseFloat(e.target.value) || 0);
  }

  return (
    <div className="app-layout">
      <header className="topbar">
        <div className="brand">
          <h1>RigMotion</h1>
          <span className="badge">Etapa 4 — Qualidade & Refinamento</span>
        </div>

        <div className="topbar-controls">
          <button type="button" className="btn-secondary" onClick={handleRunTestAnimation}>
            Animação de Teste ({rigType})
          </button>
          <button type="button" className="btn-secondary" onClick={handleResetPose}>
            Pose Neutra
          </button>
        </div>
      </header>

      <div className="workspace-body">
        <PromptPanel
          prompt={prompt}
          onPromptChange={setPrompt}
          rigType={rigType}
          onRigChange={handleRigChange}
          duration={durationInput}
          onDurationChange={setDurationInput}
          loop={loop}
          onLoopChange={setLoop}
          isGenerating={isGenerating}
          error={error}
          variations={variations}
          selectedIndex={selectedIndex}
          onSelectVariation={handleSelectVariation}
          onGenerate={handleGenerate}
          hasAnimation={Boolean(animation)}
          refineInstruction={refineInstruction}
          onRefineInstructionChange={setRefineInstruction}
          isRefining={isRefining}
          onRefine={handleRefine}
        />

        <main className="viewport-area">
          <RigPreview rigType={rigType} animation={animation} currentTime={currentTime} />

          <div className="viewport-overlay">
            <span>Rig: <strong>{rigType}</strong></span>
            <span>•</span>
            <span>
              Animação: <strong>{animation ? animation.name : 'Pose Neutra'}</strong>
            </span>
            <span className="hint">Arraste para girar • Scroll para zoom • Botão direito para mover</span>
          </div>
        </main>
      </div>

      <footer className="timeline-bar">
        <button
          type="button"
          className="btn-play"
          onClick={handleTogglePlay}
          title={isPlaying ? 'Pausar' : 'Reproduzir'}
        >
          {isPlaying ? 'Pausar' : 'Play'}
        </button>

        <input
          type="range"
          className="timeline-slider"
          min={0}
          max={activeDuration}
          step={0.01}
          value={Math.min(currentTime, activeDuration)}
          onChange={handleScrub}
          disabled={!animation}
          aria-label="Linha do tempo da animação"
        />

        <span className="time-readout">
          {currentTime.toFixed(2)}s / {activeDuration.toFixed(2)}s
        </span>

        <label className="loop-toggle">
          <input
            type="checkbox"
            checked={loop}
            onChange={(e) => setLoop(e.target.checked)}
          />
          Loop
        </label>
      </footer>
    </div>
  );
}
