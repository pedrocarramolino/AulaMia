import { useEffect, useState } from 'react'
import { Tarjeta, Boton } from '@/components/ui'
import { supabase } from '@/lib/supabase'

const VAPID = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

function base64ToUint8(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

const soportado =
  typeof navigator !== 'undefined' &&
  'serviceWorker' in navigator &&
  typeof window !== 'undefined' &&
  'PushManager' in window &&
  'Notification' in window

export function NotificacionesPush() {
  const [suscrito, setSuscrito] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!soportado) return
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setSuscrito(!!sub))
      .catch(() => {})
  }, [])

  if (!soportado) {
    return (
      <Tarjeta>
        <h2 className="font-display text-base font-semibold text-ink">Notificaciones</h2>
        <p className="mt-1 text-sm text-muted">
          Este navegador no admite notificaciones. Instala AulaMia en la pantalla de
          inicio para recibirlas.
        </p>
      </Tarjeta>
    )
  }

  async function activar() {
    setError('')
    setOcupado(true)
    try {
      if (!VAPID) throw new Error('Falta la clave VAPID')
      const permiso = await Notification.requestPermission()
      if (permiso !== 'granted') {
        setError('Permiso denegado. Actívalo en los ajustes del navegador.')
        return
      }
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64ToUint8(VAPID) as BufferSource,
      })
      const json = sub.toJSON()
      const { error } = await supabase.from('push_subscription').upsert(
        {
          endpoint: json.endpoint!,
          p256dh: json.keys!.p256dh,
          auth: json.keys!.auth,
        },
        { onConflict: 'endpoint' },
      )
      if (error) throw error
      setSuscrito(true)
    } catch {
      setError('No se han podido activar las notificaciones en este dispositivo.')
    } finally {
      setOcupado(false)
    }
  }

  async function desactivar() {
    setOcupado(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await supabase.from('push_subscription').delete().eq('endpoint', sub.endpoint)
        await sub.unsubscribe()
      }
      setSuscrito(false)
    } finally {
      setOcupado(false)
    }
  }

  return (
    <Tarjeta>
      <h2 className="font-display text-base font-semibold text-ink">Notificaciones</h2>
      <p className="mt-1 text-sm text-muted">
        Recibe los recordatorios en este dispositivo aunque tengas AulaMia cerrada.
        Funciona mejor con la app instalada en la pantalla de inicio.
      </p>
      <div className="mt-4">
        {suscrito ? (
          <Boton variante="secundario" onClick={desactivar} disabled={ocupado}>
            Desactivar en este dispositivo
          </Boton>
        ) : (
          <Boton onClick={activar} disabled={ocupado}>
            {ocupado ? 'Activando…' : 'Activar notificaciones'}
          </Boton>
        )}
      </div>
      {error && <p className="mt-3 text-sm text-crit">{error}</p>}
    </Tarjeta>
  )
}
