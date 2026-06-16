import type { CompetitorConfig } from '../types'

export interface RosterPreset {
  id: string
  name: string
  savedAt: string
  maxClicks: number
  hostPrompt: string
  includeSummary: boolean
  competitors: CompetitorConfig[]
}

const PRESETS_KEY = 'oof-roster-presets'

export function loadPresets(): RosterPreset[] {
  try {
    const raw = localStorage.getItem(PRESETS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as RosterPreset[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writePresets(presets: RosterPreset[]): void {
  localStorage.setItem(PRESETS_KEY, JSON.stringify(presets))
}

export function savePreset(preset: Omit<RosterPreset, 'id' | 'savedAt'> & { id?: string }): RosterPreset {
  const presets = loadPresets()
  const saved: RosterPreset = {
    ...preset,
    id: preset.id ?? `preset-${Date.now()}`,
    savedAt: new Date().toISOString(),
  }
  const idx = presets.findIndex((p) => p.id === saved.id)
  if (idx >= 0) presets[idx] = saved
  else presets.unshift(saved)
  writePresets(presets)
  return saved
}

export function deletePreset(id: string): void {
  writePresets(loadPresets().filter((p) => p.id !== id))
}
