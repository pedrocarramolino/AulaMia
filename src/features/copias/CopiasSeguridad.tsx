import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Tarjeta, Boton, ConfirmarDialogo } from '@/components/ui'
import { aISO } from '@/lib/fechas'

const TABLAS = [
  'materia',
  'alumno',
  'alumno_materia',
  'disponibilidad',
  'disponibilidad_excepcion',
  'horario_recurrente',
  'examen',
  'clase',
  'plan_examen',
  'plan_sesion',
  'tarea',
  'cambio_clase',
  'nota',
  'recordatorio',
] as const

export function CopiasSeguridad() {
  const qc = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [estado, setEstado] = useState<'idle' | 'exportando' | 'importando'>('idle')
  const [error, setError] = useState('')
  const [pendiente, setPendiente] = useState<unknown | null>(null)

  async function exportar() {
    setEstado('exportando')
    setError('')
    try {
      const datos: Record<string, unknown[]> = {}
      for (const t of TABLAS) {
        const { data, error } = await supabase.from(t).select('*')
        if (error) throw error
        datos[t] = data ?? []
      }
      const copia = {
        app: 'AulaMia',
        version: 1,
        exportado_en: new Date().toISOString(),
        datos,
      }
      const blob = new Blob([JSON.stringify(copia, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `aulamia-copia-${aISO(new Date())}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setError('No se ha podido exportar la copia.')
    } finally {
      setEstado('idle')
    }
  }

  function elegirArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError('')
    const lector = new FileReader()
    lector.onload = () => {
      try {
        const json = JSON.parse(lector.result as string)
        if (json?.app !== 'AulaMia' || !json?.datos) {
          setError('Ese archivo no es una copia de AulaMia.')
          return
        }
        setPendiente(json)
      } catch {
        setError('El archivo no es un JSON válido.')
      }
    }
    lector.readAsText(file)
  }

  async function confirmarImportar() {
    setEstado('importando')
    setError('')
    try {
      const { error } = await supabase.rpc('importar_datos', {
        p: pendiente as never,
      })
      if (error) throw error
      setPendiente(null)
      await qc.invalidateQueries()
    } catch {
      setError('No se ha podido importar la copia. No se ha cambiado nada.')
    } finally {
      setEstado('idle')
    }
  }

  return (
    <Tarjeta>
      <h2 className="font-display text-base font-semibold text-ink">Copias de seguridad</h2>
      <p className="mt-1 text-sm text-muted">
        Supabase guarda una copia automática cada día. Además puedes descargar todos
        tus datos en un archivo y volver a cargarlos cuando quieras.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Boton variante="secundario" onClick={exportar} disabled={estado !== 'idle'}>
          {estado === 'exportando' ? 'Exportando…' : 'Exportar copia'}
        </Boton>
        <Boton
          variante="secundario"
          onClick={() => inputRef.current?.click()}
          disabled={estado !== 'idle'}
        >
          Importar copia
        </Boton>
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={elegirArchivo}
        />
      </div>

      {error && <p className="mt-3 text-sm text-crit">{error}</p>}

      <ConfirmarDialogo
        abierto={pendiente !== null}
        titulo="¿Restaurar esta copia?"
        texto="Se reemplazan TODOS tus datos actuales (alumnos, clases, exámenes…) por los del archivo. Esto no se puede deshacer."
        confirmar={estado === 'importando' ? 'Restaurando…' : 'Restaurar'}
        peligro
        onCancelar={() => setPendiente(null)}
        onConfirmar={confirmarImportar}
      />
    </Tarjeta>
  )
}
