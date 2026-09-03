import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/auth/AuthProvider'
import { Boton, Cargando } from '@/components/ui'
import { Campo, Input } from '@/components/campos'

export function NuevaContrasena() {
  const { session, cargando } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState('')
  const [hecho, setHecho] = useState(false)

  if (cargando) return <Cargando />

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (password !== password2) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setOcupado(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ password })
    setOcupado(false)
    if (error) setError(error.message)
    else setHecho(true)
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-ground px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <img src="/pwa-512.png" alt="" width={96} height={96} className="rounded-2xl" />
          <span className="mt-2 font-display text-2xl font-bold tracking-tight text-ink">
            Aula<span className="text-accent-ink">Mia</span>
          </span>
        </div>

        {!session ? (
          <div className="rounded-2xl border border-line bg-surface p-6 text-center">
            <h1 className="font-display text-lg font-semibold text-ink">Enlace no válido</h1>
            <p className="mt-2 text-sm text-muted">
              Este enlace ha caducado o ya se ha usado. Pide uno nuevo desde la pantalla de acceso.
            </p>
            <Link
              to="/acceso"
              className="mt-4 inline-block text-sm font-medium text-accent-ink hover:underline"
            >
              Ir a acceso
            </Link>
          </div>
        ) : hecho ? (
          <div className="rounded-2xl border border-line bg-surface p-6 text-center">
            <h1 className="font-display text-lg font-semibold text-ink">Contraseña guardada</h1>
            <p className="mt-2 text-sm text-muted">Ya puedes usar tu correo y esta contraseña para entrar.</p>
            <Boton className="mt-4 w-full" onClick={() => navigate('/', { replace: true })}>
              Entrar en AulaMia
            </Boton>
          </div>
        ) : (
          <form onSubmit={enviar} className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-6">
            <h1 className="font-display text-lg font-semibold text-ink">Pon tu contraseña</h1>
            <Campo etiqueta="Nueva contraseña" htmlFor="p1" obligatorio>
              <Input
                id="p1"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
              />
            </Campo>
            <Campo etiqueta="Repite la contraseña" htmlFor="p2" obligatorio>
              <Input
                id="p2"
                type="password"
                required
                autoComplete="new-password"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
              />
            </Campo>
            {error && <p className="text-sm text-crit">{error}</p>}
            <Boton type="submit" className="w-full" disabled={ocupado}>
              {ocupado ? 'Guardando…' : 'Guardar contraseña'}
            </Boton>
          </form>
        )}
      </div>
    </div>
  )
}
