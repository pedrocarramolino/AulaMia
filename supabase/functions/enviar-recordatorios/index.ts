// AulaMia · Edge Function · enviar-recordatorios
// Lo invoca pg_cron cada 5 min con la cabecera x-cron-secret.
// Envía Web Push de los recordatorios vencidos y los marca como enviados.

import webpush from 'npm:web-push@3.6.7'
import { createClient } from 'jsr:@supabase/supabase-js@2'

Deno.serve(async (req: Request) => {
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: cfg, error: cfgErr } = await admin.rpc('config_push')
  if (cfgErr || !cfg) {
    return new Response(JSON.stringify({ error: 'sin configuración' }), { status: 500 })
  }

  if (req.headers.get('x-cron-secret') !== cfg.cron_secret) {
    return new Response(JSON.stringify({ error: 'no autorizado' }), { status: 401 })
  }

  webpush.setVapidDetails(cfg.vapid_subject, cfg.vapid_public, cfg.vapid_private)

  const { data: pendientes } = await admin
    .from('recordatorio')
    .select('*')
    .eq('estado', 'pendiente')
    .lte('dispara_en', new Date().toISOString())
    .limit(200)

  let enviados = 0

  for (const r of pendientes ?? []) {
    const { data: subs } = await admin
      .from('push_subscription')
      .select('*')
      .eq('user_id', r.user_id)

    const payload = JSON.stringify({
      title: 'AulaMia',
      body: r.mensaje ?? 'Tienes un aviso',
      tag: r.id,
      url:
        r.ref_tipo === 'examen'
          ? `/examenes/${r.ref_id}`
          : `/agenda/clase/${r.ref_id}`,
    })

    for (const s of subs ?? []) {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
        )
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode
        if (code === 404 || code === 410) {
          await admin.from('push_subscription').delete().eq('id', s.id)
        }
      }
    }

    await admin.from('recordatorio').update({ estado: 'enviado' }).eq('id', r.id)
    enviados++
  }

  return new Response(JSON.stringify({ enviados }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
