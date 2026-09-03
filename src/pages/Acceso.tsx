import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/auth/AuthProvider'
import { Boton } from '@/components/ui'
import { Campo, Input } from '@/components/campos'
import { AuthLayout } from '@/components/AuthLayout'
import { IconoOjo, IconoOjoTachado, IconoSobre } from '@/components/iconos'

type Modo = 'entrar' | 'registro' | 'recuperar'

function CampoContrasena({
  valor,
  onChange,
  nueva = false,
  autoComplete,
}: {
  valor: string
  onChange: (v: string) => void
  nueva?: boolean
  autoComplete: string
}) {
  const [ver, setVer] = useState(false)
  return (
    <Campo
      etiqueta="Contraseña"
      htmlFor="password"
      obligatorio
      ayuda={nueva ? 'Mínimo 8 caracteres.' : undefined}
    >
      <div className="relative">
        <Input
          id="password"
          type={ver ? 'text' : 'password'}
          required
          minLength={nueva ? 8 : undefined}
          autoComplete={autoComplete}
          value={valor}
          onChange={(e) => onChange(e.target.value)}
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
  )
}

export function Acceso() {
  const { session, cargando } = useAuth()
  const [modo, setModo] = useState<Modo>('entrar')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState('')
  const [correoEnviado, setCorreoEnviado] = useState('')

  if (!cargando && session) return <Navigate to="/" replace />

  function cambiarModo(m: Modo) {
    setModo(m)
    setError('')
  }

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setOcupado(true)
    setError('')
    const correo = email.trim()

    try {
      if (modo === 'entrar') {
        const { error } = await supabase.auth.signInWithPassword({ email: correo, password })
        if (error) {
          setError(
            /invalid login/i.test(error.message)
              ? 'Correo o contraseña incorrectos.'
              : error.message,
          )
        }
      } else if (modo === 'registro') {
        const { data, error } = await supabase.auth.signUp({
          email: correo,
          password,
          options: { emailRedirectTo: window.location.origin },
        })
        if (error) setError(error.message)
        else if (!data.session) setCorreoEnviado(correo)
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(correo, {
          redirectTo: `${window.location.origin}/nueva-contrasena`,
        })
        if (error) setError(error.message)
        else setCorreoEnviado(correo)
      }
    } finally {
      setOcupado(false)
    }
  }

  // ---- Pantalla "revisa tu correo" ----
  if (correoEnviado) {
    return (
      <AuthLayout>
        <div className="rounded-2xl border border-line bg-surface p-6 text-center shadow-sm">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-accent-soft text-accent-ink">
            <IconoSobre className="size-6" />
          </div>
          <h1 className="mt-3 font-display text-lg font-semibold text-ink">Revisa tu correo</h1>
          <p className="mt-2 text-sm text-muted">
            {modo === 'recuperar'
              ? 'Te hemos enviado un enlace para poner tu contraseña a '
              : 'Te hemos enviado un enlace para confirmar la cuenta a '}
            <strong className="text-ink">{correoEnviado}</strong>. Ábrelo en este dispositivo.
          </p>
          <button
            className="mt-4 min-h-11 text-sm font-medium text-accent-ink hover:underline"
            onClick={() => {
              setCorreoEnviado('')
              cambiarModo('entrar')
            }}
          >
            Volver
          </button>
        </div>
      </AuthLayout>
    )
  }

  // ---- Pantalla "recuperar contraseña" ----
  if (modo === 'recuperar') {
    return (
      <AuthLayout subtitulo="Recuperar contraseña">
        <form
          onSubmit={enviar}
          className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-6 shadow-sm"
        >
          <p className="text-sm text-muted">
            Escribe tu correo y te enviamos un enlace para poner una contraseña nueva. Úsalo
            también si es tu primera vez y aún no tienes contraseña.
          </p>
          <Campo etiqueta="Correo electrónico" htmlFor="email" obligatorio>
            <Input
              id="email"
              type="email"
              inputMode="email"
              required
              autoFocus
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@ejemplo.com"
            />
          </Campo>
          {error && (
            <p role="alert" className="text-sm text-crit">
              {error}
            </p>
          )}
          <Boton type="submit" className="w-full" cargando={ocupado}>
            Enviar enlace
          </Boton>
          <button
            type="button"
            onClick={() => cambiarModo('entrar')}
            className="min-h-11 text-center text-sm font-medium text-accent-ink hover:underline"
          >
            Volver a entrar
          </button>
        </form>
      </AuthLayout>
    )
  }

  // ---- Entrar / Crear cuenta ----
  return (
    <AuthLayout subtitulo="Agenda y planificador de clases de repaso">
      <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
        <div
          role="tablist"
          aria-label="Acceder o crear cuenta"
          className="mb-5 grid grid-cols-2 rounded-xl border border-line-strong bg-ground p-0.5"
        >
          {(
            [
              ['entrar', 'Entrar'],
              ['registro', 'Crear cuenta'],
            ] as const
          ).map(([m, txt]) => (
            <button
              key={m}
              role="tab"
              aria-selected={modo === m}
              onClick={() => cambiarModo(m)}
              className={`min-h-10 rounded-lg text-sm font-medium transition-colors ${
                modo === m ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink'
              }`}
            >
              {txt}
            </button>
          ))}
        </div>

        <form onSubmit={enviar} className="flex flex-col gap-4">
          <Campo etiqueta="Correo electrónico" htmlFor="email" obligatorio>
            <Input
              id="email"
              type="email"
              inputMode="email"
              required
              autoFocus
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@ejemplo.com"
            />
          </Campo>

          <CampoContrasena
            valor={password}
            onChange={setPassword}
            nueva={modo === 'registro'}
            autoComplete={modo === 'registro' ? 'new-password' : 'current-password'}
          />

          {error && (
            <p role="alert" className="text-sm text-crit">
              {error}
            </p>
          )}

          <Boton type="submit" className="w-full" cargando={ocupado}>
            {modo === 'entrar' ? 'Entrar' : 'Crear cuenta'}
          </Boton>

          {modo === 'entrar' && (
            <button
              type="button"
              onClick={() => cambiarModo('recuperar')}
              className="min-h-11 text-center text-sm font-medium text-accent-ink hover:underline"
            >
              He olvidado la contraseña
            </button>
          )}
          {modo === 'registro' && (
            <p className="text-center text-xs text-muted">
              Al crear una cuenta recibirás un correo para confirmarla.
            </p>
          )}
        </form>
      </div>
    </AuthLayout>
  )
}
