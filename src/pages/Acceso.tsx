import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/auth/AuthProvider'
import { Boton } from '@/components/ui'

export function Acceso() {
  const { session, cargando } = useAuth()
  const [email, setEmail] = useState('')
  const [estado, setEstado] = useState<'idle' | 'enviando' | 'enviado' | 'error'>('idle')
  const [mensaje, setMensaje] = useState('')

  if (!cargando && session) return <Navigate to="/" replace />

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setEstado('enviando')
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    })
    if (error) {
      setEstado('error')
      setMensaje(error.message)
    } else {
      setEstado('enviado')
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-ground px-5">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="font-display text-3xl font-bold tracking-tight text-ink">
            Aula<span className="text-accent-ink">Mia</span>
          </span>
          <p className="mt-2 text-sm text-muted">
            Agenda y planificador de clases de repaso
          </p>
        </div>

        {estado === 'enviado' ? (
          <div className="rounded-2xl border border-line bg-surface p-6 text-center">
            <h1 className="font-display text-lg font-semibold text-ink">Revisa tu correo</h1>
            <p className="mt-2 text-sm text-muted">
              Te hemos enviado un enlace de acceso a <strong className="text-ink">{email}</strong>.
              Ábrelo en este dispositivo para entrar.
            </p>
            <button
              className="mt-4 text-sm font-medium text-accent-ink hover:underline"
              onClick={() => setEstado('idle')}
            >
              Usar otro correo
            </button>
          </div>
        ) : (
          <form onSubmit={enviar} className="rounded-2xl border border-line bg-surface p-6">
            <label htmlFor="email" className="block text-sm font-medium text-ink">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@ejemplo.com"
              className="mt-2 w-full rounded-xl border border-line-strong bg-ground px-3.5 py-2.5 text-sm text-ink outline-none focus:border-accent"
            />
            <Boton type="submit" className="mt-4 w-full" disabled={estado === 'enviando'}>
              {estado === 'enviando' ? 'Enviando…' : 'Enviar enlace de acceso'}
            </Boton>
            {estado === 'error' && (
              <p className="mt-3 text-sm text-crit">{mensaje}</p>
            )}
            <p className="mt-4 text-center text-xs text-muted">
              Sin contraseñas: recibirás un enlace para entrar.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
