import { createHash } from 'node:crypto'

export const text = (value, limit = 1000) => typeof value === 'string'
  ? value.replace(/Bearer\s+\S+|\b(?:sk-|khk_)[\w-]{12,}/gi, '[redacted]').trim().slice(0, limit) : ''
export const strings = value => Array.isArray(value) ? value.slice(0, 12).map(v => text(v)).filter(Boolean) : []
export const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex')
const credentialKey = value => /^(?:password|passwd|passcode|otp|token|accesstoken|refreshtoken|idtoken|authorization|session|sessionid|code|authcode|apikey|clientsecret|secret)$/i.test(String(value).replace(/[-_.\s]/g, ''))
export function websiteUrl(value, base) {
  let url
  if(typeof value!=='string'||!value.trim())throw new Error('Enter a complete HTTP or HTTPS website URL.')
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
const lines = (value, limit = 12) => typeof value === 'string' ? value.split(/\r?\n/).map(line=>text(line,3000).replace(/^\s*(?:[-*•]\s+|\d+[.)]\s+)/,'')).filter(line=>knownText(line,3000)).slice(0,limit) : []
const cells = line => line.split('|').map(part=>part.trim())
const textItems = (structured, plain) => {
  const observed=strings(jsonValue(structured,[]))
  return observed.length?observed:lines(plain)
}
export function fieldsFrom(structured, plain) {
  const observed=fields(structured)
  if(observed.length)return observed
  return lines(plain,64).map(line=>cells(line)).filter(parts=>parts.length>=2&&parts[0]&&parts.slice(1).join('|').trim()&&!(parts[0].toLowerCase()==='label'&&parts[1].toLowerCase()==='value'))
    .map(parts=>({label:text(parts[0],100),value:text(parts.slice(1).join(' | '),800)}))
}
function textChecks(value, key='label') {
  return lines(value,64).map(line=>cells(line)).filter(parts=>parts.length>=2&&parts[0])
    .map(parts=>({[key]:text(parts[0],200),status:['match','conflict','unknown'].includes(parts[1].toLowerCase())?parts[1].toLowerCase():'unknown',detail:text(parts.slice(2).join(' | '),800)}))
}
export function requirementChecksFrom(result) {
  const f=result.finalState||{}, observed=list(f.requirements_checks_json,64)
  return observed.length?observed:textChecks(f.requirements_checks_text,'id')
}
const unsafeAction = (label,url) => /\b(?:log\s*out|logout|sign\s*out|delete|remove|cancel|unsubscribe|purchase|buy|checkout|pay|submit|send|confirm|reset)\b/i.test(label)
  || /(?:^|[/?&=._-])(?:logout|signout|delete|remove|cancel|unsubscribe|checkout|purchase|submit|reset)(?:$|[/?&=._-])/i.test(new URL(url).pathname+new URL(url).search)
