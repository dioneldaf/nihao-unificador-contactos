import { FIELDS } from '../config/fields.js'
import { formatValue, computeRank, formatLoginDate } from '../lib/merge.js'
import FieldChip from './FieldChip.jsx'

// Tarjeta de un contacto del bloque. Muestra cada campo del mapeo como un chip
// arrastrable. Permite marcarlo como principal (radio) y excluirlo del bloque.
export default function ContactCard({
  contact,
  index,
  isPrimary,
  isExcluded,
  onSetPrimary,
  onToggleExclude,
}) {
  const lastLogin = formatLoginDate(contact.user_login_date)
  return (
    <div className={'contact-card' + (isExcluded ? ' contact-card--excluded' : '')}>
      <div className="contact-card__head">
        <span className="contact-card__tag">
          Contacto {index + 1}
          <span className="rank-badge" title="Rank = customer_rank + supplier_rank">
            rank {computeRank(contact)}
          </span>
        </span>
        <div className="contact-card__actions">
          <label className="radio">
            <input
              type="radio"
              name="primary-contact"
              checked={isPrimary}
              disabled={isExcluded}
              onChange={() => onSetPrimary(contact.id)}
            />
            <span>Principal</span>
          </label>
          <label className="exclude-toggle">
            <input
              type="checkbox"
              checked={isExcluded}
              onChange={() => onToggleExclude(contact.id)}
            />
            <span>Excluir</span>
          </label>
        </div>
      </div>

      {contact.has_user === true && (
        <div className="contact-card__user">
          <span className="user-badge" title="Este contacto tiene una cuenta de usuario en el sistema">
            <span aria-hidden>👤</span> Cuenta de usuario activa
          </span>
          {lastLogin && (
            <span className="contact-card__login">Último acceso: {lastLogin}</span>
          )}
        </div>
      )}

      <dl className="contact-card__fields">
        {FIELDS.map((field) => {
          const value = formatValue(field, contact[field.key])
          return (
            <div className="field-row" key={field.key}>
              <dt className="field-row__label">{field.label}</dt>
              <dd className="field-row__value">
                <FieldChip
                  id={`chip:${contact.id}:${field.key}`}
                  fieldKey={field.key}
                  contactId={contact.id}
                  value={value}
                  rawValue={contact[field.key]}
                  disabled={isExcluded}
                />
              </dd>
            </div>
          )
        })}
      </dl>
    </div>
  )
}
