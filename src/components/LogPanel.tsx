import { useState, useEffect, useRef } from 'react'
import { logger, type LogEntry } from '../lib/logger'

const LEVEL_COLORS: Record<LogEntry['level'], string> = {
  info:  'text-gray-300',
  warn:  'text-yellow-400',
  error: 'text-red-400',
  debug: 'text-gray-600',
}

const CAT_COLORS: Record<LogEntry['category'], string> = {
  race:   'text-blue-400',
  wiki:   'text-purple-400',
  api:    'text-green-400',
  engine: 'text-cyan-400',
  vault:  'text-orange-400',
  system: 'text-gray-400',
}

export default function LogPanel() {
  const [open, setOpen] = useState(false)
  const [entries, setEntries] = useState<LogEntry[]>([])
  const [copied, setCopied] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)

  useEffect(() => {
    const unsub = logger.subscribe(() => {
      setEntries([...logger.getEntries()])
    })
    return unsub
  }, [])

  useEffect(() => {
    if (open && autoScroll) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [entries, open, autoScroll])

  const copyLogs = async () => {
    await navigator.clipboard.writeText(logger.toText())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const errorCount = entries.filter((e) => e.level === 'error').length

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 font-mono">
      {/* Header bar */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center gap-3 px-4 py-1.5 text-xs tracking-widest uppercase border-t ${
          errorCount > 0 ? 'border-red-800 bg-red-950/80' : 'border-white/15 bg-black/90'
        } backdrop-blur`}
      >
        <span className={errorCount > 0 ? 'text-red-400' : 'text-gray-500'}>
          {open ? '▼' : '▲'} LOG
        </span>
        <span className="text-gray-600">{entries.length} entries</span>
        {errorCount > 0 && (
          <span className="text-red-400 font-bold">{errorCount} ERROR{errorCount !== 1 ? 'S' : ''}</span>
        )}
        <span className="ml-auto text-gray-700">{open ? 'COLLAPSE' : 'EXPAND'}</span>
      </button>

      {/* Log body */}
      {open && (
        <div className="bg-black/95 border-t border-white/10 backdrop-blur">
          {/* Toolbar */}
          <div className="flex items-center gap-3 px-4 py-2 border-b border-white/10">
            <span className="text-xs text-gray-600 tracking-widest uppercase">
              {entries.length} entries
            </span>
            <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer ml-4">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="accent-white"
              />
              AUTO-SCROLL
            </label>
            <button
              onClick={copyLogs}
              className="ml-auto text-xs border border-white/20 px-3 py-1 tracking-widest uppercase hover:border-white hover:text-white text-gray-500 transition-colors"
            >
              {copied ? '✓ COPIED' : 'COPY ALL'}
            </button>
            <button
              onClick={() => setOpen(false)}
              className="text-xs text-gray-600 hover:text-white px-2"
            >
              ✕
            </button>
          </div>

          {/* Entries */}
          <div className="h-64 overflow-y-auto px-4 py-2 space-y-0.5">
            {entries.length === 0 && (
              <div className="text-xs text-gray-700 py-4 text-center">No log entries yet. Start a race.</div>
            )}
            {entries.map((e) => (
              <div key={e.id} className="flex gap-2 text-xs leading-relaxed">
                <span className="text-gray-700 shrink-0 w-16 text-right">+{e.elapsed}ms</span>
                <span className={`shrink-0 w-12 uppercase ${LEVEL_COLORS[e.level]}`}>{e.level}</span>
                <span className={`shrink-0 w-14 uppercase ${CAT_COLORS[e.category]}`}>{e.category}</span>
                <span className={`flex-1 break-all ${LEVEL_COLORS[e.level]}`}>{e.msg}</span>
                {e.data !== undefined && (
                  <span className="text-gray-600 break-all max-w-xs truncate" title={String(e.data)}>
                    {String(e.data).slice(0, 120)}
                  </span>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        </div>
      )}
    </div>
  )
}
