// Sustituye a @supabase/storage-js en el build.
//
// AulaMia no sube ficheros: no hay ni una llamada a `supabase.storage`. Como
// supabase-js lo instancia en su constructor, entra en el bundle junto con su
// dependencia `iceberg-js`.
//
// `StorageApiError` solo se re-exporta desde supabase-js, nunca se usa dentro.

const AVISO =
  'Este build no incluye @supabase/storage-js porque AulaMia no usa almacenamiento. ' +
  'Quita el alias de vite.config.ts si necesitas subir ficheros.'

export class StorageClient {
  from(): never {
    throw new Error(AVISO)
  }
}

export class StorageApiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'StorageApiError'
  }
}
