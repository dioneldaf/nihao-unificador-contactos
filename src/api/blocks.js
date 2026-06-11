// Capa de acceso a datos.
// En desarrollo, /api lo reenvía Vite a https://automatizaciones.nihao53.com/webhook
// (ver vite.config.js) para evitar problemas de CORS.

const BLOCKS_URL = '/api/get-blocks-human'
const RESPONSE_URL = '/api/human_response'

// Obtiene la lista de bloques pendientes de revisión humana.
export async function fetchBlocks() {
  const res = await fetch(BLOCKS_URL)
  if (!res.ok) {
    throw new Error(`Error al cargar los bloques (HTTP ${res.status})`)
  }
  const data = await res.json()
  if (!Array.isArray(data)) {
    throw new Error('La respuesta del endpoint no es una lista de bloques')
  }
  return data
}

// Envía la resolución de un bloque al webhook human_response.
// `payload` es una LISTA de acciones por contacto, una entrada por contacto del bloque:
//   { id, action: 'update', merged_fields: {...} }  -> el principal (resultado del merge)
//   { id, action: 'archive' }                       -> fusionados que no son el principal
//   { id, action: 'keep' }                          -> excluidos / no se les hace nada
export async function submitResolution(payload) {
  const res = await fetch(RESPONSE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    throw new Error(`Error al enviar la resolución (HTTP ${res.status})`)
  }
  // El webhook puede responder con cuerpo o vacío; ambos son válidos.
  return res.json().catch(() => ({ ok: true }))
}