function textActions(value, base) {
  return lines(value,12).flatMap(line=>{
    const parts=cells(line), href=parts.length===2?safeUrl(parts[1]):null
    if(!knownText(parts[0],100)||!href||!sameSite(href,base)||unsafeAction(parts[0],href))return []
    return [{title:parts[0],href,kind:'read',description:'Read the linked source page.',prerequisites:[],sourceQuote:parts[0]}]
  })
}
function textRecords(value, base) {
  return lines(value,8).map(line=>{
    const parts=cells(line), last=parts.at(-1), url=parts.length>1?safeUrl(last):null
    const details=(url?parts.slice(1,-1):parts.slice(1)).join(' | ')
    return {title:parts[0],details,sourceQuote:line,url:url&&sameSite(url,base)?url:base}
  })
}
function observedRecords(f,base){return recordsFrom(list(f.records_json).length?f.records_json:textRecords(f.records_text,base),base)}

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
  const rawActions=list(f.actions_json)
  const actions = (rawActions.length?rawActions:textActions(f.actions_text,base)).filter(a => a && text(a.title) && text(a.sourceQuote) && sameSite(a.href || pageUrl, base) && !unsafeAction(a.title,sameSite(a.href || pageUrl,base))).slice(0, 4).map(a => ({
    id: digest([a.title, a.href]).slice(0, 16), title: text(a.title, 100), description: text(a.description, 500),
    href: sameSite(a.href || pageUrl, base), kind: kind(a.kind), prerequisites: strings(a.prerequisites),
    sourceQuote: text(a.sourceQuote, 400), availability: 'discovered',
  }))
  return {
    pageUrl, siteTitle: text(f.page_title, 160),
    access: ['public','signed_in','needs_sign_in','blocked'].includes(access) ? access : 'unknown',
    account: accountFrom(result),
    actions, records: observedRecords(f,pageUrl), limitations: textItems(f.limitations_json,f.limitations_text),
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
  const structuredQuestions=list(f.questions_json)
  const rawQuestions = structuredQuestions.length?structuredQuestions:lines(f.questions_text,8).map(label=>({id:`q-${label.toLowerCase().replace(/[^\w]+/g,'-').slice(0,40)}-${digest(label).slice(0,8)}`,label,type:'text',required:true,options:[]}))
  const needsHuman = rawQuestions.some(q => q && (secretLabel(q.label) || secretLabel(q.id || '')))
  const questions = rawQuestions.filter(q => q && text(q.label) && !secretLabel(q.label) && !secretLabel(q.id || '')).map((q,i) => ({
    id: text(q.id, 60).replace(/[^\w-]/g, '') || `question-${i}`, label: text(q.label, 200),
    type: ['text','number','date','select'].includes(q.type) ? q.type : 'text', required: q.required === true,
    options: list(q.options).filter(v => text(v.value) && text(v.label)).map(v => ({value:text(v.value,100),label:text(v.label,200)})),
  }))
  const structuredOptions=list(f.options_json)
  const rawOptions=structuredOptions.length?structuredOptions:lines(f.options_text,8).flatMap(line=>{
    const parts=cells(line), url=parts.length===5?safeUrl(parts[4]):null
    if(!url||!sameSite(url,base)||!knownText(parts[0],200)||unsafeAction(parts[0],url))return []
    return [{label:parts[0],price:knownText(parts[1],200)||'Not stated by the website',requirements:[knownText(parts[2],1000)||'Not stated by the website'],changes:[],nextSteps:[knownText(parts[3],1000)||'Not stated by the website'],url,reversible:false,sourceQuote:line}]
  })
  const options = rawOptions.filter(o => o && text(o.label) && text(o.sourceQuote) && sameSite(o.url || base, base) && !unsafeAction(o.label,sameSite(o.url || base,base))).slice(0, 4).map(o => ({
    id: digest([o.label, o.url, o.sourceQuote]).slice(0, 16), label: text(o.label, 200),
    price: text(o.price, 200) || 'Not stated by the website', requirements: strings(o.requirements),
    changes: strings(o.changes), nextSteps: strings(o.nextSteps), sourceQuote: text(o.sourceQuote, 600),
    url: sameSite(o.url || base, base), reversible: o.reversible === true, knowledge: 'terms_observed',
  }))
  const structuredProposal = jsonValue(f.proposal_json)
  const raw = structuredProposal || (knownText(f.proposal_summary,1000)&&safeUrl(f.source_url)&&sameSite(f.source_url,base)?{
    summary:f.proposal_summary,sourceUrl:f.source_url,terms:fieldsFrom(null,f.terms_text),executionKind:f.execution_kind,
    changes:[],submitControl:'',requirements:textItems(f.proposal_requirements_json,f.proposal_requirements_text),nextSteps:textItems(f.next_steps_json,f.next_steps_text),
  }:null)
  const proposal = raw && typeof raw === 'object' && text(raw.summary) && sameSite(raw.sourceUrl || base, base) ? {
    summary: text(raw.summary, 1000), changes: strings(raw.changes), terms: fields(raw.terms),
    requirements: strings(raw.requirements), nextSteps: strings(raw.nextSteps), sourceUrl: sameSite(raw.sourceUrl || base, base),
    submitControl: text(raw.submitControl, 150),
    // Generic final controls have no proven account/idempotency boundary yet.
    executionKind: raw.executionKind === 'read' && !strings(raw.changes).length && !text(raw.submitControl) ? 'read' : 'unsupported',
    observedExecutionKind: ['read','draft','consequential'].includes(raw.executionKind) ? raw.executionKind : 'unsupported',
  } : null
  return {questions,options,proposal,records:observedRecords(f,base),
    limitations:textItems(f.limitations_json,f.limitations_text), summary:text(f.observation_summary,1500),
    access:needsHuman?'needs_sign_in':text(f.access_state,40).toLowerCase(), account:accountFrom(result)}
}
export function checkedFrom(result) {
  const f=result.finalState || {}
  const structured=list(f.checks_json,64)
  const checks=(structured.length?structured:textChecks(f.checks_text)).filter(c=>c && text(c.label)).map(c=>({label:text(c.label,200),
    status:['match','conflict','unknown'].includes(c.status)?c.status:'unknown',detail:text(c.detail,800)}))
  return {checks, matches:checks.length>0 && checks.every(c=>c.status==='match') && String(f.proposal_matches).toLowerCase()==='true'}
}
export function receiptFrom(result, base) {
  const f = result.finalState || {}
  if (String(f.result_verified).toLowerCase() !== 'true' || !text(f.result_summary)) return null
  const sourceUrl = sameSite(f.result_url || f.url, base)
  const observed = fieldsFrom(f.result_fields_json,f.result_fields_text)
  if (!sourceUrl || !observed.length) return null
  return {summary:text(f.result_summary,1500),sourceUrl,recordId:knownText(f.result_record_id,200),
    fields:observed,nextSteps:textItems(f.next_steps_json,f.next_steps_text)}
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
