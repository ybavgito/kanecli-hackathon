const url = process.env.KANE_URL ?? 'http://127.0.0.1:5173'
let ready = false
for (let attempt = 0; attempt < 30; attempt++) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(2000) })
    if (response.ok) { ready = true; break }
  } catch { /* The dev server may still be starting. */ }
  await new Promise(resolve => setTimeout(resolve, 500))
}
if (!ready) { console.error('The Raising Kane app did not become ready. Inspect the dev-server log.'); process.exitCode = 1 }
else console.log('Raising Kane is reachable; browser verification is still pending.')
