// Controles de ordenamiento y filtrado de la lista de bloques.
// El valor por defecto ('default' / 'all' / 'all') reproduce el orden recomendado actual.

export const DEFAULT_PREFS = { sort: 'default', status: 'all', confidence: 'all' }

const SORTS = [
  { value: 'default', label: 'Recomendado (pendientes + confianza)' },
  { value: 'confidence-desc', label: 'Confianza: alta → baja' },
  { value: 'confidence-asc', label: 'Confianza: baja → alta' },
  { value: 'contacts-desc', label: 'Nº contactos: mayor → menor' },
  { value: 'contacts-asc', label: 'Nº contactos: menor → mayor' },
  { value: 'row-asc', label: 'Orden original' },
]
const STATUS = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'done', label: 'Resueltos' },
]
const CONFIDENCE = [
  { value: 'all', label: 'Todas' },
  { value: 'high', label: 'Alta' },
  { value: 'medium', label: 'Media' },
  { value: 'low', label: 'Baja' },
]

function Select({ id, label, value, options, onChange }) {
  return (
    <label className="control" htmlFor={id}>
      <span className="control__label">{label}</span>
      <select id={id} className="control__select" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export default function ListControls({ prefs, onChange, shown, total }) {
  const isDefault =
    prefs.sort === DEFAULT_PREFS.sort &&
    prefs.status === DEFAULT_PREFS.status &&
    prefs.confidence === DEFAULT_PREFS.confidence

  return (
    <div className="list-controls">
      <Select
        id="ctl-sort"
        label="Ordenar por"
        value={prefs.sort}
        options={SORTS}
        onChange={(v) => onChange({ ...prefs, sort: v })}
      />
      <Select
        id="ctl-status"
        label="Estado"
        value={prefs.status}
        options={STATUS}
        onChange={(v) => onChange({ ...prefs, status: v })}
      />
      <Select
        id="ctl-confidence"
        label="Confianza"
        value={prefs.confidence}
        options={CONFIDENCE}
        onChange={(v) => onChange({ ...prefs, confidence: v })}
      />
      <div className="list-controls__meta">
        <span className="list-controls__count">
          {shown} de {total}
        </span>
        {!isDefault && (
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => onChange(DEFAULT_PREFS)}>
            Restablecer
          </button>
        )}
      </div>
    </div>
  )
}
