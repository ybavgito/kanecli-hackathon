import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { resolve, extname } from 'node:path'
import { randomBytes, createHash } from 'node:crypto'
import { createServer as createViteServer } from 'vite'
import { createMerchant } from './merchant.mjs'
import { createAppointments } from './appointment.mjs'
import { createController } from './controller.mjs'
import { createBuilder } from './builder/controller.mjs'
import { shutdownBuilderWorkers } from './builder/kane.mjs'
import { previewHandler } from './builder/preview.mjs'
import { shutdownAllTaskBrowsers } from './kane-worker.mjs'
try {
  process.loadEnvFile()
} catch (e) {
  if (e.code !== 'ENOENT') throw e
}
const port = Number(process.env.PORT || 5173),
  merchantPort = Number(process.env.MERCHANT_PORT || port + 1),
  appointmentPort = Number(process.env.APPOINTMENT_PORT || port + 2)
const production = process.env.NODE_ENV === 'production'
const publicUrl =
  process.env.PUBLIC_BASE_URL ||
  (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : '')
const baseUrl = publicUrl || `http://127.0.0.1:${port}`,
  sourceUrls = {
    return: publicUrl || `http://127.0.0.1:${merchantPort}`,
    appointment: publicUrl || `http://127.0.0.1:${appointmentPort}`,
  }
const merchant = createMerchant(),
  appointments = createAppointments(),
  controller = createController({ merchant, appointments, sourceUrls, baseUrl })
const builder = createBuilder({ baseUrl, sourceUrls, controller, merchant, appointments })
const builderPreview = previewHandler(builder)
const vite = production
  ? null
  : await createViteServer({
      server: {
        middlewareMode: true,
        hmr: { port: port + 10 },
        // Publishing evidence must not reload a user's in-progress interface.
        watch: { ignored: ['**/data/**', '**/.testmuai/**', '**/docs/**'] },
      },
      appType: 'spa',
    })
const fail = (res, error) => {
  if (!res.headersSent) {
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: error.message || 'Unexpected error' }))
  } else res.end()
}
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, baseUrl)
    if (url.pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      return res.end(JSON.stringify({ status: 'ok' }))
    }
    if (publicUrl) {
      if (await merchant.handle(req, res, url)) return
      if (await appointments.handle(req, res, url)) return
    }
    // The session cookie and request origin are bound to one host, so send loopback
    // aliases (localhost, [::1]) to it instead of letting actions fail on a host mismatch.
    const host = (req.headers.host || '').toLowerCase()
    if (host === `localhost:${port}` || host === `[::1]:${port}`) {
      res.writeHead(302, { Location: baseUrl + req.url })
      return res.end()
    }
    // Approval is bound to the human app session. Kane's source browser owns a
    // different profile and cannot approve somebody else's task by navigating here.
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
        JSON.stringify({
          error: `Open Raising Kane at ${baseUrl} to use this action. Other addresses are blocked.`,
        }),
      )
    }
    if (await builder.handle(req, res, url)) return
    if (await builderPreview(req, res, url)) return
    if (url.pathname.startsWith('/api/')) return await controller.handle(req, res, url)
    // Runtime profiles, data and evidence are never served by Vite's static middleware.
    if (
      /^\/(?:data|server|\.testmuai)(?:\/|$)/.test(url.pathname) ||
      decodeURIComponent(url.pathname)
        .split('/')
        .some((part) => part.startsWith('.')) ||
      url.pathname.startsWith('/@fs/')
    ) {
      res.writeHead(404)
      return res.end('Not found')
    }
    if (!production) return vite.middlewares(req, res)
    const root = resolve('dist')
    const path = resolve(root, '.' + decodeURIComponent(url.pathname))
    if (path !== root && !path.startsWith(root + '/')) {
      res.writeHead(404)
      return res.end('Not found')
    }
    const types = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.svg': 'image/svg+xml',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.woff2': 'font/woff2',
      '.ico': 'image/x-icon',
      '.json': 'application/json',
    }
    let content,
      extension = extname(path)
    try {
      content = await readFile(path)
    } catch {
      if (extension) {
        res.writeHead(404)
        return res.end('Not found')
      }
      content = await readFile(resolve(root, 'index.html'))
      extension = '.html'
    }
    res.writeHead(200, { 'Content-Type': types[extension] || 'application/octet-stream' })
    return res.end(content)
  } catch (e) {
    fail(res, e)
  }
})
function sourceServer(adapter, origin) {
  return createServer(async (req, res) => {
    try {
      if (await adapter.handle(req, res, new URL(req.url, origin))) return
      res.writeHead(404, { 'Content-Type': 'text/plain' })
      res.end('Source page not found')
    } catch (e) {
      fail(res, e)
    }
  })
}
const merchantServer = sourceServer(merchant, sourceUrls.return),
  appointmentServer = sourceServer(appointments, sourceUrls.appointment)
server.listen(port, process.env.HOST || (production ? '0.0.0.0' : '127.0.0.1'), () =>
  console.log(`Raising Kane at ${baseUrl}`),
)
merchantServer.listen(merchantPort, '127.0.0.1', () =>
  console.log(`Northstar sandbox at ${sourceUrls.return}/store`),
)
appointmentServer.listen(appointmentPort, '127.0.0.1', () =>
  console.log(`Linden sandbox at ${sourceUrls.appointment}/appointments`),
)
let stopping = false
async function stop() {
  if (stopping) return
  stopping = true
  shutdownBuilderWorkers()
  await shutdownAllTaskBrowsers()
  await vite?.close()
  for (const s of [server, merchantServer, appointmentServer]) s.close()
  setTimeout(() => process.exit(0), 300).unref()
}
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
