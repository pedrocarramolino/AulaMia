// AulaMia · Edge Function · generar-apuntes
//
// Genera apuntes de repaso para un examen con Claude y los guarda en
// `apuntes_examen`. La llama la app con la sesión del usuario (verify_jwt on):
// el cliente de Supabase reenvía ese JWT, así que RLS limita lectura y
// escritura a los datos del propio profesor.
//
// Requiere el secreto ANTHROPIC_API_KEY en las Edge Functions del proyecto.

import Anthropic from 'npm:@anthropic-ai/sdk@0.136.0'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const MODELO = 'claude-opus-5-5'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ESQUEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['temas'],
  properties: {
    temas: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['titulo', 'explicacion', 'puntos_clave', 'conceptos', 'preguntas'],
        properties: {
          titulo: { type: 'string' },
          explicacion: { type: 'string' },
          puntos_clave: { type: 'array', items: { type: 'string' } },
          conceptos: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['termino', 'definicion'],
              properties: { termino: { type: 'string' }, definicion: { type: 'string' } },
            },
          },
          preguntas: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['pregunta', 'respuesta'],
              properties: { pregunta: { type: 'string' }, respuesta: { type: 'string' } },
            },
          },
        },
      },
    },
  },
}

const SISTEMA = `Preparas apuntes de repaso para que un alumno estudie para un examen. Te los encarga su profesor particular, que te cuenta de qué va el examen.

Escribe los apuntes en el mismo idioma en que el profesor describe el examen (catalán, castellano, inglés...), no en el idioma de estas instrucciones.

Para cada tema del examen:
- titulo: el nombre del tema.
- explicacion: lo esencial en 2-4 frases claras, al nivel del curso del alumno.
- puntos_clave: 4-6 ideas que tiene que saber, cada una en una frase.
- conceptos: 3-6 términos importantes con una definición breve.
- preguntas: 3 preguntas de repaso del estilo de las de un examen, con su respuesta.

Cíñete a lo que el profesor indica. Si describe un tema solo por su nombre, cubre lo que se suele estudiar de ese tema en ese curso. Si el profesor pide centrarse en algo, dale más peso. Sé concreto: un alumno tiene que poder estudiar con esto.`

const json = (cuerpo: unknown, status = 200) =>
  new Response(JSON.stringify(cuerpo), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) return json({ error: 'falta_clave' }, 500)

  const { examen_id, descripcion, enfoque } = (await req.json()) as {
    examen_id?: string
    descripcion?: string
    enfoque?: string
  }
  if (!examen_id || !descripcion?.trim()) return json({ error: 'faltan_datos' }, 400)

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  })

  const { data: examen, error: errExamen } = await supabase
    .from('examen')
    .select('titulo, materia:materia(nombre), alumno:alumno(curso, nivel)')
    .eq('id', examen_id)
    .single()
  if (errExamen || !examen) return json({ error: 'examen_no_encontrado' }, 404)

  // Relaciones a una sola fila: PostgREST devuelve un objeto, no una lista.
  const materia = (examen.materia as unknown as { nombre: string } | null)?.nombre
  const alumno = examen.alumno as unknown as { curso: string | null; nivel: string | null } | null

  const peticion = [
    `Examen: ${examen.titulo}`,
    materia && `Materia: ${materia}`,
    alumno?.curso && `Curso del alumno: ${alumno.curso}`,
    alumno?.nivel && `Nivel del alumno: ${alumno.nivel}`,
    `\nDe qué va el examen, según el profesor:\n${descripcion.trim()}`,
    enfoque?.trim() && `\nEn qué quiere que se centren los apuntes:\n${enfoque.trim()}`,
  ]
    .filter(Boolean)
    .join('\n')

  const claude = new Anthropic({ apiKey })

  let respuesta: Anthropic.Beta.BetaMessage
  try {
    respuesta = await claude.beta.messages
      .stream({
        model: MODELO,
        max_tokens: 32000,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        output_config: { effort: 'medium', format: { type: 'json_schema', schema: ESQUEMA } },
        system: SISTEMA,
        messages: [{ role: 'user', content: peticion }],
      })
      .finalMessage()
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) return json({ error: 'clave_invalida' }, 502)
    if (e instanceof Anthropic.RateLimitError) return json({ error: 'limite' }, 429)
    if (e instanceof Anthropic.APIError) {
      return json({ error: 'api', estado: e.status, detalle: e.message }, 502)
    }
    throw e
  }

  if (respuesta.stop_reason === 'refusal') return json({ error: 'rechazado' }, 422)
  if (respuesta.stop_reason === 'max_tokens') return json({ error: 'demasiado_largo' }, 422)

  const texto = respuesta.content.find((b) => b.type === 'text')
  if (!texto || texto.type !== 'text') return json({ error: 'sin_respuesta' }, 502)

  const contenido = JSON.parse(texto.text)

  const { error: errGuardar } = await supabase.from('apuntes_examen').upsert({
    examen_id,
    descripcion: descripcion.trim(),
    enfoque: enfoque?.trim() || null,
    contenido,
    modelo: respuesta.model,
  })
  if (errGuardar) return json({ error: 'guardar', detalle: errGuardar.message }, 500)

  return json({ ok: true })
})
