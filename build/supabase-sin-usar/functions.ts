// Sustituye a @supabase/functions-js en el build.
//
// La única Edge Function de AulaMia (`enviar-recordatorios`) la dispara pg_cron
// con la cabecera `x-cron-secret`, nunca el navegador: no hay ni un
// `supabase.functions.invoke()` en `src/`.
//
// Las clases de error solo se re-exportan desde supabase-js, nunca se usan dentro.

const AVISO =
  'Este build no incluye @supabase/functions-js porque AulaMia no invoca Edge ' +
  'Functions desde el cliente. Quita el alias de vite.config.ts si hace falta.'

export const FunctionRegion = { Any: 'any' } as const

export class FunctionsClient {
  invoke(): never {
    throw new Error(AVISO)
  }

  setAuth() {}
}

export class FunctionsError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FunctionsError'
  }
}

export class FunctionsFetchError extends FunctionsError {}
export class FunctionsHttpError extends FunctionsError {}
export class FunctionsRelayError extends FunctionsError {}
