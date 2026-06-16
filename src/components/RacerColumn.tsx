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

const STATUS_SHORT: Record<RacerRun['status'], string> = {
  pending: 'WAIT',
  running: 'GO',
  success: '★',
  dnf_max_clicks: 'MAX',
  dnf_invalid_link: 'INV',
  dnf_repeat_page: 'REP',
  dnf_timeout: 'TMO',
  dnf_provider_error: 'ERR',
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
  const currentPage = path[path.length - 1] ?? startPage

  return (
    <div className="flex flex-col min-w-0 min-h-0 h-full border border-white/15 rounded-sm p-1.5 md:min-w-52 md:border-0 md:border-r md:rounded-none md:p-0 md:pr-4 md:last:border-r-0 md:last:pr-0">
      {/* Header */}
      <div className="shrink-0 mb-1 md:mb-3">
        <div className="text-[10px] md:text-sm font-bold tracking-wide truncate leading-tight">
          {racer.competitorName}
        </div>
        <div className="hidden md:block text-xs text-gray-500 truncate">{racer.modelId}</div>
        <div className={`text-[10px] md:text-xs mt-0.5 tracking-wider ${STATUS_COLORS[racer.status]}`}>
          <span className="md:hidden">{STATUS_SHORT[racer.status]}</span>
          <span className="hidden md:inline">{STATUS_LABELS[racer.status]}</span>
        </div>
      </div>

      {/* Metrics */}
      <div className="shrink-0 text-[10px] md:text-xs text-gray-400 mb-1 md:mb-3">
        <div>
          <span className="text-white font-bold">{racer.clicks}</span>
          <span className="text-gray-600">/{maxClicks}</span>
        </div>
        {racer.totalCostUsd > 0 && (
          <div className="hidden sm:block">
            COST: <span className="text-white">{formatCost(racer.totalCostUsd)}</span>
          </div>
        )}
        {racer.totalInputTokens > 0 && (
          <div className="hidden md:block text-gray-600">
            {racer.totalInputTokens.toLocaleString()}in / {racer.totalOutputTokens.toLocaleString()}out tokens
          </div>
        )}
      </div>

      {/* Current page — always visible on mobile */}
      <div className="shrink-0 md:hidden mb-1 border-t border-white/10 pt-1">
        <div className="text-[9px] text-gray-600 tracking-widest uppercase">NOW</div>
        <div
          className={`text-[10px] leading-tight line-clamp-3 break-words ${
            currentPage.toLowerCase() === 'oprah winfrey' ? 'text-white font-bold' : 'text-white'
          } ${racer.status === 'running' ? 'animate-pulse' : ''}`}
        >
          {currentPage}
        </div>
      </div>

      {/* Full path — scrollable within column */}
      <div className="text-[10px] md:text-xs space-y-0.5 flex-1 min-h-0 overflow-y-auto overscroll-contain">
        <div className="hidden md:block space-y-1">
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
        </div>
        {/* Mobile: compact path — start + recent hops */}
        <div className="md:hidden space-y-0.5">
          {path.length > 3 ? (
            <>
              <span className="text-gray-500 line-clamp-1 break-words">{path[0]}</span>
              <span className="text-gray-600">⋯</span>
              {path.slice(-2, -1).map((page, i) => (
                <div key={i} className="flex flex-col">
                  <span className="text-gray-400 line-clamp-1 break-words">{page}</span>
                  <span className="text-gray-600">↓</span>
                </div>
              ))}
            </>
          ) : (
            path.slice(0, -1).map((page, i) => (
              <div key={i} className="flex flex-col">
                <span className={i === 0 ? 'text-gray-500 line-clamp-1 break-words' : 'text-gray-400 line-clamp-1 break-words'}>
                  {page}
                </span>
                <span className="text-gray-600">↓</span>
              </div>
            ))
          )}
        </div>
        {racer.status === 'running' && (
          <div className="text-yellow-400 animate-pulse text-[10px] md:text-xs">...</div>
        )}
      </div>

      {/* Latest scratchpad / error — desktop only */}
      {latestTurn && (
        <div className="hidden md:block shrink-0 mt-3 border-t border-white/10 pt-2">
          <div className="text-xs text-gray-600 tracking-widest mb-1">
            {latestTurn.validationStatus === 'json_error' || racer.status === 'dnf_provider_error'
              ? 'ERROR'
              : 'NAVIGATOR LOG'}
          </div>
          <div className={`text-xs leading-relaxed line-clamp-6 break-all ${
            latestTurn.validationStatus === 'json_error' || racer.status === 'dnf_provider_error'
              ? 'text-red-400'
              : 'text-gray-400'
          }`}>
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
