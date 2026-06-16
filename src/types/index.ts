export type ProviderId = 'openai' | 'anthropic' | 'google' | 'xai' | 'shotgunbot'

export type RaceMode = 'wait' | 'live' | 'solo'

export type RunStatus =
  | 'pending'
  | 'running'
  | 'success'
  | 'dnf_max_clicks'
  | 'dnf_invalid_link'
  | 'dnf_repeat_page'
  | 'dnf_timeout'
  | 'dnf_provider_error'

export interface ApiKeys {
  openai: string
  anthropic: string
  google: string
  xai: string
}

export interface WikiPage {
  title: string
  canonicalTitle: string
  pageId: number
  summary: string
  links: string[]
  url: string
}

export interface Turn {
  turnIndex: number
  currentPageTitle: string
  availableLinks: string[]
  chosenLink: string
  resultingPageTitle: string
  publicScratchpad: string
  confidence: number
  latencyMs: number
  validationStatus: 'ok' | 'invalid_link' | 'repeat_page' | 'json_error'
  inputTokens: number
  outputTokens: number
  costUsd: number
}

export interface RacerRun {
  id: string
  competitorConfigId: string
  competitorName: string
  providerId: ProviderId
  modelId: string
  status: RunStatus
  clicks: number
  elapsedMs: number
  invalidAttempts: number
  turns: Turn[]
  totalInputTokens: number
  totalOutputTokens: number
  totalCostUsd: number
  startPageTitle: string
}

export interface Race {
  id: string
  seedLabel: string
  startPageTitle: string
  targetPageTitle: string
  maxClicks: number
  mode: RaceMode
  hostPrompt: string
  status: 'setup' | 'running' | 'complete'
  createdAt: string
  racers: RacerRun[]
}

export interface CompetitorConfig {
  id: string
  providerId: ProviderId
  modelId: string
  displayName: string
  temperature: number
  maxTokens: number
  /** When set, overrides the race-wide host prompt for this bot only. */
  hostPrompt?: string
}

export interface RaceConfig {
  mode: RaceMode
  maxClicks: number
  hostPrompt: string
  competitors: CompetitorConfig[]
  includeSummary: boolean
  maxLinksPerPage: number
}

export interface AgentRequest {
  model: string
  systemPrompt: string
  hostPrompt: string
  gameState: {
    goal: string
    rules: string[]
    clicksUsed: number
    clicksRemaining: number
    visitedPages: string[]
    currentPage: {
      title: string
      summary: string
      availableLinks: string[]
    }
  }
  temperature: number
  maxTokens: number
}

export interface AgentResponse {
  chosenLink: string
  publicScratchpad: string
  confidence: number
  inputTokens: number
  outputTokens: number
  costUsd: number
}

export interface ModelCostTable {
  [modelId: string]: {
    inputPer1M: number
    outputPer1M: number
  }
}
