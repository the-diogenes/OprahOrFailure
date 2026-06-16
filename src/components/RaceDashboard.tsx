import { useRace } from '../context/RaceContext'
import RacerColumn from './RacerColumn'
import { formatCost } from '../lib/costs'

/** Mobile grid columns so every racer fits on screen without horizontal scroll. */
function mobileGridClass(count: number): string {
  if (count <= 2) return 'max-md:grid-cols-2'
  if (count <= 4) return 'max-md:grid-cols-2 max-md:landscape:grid-cols-4'
  if (count <= 6) return 'max-md:grid-cols-3 max-md:landscape:grid-cols-3'
  if (count <= 9) return 'max-md:grid-cols-3 max-md:landscape:grid-cols-5'
  return 'max-md:grid-cols-5'
}

export default function RaceDashboard() {
  const { race, setScreen, stopRace } = useRace()

  if (!race) return null

  const allDone = race.racers.every(
    (r) => r.status !== 'running' && r.status !== 'pending',
  )

  const totalRaceCost = race.racers.reduce((s, r) => s + r.totalCostUsd, 0)

  // Sort for display: success first by clicks, then running, then DNF
  const sorted = [...race.racers].sort((a, b) => {
    const rank = (r: typeof a) =>
      r.status === 'success' ? r.clicks
      : r.status === 'running' || r.status === 'pending' ? 999
      : 9999
    return rank(a) - rank(b)
  })

  return (
    <div className="flex flex-col min-h-[100dvh] px-2 py-3 pb-10 md:px-4 md:py-8 md:min-h-screen">
      {/* Header */}
      <div className="shrink-0 max-w-full mb-3 md:mb-6 flex flex-wrap items-start justify-between gap-2 md:gap-4">
        <div className="min-w-0">
          <h2 className="text-lg md:text-2xl font-bold tracking-widest uppercase truncate">
            RACE {race.seedLabel}
          </h2>
          <div className="text-[10px] md:text-xs text-gray-400 mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
            <span className="truncate max-w-full">START: <span className="text-white">{race.startPageTitle}</span></span>
            <span>TARGET: <span className="text-white">{race.targetPageTitle}</span></span>
            <span>PAR: <span className="text-white">{race.maxClicks}</span></span>
            {totalRaceCost > 0 && (
              <span className="hidden sm:inline">RACE COST: <span className="text-white">{formatCost(totalRaceCost)}</span></span>
            )}
          </div>
        </div>
        <div className="flex gap-2 md:gap-3 shrink-0">
          {!allDone && (
            <button
              onClick={stopRace}
              className="text-xs border border-red-500/50 text-red-400 px-4 py-2 tracking-widest uppercase hover:border-red-400"
            >
              STOP
            </button>
          )}
          {allDone && (
            <button
              onClick={() => setScreen('results')}
              className="text-xs border border-white px-4 py-2 tracking-widest uppercase hover:bg-white hover:text-black transition-colors"
            >
              VIEW RESULTS →
            </button>
          )}
          <button
            onClick={() => setScreen('setup')}
            className="text-xs border border-white/30 px-4 py-2 tracking-widest uppercase hover:border-white"
          >
            NEW RACE
          </button>
        </div>
      </div>

      {/* Race columns — grid on mobile (all bots visible), scroll row on desktop */}
      <div
        className={`flex-1 min-h-0 grid gap-1.5 auto-rows-fr ${mobileGridClass(sorted.length)} md:flex md:gap-6 md:overflow-x-auto md:min-w-fit md:pb-4`}
      >
        {sorted.map((racer) => (
          <RacerColumn
            key={racer.id}
            racer={racer}
            startPage={race.startPageTitle}
            maxClicks={race.maxClicks}
          />
        ))}
      </div>

      {/* Cost breakdown — always on desktop; on mobile only after race finishes */}
      {totalRaceCost > 0 && (
        <div className={`shrink-0 mt-4 md:mt-8 border-t border-white/15 pt-4 md:pt-6 ${allDone ? '' : 'hidden md:block'}`}>
          <h3 className="text-xs tracking-widest uppercase text-gray-400 mb-3">COST BREAKDOWN</h3>
          <div className="overflow-x-auto">
            <table className="text-xs font-mono w-full max-w-2xl border-collapse">
              <thead>
                <tr className="text-gray-500 text-left">
                  <th className="py-1 pr-6">COMPETITOR</th>
                  <th className="py-1 pr-6">MODEL</th>
                  <th className="py-1 pr-6 text-right">IN TOKENS</th>
                  <th className="py-1 pr-6 text-right">OUT TOKENS</th>
                  <th className="py-1 text-right">COST</th>
                </tr>
              </thead>
              <tbody>
                {race.racers.map((r) => (
                  <tr key={r.id} className="border-t border-white/10">
                    <td className="py-1 pr-6">{r.competitorName}</td>
                    <td className="py-1 pr-6 text-gray-400">{r.modelId}</td>
                    <td className="py-1 pr-6 text-right">{r.totalInputTokens.toLocaleString()}</td>
                    <td className="py-1 pr-6 text-right">{r.totalOutputTokens.toLocaleString()}</td>
                    <td className="py-1 text-right text-white">{formatCost(r.totalCostUsd)}</td>
                  </tr>
                ))}
                <tr className="border-t border-white/30">
                  <td colSpan={4} className="py-1 pr-6 text-gray-400 uppercase tracking-wider">Total</td>
                  <td className="py-1 text-right font-bold">{formatCost(totalRaceCost)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
