// Helpers de persistencia en localStorage (preferencias de lista y borradores de fusión).
// Tolerantes a fallos: si localStorage no está disponible o el JSON es inválido, no rompen.

export const LIST_PREFS_KEY = 'nihao:list-prefs'
export const draftKey = (row) => `nihao:draft:${row}`

export function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* almacenamiento no disponible: se ignora */
  }
}

export function removeKey(key) {
  try {
    localStorage.removeItem(key)
  } catch {
    /* no-op */
  }
}
