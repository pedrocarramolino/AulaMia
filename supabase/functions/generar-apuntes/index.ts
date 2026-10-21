// AulaMia · Edge Function · generar-apuntes
//
// Genera apuntes de repaso para un examen y los guarda en `apuntes_examen`.
// La llama la app con la sesión del usuario (verify_jwt on): el cliente de
// Supabase reenvía ese JWT, así que RLS limita lectura y escritura a los datos
// del propio profesor.
//
// Proveedor según el secreto que haya en las Edge Functions:
//   ANTHROPIC_API_KEY → Claude (de pago, mejor calidad)
//   GEMINI_API_KEY    → Gemini Flash (plan gratuito de Google, con límite diario)
// Si están los dos, Claude.

import Anthropic from 'npm:@anthropic-ai/sdk@0.136.0'
import { ApiError, FinishReason, GoogleGenAI } from 'npm:@google/genai@2.30.0'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const MODELO_CLAUDE = 'claude-opus-5-5'
const MODELO_GEMINI = 'gemini-2.5-flash'

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

type Resultado =
  | { ok: true; texto: string; modelo: string }
  | { ok: false; error: string; status: number; detalle?: string }

async function conClaude(apiKey: string, peticion: string): Promise<Resultado> {
  const claude = new Anthropic({ apiKey })
  let respuesta: Anthropic.Beta.BetaMessage
  try {
    respuesta = await claude.beta.messages
      .stream({
        model: MODELO_CLAUDE,
        max_tokens: 32000,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        output_config: { effort: 'medium', format: { type: 'json_schema', schema: ESQUEMA } },
        system: SISTEMA,
        messages: [{ role: 'user', content: peticion }],
      })
      .finalMessage()
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) return { ok: false, error: 'clave_invalida', status: 502 }
    if (e instanceof Anthropic.RateLimitError) return { ok: false, error: 'limite', status: 429 }
    if (e instanceof Anthropic.APIError) {
      return { ok: false, error: 'api', status: 502, detalle: e.message }
    }
    throw e
  }

  if (respuesta.stop_reason === 'refusal') return { ok: false, error: 'rechazado', status: 422 }
  if (respuesta.stop_reason === 'max_tokens') return { ok: false, error: 'demasiado_largo', status: 422 }

  const texto = respuesta.content.find((b) => b.type === 'text')
  if (!texto || texto.type !== 'text') return { ok: false, error: 'sin_respuesta', status: 502 }
  return { ok: true, texto: texto.text, modelo: respuesta.model }
}

async function conGemini(apiKey: string, peticion: string): Promise<Resultado> {
  const gemini = new GoogleGenAI({ apiKey })
  let respuesta
  try {
    respuesta = await gemini.models.generateContent({
      model: MODELO_GEMINI,
      contents: peticion,
      config: {
        systemInstruction: SISTEMA,
        responseMimeType: 'application/json',
        responseJsonSchema: ESQUEMA,
      },
    })
  } catch (e) {
    if (e instanceof ApiError) {
      if (e.status === 429) return { ok: false, error: 'limite', status: 429 }
      // Gemini responde a una clave mala con un 400 genérico; solo el texto lo distingue.
      if (e.status === 401 || e.status === 403 || (e.status === 400 && /API key/i.test(e.message))) {
        return { ok: false, error: 'clave_invalida', status: 502 }
      }
      return { ok: false, error: 'api', status: 502, detalle: e.message }
    }
    throw e
  }

  const motivo = respuesta.candidates?.[0]?.finishReason
  if (
    respuesta.promptFeedback?.blockReason ||
    motivo === FinishReason.SAFETY ||
    motivo === FinishReason.PROHIBITED_CONTENT ||
    motivo === FinishReason.BLOCKLIST
  ) {
    return { ok: false, error: 'rechazado', status: 422 }
  }
  if (motivo === FinishReason.MAX_TOKENS) return { ok: false, error: 'demasiado_largo', status: 422 }

  const texto = respuesta.text
  if (!texto) return { ok: false, error: 'sin_respuesta', status: 502 }
  return { ok: true, texto, modelo: MODELO_GEMINI }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const claveClaude = Deno.env.get('ANTHROPIC_API_KEY')
  const claveGemini = Deno.env.get('GEMINI_API_KEY')
  if (!claveClaude && !claveGemini) return json({ error: 'falta_clave' }, 500)

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

  const resultado = claveClaude
    ? await conClaude(claveClaude, peticion)
    : await conGemini(claveGemini!, peticion)
  if (!resultado.ok) {
    return json({ error: resultado.error, detalle: resultado.detalle }, resultado.status)
  }

  const contenido = JSON.parse(resultado.texto)

  const { error: errGuardar } = await supabase.from('apuntes_examen').upsert({
    examen_id,
    descripcion: descripcion.trim(),
    enfoque: enfoque?.trim() || null,
    contenido,
    modelo: resultado.modelo,
  })
  if (errGuardar) return json({ error: 'guardar', detalle: errGuardar.message }, 500)

  return json({ ok: true })
})
