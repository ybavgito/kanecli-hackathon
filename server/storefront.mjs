const escape = (value) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  )
const products = [
  {
    id: 'red-running-shoes',
    name: 'Red running shoes',
    category: 'Footwear',
    price: 80,
    detail: 'A lightweight everyday running shoe. Size 8 is available; size 9 is sold out.',
    color: '#b9513c',
  },
  {
    id: 'black-jacket',
    name: 'Black jacket',
    category: 'Outerwear',
    price: 120,
    detail: 'A weather-resistant shell with a removable hood. Your order contains Medium.',
    color: '#353e42',
  },
  {
    id: 'trail-pack',
    name: 'Trail day pack',
    category: 'Equipment',
    price: 55,
    detail: 'An 18-litre pack for day walks. Equipment has a separate warranty route.',
    color: '#708354',
  },
]
export function storefrontPage(url) {
  if (!url.pathname.startsWith('/store')) return null
  const taskId = url.searchParams.get('taskId') || 'demo'
  if (!/^[\w-]{1,100}$/.test(taskId)) return null
  const readonly = url.searchParams.get('view') === 'readonly'
  const link = (path, extra = {}) => {
    const u = new URL(path, 'http://store.local')
    u.searchParams.set('taskId', taskId)
    if (readonly) u.searchParams.set('view', 'readonly')
    for (const [k, v] of Object.entries(extra)) u.searchParams.set(k, v)
    return escape(u.pathname + u.search)
  }
  const a = (path, text, extra) => '<a href="' + link(path, extra) + '">' + escape(text) + '</a>'
  const card = (p) =>
    '<article class="product"><div class="swatch" style="background:' +
    p.color +
    '"><span>' +
    escape(p.category) +
    '</span></div><h2>' +
    a('/store/products/' + p.id, p.name) +
    '</h2><p>$' +
    p.price.toFixed(2) +
    '</p><p>' +
    escape(p.detail) +
    '</p>' +
    a('/store/products/' + p.id, 'View product & options →') +
    '</article>'
  let title, body
  if (url.pathname === '/store' || url.pathname === '/store/') {
    title = 'Your next chapter, outside.'
    body =
      '<p class="eyebrow">Northstar · Autumn collection</p><h1>' +
      title +
      '</h1><p class="lead">Explore the collection, manage an order, or find the right aftercare route.</p><div class="tiles"><section><h2>Shop by activity</h2>' +
      a('/store/products', 'Browse all products') +
      '<p>Footwear, outerwear and equipment.</p></section><section><h2>Your account</h2>' +
      a('/store/orders', 'View orders & delivery') +
      '<p>Two orders. Different eligibility windows.</p></section><section><h2>Need a hand?</h2>' +
      a('/store/help', 'Returns, exchanges & warranty') +
      '<p>Find the policy before starting a request.</p></section></div><h2>Featured this week</h2><div class="products">' +
      products.map(card).join('') +
      '</div>'
  } else if (url.pathname === '/store/products') {
    title = 'Shop the collection'
    const category = url.searchParams.get('category')
    body =
      '<h1>' +
      title +
      '</h1><nav class="filters">' +
      a('/store/products', 'All products') +
      a('/store/products', 'Footwear', { category: 'Footwear' }) +
      a('/store/products', 'Outerwear', { category: 'Outerwear' }) +
      a('/store/products', 'Equipment', { category: 'Equipment' }) +
      '</nav><p>Showing ' +
      escape(category || 'all categories') +
      '. Prices are USD.</p><div class="products">' +
      products
        .filter((p) => !category || p.category === category)
        .map(card)
        .join('') +
      '</div>'
  } else if (url.pathname.startsWith('/store/products/')) {
    const p = products.find((p) => url.pathname === '/store/products/' + p.id)
    if (!p) return null
    const size =
      url.searchParams.get('size') ||
      (p.id === 'red-running-shoes' ? '8' : p.id === 'black-jacket' ? 'Medium' : '18L')
    const soldOut = p.id === 'red-running-shoes' && size === '9'
    title = p.name
    body =
      '<p>' +
      a('/store/products', 'Collection') +
      ' / ' +
      escape(p.category) +
      '</p><div class="detail"><div class="swatch" style="background:' +
      p.color +
      '"><span>' +
      escape(p.name) +
      '</span></div><section><h1>' +
      escape(p.name) +
      '</h1><p class="price">$' +
      p.price.toFixed(2) +
      '</p><p>' +
      escape(p.detail) +
      '</p><h2>Choose a size</h2><nav class="filters">' +
      (p.id === 'red-running-shoes'
        ? ['8', '9']
        : p.id === 'black-jacket'
          ? ['Small', 'Medium', 'Large']
          : ['18L']
      )
        .map((s) => a('/store/products/' + p.id, s, { size: s }))
        .join('') +
      '</nav><p><strong>Selected: ' +
      escape(size) +
      ' · ' +
      (soldOut ? 'Sold out' : 'Available in this demonstration') +
      '</strong></p><p>This storefront is a browsing sandbox. Checkout is not offered.</p>' +
      a('/store/help/delivery', 'Delivery and collection details') +
      '<br>' +
      a(
        p.id === 'trail-pack' ? '/store/help/warranty' : '/store/help/returns',
        p.id === 'trail-pack' ? 'Equipment warranty' : 'Returns and exchanges',
      ) +
      '</section></div>'
  } else if (url.pathname === '/store/orders') {
    title = 'Your orders'
    body =
      '<h1>' +
      title +
      '</h1><p>Demo account · Orders and eligibility are synthetic.</p><table><thead><tr><th>Order</th><th>Items</th><th>Status</th><th>Next step</th></tr></thead><tbody><tr><td>ORD-1042</td><td>Red shoes + Black jacket</td><td>Delivered · within 30-day return window</td><td>' +
      a('/store/orders/ORD-1042', 'View order') +
      '</td></tr><tr><td>ORD-0938</td><td>Trail day pack</td><td>Delivered · outside return window</td><td>' +
      a('/store/orders/ORD-0938', 'View order') +
      '</td></tr></tbody></table>'
  } else if (url.pathname === '/store/orders/ORD-1042') {
    title = 'Order ORD-1042'
    body =
      '<p>' +
      a('/store/orders', 'All orders') +
      '</p><h1>' +
      title +
      '</h1><p>Delivered · Return window open · Original payment: card ending 4242</p><table><tr><th>Item</th><th>Size</th><th>Paid</th></tr><tr><td>' +
      a('/store/products/red-running-shoes', 'Red running shoes') +
      '</td><td>8</td><td>$80.00</td></tr><tr><td>' +
      a('/store/products/black-jacket', 'Black jacket') +
      '</td><td>Medium</td><td>$120.00</td></tr></table><div class="tiles"><section><h2>Return items</h2><p>Choose individual items and your refund method.</p>' +
      a('/merchant', 'Start a return →') +
      '</section><section><h2>Delivery details</h2>' +
      a('/store/orders/ORD-1042/delivery', 'View delivery timeline') +
      '</section><section><h2>Before you choose</h2>' +
      a('/store/help/returns', 'Compare return methods & fees') +
      '</section></div>'
  } else if (url.pathname === '/store/orders/ORD-0938') {
    title = 'Order ORD-0938'
    body =
      '<h1>' +
      title +
      '</h1><p>Trail day pack · $55.00 · Delivered 45 days ago.</p><div class="notice"><h2>Return window closed</h2><p>This order is outside the 30-day return window. No return can be started here.</p></div>' +
      a('/store/help/warranty', 'Check equipment warranty instead') +
      '<p>' +
      a('/store/products/trail-pack', 'View product information') +
      '</p>'
  } else if (url.pathname === '/store/orders/ORD-1042/delivery') {
    title = 'Delivery timeline'
    body =
      '<h1>ORD-1042 · ' +
      title +
      '</h1><ol><li>Order confirmed</li><li>Dispatched from warehouse</li><li>Delivered to front desk</li></ol><p>Both items were delivered in one parcel. No shipment is currently in transit.</p>' +
      a('/store/orders/ORD-1042', 'Back to order') +
      '<p>' +
      a('/store/help/delivery', 'Delivery questions') +
      '</p>'
  } else if (url.pathname === '/store/help') {
    title = 'How can we help?'
    body =
      '<h1>' +
      title +
      '</h1><div class="tiles"><section><h2>Returns & exchanges</h2>' +
      a('/store/help/returns', 'Check methods, eligibility and fees') +
      '</section><section><h2>Delivery</h2>' +
      a('/store/help/delivery', 'Understand delivery and collection') +
      '</section><section><h2>Equipment warranty</h2>' +
      a('/store/help/warranty', 'Find the right route for a damaged pack') +
      '</section></div>'
  } else if (url.pathname === '/store/help/returns') {
    title = 'Returns and exchanges'
    body =
      '<h1>' +
      title +
      '</h1><p>Eligible apparel and footwear may be returned within 30 days. Select only the items you intend to return.</p><table><tr><th>Method</th><th>What you need</th><th>Deduction</th></tr><tr><td>Printed shipping label</td><td>A printer</td><td>$0</td></tr><tr><td>QR drop-off</td><td>No printer</td><td>$5</td></tr></table><p>Review the refund destination after changing a method. The final merchant review is authoritative.</p><p>Direct size exchanges are not supported in this sandbox; an eligible return is a separate request.</p>' +
      a('/store/orders', 'Find your order to start') +
      '<p>' +
      a('/store/help/warranty', 'Outside the return window? Read warranty information') +
      '</p>'
  } else if (url.pathname === '/store/help/delivery') {
    title = 'Delivery and collection'
    body =
      '<h1>' +
      title +
      '</h1><p>Standard delivery is 3–5 business days. Collection is available only when a product is marked in stock.</p><p>A delivered order cannot be rescheduled. Check its delivery timeline before choosing another action.</p>' +
      a('/store/orders', 'Check order status') +
      '<p>' +
      a('/store/products', 'Check product availability') +
      '</p>'
  } else if (url.pathname === '/store/help/warranty') {
    title = 'Equipment warranty'
    body =
      '<h1>' +
      title +
      '</h1><p>Trail packs have a one-year manufacturing-defect warranty. Wear and tear and change of mind are excluded.</p><p>You would need an order number, a description and photographs of the defect. This demonstration provides information only; it does not submit a claim.</p>' +
      a('/store/orders/ORD-0938', 'View the older trail-pack order') +
      '<p>' +
      a('/store/help/returns', 'Compare with ordinary returns') +
      '</p>'
  } else return null
  return (
    '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' +
    escape(title) +
    ' | Northstar Outfitters</title><style>*{box-sizing:border-box}body{margin:0;background:#f7f5ee;color:#223329;font:16px/1.55 system-ui}a{color:#184d65;text-underline-offset:4px}a:focus-visible{outline:3px solid #a86126;outline-offset:5px}header{padding:20px 5%;background:#173e30;color:white;display:flex;justify-content:space-between;gap:24px}header a{color:white}nav{display:flex;gap:25px;flex-wrap:wrap}.bar{padding:8px 5%;background:#e8dfc9;font-size:13px}main{max-width:1180px;margin:auto;padding:36px 24px 80px}h1{font-size:clamp(32px,5vw,60px);line-height:1.1;max-width:850px}h2{font-size:21px}.lead{font-size:21px;max-width:700px}.eyebrow{font-size:12px;text-transform:uppercase;letter-spacing:.15em}.tiles,.products{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin:32px 0}.tiles section,.product{background:white;border:1px solid #d8ddd3;padding:24px}.swatch{height:160px;display:flex;align-items:center;justify-content:center;color:white;padding:24px;font-size:22px}.swatch span{border:1px solid #ffffff77;padding:15px}.detail{display:grid;grid-template-columns:1fr 1fr;gap:50px}.detail .swatch{height:430px}.price{font-size:28px}.filters a{border:1px solid #c4cec2;padding:8px 16px}.notice{border-left:5px solid #a86126;padding:16px;background:#fff0d8}table{border-collapse:collapse;width:100%;background:white;margin:24px 0}td,th{text-align:left;border-bottom:1px solid #d7ddd4;padding:18px}footer{border-top:1px solid #ccd4ca;padding:28px 5%;font-size:13px}@media(max-width:700px){header{display:block}nav{gap:14px}.tiles,.products,.detail{grid-template-columns:1fr}.detail .swatch{height:180px}td,th{padding:10px}}</style><header><strong>' +
    a('/store', 'NORTHSTAR OUTFITTERS') +
    '</strong><nav>' +
    a('/store/products', 'Shop') +
    a('/store/orders', 'My orders') +
    a('/store/help', 'Help centre') +
    '</nav></header><div class="bar">Fictional merchant · Synthetic records · Browsing never places an order' +
    (readonly ? ' · Read-only inspection' : '') +
    '</div><main>' +
    body +
    '</main><footer>' +
    a('/store', 'Home') +
    ' · ' +
    a('/store/help/returns', 'Return policy') +
    ' · ' +
    a('/store/help/warranty', 'Warranty') +
    '<p>This is a local demonstration, not a real store.</p></footer></html>'
  )
}
