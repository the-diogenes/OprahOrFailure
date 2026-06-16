import type { RacerRun } from '../types'
import { formatCost } from '../lib/costs'

const STATUS_LABELS: Record<RacerRun['status'], string> = {
  pending: 'WAITING',
  running: 'RUNNING',
  success: '★ OPRAH',
  dnf_max_clicks: 'DNF — MAX CLICKS',
  dnf_invalid_link: 'DNF — INVALID LINK',
  dnf_repeat_page: 'DNF — REPEAT PAGE',
  dnf_timeout: 'DNF — TIMEOUT',
  dnf_provider_error: 'DNF — PROVIDER ERROR',
}

const STATUS_COLORS: Record<RacerRun['status'], string> = {
  pending: 'text-gray-500',
  running: 'text-yellow-400',
  success: 'text-white font-bold',
  dnf_max_clicks: 'text-red-400',
  dnf_invalid_link: 'text-red-400',
  dnf_repeat_page: 'text-red-400',
  dnf_timeout: 'text-red-400',
  dnf_provider_error: 'text-red-400',
}

interface Props {
  racer: RacerRun
  startPage: string
  maxClicks: number
}

export default function RacerColumn({ racer, startPage, maxClicks }: Props) {
  const path = [startPage, ...racer.turns.filter((t) => t.validationStatus === 'ok').map((t) => t.resultingPageTitle)]
  const latestTurn = racer.turns[racer.turns.length - 1]

  return (
    <div className={`flex flex-col min-w-52 border-r border-white/15 pr-4 last:border-r-0 last:pr-0`}>
      {/* Header */}
      <div className="mb-3">
        <div className="text-sm font-bold tracking-wider truncate">{racer.competitorName}</div>
        <div className="text-xs text-gray-500 truncate">{racer.modelId}</div>
        <div className={`text-xs mt-1 tracking-wider ${STATUS_COLORS[racer.status]}`}>
          {STATUS_LABELS[racer.status]}
        </div>
      </div>

      {/* Metrics */}
      <div className="text-xs text-gray-400 mb-3 space-y-0.5">
        <div>
          CLICKS: <span className="text-white">{racer.clicks}</span>
          <span className="text-gray-600"> / {maxClicks}</span>
        </div>
        {racer.totalCostUsd > 0 && (
          <div>
            COST: <span className="text-white">{formatCost(racer.totalCostUsd)}</span>
          </div>
        )}
        {racer.totalInputTokens > 0 && (
          <div className="text-gray-600">
            {racer.totalInputTokens.toLocaleString()}in / {racer.totalOutputTokens.toLocaleString()}out tokens
          </div>
        )}
      </div>

      {/* Path */}
      <div className="text-xs space-y-1 flex-1">
        {path.map((page, i) => (
          <div key={i} className="flex flex-col">
            <span
              className={
                i === 0 ? 'text-gray-500'
                : page.toLowerCase() === 'oprah winfrey' ? 'text-white font-bold'
                : 'text-white'
              }
            >
              {page}
            </span>
            {i < path.length - 1 && (
              <span className="text-gray-600 ml-1">↓</span>
            )}
          </div>
        ))}
        {racer.status === 'running' && (
          <div className="text-yellow-400 animate-pulse text-xs">...</div>
        )}
      </div>

      {/* Latest scratchpad */}
      {latestTurn && (
        <div className="mt-3 border-t border-white/10 pt-2">
          <div className="text-xs text-gray-600 tracking-widest mb-1">NAVIGATOR LOG</div>
          <div className="text-xs text-gray-400 leading-relaxed line-clamp-4">
            {latestTurn.publicScratchpad}
          </div>
          {latestTurn.latencyMs > 0 && (
            <div className="text-xs text-gray-600 mt-1">{(latestTurn.latencyMs / 1000).toFixed(1)}s</div>
          )}
        </div>
      )}
    </div>
  )
}
