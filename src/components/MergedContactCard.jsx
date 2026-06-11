import { useDroppable } from '@dnd-kit/core'
import { FIELDS } from '../config/fields.js'

// Drop-zone + input editable para un campo del contacto unificado.
function MergedField({ field, value, onChange }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `drop:${field.key}`,
    data: { fieldKey: field.key },
  })

  return (
    <div className="field-row">
      <label className="field-row__label" htmlFor={`merged-${field.key}`}>
        {field.label}
      </label>
      <div
        ref={setNodeRef}
        className={'dropzone' + (isOver ? ' dropzone--over' : '')}
      >
        <input
          id={`merged-${field.key}`}
          className="merged-input"
          type="text"
          value={value}
          placeholder="Arrastra un valor o escribe…"
          onChange={(e) => onChange(field.key, e.target.value)}
        />
      </div>
    </div>
  )
}

// Tarjeta destino: el contacto unificado que el empleado va construyendo.
export default function MergedContactCard({ merged, onChange, onFillFromPrimary, canFill, primaryRank, userAccountWarning }) {
  return (
    <div className="merged-card">
      <div className="merged-card__head">
        <span className="merged-card__title">
          Contacto unificado
          {primaryRank != null && (
            <span className="rank-badge" title="Rank del contacto principal (no editable)">
              rank {primaryRank}
            </span>
          )}
        </span>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={onFillFromPrimary}
          disabled={!canFill}
          title={
            canFill
              ? 'Copia todos los valores del contacto principal'
              : 'Marca primero un contacto como principal'
          }
        >
          Rellenar con el principal
        </button>
      </div>
      {userAccountWarning && (
        <p className="merged-warning" role="status">
          <span aria-hidden>⚠</span> Has elegido como principal un contacto sin cuenta de
          usuario, pero otro contacto del grupo sí tiene una. Normalmente conviene
          conservar el que tiene cuenta de usuario.
        </p>
      )}
      <div className="merged-card__fields">
        {FIELDS.map((field) => (
          <MergedField
            key={field.key}
            field={field}
            value={merged[field.key] ?? ''}
            onChange={onChange}
          />
        ))}
      </div>
    </div>
  )
}
