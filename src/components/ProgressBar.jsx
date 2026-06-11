export default function ProgressBar({ resolved, total }) {
  const pct = total > 0 ? Math.round((resolved / total) * 100) : 0
  return (
    <div className="progress">
      <div className="progress__label">
        {resolved} de {total} bloques resueltos
      </div>
      <div className="progress__track">
        <div className="progress__fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
