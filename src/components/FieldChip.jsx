import { useDraggable } from '@dnd-kit/core'

// Valor arrastrable de un campo de un contacto. Al soltarlo sobre el campo
// correspondiente del contacto unificado, ese valor se copia.
// No es arrastrable si el contacto está excluido o si el valor está vacío ("—").
export default function FieldChip({ id, fieldKey, contactId, value, rawValue, disabled }) {
  const draggable = !disabled && value !== '—'
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    data: { fieldKey, contactId, value, rawValue },
    disabled: !draggable,
  })

  return (
    <span
      ref={setNodeRef}
      className={
        'chip' +
        (draggable ? ' chip--draggable' : ' chip--static') +
        (isDragging ? ' chip--dragging' : '')
      }
      {...(draggable ? listeners : {})}
      {...(draggable ? attributes : {})}
      title={draggable ? 'Arrastra este valor al contacto unificado' : undefined}
    >
      {value}
    </span>
  )
}
