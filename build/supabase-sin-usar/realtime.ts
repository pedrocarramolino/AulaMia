// Sustituye a @supabase/realtime-js en el build.
//
// AulaMia no usa suscripciones en tiempo real: nadie llama a `supabase.channel()`.
// supabase-js instancia el cliente de realtime dentro de su constructor, así que
// el tree-shaking no puede quitarlo y arrastra también a @supabase/phoenix.
//
// `setAuth` sí se llama en el flujo normal de sesión (al iniciar y en cada cambio
// de token), por eso es un no-op silencioso. El resto de métodos avisa en alto:
// si algún día hace falta tiempo real, hay que quitar el alias de `vite.config.ts`.

const AVISO =
  'Este build no incluye @supabase/realtime-js porque AulaMia no usa tiempo real. ' +
  'Quita el alias de vite.config.ts si necesitas suscripciones.'

export class RealtimeClient {
  setAuth() {}

  channel(): never {
    throw new Error(AVISO)
  }

  getChannels(): never {
    throw new Error(AVISO)
  }

  removeChannel(): never {
    throw new Error(AVISO)
  }

  removeAllChannels(): never {
    throw new Error(AVISO)
  }
}
