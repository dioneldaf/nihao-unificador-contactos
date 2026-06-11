import { useEffect, useMemo, useState } from 'react'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { FIELD_KEYS } from '../config/fields.js'
import { emptyMerged, mergedFromContact, computeRank, normalizeMergedFields } from '../lib/merge.js'
import { draftKey, loadJSON, saveJSON, removeKey } from '../lib/storage.js'
import AiContextPanel from './AiContextPanel.jsx'
import ContactCard from './ContactCard.jsx'
import MergedContactCard from './MergedContactCard.jsx'

// Reenvía user_ids / user_login_date tal cual vienen del GET en cada elemento del POST,
// con defaults seguros (nunca undefined) para que el endpoint no tenga que distinguir
// formas distintas: user_ids -> [] si no es array; user_login_date -> null si falta.
const userFields = (c) => ({
  user_ids: Array.isArray(c?.user_ids) ? c.user_ids : [],
  user_login_date: c?.user_login_date ?? null,
})

// Vista de detalle: el empleado revisa un bloque y construye el contacto unificado.
export default function BlockReview({ entry, onMerge, onDiscard, onBack, onPrev, onNext, submitting }) {
  const block = entry.block
  const contacts = block.contacts || []

  // Borrador persistente por bloque: se conserva al salir de la vista o recargar la web.
  const dkey = draftKey(entry.row_number)
  const [merged, setMerged] = useState(() => loadJSON(dkey, null)?.merged ?? emptyMerged())
  const [primaryId, setPrimaryId] = useState(() => loadJSON(dkey, null)?.primaryId ?? null)
  const [excludedIds, setExcludedIds] = useState(
    () => new Set(loadJSON(dkey, null)?.excludedIds ?? []),
  )
  // valor que se está arrastrando, para pintarlo siguiendo al ratón (DragOverlay)
  const [activeValue, setActiveValue] = useState(null)

  // Guarda el borrador cada vez que cambian los campos / principal / excluidos.
  useEffect(() => {
    saveJSON(dkey, { merged, primaryId, excludedIds: Array.from(excludedIds) })
  }, [dkey, merged, primaryId, excludedIds])

  function handleReset() {
    setMerged(emptyMerged())
    setPrimaryId(null)
    setExcludedIds(new Set())
    removeKey(dkey)
  }

  // Pequeña distancia de activación para no disparar drag con un simple clic.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const primaryContact = useMemo(
    () => contacts.find((c) => c.id === primaryId) || null,
    [contacts, primaryId],
  )

  // Aviso de presentación: el principal elegido NO tiene cuenta de usuario pero otro
  // contacto (no excluido) del grupo sí la tiene. Solo informativo, no bloquea nada.
  const userAccountWarning =
    !!primaryContact &&
    primaryContact.has_user !== true &&
    contacts.some(
      (c) => c.id !== primaryId && !excludedIds.has(c.id) && c.has_user === true,
    )

  function handleDragStart(event) {
    setActiveValue(event.active.data.current?.value ?? null)
  }

  function handleDragEnd(event) {
    setActiveValue(null)
    const { active, over } = event
    if (!over) return
    const fieldKey = over.data.current?.fieldKey
    const value = active.data.current?.value
    if (!fieldKey || value === undefined) return
    setMerged((m) => ({ ...m, [fieldKey]: value === '—' ? '' : value }))
  }

  function handleMergedChange(key, value) {
    setMerged((m) => ({ ...m, [key]: value }))
  }

  function handleSetPrimary(id) {
    setPrimaryId(id)
    // si estaba excluido, al marcarlo principal lo reincluimos
    setExcludedIds((prev) => {
      if (!prev.has(id)) return prev
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  function handleToggleExclude(id) {
    setExcludedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else {
        next.add(id)
        if (primaryId === id) setPrimaryId(null) // no puede ser principal y estar excluido
      }
      return next
    })
  }

  function handleFillFromPrimary() {
    if (primaryContact) setMerged(mergedFromContact(primaryContact))
  }

  const includedIds = contacts.map((c) => c.id).filter((id) => !excludedIds.has(id))

  function handleListo() {
    if (!primaryId) {
      alert('Marca cuál contacto es el principal antes de pulsar Listo.')
      return
    }
    if (includedIds.length < 2) {
      const ok = window.confirm(
        'Vas a unificar con menos de 2 contactos incluidos. ¿Continuar igualmente?',
      )
      if (!ok) return
    }
    const fields = {}
    for (const key of FIELD_KEYS) fields[key] = merged[key] ?? ''
    const merged_fields = normalizeMergedFields(fields)

    // Lista de acciones por contacto para el webhook human_response. Cada elemento
    // lleva el row_number del bloque (del primer webhook) y reenvía user_ids /
    // user_login_date tal cual vienen del GET:
    //  - principal -> update (con merged_fields)
    //  - fusionados que no son el principal -> archive
    //  - excluidos -> keep
    const rn = entry.row_number
    const primary = contacts.find((c) => c.id === primaryId)
    const payload = [
      { row_number: rn, id: primaryId, action: 'update', merged_fields, ...userFields(primary) },
    ]
    for (const c of contacts) {
      if (c.id === primaryId || excludedIds.has(c.id)) continue
      payload.push({ row_number: rn, id: c.id, action: 'archive', ...userFields(c) })
    }
    for (const c of contacts) {
      if (excludedIds.has(c.id)) {
        payload.push({ row_number: rn, id: c.id, action: 'keep', ...userFields(c) })
      }
    }

    onMerge({ row_number: rn, payload })
  }

  function handleDescartar() {
    // "No son duplicados": no se fusiona nada, todos los contactos se conservan.
    const rn = entry.row_number
    const payload = contacts.map((c) => ({
      row_number: rn,
      id: c.id,
      action: 'keep',
      ...userFields(c),
    }))
    onDiscard({ row_number: rn, payload })
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveValue(null)}
    >
      <div className="review">
        <div className="review__topbar">
          <button type="button" className="btn btn--ghost" onClick={onBack}>
            ← Volver a la lista
          </button>
          <span className="review__blockkey">{block.block}</span>
          <div className="review__nav">
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={onPrev || undefined}
              disabled={!onPrev}
              title="Bloque pendiente anterior"
            >
              ← Anterior
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={onNext || undefined}
              disabled={!onNext}
              title="Siguiente bloque pendiente"
            >
              Siguiente →
            </button>
          </div>
        </div>

        <AiContextPanel confidence={entry.confidence} reason={entry.reason} />

        <div className="review__grid">
          <div className="review__sources">
            {contacts.map((c, i) => (
              <ContactCard
                key={c.id}
                contact={c}
                index={i}
                isPrimary={primaryId === c.id}
                isExcluded={excludedIds.has(c.id)}
                onSetPrimary={handleSetPrimary}
                onToggleExclude={handleToggleExclude}
              />
            ))}
          </div>

          <div className="review__target">
            <MergedContactCard
              merged={merged}
              onChange={handleMergedChange}
              onFillFromPrimary={handleFillFromPrimary}
              canFill={!!primaryContact}
              primaryRank={primaryContact ? computeRank(primaryContact) : null}
              userAccountWarning={userAccountWarning}
              onReset={handleReset}
            />
            <div className="merged-actions">
              <button
                type="button"
                className="btn btn--danger"
                onClick={handleDescartar}
                disabled={submitting}
              >
                No son duplicados / Descartar
              </button>
              <button
                type="button"
                className="btn btn--primary"
                onClick={handleListo}
                disabled={submitting}
              >
                {submitting ? 'Enviando…' : 'Listo'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeValue != null ? (
          <span className="chip chip--overlay">{activeValue}</span>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
