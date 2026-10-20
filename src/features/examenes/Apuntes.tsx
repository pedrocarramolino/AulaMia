import { useState, type FormEvent } from 'react'
import { Boton, Modal } from '@/components/ui'
import { Campo, Textarea } from '@/components/campos'
import {
  useApuntesExamen,
  useGenerarApuntes,
  type Examen,
  type TemaApuntes,
} from './api'

export function ApuntesExamen({ examen }: { examen: Examen }) {
  const { data: apuntes } = useApuntesExamen(examen.id)
  const generar = useGenerarApuntes(examen.id)
  const [abierto, setAbierto] = useState(false)
  const [descripcion, setDescripcion] = useState('')
  const [enfoque, setEnfoque] = useState('')

  function abrir() {
    setDescripcion(apuntes?.descripcion ?? examen.temario ?? '')
    setEnfoque(apuntes?.enfoque ?? '')
    generar.reset()
    setAbierto(true)
  }

  function enviar(e: FormEvent) {
    e.preventDefault()
    if (!descripcion.trim()) return
    setAbierto(false)
    generar.mutate({ descripcion: descripcion.trim(), enfoque: enfoque.trim() })
  }

  return (
    <section className="mt-5">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-display text-base font-semibold text-ink">Apuntes</h2>
        {apuntes && !generar.isPending && (
          <button onClick={abrir} className="text-sm font-medium text-accent-ink hover:underline">
            Rehacer
          </button>
        )}
      </div>

      {generar.isPending ? (
        <div
          role="status"
          className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-surface px-5 py-8 text-center"
        >
          <div className="size-6 animate-spin rounded-full border-2 border-line-strong border-t-accent" />
          <p className="text-sm text-muted">
            Preparando los apuntes… Suele tardar alrededor de un minuto.
          </p>
        </div>
      ) : apuntes ? (
        <div className="flex flex-col gap-3">
          {apuntes.contenido.temas.map((t, i) => (
            <TemaApunte key={i} tema={t} abierto={i === 0} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-line-strong bg-surface px-5 py-8 text-center">
          <p className="text-sm text-muted">
            Cuéntame de qué va el examen y preparo apuntes para que {examen.alumno.nombre} repase:
            lo esencial de cada tema, conceptos clave y preguntas de práctica.
          </p>
          <Boton className="mt-4" onClick={abrir}>
            Preparar apuntes
          </Boton>
        </div>
      )}

      {generar.error && (
        <p role="alert" className="mt-2 text-sm text-crit">
          {generar.error.message}
        </p>
      )}

      <Modal abierto={abierto} titulo="¿De qué va el examen?" onCerrar={() => setAbierto(false)}>
        <form onSubmit={enviar} className="flex flex-col gap-4">
          <Campo
            etiqueta="Temas y contenidos"
            obligatorio
            ayuda="Lo que entra: temas, apartados, páginas del libro… Los apuntes saldrán en el idioma en que lo escribas."
          >
            <Textarea
              rows={5}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder={'Tema 4: La cèl·lula\nTema 5: Els teixits'}
              required
            />
          </Campo>
          <Campo etiqueta="¿En qué quieres que se centre?" ayuda="Opcional.">
            <Textarea
              rows={2}
              value={enfoque}
              onChange={(e) => setEnfoque(e.target.value)}
              placeholder="Le cuestan las definiciones; más preguntas de relacionar conceptos"
            />
          </Campo>
          <div className="flex gap-2">
            <Boton type="submit" disabled={!descripcion.trim()}>
              Preparar apuntes
            </Boton>
            <Boton type="button" variante="secundario" onClick={() => setAbierto(false)}>
              Cancelar
            </Boton>
          </div>
        </form>
      </Modal>
    </section>
  )
}

function TemaApunte({ tema, abierto }: { tema: TemaApuntes; abierto: boolean }) {
  const [verRespuestas, setVerRespuestas] = useState(false)

  return (
    <details open={abierto} className="rounded-2xl border border-line bg-surface">
      <summary className="cursor-pointer list-none px-4 py-3 font-display text-base font-semibold text-ink">
        {tema.titulo}
      </summary>

      <div className="flex flex-col gap-4 border-t border-line px-4 py-4 text-sm">
        <p className="text-ink">{tema.explicacion}</p>

        {tema.puntos_clave.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">Puntos clave</h4>
            <ul className="mt-1.5 list-disc space-y-1 pl-5 text-ink">
              {tema.puntos_clave.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>
        )}

        {tema.conceptos.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">Conceptos</h4>
            <dl className="mt-1.5 space-y-1.5">
              {tema.conceptos.map((c, i) => (
                <div key={i}>
                  <dt className="inline font-semibold text-ink">{c.termino}: </dt>
                  <dd className="inline text-ink">{c.definicion}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {tema.preguntas.length > 0 && (
          <div>
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">
                Preguntas de repaso
              </h4>
              <button
                type="button"
                onClick={() => setVerRespuestas((v) => !v)}
                className="text-xs font-medium text-accent-ink hover:underline"
              >
                {verRespuestas ? 'Ocultar respuestas' : 'Ver respuestas'}
              </button>
            </div>
            <ol className="mt-1.5 list-decimal space-y-2 pl-5 text-ink">
              {tema.preguntas.map((p, i) => (
                <li key={i}>
                  {p.pregunta}
                  {verRespuestas && <p className="mt-0.5 text-muted">{p.respuesta}</p>}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </details>
  )
}
