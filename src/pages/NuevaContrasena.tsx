import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/auth/AuthProvider'
import { Boton, Cargando } from '@/components/ui'
import { Campo, Input } from '@/components/campos'
import { AuthLayout } from '@/components/AuthLayout'
import { IconoOjo, IconoOjoTachado } from '@/components/iconos'

export function NuevaContrasena() {
  const { session, cargando } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [ver, setVer] = useState(false)
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

  if (!session) {
    return (
      <AuthLayout>
        <div className="rounded-2xl border border-line bg-surface p-6 text-center shadow-sm">
          <h1 className="font-display text-lg font-semibold text-ink">Enlace no válido</h1>
          <p className="mt-2 text-sm text-muted">
            Este enlace ha caducado o ya se ha usado. Pide uno nuevo desde la pantalla de acceso.
          </p>
          <Link
            to="/acceso"
            className="mt-4 inline-flex min-h-11 items-center text-sm font-medium text-accent-ink hover:underline"
          >
            Ir a acceso
          </Link>
        </div>
      </AuthLayout>
    )
  }

  if (hecho) {
    return (
      <AuthLayout>
        <div className="rounded-2xl border border-line bg-surface p-6 text-center shadow-sm">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-good-soft text-good">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="size-6" aria-hidden="true">
              <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="mt-3 font-display text-lg font-semibold text-ink">Contraseña guardada</h1>
          <p className="mt-2 text-sm text-muted">
            Ya puedes usar tu correo y esta contraseña para entrar.
          </p>
          <Boton className="mt-4 w-full" onClick={() => navigate('/', { replace: true })}>
            Entrar en AulaMia
          </Boton>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout subtitulo="Pon tu contraseña">
      <form
        onSubmit={enviar}
        className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-6 shadow-sm"
      >
        <Campo etiqueta="Nueva contraseña" htmlFor="p1" obligatorio ayuda="Mínimo 8 caracteres.">
          <div className="relative">
            <Input
              id="p1"
              type={ver ? 'text' : 'password'}
              required
              minLength={8}
              autoFocus
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-11"
            />
            <button
              type="button"
              onClick={() => setVer((v) => !v)}
              aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              className="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted hover:text-ink"
            >
              {ver ? <IconoOjoTachado className="size-5" /> : <IconoOjo className="size-5" />}
            </button>
          </div>
        </Campo>
        <Campo etiqueta="Repite la contraseña" htmlFor="p2" obligatorio>
          <Input
            id="p2"
            type={ver ? 'text' : 'password'}
            required
            autoComplete="new-password"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
          />
        </Campo>
        {error && (
          <p role="alert" className="text-sm text-crit">
            {error}
          </p>
        )}
        <Boton type="submit" className="w-full" cargando={ocupado}>
          Guardar contraseña
        </Boton>
      </form>
    </AuthLayout>
  )
}
