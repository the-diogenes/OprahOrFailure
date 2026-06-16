import type { AgentRequest, AgentResponse } from '../../types'
import { logger } from '../logger'

export interface LLMProviderAdapter {
  id: string
  displayName: string
  defaultModels: string[]
  callAgent(request: AgentRequest, apiKey: string): Promise<AgentResponse>
}

const RETRYABLE_STATUSES = [408, 409, 425, 429, 500, 502, 503, 504, 529]
const MAX_RETRIES = 3

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

// fetch wrapper that retries transient errors (rate limits, overload, 5xx)
// with exponential backoff + jitter. Honors Retry-After when present.
export async function fetchWithRetry(
  label: string,
  url: string,
  init: RequestInit,
): Promise<Response> {
  let lastRes: Response | null = null
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    let res: Response
    try {
      res = await fetch(url, init)
    } catch (err) {
      // Network error (DNS, CORS, offline) — retry a couple times
      if (attempt === MAX_RETRIES) throw err
      const delay = 700 * 2 ** attempt + Math.random() * 300
      logger.warn('api', `${label} network error — retry ${attempt + 1}/${MAX_RETRIES} in ${Math.round(delay)}ms`, String(err))
      await sleep(delay)
      continue
    }

    if (res.ok || !RETRYABLE_STATUSES.includes(res.status) || attempt === MAX_RETRIES) {
      return res
    }

    lastRes = res
    const retryAfter = Number(res.headers.get('retry-after'))
    const delay = Number.isFinite(retryAfter) && retryAfter > 0
      ? retryAfter * 1000
      : 700 * 2 ** attempt + Math.random() * 300
    logger.warn('api', `${label} ${res.status} — retry ${attempt + 1}/${MAX_RETRIES} in ${Math.round(delay)}ms`)
    // Drain the body so the connection can be reused
    try { await res.text() } catch { /* ignore */ }
    await sleep(delay)
  }
  return lastRes as Response
}

export const SYSTEM_PROMPT = `You are a Wikipedia navigation agent competing in a race to reach the Oprah Winfrey Wikipedia page.

You will receive the current page, a list of valid links, and your navigation history.
You must respond with valid JSON only — no markdown, no explanation outside the JSON.

Response schema:
{
  "chosen_link": "exact title from available_links",
  "public_scratchpad": "short public reasoning (max 60 words)",
  "confidence": 0.0
}`

export function buildUserMessage(request: AgentRequest): string {
  const { gameState, hostPrompt } = request
  const { goal, rules, clicksUsed, clicksRemaining, visitedPages, currentPage } = gameState

  return JSON.stringify({
    goal,
    rules,
    host_prompt: hostPrompt,
    clicks_used: clicksUsed,
    clicks_remaining: clicksRemaining,
    visited_pages: visitedPages,
    current_page: {
      title: currentPage.title,
      summary: currentPage.summary,
      available_links: currentPage.availableLinks,
    },
  })
}

export function extractJsonObject(raw: string): string {
  let text = raw.trim()
  // Strip markdown fences anywhere in the string
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fence) text = fence[1].trim()

  // Already valid JSON?
  if (text.startsWith('{')) return text

  // Find first { … last } (handles "Here is the JSON:\n{...}")
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start !== -1 && end > start) return text.slice(start, end + 1)

  return text
}

export function parseAgentJson(
  raw: string,
  available: string[],
  modelId: string,
  inputTokens: number,
  outputTokens: number,
  costUsd: number,
): AgentResponse {
  let parsed: { chosen_link?: string; public_scratchpad?: string; confidence?: number }
  const jsonText = extractJsonObject(raw)
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    logger.error('api', `${modelId} JSON parse failed`, { raw: raw.slice(0, 300), extracted: jsonText.slice(0, 300) })
    throw new Error(`Invalid JSON from ${modelId}: ${raw.slice(0, 200)}`)
  }

  const chosenLink = String(parsed.chosen_link ?? '')
  const publicScratchpad = String(parsed.public_scratchpad ?? '')
  const confidence = Number(parsed.confidence ?? 0)

  if (!chosenLink) {
    throw new Error(`Missing chosen_link from ${modelId}: ${raw.slice(0, 200)}`)
  }

  // Case-insensitive match
  const resolved = available.find(
    (a) => a.toLowerCase() === chosenLink.toLowerCase()
  ) ?? chosenLink

  return { chosenLink: resolved, publicScratchpad, confidence, inputTokens, outputTokens, costUsd }
}
