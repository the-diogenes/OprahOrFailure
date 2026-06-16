import type { ModelCostTable } from '../types'

// Prices in USD per 1M tokens. Newer (2026) model prices are best-effort
// estimates — verify against current provider pricing pages and adjust.
export const MODEL_COSTS: ModelCostTable = {
  // OpenAI
  'gpt-4o': { inputPer1M: 2.5, outputPer1M: 10.0 },
  'gpt-4o-mini': { inputPer1M: 0.15, outputPer1M: 0.6 },
  'gpt-4.1': { inputPer1M: 2.0, outputPer1M: 8.0 },
  'gpt-4.1-mini': { inputPer1M: 0.4, outputPer1M: 1.6 },
  'o4-mini': { inputPer1M: 1.1, outputPer1M: 4.4 },
  'gpt-5.5': { inputPer1M: 1.25, outputPer1M: 10.0 },
  'gpt-5-mini': { inputPer1M: 0.25, outputPer1M: 2.0 },
  'gpt-5.4-mini': { inputPer1M: 0.25, outputPer1M: 2.0 },
  'gpt-5.4-nano': { inputPer1M: 0.05, outputPer1M: 0.4 },
  // Anthropic
  'claude-opus-4-8': { inputPer1M: 15.0, outputPer1M: 75.0 },
  'claude-fable-5': { inputPer1M: 5.0, outputPer1M: 25.0 },
  'claude-sonnet-4-6': { inputPer1M: 3.0, outputPer1M: 15.0 },
  'claude-haiku-4-5-20251001': { inputPer1M: 1.0, outputPer1M: 5.0 },
  // Google Gemini
  'gemini-2.5-pro': { inputPer1M: 1.25, outputPer1M: 10.0 },
  'gemini-2.5-flash': { inputPer1M: 0.075, outputPer1M: 0.3 },
  'gemini-3.5-flash': { inputPer1M: 0.1, outputPer1M: 0.4 },
  'gemini-flash-latest': { inputPer1M: 0.1, outputPer1M: 0.4 },
  'gemini-3-pro-preview': { inputPer1M: 1.5, outputPer1M: 12.0 },
  'gemini-2.0-flash': { inputPer1M: 0.075, outputPer1M: 0.3 },
  // xAI / Grok
  'grok-4.3': { inputPer1M: 3.0, outputPer1M: 15.0 },
  'grok-4.20-0309-non-reasoning': { inputPer1M: 2.0, outputPer1M: 10.0 },
  'grok-4.20-0309-reasoning': { inputPer1M: 3.0, outputPer1M: 15.0 },
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
