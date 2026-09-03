import { useSyncExternalStore } from 'react'

export type Tema = 'sistema' | 'light' | 'dark'

const CLAVE = 'aulamia:tema'
const listeners = new Set<() => void>()

function leer(): Tema {
  try {
    const v = localStorage.getItem(CLAVE)
    if (v === 'light' || v === 'dark') return v
  } catch {
    /* almacenamiento no disponible */
  }
  return 'sistema'
}

function aplicar(tema: Tema) {
  const root = document.documentElement
  if (tema === 'sistema') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', tema)
}

export function fijarTema(tema: Tema) {
  try {
    if (tema === 'sistema') localStorage.removeItem(CLAVE)
    else localStorage.setItem(CLAVE, tema)
  } catch {
    /* ignora */
  }
  aplicar(tema)
  listeners.forEach((l) => l())
}

/** Aplica el tema guardado en el arranque (además del script inline del HTML). */
export function iniciarTema() {
  aplicar(leer())
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function useTema(): [Tema, (t: Tema) => void] {
  const tema = useSyncExternalStore(subscribe, leer, () => 'sistema' as Tema)
  return [tema, fijarTema]
}
