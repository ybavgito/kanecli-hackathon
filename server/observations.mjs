import { createHash } from 'node:crypto'

export const text = (value, limit = 1000) => typeof value === 'string'
  ? value.replace(/Bearer\s+\S+|\b(?:sk-|khk_)[\w-]{12,}/gi, '[redacted]').trim().slice(0, limit) : ''
export const strings = value => Array.isArray(value) ? value.slice(0, 12).map(v => text(v)).filter(Boolean) : []
export const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex')
const credentialKey = value => /^(?:password|passwd|passcode|otp|token|accesstoken|refreshtoken|idtoken|authorization|session|sessionid|code|authcode|apikey|clientsecret|secret)$/i.test(String(value).replace(/[-_.\s]/g, ''))
export function websiteUrl(value, base) {
  let url
  try { url = new URL(value, base) } catch { throw new Error('Enter a complete HTTP or HTTPS website URL.') }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password)
    throw new Error('Use an HTTP or HTTPS URL without embedded credentials.')
  let fragment = url.hash.slice(1)
  try { fragment = decodeURIComponent(fragment) } catch { /* Inspect the original fragment. */ }
  const fragmentKeys = fragment.split(/[?&#/]/).map(part => part.split('=')[0])
  if ([...url.searchParams.keys(), ...fragmentKeys].some(credentialKey))
    throw new Error('Open the website without a credential or sign-in token in its URL.')
  return url.href
}
export function safeUrl(value, base) { try { return websiteUrl(value, base) } catch { return null } }
export function sameSite(value, base) {
  const url = safeUrl(value, base)
  return url && new URL(url).origin === new URL(base).origin ? url : null
}
export function jsonValue(value, fallback = null) {
  if (value && typeof value === 'object') return value
  if (typeof value !== 'string') return fallback
  try { return JSON.parse(value.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()) } catch { return fallback }
}
function list(value, limit = 8) { const parsed = jsonValue(value, []); return Array.isArray(parsed) ? parsed.slice(0, limit) : [] }
const fields = value => list(value, 64).filter(v => v && text(v.label) && text(v.value)).map(v => ({ label: text(v.label, 100), value: text(v.value, 800) }))
const kind = value => ['read','draft','consequential'].includes(value) ? value : 'unknown'
export const secretLabel = value => /password|passwd|passcode|passkey|one[\s_-]?time|\botp\b|secret|credit[\s_-]?card|card[\s_-]?number|(?:security|verification|authentication|recovery|backup)[\s_-]?(?:code|key)|\bcvv\b|token|captcha|cookie/i.test(String(value).replace(/_/g, ' '))
const knownText = (value, limit) => {
  const normalized=text(value,limit)
  return /^(?:unknown|not[_\s-]?applicable|not[_\s-]?stated|none|null|n\/a)$/i.test(normalized)?null:normalized||null
}

export function accountFrom(result) {
  const f = result.finalState || {}
  const access = text(f.access_state, 40).toLowerCase()
  return {
    status: access === 'signed_in' ? 'signed_in' : access === 'public' ? 'public' : 'unknown',
    label: knownText(f.account_label, 100),
    // This must be a visible username, email address or account ID, never a display name.
    identity: access === 'signed_in' ? knownText(f.account_identity, 200) : null,
  }
}

export function discoveryFrom(result, base) {
  const f = result.finalState || {}
  const pageUrl = safeUrl(f.page_url || f.url, base)
  if (!pageUrl || !text(f.page_title)) throw new Error('Kane did not return a usable page identity. Inspect again; no actions were inferred.')
  const access = text(f.access_state, 40).toLowerCase()
  const actions = list(f.actions_json).filter(a => a && text(a.title) && text(a.sourceQuote) && sameSite(a.href || pageUrl, base)).slice(0, 4).map(a => ({
    id: digest([a.title, a.href]).slice(0, 16), title: text(a.title, 100), description: text(a.description, 500),
    href: sameSite(a.href || pageUrl, base), kind: kind(a.kind), prerequisites: strings(a.prerequisites),
    sourceQuote: text(a.sourceQuote, 400), availability: 'discovered',
  }))
  return {
    pageUrl, siteTitle: text(f.page_title, 160),
    access: ['public','signed_in','needs_sign_in','blocked'].includes(access) ? access : 'unknown',
    account: accountFrom(result),
    actions, records: recordsFrom(f.records_json, base), limitations: strings(jsonValue(f.limitations_json, [])),
  }
}
export function recordsFrom(value, base) {
  return list(value).filter(r => r && text(r.title) && text(r.sourceQuote)).map(r => ({
    id: text(r.id, 100) || digest([r.title, r.url]).slice(0, 16), title: text(r.title, 150),
    details: text(r.details, 1200), sourceQuote: text(r.sourceQuote, 500), url: sameSite(r.url || base, base),
  }))
}
export function optionsFrom(result, base) {
  const f = result.finalState || {}
  const rawQuestions = list(f.questions_json)
  const needsHuman = rawQuestions.some(q => q && (secretLabel(q.label) || secretLabel(q.id || '')))
  const questions = rawQuestions.filter(q => q && text(q.label) && !secretLabel(q.label) && !secretLabel(q.id || '')).map((q,i) => ({
    id: text(q.id, 60).replace(/[^\w-]/g, '') || `question-${i}`, label: text(q.label, 200),
    type: ['text','number','date','select'].includes(q.type) ? q.type : 'text', required: q.required === true,
    options: list(q.options).filter(v => text(v.value) && text(v.label)).map(v => ({value:text(v.value,100),label:text(v.label,200)})),
  }))
  const options = list(f.options_json).filter(o => o && text(o.label) && text(o.sourceQuote) && sameSite(o.url || base, base)).slice(0, 4).map(o => ({
    id: digest([o.label, o.url, o.sourceQuote]).slice(0, 16), label: text(o.label, 200),
    price: text(o.price, 200) || 'Not stated by the website', requirements: strings(o.requirements),
    changes: strings(o.changes), nextSteps: strings(o.nextSteps), sourceQuote: text(o.sourceQuote, 600),
    url: sameSite(o.url || base, base), reversible: o.reversible === true, knowledge: 'terms_observed',
  }))
  const raw = jsonValue(f.proposal_json)
  const proposal = raw && typeof raw === 'object' && text(raw.summary) && sameSite(raw.sourceUrl || base, base) ? {
    summary: text(raw.summary, 1000), changes: strings(raw.changes), terms: fields(raw.terms),
    requirements: strings(raw.requirements), nextSteps: strings(raw.nextSteps), sourceUrl: sameSite(raw.sourceUrl || base, base),
    submitControl: text(raw.submitControl, 150),
    // Generic final controls have no proven account/idempotency boundary yet.
    executionKind: raw.executionKind === 'read' && !strings(raw.changes).length && !text(raw.submitControl) ? 'read' : 'unsupported',
    observedExecutionKind: ['read','draft','consequential'].includes(raw.executionKind) ? raw.executionKind : 'unsupported',
  } : null
  return {questions,options,proposal,records:recordsFrom(f.records_json,base),
    limitations:strings(jsonValue(f.limitations_json, [])), summary:text(f.observation_summary,1500),
    access:needsHuman?'needs_sign_in':text(f.access_state,40).toLowerCase(), account:accountFrom(result)}
}
export function checkedFrom(result) {
  const f=result.finalState || {}
  const checks=list(f.checks_json,64).filter(c=>c && text(c.label)).map(c=>({label:text(c.label,200),
    status:['match','conflict','unknown'].includes(c.status)?c.status:'unknown',detail:text(c.detail,800)}))
  return {checks, matches:checks.length>0 && checks.every(c=>c.status==='match') && String(f.proposal_matches).toLowerCase()==='true'}
}
export function receiptFrom(result, base) {
  const f = result.finalState || {}
  if (String(f.result_verified).toLowerCase() !== 'true' || !text(f.result_summary)) return null
  const sourceUrl = sameSite(f.result_url || f.url, base)
  const observed = fields(f.result_fields_json)
  if (!sourceUrl || !observed.length) return null
  return {summary:text(f.result_summary,1500),sourceUrl,recordId:knownText(f.result_record_id,200),
    fields:observed,nextSteps:strings(jsonValue(f.next_steps_json,[]))}
}
export function validateAnswers(value, questions, previous = {}) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Provide answers using the displayed questions.')
  const answers={}
  for(const [key,raw] of Object.entries(value)) {
    const q=questions.find(q=>q.id===key)
    const value=text(String(raw),800)
    if(secretLabel(key) || q && secretLabel(q.label)) throw new Error('Only the displayed non-secret questions can be answered here.')
    if(!q) {
      if(Object.hasOwn(previous,key) && previous[key]===value) continue
      throw new Error('Only the displayed non-secret questions can be answered here.')
    }
    if(q.type==='select' && !q.options.some(o=>o.value===value)) throw new Error('Choose one of the observed options.')
    if(q.type==='number' && !Number.isFinite(Number(value))) throw new Error('Enter a valid number.')
    answers[key]=value
  }
  return answers
}
