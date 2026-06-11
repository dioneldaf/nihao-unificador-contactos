import { FIELDS, FIELD_KEYS } from '../config/fields.js'

// Formatea un valor crudo del contacto para mostrarlo al empleado.
// null/undefined/'' -> "—"; booleanos -> "Sí"/"No"; el resto, texto recortado.
export function formatValue(field, raw) {
  if (raw === null || raw === undefined || raw === '') return '—'
  if (field?.type === 'bool' || typeof raw === 'boolean') {
    return raw ? 'Sí' : 'No'
  }
  return String(raw).trim()
}

// Formatea la fecha de último acceso (campo informativo de UI) a español legible.
// Acepta "YYYY-MM-DD HH:MM:SS" (formato real del backend) o ISO con "T".
// Devuelve null si es null/vacía/inválida, para que la UI no pinte la línea.
const LOGIN_DATE_FMT = new Intl.DateTimeFormat('es-ES', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})
export function formatLoginDate(value) {
  if (!value) return null
  const d = new Date(String(value).replace(' ', 'T'))
  if (isNaN(d.getTime())) return null
  return LOGIN_DATE_FMT.format(d)
}

// Rank = customer_rank + supplier_rank. Campo calculado, NO editable; solo ayuda al
// empleado a decidir cuál contacto conservar. Como el id, el del principal es el que
// se usa al hacer el merge.
export function computeRank(contact) {
  const a = Number(contact?.customer_rank) || 0
  const b = Number(contact?.supplier_rank) || 0
  return a + b
}

// Normaliza los valores editables de la UI al formato del backend para `merged_fields`:
// booleanos ('Sí'/'No') -> true/false, y vacíos ('' o '—') -> null.
export function normalizeMergedFields(fields) {
  const out = {}
  for (const field of FIELDS) {
    const v = fields?.[field.key]
    if (field.type === 'bool') {
      if (v === 'Sí' || v === true) out[field.key] = true
      else if (v === 'No' || v === false) out[field.key] = false
      else out[field.key] = null
    } else {
      const s = (v ?? '').toString().trim()
      out[field.key] = s === '' || s === '—' ? null : s
    }
  }
  return out
}

// Estado inicial del contacto unificado: un valor vacío por cada campo del mapeo.
export function emptyMerged() {
  const out = {}
  for (const key of FIELD_KEYS) out[key] = ''
  return out
}

// Construye los valores finales del contacto unificado a partir de un contacto
// (usado por "rellenar con el principal"). Normaliza al formato editable de la UI.
export function mergedFromContact(contact) {
  const out = {}
  for (const field of FIELDS) {
    const raw = contact?.[field.key]
    if (field.type === 'bool') {
      // los campos booleanos se editan como "Sí"/"No"
      out[field.key] = raw === null || raw === undefined ? '' : raw ? 'Sí' : 'No'
    } else {
      out[field.key] = raw === null || raw === undefined ? '' : String(raw)
    }
  }
  return out
}
