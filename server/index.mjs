import { createServer } from 'node:http'
import { createServer as createViteServer } from 'vite'
import { createMerchant } from './merchant.mjs'
import { createController } from './controller.mjs'
import { createExplorerController } from './explorer-controller.mjs'
import { shutdownAllTaskBrowsers } from './kane-worker.mjs'

try { process.loadEnvFile() } catch (error) {
  if (error.code !== 'ENOENT') throw error
}

const port = Number(process.env.PORT || 5173)
const baseUrl = `http://127.0.0.1:${port}`
let controller
const merchant = createMerchant({
  verifyApproval: input => controller?.verifyLegacyApproval(input) ?? false,
})
controller = createController({ merchant, baseUrl })
const explorer = createExplorerController({ baseUrl })
const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' })
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, baseUrl)
    if (url.pathname.startsWith('/merchant')) {
      if (await merchant.handle(req, res, url)) return
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
      return res.end('Merchant page not found.')
    }
    if (url.pathname.startsWith('/api/')) {
      if (await explorer.handle(req, res, url)) return
      return await controller.handle(req, res, url)
    }
    return vite.middlewares(req, res)
  } catch (error) {
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' })
      res.end(JSON.stringify({ error: error.message || 'Unexpected error.' }))
    } else res.end()
  }
})
server.listen(port, '127.0.0.1', () => console.log(`Raising Kane at ${baseUrl}`))

let stopping = false
async function stop() {
  if (stopping) return
  stopping = true
  await explorer.shutdown()
  await shutdownAllTaskBrowsers()
  await vite.close()
  server.close(() => process.exit(0))
  setTimeout(() => process.exit(0), 3000).unref()
}
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
