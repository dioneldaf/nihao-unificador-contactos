// Barra de paginación para la lista de bloques.
export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null

  const go = (p) => onChange(Math.min(Math.max(1, p), totalPages))

  return (
    <nav className="pagination" aria-label="Paginación">
      <button
        type="button"
        className="btn btn--ghost btn--sm"
        onClick={() => go(1)}
        disabled={page <= 1}
        title="Primera página"
      >
        «
      </button>
      <button
        type="button"
        className="btn btn--ghost btn--sm"
        onClick={() => go(page - 1)}
        disabled={page <= 1}
      >
        ← Anterior
      </button>
      <span className="pagination__info">
        Página {page} de {totalPages}
      </span>
      <button
        type="button"
        className="btn btn--ghost btn--sm"
        onClick={() => go(page + 1)}
        disabled={page >= totalPages}
      >
        Siguiente →
      </button>
      <button
        type="button"
        className="btn btn--ghost btn--sm"
        onClick={() => go(totalPages)}
        disabled={page >= totalPages}
        title="Última página"
      >
        »
      </button>
    </nav>
  )
}
