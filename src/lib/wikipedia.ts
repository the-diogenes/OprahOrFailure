import type { WikiPage } from '../types'
import { logger } from './logger'

const WIKI_API = 'https://en.wikipedia.org/w/api.php'
const OPRAH_TITLE = 'Oprah Winfrey'

// In-memory cache for this session
const pageCache = new Map<string, WikiPage>()

export { OPRAH_TITLE }

function buildParams(params: Record<string, string>): string {
  const p = new URLSearchParams({ ...params, origin: '*', format: 'json' })
  return `${WIKI_API}?${p.toString()}`
}

export async function getRandomPage(): Promise<WikiPage> {
  logger.info('wiki', 'Fetching random Wikipedia page...')
  try {
    const url = buildParams({ action: 'query', list: 'random', rnnamespace: '0', rnlimit: '1' })
    const res = await fetch(url)
    const data = await res.json()
    const title: string = data.query.random[0].title
    logger.info('wiki', `Random page selected: "${title}"`)
    return fetchPage(title)
  } catch (err) {
    logger.error('wiki', 'Failed to fetch random page', String(err))
    throw err
  }
}

export async function fetchPage(title: string): Promise<WikiPage> {
  const normalized = normalizeTitle(title)

  if (pageCache.has(normalized)) {
    logger.debug('wiki', `Cache hit: "${normalized}"`)
    return pageCache.get(normalized)!
  }

  logger.info('wiki', `Fetching page: "${normalized}"`)
  const [infoRes, linksRes] = await Promise.all([
    fetch(buildParams({
      action: 'query',
      titles: normalized,
      prop: 'extracts|info',
      exintro: '1',
      explaintext: '1',
      exsentences: '3',
      inprop: 'url|canonicalurl',
      redirects: '1',
    })),
    fetch(buildParams({
      action: 'query',
      titles: normalized,
      prop: 'links',
      pllimit: '500',
      plnamespace: '0',
      redirects: '1',
    })),
  ])

  const infoData = await infoRes.json()
  const linksData = await linksRes.json()

  const pages = infoData.query.pages
  const pageKey = Object.keys(pages)[0]
  const page = pages[pageKey]

  const canonicalTitle: string = page.title ?? normalized
  const pageId: number = page.pageid ?? 0
  const summary: string = (page.extract ?? '').slice(0, 500)
  const url: string = page.canonicalurl ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(canonicalTitle)}`

  const linkPages = linksData.query?.pages ?? {}
  const linkPageKey = Object.keys(linkPages)[0]
  const rawLinks: Array<{ title: string }> = linkPages[linkPageKey]?.links ?? []

  const links = rawLinks
    .map((l) => l.title)
    .filter((t) => t && !t.includes(':'))
    .filter((t, i, arr) => arr.indexOf(t) === i) // dedupe
    .sort()

  const wikiPage: WikiPage = { title: normalized, canonicalTitle, pageId, summary, links, url }
  pageCache.set(normalized, wikiPage)
  pageCache.set(canonicalTitle, wikiPage)

  logger.info('wiki', `Fetched "${canonicalTitle}" — ${links.length} links`)
  return wikiPage
}

export function normalizeTitle(title: string): string {
  return title.replace(/_/g, ' ').trim()
}

export function isOprah(title: string): boolean {
  const t = normalizeTitle(title).toLowerCase()
  return t === 'oprah winfrey' || t === 'oprah'
}

export function validateLink(chosen: string, available: string[]): boolean {
  const norm = normalizeTitle(chosen)
  return available.some((a) => normalizeTitle(a).toLowerCase() === norm.toLowerCase())
}

export function resolveLink(chosen: string, available: string[]): string | null {
  const norm = normalizeTitle(chosen).toLowerCase()
  return available.find((a) => normalizeTitle(a).toLowerCase() === norm) ?? null
}
