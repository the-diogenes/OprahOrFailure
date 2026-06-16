import { useRace } from '../context/RaceContext'
import RacerColumn from './RacerColumn'
import { formatCost } from '../lib/costs'

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
    <div className="min-h-screen px-4 py-8">
      {/* Header */}
      <div className="max-w-full mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-widest uppercase">RACE {race.seedLabel}</h2>
          <div className="text-xs text-gray-400 mt-1 space-x-4">
            <span>START: <span className="text-white">{race.startPageTitle}</span></span>
            <span>TARGET: <span className="text-white">{race.targetPageTitle}</span></span>
            <span>PAR: <span className="text-white">{race.maxClicks}</span></span>
            {totalRaceCost > 0 && (
              <span>RACE COST: <span className="text-white">{formatCost(totalRaceCost)}</span></span>
            )}
          </div>
        </div>
        <div className="flex gap-3">
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

      {/* Race columns */}
      <div className="overflow-x-auto">
        <div className="flex gap-6 min-w-fit pb-4">
          {sorted.map((racer) => (
            <RacerColumn
              key={racer.id}
              racer={racer}
              startPage={race.startPageTitle}
              maxClicks={race.maxClicks}
            />
          ))}
        </div>
      </div>

      {/* Cost breakdown table */}
      {totalRaceCost > 0 && (
        <div className="mt-8 border-t border-white/15 pt-6">
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
