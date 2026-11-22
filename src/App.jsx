import { useEffect, useRef, useState } from 'react';
import { RigPreview, TEST_ANIMATIONS } from './preview/index.js';
import { RIG_TYPES } from './rig/index.js';

export default function App() {
  const [rigType, setRigType] = useState('R15');
  const [animation, setAnimation] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [loop, setLoop] = useState(true);

  const lastTickRef = useRef(null);

  const duration = animation?.duration || 1.2;

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
        if (next >= duration) {
          if (loop) {
            return next % duration;
          }
          setIsPlaying(false);
          return duration;
        }
        return next;
      });

      frameId = requestAnimationFrame(step);
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [isPlaying, animation, duration, loop]);

  function handleRigChange(nextRig) {
    setRigType(nextRig);
    // Uma animação não troca de rig depois de criada
    if (animation && animation.rig !== nextRig) {
      setIsPlaying(false);
      setAnimation(null);
      setCurrentTime(0);
    }
  }

  function handleRunTestAnimation() {
    const testAnim = TEST_ANIMATIONS[rigType];
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
    if (!isPlaying && currentTime >= duration) {
      setCurrentTime(0);
    }
    setIsPlaying((prev) => !prev);
  }

  function handleScrub(e) {
    setIsPlaying(false);
    setCurrentTime( parseFloat(e.target.value) || 0 );
  }

  return (
    <div className="app-layout">
      <header className="topbar">
        <div className="brand">
          <h1>RigMotion</h1>
          <span className="badge">Etapa 1 — Prévia 3D</span>
        </div>

        <div className="topbar-controls">
          <div className="rig-switcher" role="group" aria-label="Escolha do Rig">
            {Object.values(RIG_TYPES).map((rig) => (
              <button
                key={rig.id}
                type="button"
                className={`btn-toggle ${rigType === rig.id ? 'active' : ''}`}
                onClick={() => handleRigChange(rig.id)}
              >
                {rig.id}
              </button>
            ))}
          </div>

          <button type="button" className="btn-primary" onClick={handleRunTestAnimation}>
            Rodar Animação de Teste ({rigType})
          </button>

          <button type="button" className="btn-secondary" onClick={handleResetPose}>
            Pose Neutra
          </button>
        </div>
      </header>

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
          max={duration}
          step={0.01}
          value={Math.min(currentTime, duration)}
          onChange={handleScrub}
          disabled={!animation}
          aria-label="Linha do tempo da animação"
        />

        <span className="time-readout">
          {currentTime.toFixed(2)}s / {duration.toFixed(2)}s
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
