import { DEFAULT_HOST_PROMPT } from './raceEngine'
import type { CompetitorConfig, ProviderId } from '../types'

export const MAX_RACERS = 8
export const MIN_RACERS = 1
export const DEFAULT_RACER_COUNT = 4

export const PROMPT_PRESETS: Record<string, string> = {
  'Aggressive Media': DEFAULT_HOST_PROMPT,
  Bloodhound: `You are a bloodhound trained to find Oprah. Smell for television, celebrities, American media, talk shows, actors, producers, Chicago, and mass culture. Choose the link that most increases the probability of reaching Oprah quickly.`,
  'Country Funnel': `If stuck, move toward countries, then toward the United States, then toward television, then talk shows, then Oprah Winfrey.`,
  'Person Graph': `Wikipedia is dense with biographies. Prefer notable people, occupations, actors, writers, journalists, hosts, producers, and entertainers when they appear.`,
  Speedrunner: `Think like a Wikipedia speedrunner. Avoid narrow pages. Escape to high-degree hubs. Take routes that increase global connectivity, not local relevance.`,
  Minimal: `Choose the best link. Keep the public scratchpad under 20 words.`,
}

export const MODEL_OPTIONS: Record<ProviderId, string[]> = {
  openai: ['gpt-4o-mini', 'gpt-5.4-mini', 'gpt-5-mini', 'gpt-5.5', 'gpt-4.1-mini', 'o4-mini'],
  anthropic: ['claude-haiku-4-5-20251001', 'claude-sonnet-4-6', 'claude-opus-4-8', 'claude-fable-5'],
  google: ['gemini-2.5-flash', 'gemini-3.5-flash', 'gemini-flash-latest', 'gemini-2.5-pro', 'gemini-3-pro-preview'],
  xai: ['grok-4.3', 'grok-4.20-0309-non-reasoning', 'grok-4.20-0309-reasoning'],
  shotgunbot: ['shotgunbot-v1'],
}

export const PROVIDER_ORDER: ProviderId[] = ['openai', 'anthropic', 'google', 'xai', 'shotgunbot']

let racerSeq = 0

export function newRacerId(): string {
  return `racer-${Date.now()}-${(++racerSeq).toString(36)}`
}

export function createRacer(partial?: Partial<CompetitorConfig>): CompetitorConfig {
  const providerId = partial?.providerId ?? 'openai'
  const models = MODEL_OPTIONS[providerId]
  const modelId =
    partial?.modelId && models.includes(partial.modelId) ? partial.modelId : models[0]
  return {
    id: partial?.id ?? newRacerId(),
    providerId,
    modelId,
    displayName: partial?.displayName ?? 'New Racer',
    temperature: partial?.temperature ?? 0.7,
    maxTokens: partial?.maxTokens ?? (providerId === 'shotgunbot' ? 0 : 300),
    hostPrompt: partial?.hostPrompt,
  }
}

export function defaultRoster(): CompetitorConfig[] {
  return [
    createRacer({ providerId: 'openai', modelId: 'gpt-4o-mini', displayName: 'GPT-4o Mini' }),
    createRacer({ providerId: 'anthropic', modelId: 'claude-haiku-4-5-20251001', displayName: 'Claude Haiku' }),
    createRacer({ providerId: 'google', modelId: 'gemini-2.5-flash', displayName: 'Gemini Flash' }),
    createRacer({ providerId: 'xai', modelId: 'grok-4.3', displayName: 'Grok 4.3' }),
  ]
}

export function cloneRoster(competitors: CompetitorConfig[]): CompetitorConfig[] {
  return competitors.map((c) => ({ ...c, id: newRacerId() }))
}

export interface SetupDraft {
  maxClicks: number
  hostPrompt: string
  includeSummary: boolean
  competitors: CompetitorConfig[]
}

export const SETUP_DRAFT_KEY = 'oof-setup-draft'

export function loadSetupDraft(): SetupDraft | null {
  try {
    const raw = localStorage.getItem(SETUP_DRAFT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as SetupDraft
    if (!parsed.competitors?.length) return null
    return parsed
  } catch {
    return null
  }
}

export function saveSetupDraft(draft: SetupDraft): void {
  localStorage.setItem(SETUP_DRAFT_KEY, JSON.stringify(draft))
}
