/* AulaMia · manejadores de Web Push para el service worker (se importa desde el SW generado) */

self.addEventListener('push', (event) => {
  let datos = {}
  try {
    datos = event.data ? event.data.json() : {}
  } catch (e) {
    datos = { body: event.data && event.data.text() }
  }

  const titulo = datos.title || 'AulaMia'
  const opciones = {
    body: datos.body || 'Tienes un aviso',
    tag: datos.tag,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    data: { url: datos.url || '/' },
  }

  event.waitUntil(self.registration.showNotification(titulo, opciones))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((lista) => {
      for (const cliente of lista) {
        if ('focus' in cliente) {
          cliente.navigate(url)
          return cliente.focus()
        }
      }
      return self.clients.openWindow(url)
    }),
  )
})
