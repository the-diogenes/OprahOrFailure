import type { ModelCostTable } from '../types'

// Prices in USD per 1M tokens (as of June 2026 — update as needed)
export const MODEL_COSTS: ModelCostTable = {
  // OpenAI
  'gpt-4o': { inputPer1M: 2.5, outputPer1M: 10.0 },
  'gpt-4o-mini': { inputPer1M: 0.15, outputPer1M: 0.6 },
  'gpt-4.1': { inputPer1M: 2.0, outputPer1M: 8.0 },
  'gpt-4.1-mini': { inputPer1M: 0.4, outputPer1M: 1.6 },
  'o4-mini': { inputPer1M: 1.1, outputPer1M: 4.4 },
  // Anthropic
  'claude-opus-4-5': { inputPer1M: 15.0, outputPer1M: 75.0 },
  'claude-sonnet-4-5': { inputPer1M: 3.0, outputPer1M: 15.0 },
  'claude-haiku-3-5': { inputPer1M: 0.8, outputPer1M: 4.0 },
  'claude-3-5-sonnet-20241022': { inputPer1M: 3.0, outputPer1M: 15.0 },
  'claude-3-5-haiku-20241022': { inputPer1M: 0.8, outputPer1M: 4.0 },
  // Google Gemini
  'gemini-2.5-pro': { inputPer1M: 1.25, outputPer1M: 10.0 },
  'gemini-2.5-flash': { inputPer1M: 0.075, outputPer1M: 0.3 },
  'gemini-2.0-flash': { inputPer1M: 0.075, outputPer1M: 0.3 },
  // xAI / Grok
  'grok-3': { inputPer1M: 3.0, outputPer1M: 15.0 },
  'grok-3-mini': { inputPer1M: 0.3, outputPer1M: 0.5 },
  'grok-2-1212': { inputPer1M: 2.0, outputPer1M: 10.0 },
}

export function calcCostUsd(modelId: string, inputTokens: number, outputTokens: number): number {
  const pricing = MODEL_COSTS[modelId]
  if (!pricing) return 0
  return (inputTokens / 1_000_000) * pricing.inputPer1M +
         (outputTokens / 1_000_000) * pricing.outputPer1M
}

export function formatCost(usd: number): string {
  if (usd < 0.001) return `$${(usd * 1000).toFixed(4)}m` // show in milli-dollars
  return `$${usd.toFixed(4)}`
}
