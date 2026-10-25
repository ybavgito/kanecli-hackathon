import test from 'node:test'
import assert from 'node:assert/strict'
import { storefrontPage } from '../../server/storefront.mjs'

test('storefront offers connected, record-preserving paths with distinct business outcomes', () => {
  const root = new URL('http://localhost/store?taskId=test-record&view=readonly')
  const visited = new Set(),
    queue = [root]
  while (queue.length && visited.size < 40) {
    const url = queue.shift()
    if (visited.has(url.href)) continue
    visited.add(url.href)
    const html = storefrontPage(url)
    assert.ok(html, url.pathname)
    for (const [, href] of html.matchAll(/href="([^"]+)"/g)) {
      const child = new URL(href.replaceAll('&amp;', '&'), url)
      assert.equal(child.searchParams.get('taskId'), 'test-record')
      assert.equal(child.searchParams.get('view'), 'readonly')
      if (child.pathname.startsWith('/store') && !visited.has(child.href)) queue.push(child)
    }
  }
  assert.ok(visited.size >= 12)
  assert.ok([...visited].some((url) => url.includes('/store/products/red-running-shoes')))
  assert.ok([...visited].some((url) => url.includes('/store/orders/ORD-1042/delivery')))
  const page = (path) => storefrontPage(new URL(path + '?taskId=test-record', root))
  assert.ok(page('/store/orders/ORD-1042').includes('Start a return'))
  assert.ok(page('/store/orders/ORD-0938').includes('Return window closed'))
  assert.ok(!page('/store/orders/ORD-0938').includes('Start a return'))
  assert.ok(
    storefrontPage(new URL('/store/products/red-running-shoes?size=9', root)).includes('Sold out'),
  )
  assert.equal(storefrontPage(new URL('/store/products/missing', root)), null)
})
