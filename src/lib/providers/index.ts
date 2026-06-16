import { openaiAdapter } from './openai'
import { anthropicAdapter } from './anthropic'
import { googleAdapter } from './google'
import { xaiAdapter } from './xai'
import { shotgunBotAdapter } from './shotgunbot'
import type { LLMProviderAdapter } from './types'
import type { ProviderId } from '../../types'

export const PROVIDERS: Record<ProviderId, LLMProviderAdapter> = {
  openai: openaiAdapter,
  anthropic: anthropicAdapter,
  google: googleAdapter,
  xai: xaiAdapter,
  shotgunbot: shotgunBotAdapter,
}

export type { LLMProviderAdapter }
