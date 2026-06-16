import { useRace } from '../context/RaceContext'
import { formatCost } from '../lib/costs'
import type { RacerRun } from '../types'

const STATUS_LABELS: Record<RacerRun['status'], string> = {
  pending: 'WAITING',
  running: 'RUNNING',
  success: 'SUCCESS',
  dnf_max_clicks: 'DNF — MAX CLICKS',
  dnf_invalid_link: 'DNF — INVALID LINK',
  dnf_repeat_page: 'DNF — REPEAT PAGE',
  dnf_timeout: 'DNF — TIMEOUT',
  dnf_provider_error: 'DNF — PROVIDER ERROR',
}

/** Short rank-column label (STATUS column explains the rest). */
const STATUS_RANK: Record<RacerRun['status'], string> = {
  pending: '—',
  running: '…',
  success: '', // filled with numeric rank
  dnf_max_clicks: 'MAX',
  dnf_invalid_link: 'INV',
  dnf_repeat_page: 'REP',
  dnf_timeout: 'TMO',
  dnf_provider_error: 'ERR',
}

function sortRacers(racers: RacerRun[]): RacerRun[] {
  return [...racers].sort((a, b) => {
    const aWin = a.status === 'success'
    const bWin = b.status === 'success'
    if (aWin && !bWin) return -1
    if (!aWin && bWin) return 1
    if (aWin && bWin) return a.clicks - b.clicks
    // Among DNF / incomplete: furthest (most clicks) first
    return b.clicks - a.clicks
  })
}

function golfScore(r: RacerRun, par: number): string {
  if (r.status === 'success') {
    const diff = r.clicks - par
    if (diff === 0) return 'E'
    return diff < 0 ? String(diff) : `+${diff}`
  }
  if (r.status === 'dnf_max_clicks') return 'MAX'
  return 'DNF'
}

export default function ResultsPage() {
  const { race, setScreen } = useRace()

  if (!race) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <button onClick={() => setScreen('landing')} className="text-xs tracking-widest uppercase border border-white/30 px-4 py-2 hover:border-white">
          ← HOME
        </button>
      </div>
    )
  }

  const sorted = sortRacers(race.racers)
  let successRank = 0

  const winner = sorted.find((r) => r.status === 'success')
  const totalCost = race.racers.reduce((s, r) => s + r.totalCostUsd, 0)
  const par = race.maxClicks

  function displayGolfScore(r: RacerRun): string {
    return golfScore(r, par)
  }

  return (
    <div className="min-h-screen px-4 py-12 max-w-5xl mx-auto">
      {/* Nav */}
      <div className="flex gap-4 mb-8">
        <button onClick={() => setScreen('race')} className="text-xs text-gray-500 hover:text-white tracking-widest uppercase">
          ← RACE BOARD
        </button>
        <button onClick={() => setScreen('setup')} className="text-xs border border-white px-4 py-2 tracking-widest uppercase hover:bg-white hover:text-black transition-colors">
          NEW RACE
        </button>
      </div>

      {/* Headline */}
      <h2 className="text-3xl font-bold tracking-widest uppercase mb-1">RESULTS</h2>
      <div className="text-xs text-gray-500 mb-8">
        SEED {race.seedLabel} · START: {race.startPageTitle} · PAR: {par}
        {totalCost > 0 && <span> · TOTAL COST: {formatCost(totalCost)}</span>}
      </div>

      {winner && (
        <div className="border border-white px-6 py-4 mb-8 max-w-md">
          <div className="text-xs text-gray-400 tracking-widest uppercase mb-1">Winner</div>
          <div className="text-xl font-bold">{winner.competitorName}</div>
          <div className="text-gray-400 text-sm">{winner.clicks} CLICKS · {displayGolfScore(winner)}</div>
        </div>
      )}

      {/* Ranking table */}
      <div className="mb-10 overflow-x-auto">
        <table className="text-xs font-mono w-full border-collapse">
          <thead>
            <tr className="text-gray-500 text-left border-b border-white/20">
              <th className="py-2 pr-6">RANK</th>
              <th className="py-2 pr-6">COMPETITOR</th>
              <th className="py-2 pr-6">MODEL</th>
              <th className="py-2 pr-4">STATUS</th>
              <th className="py-2 pr-4 text-right">CLICKS</th>
              <th className="py-2 pr-4 text-right">SCORE</th>
              <th className="py-2 pr-4 text-right">IN TOK</th>
              <th className="py-2 pr-4 text-right">OUT TOK</th>
              <th className="py-2 text-right">COST</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => {
              const rankCell = r.status === 'success' ? String(++successRank) : STATUS_RANK[r.status]
              return (
              <tr key={r.id} className={`border-b border-white/10 ${r.status === 'success' ? '' : 'text-gray-500'}`}>
                <td className="py-2 pr-6">{rankCell}</td>
                <td className="py-2 pr-6 text-white">{r.competitorName}</td>
                <td className="py-2 pr-6 text-gray-400">{r.modelId}</td>
                <td className="py-2 pr-4 text-xs">{STATUS_LABELS[r.status]}</td>
                <td className="py-2 pr-4 text-right text-white">{r.clicks}</td>
                <td className={`py-2 pr-4 text-right font-bold ${r.status === 'success' && r.clicks < par ? 'text-green-400' : r.status === 'success' ? 'text-white' : 'text-red-400'}`}>
                  {displayGolfScore(r)}
                </td>
                <td className="py-2 pr-4 text-right">{r.totalInputTokens > 0 ? r.totalInputTokens.toLocaleString() : '—'}</td>
                <td className="py-2 pr-4 text-right">{r.totalOutputTokens > 0 ? r.totalOutputTokens.toLocaleString() : '—'}</td>
                <td className="py-2 text-right text-white">{r.totalCostUsd > 0 ? formatCost(r.totalCostUsd) : '—'}</td>
              </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Full paths */}
      <h3 className="text-sm tracking-widest uppercase text-gray-400 mb-4">FULL PATHS</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {sorted.map((r) => {
          const path = [race.startPageTitle, ...r.turns.filter((t) => t.validationStatus === 'ok').map((t) => t.resultingPageTitle)]
          return (
            <div key={r.id} className="border border-white/20 p-4">
              <div className="text-sm font-bold mb-1">{r.competitorName}</div>
              <div className="text-xs text-gray-500 mb-3">
                {r.modelId} · {r.clicks} click{r.clicks !== 1 ? 's' : ''} · {STATUS_LABELS[r.status]}
              </div>
              <div className="text-xs space-y-1">
                {path.map((page, i) => (
                  <div key={i} className={page.toLowerCase() === 'oprah winfrey' ? 'text-white font-bold' : i === 0 ? 'text-gray-500' : 'text-white'}>
                    {i > 0 && <span className="text-gray-600 mr-1">↓</span>}
                    {page}
                  </div>
                ))}
              </div>
              {r.status === 'dnf_provider_error' && r.turns.length > 0 && (
                <div className="mt-3 text-xs text-red-400 border-t border-white/10 pt-2 break-all">
                  {r.turns[r.turns.length - 1].publicScratchpad}
                </div>
              )}
              {r.status !== 'dnf_provider_error' && r.turns.length > 0 && (
                <div className="mt-3 text-xs text-gray-500 border-t border-white/10 pt-2">
                  Avg latency: {Math.round(r.turns.reduce((s, t) => s + t.latencyMs, 0) / r.turns.length)}ms
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
