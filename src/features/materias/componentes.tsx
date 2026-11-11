import { useState } from 'react'
import { Boton } from '@/components/ui'
import { Input, Select } from '@/components/campos'
import { IconoX } from '@/components/iconos'
import { useMaterias, useCrearMateria } from './api'

const NUEVA = '__nueva__'

// Desplegable de materias que deja crear una nueva sin salir del formulario.
// Va dentro de otros <form>, así que no puede llevar el suyo: Enter se captura a mano.
export function SelectorMateria({
  value,
  onChange,
}: {
  value: string
  onChange: (id: string) => void
}) {
  const { data: materias } = useMaterias()
  const crear = useCrearMateria()
  const [creando, setCreando] = useState(false)
  const [nombre, setNombre] = useState('')
  const [error, setError] = useState('')

  function cancelar() {
    setCreando(false)
    setNombre('')
    setError('')
  }

  async function anadir() {
    const limpio = nombre.trim()
    if (!limpio) return
    setError('')
    try {
      const existente = materias?.find((m) => m.nombre.toLowerCase() === limpio.toLowerCase())
      const materia = existente ?? (await crear.mutateAsync({ nombre: limpio }))
      onChange(materia.id)
      cancelar()
    } catch {
      setError('No se ha podido crear la materia.')
    }
  }

  if (creando) {
    return (
      <div>
        <div className="flex gap-2">
          <Input
            value={nombre}
            onChange={(e) => {
              setNombre(e.target.value)
              setError('')
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                anadir()
              } else if (e.key === 'Escape') {
                cancelar()
              }
            }}
            placeholder="Música, Inglés…"
            aria-label="Nueva materia"
            autoFocus
          />
          <Boton
            type="button"
            onClick={anadir}
            cargando={crear.isPending}
            disabled={!nombre.trim()}
            className="shrink-0"
          >
            Añadir
          </Boton>
          <Boton
            type="button"
            variante="secundario"
            onClick={cancelar}
            aria-label="Cancelar"
            className="shrink-0 px-3"
          >
            <IconoX className="size-4" />
          </Boton>
        </div>
        {error && (
          <p role="alert" className="mt-1.5 text-xs text-crit">
            {error}
          </p>
        )}
      </div>
    )
  }

  return (
    <Select
      value={value}
      onChange={(e) => (e.target.value === NUEVA ? setCreando(true) : onChange(e.target.value))}
    >
      <option value="">Sin materia</option>
      {materias?.map((m) => (
        <option key={m.id} value={m.id}>
          {m.nombre}
        </option>
      ))}
      <option value={NUEVA}>+ Nueva materia…</option>
    </Select>
  )
}
