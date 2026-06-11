const CONFIDENCE_LABELS = {
  high: 'alta',
  medium: 'media',
  low: 'baja',
}

export default function AiContextPanel({ confidence, reason }) {
  const level = (confidence || '').toLowerCase()
  const label = CONFIDENCE_LABELS[level] || confidence || '—'
  return (
    <div className="ai-panel">
      <div className="ai-panel__head">
        <span className="ai-panel__icon" aria-hidden>⚠</span>
        <span className="ai-panel__title">Revisión humana requerida</span>
        <span className={`badge badge--${level || 'unknown'}`}>
          confianza: {label}
        </span>
      </div>
      {reason && <p className="ai-panel__reason">{reason}</p>}
    </div>
  )
}
