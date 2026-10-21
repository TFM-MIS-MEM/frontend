// Sesión del canal web: solo el JWT y su caducidad.
//
// Va en sessionStorage, que sobrevive a recargar la página y muere con la
// pestaña. La API KEY NUNCA pasa por aquí: el panel la muestra al registrarse
// o al rotarla y la olvida al cerrar el diálogo, porque `auth` solo guarda su
// hash y la clave es la credencial permanente del canal de API.

const KEY = 'tfm.session'

export interface Session {
  token: string
  expiresAt: number // ms desde la época
}

export function loadSession(now = Date.now()): Session | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    const s = JSON.parse(raw) as Session
    if (typeof s.token !== 'string' || typeof s.expiresAt !== 'number' || s.expiresAt <= now) {
      sessionStorage.removeItem(KEY)
      return null
    }
    return s
  } catch {
    return null
  }
}

export function saveSession(token: string, expiresInSeconds: number, now = Date.now()): Session {
  const s = { token, expiresAt: now + expiresInSeconds * 1000 }
  try {
    sessionStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    // Sin almacenamiento (ventana privada estricta): la sesión vive en memoria.
  }
  return s
}

export function clearSession() {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    // nada que limpiar
  }
}
