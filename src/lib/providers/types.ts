import type { AgentRequest, AgentResponse } from '../../types'

export interface LLMProviderAdapter {
  id: string
  displayName: string
  defaultModels: string[]
  callAgent(request: AgentRequest, apiKey: string): Promise<AgentResponse>
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

export function parseAgentJson(
  raw: string,
  available: string[],
  modelId: string,
  inputTokens: number,
  outputTokens: number,
  costUsd: number,
): AgentResponse {
  let parsed: { chosen_link?: string; public_scratchpad?: string; confidence?: number }
  try {
    // Strip markdown code fences if present
    const cleaned = raw.replace(/^```json?\s*/i, '').replace(/```\s*$/i, '').trim()
    parsed = JSON.parse(cleaned)
  } catch {
    throw new Error(`Invalid JSON from ${modelId}: ${raw.slice(0, 200)}`)
  }

  const chosenLink = String(parsed.chosen_link ?? '')
  const publicScratchpad = String(parsed.public_scratchpad ?? '')
  const confidence = Number(parsed.confidence ?? 0)

  // Case-insensitive match
  const resolved = available.find(
    (a) => a.toLowerCase() === chosenLink.toLowerCase()
  ) ?? chosenLink

  return { chosenLink: resolved, publicScratchpad, confidence, inputTokens, outputTokens, costUsd }
}
