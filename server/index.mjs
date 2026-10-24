import { createServer } from 'node:http'
import { randomBytes, createHash } from 'node:crypto'
import { createServer as createViteServer } from 'vite'
import { createMerchant } from './merchant.mjs'
import { createAppointments } from './appointment.mjs'
import { createController } from './controller.mjs'
import { createExplorerController } from './explorer-controller.mjs'
import { createBuilderSource, handlePublicSource } from './builder-source.mjs'
import { createBuilderController } from './builder-controller.mjs'
import { shutdownAllTaskBrowsers } from './kane-worker.mjs'
try {
  process.loadEnvFile()
} catch (e) {
  if (e.code !== 'ENOENT') throw e
}
const port = Number(process.env.PORT || 5173)
const merchantPort = Number(process.env.MERCHANT_PORT || port + 1)
const appointmentPort = Number(process.env.APPOINTMENT_PORT || port + 2)
const baseUrl = `http://127.0.0.1:${port}`
const sourceUrls = {
  return: `http://127.0.0.1:${merchantPort}`,
  appointment: `http://127.0.0.1:${appointmentPort}`,
}
const merchant = createMerchant(),
  appointments = createAppointments()
const controller = createController({ merchant, appointments, sourceUrls, baseUrl })
const explorer = createExplorerController({ baseUrl })
const builderSource = createBuilderSource({
  controller,
  merchant,
  appointments,
  sourceUrls,
  baseUrl,
})
const builder = createBuilderController({ source: builderSource, baseUrl })
const vite = await createViteServer({
  server: { middlewareMode: true, watch: { ignored: ['**/data/**', '**/.testmuai/**'] } },
  appType: 'spa',
})
const fail = (res, error) => {
  if (!res.headersSent) {
    res.writeHead(error.statusCode || 500, { 'Content-Type': 'application/json' })
    res.end(
      JSON.stringify({
        error: error.message || 'Unexpected error',
        ...(error.code ? { code: error.code } : {}),
      }),
    )
  } else res.end()
}
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, baseUrl)
    const rawCookie = (req.headers.cookie || '')
      .split(';')
      .map((x) => x.trim())
      .find((x) => x.startsWith('rk_session='))
      ?.slice(11)
    const session = /^[a-f0-9]{64}$/.test(rawCookie || '')
      ? rawCookie
      : randomBytes(32).toString('hex')
    if (session !== rawCookie)
      res.setHeader(
        'Set-Cookie',
        `rk_session=${session}; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800`,
      )
    req.clientId = createHash('sha256').update(session).digest('hex')
    if (req.method === 'POST' && req.headers.origin && req.headers.origin !== baseUrl) {
      res.writeHead(403, { 'Content-Type': 'application/json' })
      return res.end(
        JSON.stringify({ error: 'Use the Raising Kane task interface for this action.' }),
      )
    }
    if (url.pathname.startsWith('/api/')) {
      if (await builder.handle(req, res, url)) return
      if (await explorer.handle(req, res, url)) return
      return await controller.handle(req, res, url)
    }
    if (url.pathname === '/appointment') {
      res.writeHead(302, { Location: '/appointments' })
      return res.end()
    }
    if (url.pathname === '/merchant' || url.pathname.startsWith('/merchant/')) {
      if (await handlePublicSource(req, res, url, merchant)) return
      res.writeHead(404)
      return res.end('Source page not found')
    }
    if (url.pathname === '/appointments' || url.pathname.startsWith('/appointments/')) {
      if (await handlePublicSource(req, res, url, appointments)) return
      res.writeHead(404)
      return res.end('Source page not found')
    }
    if (
      /^\/(?:data|server|\.testmuai)(?:\/|$)/.test(url.pathname) ||
      url.pathname.startsWith('/@fs/')
    ) {
      res.writeHead(404)
      return res.end('Not found')
    }
    return vite.middlewares(req, res)
  } catch (e) {
    fail(res, e)
  }
})
function sourceServer(adapter, origin) {
  return createServer(async (req, res) => {
    try {
      const url = new URL(req.url, origin)
      if (url.pathname === '/appointment') {
        res.writeHead(302, { Location: '/appointments' })
        return res.end()
      }
      if (await handlePublicSource(req, res, url, adapter)) return
      res.writeHead(404, { 'Content-Type': 'text/plain' })
      res.end('Source page not found')
    } catch (e) {
      fail(res, e)
    }
  })
}
const merchantServer = sourceServer(merchant, sourceUrls.return),
  appointmentServer = sourceServer(appointments, sourceUrls.appointment)
server.listen(port, '127.0.0.1', () => console.log(`Raising Kane at ${baseUrl}`))
merchantServer.listen(merchantPort, '127.0.0.1', () =>
  console.log(`Northstar sandbox at ${sourceUrls.return}/merchant`),
)
appointmentServer.listen(appointmentPort, '127.0.0.1', () =>
  console.log(`Linden sandbox at ${sourceUrls.appointment}/appointments`),
)
let stopping = false
async function stop() {
  if (stopping) return
  stopping = true
  await builder.shutdown?.()
  await explorer.shutdown()
  await shutdownAllTaskBrowsers()
  await builderSource.shutdown()
  await vite.close()
  for (const s of [server, merchantServer, appointmentServer]) s.close()
  setTimeout(() => process.exit(0), 300).unref()
}
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
