import { useEffect, useMemo, useState } from 'react'
import { fetchBlocks, submitResolution } from './api/blocks.js'
import BlockList from './components/BlockList.jsx'
import BlockReview from './components/BlockReview.jsx'
import ListControls, { DEFAULT_PREFS } from './components/ListControls.jsx'
import ProgressBar from './components/ProgressBar.jsx'
import { LIST_PREFS_KEY, draftKey, loadJSON, saveJSON, removeKey } from './lib/storage.js'

const CONFIDENCE_RANK = { high: 3, medium: 2, low: 1 }
const confRank = (e) => CONFIDENCE_RANK[(e.confidence || '').toLowerCase()] || 0
const contactCount = (e) => e.block?.contacts?.length || 0

export default function App() {
  const [blocks, setBlocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // estado de resolución por row_number: 'pending' | 'merged' | 'discarded'
  const [resolutions, setResolutions] = useState({})
  // vista: null = lista; número = row_number del bloque abierto
  const [openRow, setOpenRow] = useState(null)
  // true mientras se envía la resolución al webhook (evita doble envío)
  const [submitting, setSubmitting] = useState(false)
  // preferencias de orden/filtro de la lista (persisten entre recargas)
  const [listPrefs, setListPrefs] = useState(() => ({
    ...DEFAULT_PREFS,
    ...loadJSON(LIST_PREFS_KEY, {}),
  }))
  useEffect(() => {
    saveJSON(LIST_PREFS_KEY, listPrefs)
  }, [listPrefs])

  useEffect(() => {
    let alive = true
    setLoading(true)
    fetchBlocks()
      .then((data) => {
        if (!alive) return
        setBlocks(data)
        setError(null)
      })
      .catch((err) => alive && setError(err.message || String(err)))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [])

  const statusOf = (row) => resolutions[row]?.status || 'pending'

  // Un bloque está "hecho" si el backend lo marcó completed o si se resolvió en sesión.
  const isDone = (entry) =>
    entry.completed === true || statusOf(entry.row_number) !== 'pending'

  // Estado a mostrar en la lista: resolución de sesión > completado del backend > pendiente.
  const displayStatusOf = (entry) => {
    const s = statusOf(entry.row_number)
    if (s !== 'pending') return s
    if (entry.completed === true) return 'completed'
    return 'pending'
  }

  // Lista visible: aplica el filtro y el ordenamiento elegidos en `listPrefs`.
  // El orden por defecto ('default') reproduce el recomendado: incompletos de mayor a
  // menor confianza y, al final, los completos (según el campo `completed` del webhook).
  const orderedBlocks = useMemo(() => {
    const { sort, status, confidence } = listPrefs
    const filtered = blocks.filter((e) => {
      if (status === 'pending' && isDone(e)) return false
      if (status === 'done' && !isDone(e)) return false
      if (confidence !== 'all' && (e.confidence || '').toLowerCase() !== confidence) return false
      return true
    })
    const arr = [...filtered]
    switch (sort) {
      case 'confidence-desc':
        return arr.sort((a, b) => confRank(b) - confRank(a))
      case 'confidence-asc':
        return arr.sort((a, b) => confRank(a) - confRank(b))
      case 'contacts-desc':
        return arr.sort((a, b) => contactCount(b) - contactCount(a))
      case 'contacts-asc':
        return arr.sort((a, b) => contactCount(a) - contactCount(b))
      case 'row-asc':
        return arr.sort((a, b) => a.row_number - b.row_number)
      case 'default':
      default:
        return arr.sort((a, b) => {
          const ad = a.completed ? 1 : 0
          const bd = b.completed ? 1 : 0
          if (ad !== bd) return ad - bd // incompletos primero
          return confRank(b) - confRank(a) // mayor confianza primero
        })
    }
  }, [blocks, resolutions, listPrefs])

  const resolvedCount = useMemo(
    () => blocks.filter((b) => isDone(b)).length,
    [blocks, resolutions],
  )

  const openEntry = blocks.find((b) => b.row_number === openRow) || null

  // Busca el row_number del siguiente/anterior bloque pendiente (no hecho) respecto a
  // `fromRow`, siguiendo el orden mostrado en la lista. dir = +1 / -1.
  function findPending(fromRow, dir) {
    const idx = orderedBlocks.findIndex((b) => b.row_number === fromRow)
    if (idx === -1) return null
    for (let i = idx + dir; i >= 0 && i < orderedBlocks.length; i += dir) {
      if (!isDone(orderedBlocks[i])) return orderedBlocks[i].row_number
    }
    return null
  }

  const prevRow = openEntry ? findPending(openRow, -1) : null
  const nextRow = openEntry ? findPending(openRow, 1) : null

  function goToNextPending(fromRow) {
    const next = findPending(fromRow, 1) ?? findPending(fromRow, -1)
    setOpenRow(next) // si no quedan pendientes, next es null y volvemos a la lista
  }

  async function resolve(row, status, payload) {
    if (submitting) return
    setSubmitting(true)
    try {
      await submitResolution(payload)
      // solo marcamos resuelto y avanzamos si el webhook respondió OK
      setResolutions((r) => ({ ...r, [row]: { status, payload } }))
      removeKey(draftKey(row)) // el borrador ya no hace falta
      goToNextPending(row)
    } catch (err) {
      console.error('Error al enviar la resolución:', err)
      alert(
        'No se pudo enviar la resolución al servidor.\n\n' +
          (err.message || String(err)) +
          '\n\nEl bloque sigue pendiente; inténtalo de nuevo.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleMerge = ({ row_number, payload }) => resolve(row_number, 'merged', payload)
  const handleDiscard = ({ row_number, payload }) => resolve(row_number, 'discarded', payload)

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__brand">
          <img
            className="app__logo"
            src="/favicon.svg"
            alt="Nihao53 · Unificador de contactos"
            width="44"
            height="44"
          />
          <div className="app__brand-text">
            <h1>Unificador de contactos</h1>
            <span className="app__brand-sub">Nihao53 · Revisión de duplicados</span>
          </div>
        </div>
        <ProgressBar resolved={resolvedCount} total={blocks.length} />
      </header>

      <main className="app__main">
        {loading && <p className="state state--loading">Cargando bloques…</p>}

        {error && (
          <div className="state state--error">
            <p>No se pudieron cargar los bloques.</p>
            <code>{error}</code>
          </div>
        )}

        {!loading && !error && blocks.length === 0 && (
          <p className="state">No hay bloques pendientes de revisión. 🎉</p>
        )}

        {!loading && !error && blocks.length > 0 && openEntry === null && (
          <>
            <ListControls
              prefs={listPrefs}
              onChange={setListPrefs}
              shown={orderedBlocks.length}
              total={blocks.length}
            />
            {orderedBlocks.length === 0 ? (
              <p className="state">Ningún bloque coincide con los filtros.</p>
            ) : (
              <BlockList entries={orderedBlocks} statusOf={displayStatusOf} onOpen={setOpenRow} />
            )}
          </>
        )}

        {!loading && !error && openEntry && (
          <BlockReview
            key={openEntry.row_number}
            entry={openEntry}
            onMerge={handleMerge}
            onDiscard={handleDiscard}
            onBack={() => setOpenRow(null)}
            onPrev={prevRow != null ? () => setOpenRow(prevRow) : null}
            onNext={nextRow != null ? () => setOpenRow(nextRow) : null}
            submitting={submitting}
          />
        )}
      </main>
    </div>
  )
}
