import { RIG_TYPES } from '../rig/index.js';

export default function PromptPanel({
  prompt,
  onPromptChange,
  rigType,
  onRigChange,
  duration,
  onDurationChange,
  loop,
  onLoopChange,
  planText,
  onPlanTextChange,
  isPlanning,
  onPlan,
  isGenerating,
  error,
  variations,
  selectedIndex,
  onSelectVariation,
  onGenerate,
  hasAnimation,
  refineInstruction,
  onRefineInstructionChange,
  isRefining,
  onRefine,
}) {
  const busy = isPlanning || isGenerating || isRefining;

  function handleSubmit(e) {
    e.preventDefault();
    onGenerate();
  }

  return (
    <aside className="side-panel">
      <form className="panel-form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="prompt-input">Descreva o movimento</label>
          <textarea
            id="prompt-input"
            rows={3}
            placeholder="Ex: ataque com espada e escudo, golpe diagonal de cima para baixo"
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            disabled={busy}
          />
        </div>

        <div className="field-row">
          <div className="field">
            <label>Rig</label>
            <div className="rig-switcher" role="group" aria-label="Escolha do Rig">
              {Object.values(RIG_TYPES).map((rig) => (
                <button
                  key={rig.id}
                  type="button"
                  className={`btn-toggle ${rigType === rig.id ? 'active' : ''}`}
                  onClick={() => onRigChange(rig.id)}
                  disabled={busy}
                >
                  {rig.id}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label htmlFor="duration-input">Duração (s)</label>
            <input
              id="duration-input"
              type="number"
              min={0.3}
              max={5.0}
              step={0.1}
              value={duration}
              onChange={(e) => onDurationChange(parseFloat(e.target.value) || 1.2)}
              disabled={busy}
            />
          </div>
        </div>

        <label className="loop-toggle">
          <input
            type="checkbox"
            checked={loop}
            onChange={(e) => onLoopChange(e.target.checked)}
            disabled={busy}
          />
          Animação em Loop
        </label>

        <div className="action-row">
          <button
            type="button"
            className="btn-secondary btn-plan"
            onClick={onPlan}
            disabled={busy || !prompt.trim()}
          >
            {isPlanning ? 'Planejando...' : '1. Planejar (Diretor)'}
          </button>

          <button
            type="submit"
            className="btn-primary btn-generate"
            disabled={busy || !prompt.trim()}
          >
            {isGenerating ? 'Gerando...' : planText ? '2. Gerar (3 variações)' : 'Gerar (3 variações)'}
          </button>
        </div>

        {planText && (
          <div className="plan-section">
            <div className="plan-header">
              <span>Plano do Diretor (editável)</span>
              <button
                type="button"
                className="btn-link"
                onClick={() => onPlanTextChange('')}
                disabled={busy}
              >
                Limpar
              </button>
            </div>
            <textarea
              className="plan-editor"
              rows={8}
              value={planText}
              onChange={(e) => onPlanTextChange(e.target.value)}
              disabled={busy}
              spellCheck={false}
            />
          </div>
        )}

        {error && (
          <div className="error-box" role="alert">
            {error}
          </div>
        )}
      </form>

      {variations.length > 0 && (
        <div className="variations-section">
          <div className="variations-header">Comparar variações geradas</div>
          <div className="variations-list">
            {variations.map((v, idx) => (
              <button
                key={`${v.name}-${idx}`}
                type="button"
                className={`variation-btn ${selectedIndex === idx ? 'active' : ''}`}
                onClick={() => onSelectVariation(idx)}
              >
                <span className="variation-title">Variação {idx + 1}</span>
                <span className="variation-meta">
                  {v.keyframes.length} keyframes • {v.duration}s
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {hasAnimation && (
        <div className="refine-section">
          <label htmlFor="refine-input" className="refine-label">
            Refinar Animação Atual
          </label>
          <div className="refine-input-row">
            <input
              id="refine-input"
              type="text"
              placeholder='Ex: "o braço gira demais", "mais rápido"'
              value={refineInstruction}
              onChange={(e) => onRefineInstructionChange(e.target.value)}
              disabled={busy}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onRefine();
                }
              }}
            />
            <button
              type="button"
              className="btn-secondary btn-refine"
              onClick={onRefine}
              disabled={busy || !refineInstruction.trim()}
            >
              {isRefining ? 'Corrigindo...' : 'Refinar'}
            </button>
          </div>
        </div>
      )}

      <div className="draft-notice">
        <strong>Nota:</strong> O resultado da IA é um <strong>rascunho</strong>. Você pode abrir a
        animação no <strong>Animation Editor</strong> do Roblox Studio para ajustar e publicar.
      </div>
    </aside>
  );
}
