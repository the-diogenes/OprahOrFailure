import { useState } from 'react'
import type { ApiKeys, CompetitorConfig, ProviderId } from '../types'
import { PROVIDERS } from '../lib/providers'
import { MODEL_OPTIONS, PROVIDER_ORDER } from '../lib/raceSetupConstants'

interface Props {
  racer: CompetitorConfig
  index: number
  canRemove: boolean
  apiKeys: ApiKeys
  onChange: (id: string, patch: Partial<CompetitorConfig>) => void
  onRemove: (id: string) => void
}

export default function RacerConfigRow({
  racer,
  index,
  canRemove,
  apiKeys,
  onChange,
  onRemove,
}: Props) {
  const [showPrompt, setShowPrompt] = useState(Boolean(racer.hostPrompt?.trim()))
  const hasCustomPrompt = Boolean(racer.hostPrompt?.trim())
  const needsKey = racer.providerId !== 'shotgunbot' && !apiKeys[racer.providerId as keyof ApiKeys]

  const handleProviderChange = (providerId: ProviderId) => {
    const models = MODEL_OPTIONS[providerId]
    onChange(racer.id, {
      providerId,
      modelId: models[0],
      maxTokens: providerId === 'shotgunbot' ? 0 : 300,
      temperature: providerId === 'shotgunbot' ? 0 : 0.7,
    })
  }

  return (
    <div className="border border-white/25 p-3 md:p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2 md:gap-3">
        <span className="text-xs text-gray-600 w-6 shrink-0">#{index + 1}</span>
        <input
          type="text"
          value={racer.displayName}
          onChange={(e) => onChange(racer.id, { displayName: e.target.value })}
          placeholder="Nickname"
          className="flex-1 min-w-[8rem] bg-black border border-white/30 px-2 py-1.5 text-sm font-bold tracking-wide focus:outline-none focus:border-white"
        />
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(racer.id)}
            className="w-8 h-8 border border-white/30 text-gray-400 hover:border-red-500 hover:text-red-400 shrink-0"
            title="Remove racer"
          >
            −
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 md:gap-3 pl-8 md:pl-9">
        <label className="flex flex-col gap-0.5">
          <span className="text-[10px] tracking-widest uppercase text-gray-500">Provider</span>
          <select
            value={racer.providerId}
            onChange={(e) => handleProviderChange(e.target.value as ProviderId)}
            className="bg-black border border-white/30 text-xs px-2 py-1.5 font-mono focus:outline-none focus:border-white min-w-[7rem]"
          >
            {PROVIDER_ORDER.map((p) => (
              <option key={p} value={p}>{PROVIDERS[p].displayName}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-0.5 flex-1 min-w-[10rem]">
          <span className="text-[10px] tracking-widest uppercase text-gray-500">Model</span>
          <select
            value={racer.modelId}
            onChange={(e) => onChange(racer.id, { modelId: e.target.value })}
            className="bg-black border border-white/30 text-xs px-2 py-1.5 font-mono focus:outline-none focus:border-white w-full"
          >
            {MODEL_OPTIONS[racer.providerId].map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </label>

        {needsKey && (
          <span className="text-xs text-yellow-500 self-end pb-1">⚠ no API key</span>
        )}
      </div>

      <div className="pl-8 md:pl-9">
        <button
          type="button"
          onClick={() => {
            if (showPrompt && hasCustomPrompt) {
              onChange(racer.id, { hostPrompt: undefined })
            }
            setShowPrompt((v) => !v)
          }}
          className="text-xs tracking-widest uppercase text-gray-500 hover:text-white"
        >
          {showPrompt ? '▼' : '▶'} Custom prompt
          {hasCustomPrompt && !showPrompt && (
            <span className="ml-2 text-white">(active)</span>
          )}
        </button>
        {showPrompt && (
          <div className="mt-2 space-y-2">
            <p className="text-[10px] text-gray-600">
              Overrides the race default for this bot only. Leave blank to use the shared host prompt.
            </p>
            <textarea
              value={racer.hostPrompt ?? ''}
              onChange={(e) => onChange(racer.id, { hostPrompt: e.target.value || undefined })}
              rows={3}
              placeholder="Optional — uses race default if empty"
              className="w-full bg-black border border-white/30 px-2 py-2 text-xs font-mono focus:outline-none focus:border-white resize-y"
            />
          </div>
        )}
      </div>
    </div>
  )
}
