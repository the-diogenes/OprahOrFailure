import type { LLMProviderAdapter } from './types'
import { SYSTEM_PROMPT, buildUserMessage, parseAgentJson, fetchWithRetry } from './types'
import { calcCostUsd } from '../costs'
import { logger } from '../logger'
import type { AgentRequest, AgentResponse } from '../../types'

export const googleAdapter: LLMProviderAdapter = {
  id: 'google',
  displayName: 'Google',
  defaultModels: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash'],

  async callAgent(request: AgentRequest, apiKey: string): Promise<AgentResponse> {
    logger.info('api', `Google → ${request.model} | page: "${request.gameState.currentPage.title}" | key: ${apiKey ? apiKey.slice(0,8)+'…' : 'MISSING'}`)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${request.model}:generateContent?key=${apiKey}`

    const body = {
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: buildUserMessage(request) }] }],
      generationConfig: {
        temperature: request.temperature,
        maxOutputTokens: request.maxTokens,
        responseMimeType: 'application/json',
      },
    }

    const res = await fetchWithRetry('Google', url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.text()
      logger.error('api', `Google ${res.status} error`, err)
      throw new Error(`Google error ${res.status}: ${err}`)
    }

    const data = await res.json()
    const raw: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    const inputTokens: number = data.usageMetadata?.promptTokenCount ?? 0
    const outputTokens: number = data.usageMetadata?.candidatesTokenCount ?? 0
    const costUsd = calcCostUsd(request.model, inputTokens, outputTokens)
    logger.info('api', `Google ✓ ${request.model} | in:${inputTokens} out:${outputTokens}`)

    return parseAgentJson(
      raw,
      request.gameState.currentPage.availableLinks,
      request.model,
      inputTokens,
      outputTokens,
      costUsd,
    )
  },
}
