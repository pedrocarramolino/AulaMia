import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/auth/AuthProvider'
import { Boton } from '@/components/ui'
import { Campo, Input } from '@/components/campos'

type Modo = 'entrar' | 'registro' | 'recuperar'

function CampoContrasena({
  valor,
  onChange,
  nueva = false,
}: {
  valor: string
  onChange: (v: string) => void
  nueva?: boolean
}) {
  const [ver, setVer] = useState(false)
  return (
    <Campo etiqueta="Contraseña" htmlFor="password" obligatorio>
      <div className="relative">
        <Input
          id="password"
          type={ver ? 'text' : 'password'}
          required
          minLength={nueva ? 8 : undefined}
          autoComplete={nueva ? 'new-password' : 'current-password'}
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          className="pr-16"
          placeholder={nueva ? 'Mínimo 8 caracteres' : ''}
        />
        <button
          type="button"
          onClick={() => setVer((v) => !v)}
          className="absolute inset-y-0 right-0 px-3 text-xs font-medium text-muted hover:text-ink"
        >
          {ver ? 'Ocultar' : 'Ver'}
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
            error.message.includes('Invalid login')
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

  return (
    <div className="flex min-h-dvh items-center justify-center bg-ground px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <img src="/pwa-512.png" alt="" width={96} height={96} className="rounded-2xl" />
          <span className="mt-2 font-display text-2xl font-bold tracking-tight text-ink">
            Aula<span className="text-accent-ink">Mia</span>
          </span>
          <p className="mt-1 text-sm text-muted">Agenda y planificador de clases de repaso</p>
        </div>

        {correoEnviado ? (
          <div className="rounded-2xl border border-line bg-surface p-6 text-center">
            <h1 className="font-display text-lg font-semibold text-ink">Revisa tu correo</h1>
            <p className="mt-2 text-sm text-muted">
              {modo === 'recuperar'
                ? 'Te hemos enviado un enlace para poner tu contraseña a '
                : 'Te hemos enviado un enlace para confirmar la cuenta a '}
              <strong className="text-ink">{correoEnviado}</strong>. Ábrelo en este dispositivo.
            </p>
            <button
              className="mt-4 text-sm font-medium text-accent-ink hover:underline"
              onClick={() => {
                setCorreoEnviado('')
                setModo('entrar')
              }}
            >
              Volver
            </button>
          </div>
        ) : (
          <form onSubmit={enviar} className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-6">
            <h1 className="font-display text-lg font-semibold text-ink">
              {modo === 'entrar' ? 'Entrar' : modo === 'registro' ? 'Crear cuenta' : 'Recuperar contraseña'}
            </h1>

            <Campo etiqueta="Correo electrónico" htmlFor="email" obligatorio>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tucorreo@ejemplo.com"
              />
            </Campo>

            {modo !== 'recuperar' && (
              <CampoContrasena valor={password} onChange={setPassword} nueva={modo === 'registro'} />
            )}

            {error && <p className="text-sm text-crit">{error}</p>}

            <Boton type="submit" className="w-full" disabled={ocupado}>
              {ocupado
                ? 'Un momento…'
                : modo === 'entrar'
                  ? 'Entrar'
                  : modo === 'registro'
                    ? 'Crear cuenta'
                    : 'Enviar enlace'}
            </Boton>

            <div className="flex flex-col gap-1.5 text-center text-sm">
              {modo === 'entrar' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setModo('recuperar')
                      setError('')
                    }}
                    className="font-medium text-accent-ink hover:underline"
                  >
                    He olvidado la contraseña (o es mi primera vez)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setModo('registro')
                      setError('')
                    }}
                    className="text-muted hover:text-ink"
                  >
                    Crear una cuenta nueva
                  </button>
                </>
              )}
              {modo !== 'entrar' && (
                <button
                  type="button"
                  onClick={() => {
                    setModo('entrar')
                    setError('')
                  }}
                  className="font-medium text-accent-ink hover:underline"
                >
                  Volver a entrar
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
