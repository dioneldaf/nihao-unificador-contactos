import { useEffect, useMemo, useState } from 'react'
import { fetchBlocks, submitResolution } from './api/blocks.js'
import BlockList from './components/BlockList.jsx'
import BlockReview from './components/BlockReview.jsx'
import ProgressBar from './components/ProgressBar.jsx'

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

  // Orden de la lista: primero los incompletos de mayor a menor confianza, luego los
  // completos (según el campo `completed` del primer webhook).
  const sortedBlocks = useMemo(() => {
    const CONFIDENCE_RANK = { high: 3, medium: 2, low: 1 }
    return [...blocks].sort((a, b) => {
      const ad = a.completed ? 1 : 0
      const bd = b.completed ? 1 : 0
      if (ad !== bd) return ad - bd // incompletos (0) primero
      const ar = CONFIDENCE_RANK[(a.confidence || '').toLowerCase()] || 0
      const br = CONFIDENCE_RANK[(b.confidence || '').toLowerCase()] || 0
      return br - ar // mayor confianza primero
    })
  }, [blocks])

  const resolvedCount = useMemo(
    () => blocks.filter((b) => isDone(b)).length,
    [blocks, resolutions],
  )

  const openEntry = blocks.find((b) => b.row_number === openRow) || null

  // Busca el row_number del siguiente/anterior bloque pendiente (no hecho) respecto a
  // `fromRow`, siguiendo el orden mostrado en la lista. dir = +1 / -1.
  function findPending(fromRow, dir) {
    const idx = sortedBlocks.findIndex((b) => b.row_number === fromRow)
    if (idx === -1) return null
    for (let i = idx + dir; i >= 0 && i < sortedBlocks.length; i += dir) {
      if (!isDone(sortedBlocks[i])) return sortedBlocks[i].row_number
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
          <BlockList entries={sortedBlocks} statusOf={displayStatusOf} onOpen={setOpenRow} />
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
