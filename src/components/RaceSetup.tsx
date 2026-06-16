import { useState, useEffect, useCallback } from 'react'
import { useRace } from '../context/RaceContext'
import type { CompetitorConfig, RaceConfig } from '../types'
import { DEFAULT_HOST_PROMPT } from '../lib/raceEngine'
import { PROVIDERS } from '../lib/providers'
import { hasSavedKeys } from '../lib/keyStore'
import {
  defaultRoster,
  loadSetupDraft,
  saveSetupDraft,
  PROMPT_PRESETS,
  MAX_RACERS,
  MIN_RACERS,
  createRacer,
  cloneRoster,
} from '../lib/raceSetupConstants'
import { loadPresets, savePreset, deletePreset, type RosterPreset } from '../lib/rosterPresets'
import RacerConfigRow from './RacerConfigRow'

function initFromDraft() {
  const draft = loadSetupDraft()
  if (draft) return draft
  return {
    maxClicks: 8,
    hostPrompt: DEFAULT_HOST_PROMPT,
    includeSummary: true,
    competitors: defaultRoster(),
  }
}

export default function RaceSetup() {
  const { setScreen, apiKeys, setApiKeys, clearKeys, startRace } = useRace()
  const initial = initFromDraft()

  const [maxClicks, setMaxClicks] = useState(initial.maxClicks)
  const [hostPrompt, setHostPrompt] = useState(initial.hostPrompt)
  const [competitors, setCompetitors] = useState<CompetitorConfig[]>(initial.competitors)
  const [selectedPreset, setSelectedPreset] = useState('Aggressive Media')
  const [includeSummary, setIncludeSummary] = useState(initial.includeSummary)
  const [showKeys, setShowKeys] = useState(!hasSavedKeys(apiKeys))
  const [launching, setLaunching] = useState(false)

  const [presets, setPresets] = useState<RosterPreset[]>(() => loadPresets())
  const [selectedSavedPresetId, setSelectedSavedPresetId] = useState('')
  const [savePresetName, setSavePresetName] = useState('')
  const [presetMessage, setPresetMessage] = useState('')

  const keysAreSaved = hasSavedKeys(apiKeys)

  const persistDraft = useCallback(() => {
    saveSetupDraft({ maxClicks, hostPrompt, includeSummary, competitors })
  }, [maxClicks, hostPrompt, includeSummary, competitors])

  useEffect(() => {
    persistDraft()
  }, [persistDraft])

  const updateRacer = (id: string, patch: Partial<CompetitorConfig>) => {
    setCompetitors((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  }

  const addRacer = () => {
    if (competitors.length >= MAX_RACERS) return
    const n = competitors.length + 1
    setCompetitors((prev) => [
      ...prev,
      createRacer({ displayName: `Racer ${n}` }),
    ])
  }

  const removeRacer = (id: string) => {
    if (competitors.length <= MIN_RACERS) return
    setCompetitors((prev) => prev.filter((c) => c.id !== id))
  }

  const handleHostPreset = (name: string) => {
    setSelectedPreset(name)
    setHostPrompt(PROMPT_PRESETS[name] ?? hostPrompt)
  }

  const loadSavedPreset = (id: string) => {
    const preset = presets.find((p) => p.id === id)
    if (!preset) return
    setMaxClicks(preset.maxClicks)
    setHostPrompt(preset.hostPrompt)
    setIncludeSummary(preset.includeSummary)
    setCompetitors(cloneRoster(preset.competitors))
    setSelectedSavedPresetId(id)
    setPresetMessage(`Loaded "${preset.name}"`)
    setTimeout(() => setPresetMessage(''), 2500)
  }

  const handleSavePreset = () => {
    const name = savePresetName.trim()
    if (!name) return
    const existing = presets.find((p) => p.name.toLowerCase() === name.toLowerCase())
    const saved = savePreset({
      id: existing?.id,
      name,
      maxClicks,
      hostPrompt,
      includeSummary,
      competitors: competitors.map((c) => ({ ...c })),
    })
    setPresets(loadPresets())
    setSelectedSavedPresetId(saved.id)
    setSavePresetName('')
    setPresetMessage(`Saved "${saved.name}"`)
    setTimeout(() => setPresetMessage(''), 2500)
  }

  const handleDeletePreset = () => {
    if (!selectedSavedPresetId) return
    const preset = presets.find((p) => p.id === selectedSavedPresetId)
    if (!preset || !confirm(`Delete preset "${preset.name}"?`)) return
    deletePreset(selectedSavedPresetId)
    setPresets(loadPresets())
    setSelectedSavedPresetId('')
    setPresetMessage(`Deleted "${preset.name}"`)
    setTimeout(() => setPresetMessage(''), 2500)
  }

  const resetToDefault = () => {
    setCompetitors(defaultRoster())
    setMaxClicks(8)
    setHostPrompt(DEFAULT_HOST_PROMPT)
    setIncludeSummary(true)
    setSelectedPreset('Aggressive Media')
  }

  const handleLaunch = async () => {
    setLaunching(true)
    persistDraft()
    const config: RaceConfig = {
      mode: 'wait',
      maxClicks,
      hostPrompt,
      competitors,
      includeSummary,
      maxLinksPerPage: 200,
    }
    await startRace(config)
    setLaunching(false)
  }

  const racersWithMissingKeys = competitors.filter(
    (c) => c.providerId !== 'shotgunbot' && !apiKeys[c.providerId as keyof typeof apiKeys],
  )

  return (
    <div className="min-h-screen px-4 py-8 md:py-12 max-w-4xl mx-auto pb-24">
      <button onClick={() => setScreen('landing')} className="text-xs text-gray-500 hover:text-white mb-6 md:mb-8 tracking-widest uppercase">
        ← BACK
      </button>

      <h2 className="text-2xl md:text-3xl font-bold tracking-widest uppercase mb-2">RACE SETUP</h2>
      <p className="text-xs text-gray-500 mb-8 tracking-wider">
        Build your roster — up to {MAX_RACERS} racers, each with its own provider, model, and optional prompt
      </p>

      {/* Saved presets */}
      <section className="mb-8 border border-white/15 p-4">
        <h3 className="text-sm tracking-widest uppercase mb-3 text-gray-400">ROSTER PRESETS</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          <select
            value={selectedSavedPresetId}
            onChange={(e) => {
              const id = e.target.value
              setSelectedSavedPresetId(id)
              if (id) loadSavedPreset(id)
            }}
            className="bg-black border border-white/30 text-xs px-2 py-2 font-mono focus:outline-none focus:border-white min-w-[10rem] flex-1"
          >
            <option value="">Load saved preset…</option>
            {presets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.competitors.length} racer{p.competitors.length !== 1 ? 's' : ''})
              </option>
            ))}
          </select>
          {selectedSavedPresetId && (
            <button
              type="button"
              onClick={handleDeletePreset}
              className="text-xs border border-red-500/40 text-red-400 px-3 py-2 tracking-widest uppercase hover:border-red-400"
            >
              DELETE
            </button>
          )}
          <button
            type="button"
            onClick={resetToDefault}
            className="text-xs border border-white/30 px-3 py-2 tracking-widest uppercase hover:border-white"
          >
            RESET DEFAULT
          </button>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="text"
            value={savePresetName}
            onChange={(e) => setSavePresetName(e.target.value)}
            placeholder="Preset name…"
            className="bg-black border border-white/30 px-2 py-2 text-xs font-mono focus:outline-none focus:border-white flex-1 min-w-[8rem]"
          />
          <button
            type="button"
            onClick={handleSavePreset}
            disabled={!savePresetName.trim()}
            className="text-xs border border-white px-4 py-2 tracking-widest uppercase hover:bg-white hover:text-black transition-colors disabled:opacity-30"
          >
            SAVE PRESET
          </button>
        </div>
        {presetMessage && (
          <p className="text-xs text-green-400 mt-2">{presetMessage}</p>
        )}
      </section>

      {/* API Keys */}
      <section className="mb-8">
        <div className="flex items-center gap-4 mb-4 flex-wrap">
          <button
            onClick={() => setShowKeys((v) => !v)}
            className="text-xs tracking-widest uppercase border border-white/30 px-4 py-2 hover:border-white"
          >
            {showKeys ? '▼' : '▶'} API KEYS
          </button>
          {keysAreSaved && (
            <span className="text-xs text-green-400 tracking-wider">
              ✓ KEYS SAVED ({Object.values(apiKeys).filter(Boolean).length}/4)
            </span>
          )}
          {keysAreSaved && (
            <button
              onClick={() => { clearKeys(); setShowKeys(true) }}
              className="text-xs text-gray-600 hover:text-red-400 tracking-widest uppercase ml-auto"
            >
              CLEAR SAVED KEYS
            </button>
          )}
        </div>
        {showKeys && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border border-white/20">
            {(['openai', 'anthropic', 'google', 'xai'] as const).map((p) => (
              <label key={p} className="flex flex-col gap-1">
                <span className="text-xs tracking-widest uppercase text-gray-400">{PROVIDERS[p].displayName}</span>
                <input
                  type="password"
                  placeholder={`${p.toUpperCase()}_API_KEY`}
                  value={apiKeys[p]}
                  onChange={(e) => setApiKeys({ ...apiKeys, [p]: e.target.value })}
                  className="bg-black border border-white/30 px-3 py-2 text-xs font-mono focus:outline-none focus:border-white"
                />
              </label>
            ))}
            <p className="col-span-full text-xs text-gray-600 mt-1">
              Keys save automatically to this browser. Never sent anywhere except the LLM provider directly.
            </p>
          </div>
        )}
      </section>

      {/* Roster */}
      <section className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="text-sm tracking-widest uppercase text-gray-400">
            RACERS ({competitors.length}/{MAX_RACERS})
          </h3>
          <button
            type="button"
            onClick={addRacer}
            disabled={competitors.length >= MAX_RACERS}
            className="text-xs border border-white px-4 py-2 tracking-widest uppercase hover:bg-white hover:text-black transition-colors disabled:opacity-30"
          >
            + ADD RACER
          </button>
        </div>
        <div className="space-y-3">
          {competitors.map((c, i) => (
            <RacerConfigRow
              key={c.id}
              racer={c}
              index={i}
              canRemove={competitors.length > MIN_RACERS}
              apiKeys={apiKeys}
              onChange={updateRacer}
              onRemove={removeRacer}
            />
          ))}
        </div>
        {racersWithMissingKeys.length > 0 && (
          <p className="text-xs text-yellow-500 mt-3">
            ⚠ {racersWithMissingKeys.map((c) => c.displayName).join(', ')} — missing API key (will fail unless you add keys or switch to ShotgunBot)
          </p>
        )}
      </section>

      {/* Race Config */}
      <section className="mb-8">
        <h3 className="text-sm tracking-widest uppercase mb-4 text-gray-400">RACE CONFIG</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <label className="flex flex-col gap-1">
            <span className="text-xs tracking-widest uppercase text-gray-400">Max Clicks (Par)</span>
            <input
              type="number"
              min={2}
              max={20}
              value={maxClicks}
              onChange={(e) => setMaxClicks(Number(e.target.value))}
              className="bg-black border border-white/30 px-3 py-2 text-sm font-mono w-24 focus:outline-none focus:border-white"
            />
          </label>
          <label className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIncludeSummary((v) => !v)}
              className={`w-5 h-5 border flex items-center justify-center text-xs shrink-0 ${includeSummary ? 'border-white bg-white text-black' : 'border-white/30'}`}
            >
              {includeSummary ? '✓' : ''}
            </button>
            <span className="text-xs tracking-widest uppercase text-gray-400">Include Page Summaries</span>
          </label>
        </div>
      </section>

      {/* Default host prompt */}
      <section className="mb-10">
        <h3 className="text-sm tracking-widest uppercase mb-4 text-gray-400">DEFAULT HOST PROMPT</h3>
        <p className="text-xs text-gray-600 mb-3">
          Applied to every racer unless they have a custom prompt override.
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          {Object.keys(PROMPT_PRESETS).map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => handleHostPreset(name)}
              className={`text-xs px-3 py-1 border tracking-wider ${selectedPreset === name ? 'border-white bg-white text-black' : 'border-white/30 hover:border-white'}`}
            >
              {name}
            </button>
          ))}
        </div>
        <textarea
          value={hostPrompt}
          onChange={(e) => { setHostPrompt(e.target.value); setSelectedPreset('Custom') }}
          rows={4}
          className="w-full bg-black border border-white/30 px-3 py-2 text-xs font-mono focus:outline-none focus:border-white resize-y"
        />
      </section>

      {/* Launch */}
      <div className="flex items-center gap-6">
        <button
          onClick={handleLaunch}
          disabled={competitors.length === 0 || launching}
          className="border border-white px-8 md:px-10 py-3 text-sm tracking-widest uppercase hover:bg-white hover:text-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {launching ? 'LAUNCHING...' : `LAUNCH RACE (${competitors.length} racer${competitors.length !== 1 ? 's' : ''})`}
        </button>
      </div>
    </div>
  )
}
