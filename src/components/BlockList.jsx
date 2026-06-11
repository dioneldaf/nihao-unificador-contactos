const STATUS_META = {
  pending: { label: 'Pendiente', cls: 'status--pending' },
  merged: { label: 'Unificado', cls: 'status--merged' },
  discarded: { label: 'Descartado', cls: 'status--discarded' },
  completed: { label: 'Completado', cls: 'status--completed' },
}

const CONFIDENCE_LABELS = { high: 'alta', medium: 'media', low: 'baja' }

export default function BlockList({ entries, statusOf, onOpen }) {
  return (
    <div className="block-list">
      {entries.map((entry) => {
        const status = statusOf(entry)
        const meta = STATUS_META[status] || STATUS_META.pending
        const level = (entry.confidence || '').toLowerCase()
        const count = entry.block?.contacts?.length ?? 0
        return (
          <button
            type="button"
            key={entry.row_number}
            className={'block-item ' + (status !== 'pending' ? 'block-item--done' : '')}
            onClick={() => onOpen(entry.row_number)}
          >
            <div className="block-item__main">
              <span className="block-item__key">{entry.block?.block}</span>
              <span className="block-item__count">{count} contactos</span>
            </div>
            <div className="block-item__meta">
              <span className={`badge badge--${level || 'unknown'}`}>
                confianza: {CONFIDENCE_LABELS[level] || entry.confidence || '—'}
              </span>
              <span className={`status ${meta.cls}`}>{meta.label}</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
