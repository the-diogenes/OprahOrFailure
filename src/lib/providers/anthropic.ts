import type { LLMProviderAdapter } from './types'
import { SYSTEM_PROMPT, buildUserMessage, parseAgentJson } from './types'
import { calcCostUsd } from '../costs'
import type { AgentRequest, AgentResponse } from '../../types'

export const anthropicAdapter: LLMProviderAdapter = {
  id: 'anthropic',
  displayName: 'Anthropic',
  defaultModels: ['claude-haiku-3-5', 'claude-3-5-haiku-20241022', 'claude-sonnet-4-5', 'claude-3-5-sonnet-20241022'],

  async callAgent(request: AgentRequest, apiKey: string): Promise<AgentResponse> {
    const body = {
      model: request.model,
      temperature: request.temperature,
      max_tokens: request.maxTokens,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: buildUserMessage(request) },
      ],
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Anthropic error ${res.status}: ${err}`)
    }

    const data = await res.json()
    const raw: string = data.content[0]?.text ?? ''
    const inputTokens: number = data.usage?.input_tokens ?? 0
    const outputTokens: number = data.usage?.output_tokens ?? 0
    const costUsd = calcCostUsd(request.model, inputTokens, outputTokens)

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
