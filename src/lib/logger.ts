export type LogLevel = 'info' | 'warn' | 'error' | 'debug'
export type LogCategory = 'race' | 'wiki' | 'api' | 'engine' | 'vault' | 'system'

export interface LogEntry {
  id: number
  ts: string          // ISO timestamp
  elapsed: number     // ms since race start
  level: LogLevel
  category: LogCategory
  msg: string
  data?: unknown
}

type Listener = () => void

class Logger {
  private entries: LogEntry[] = []
  private listeners: Set<Listener> = new Set()
  private counter = 0
  private raceStart = Date.now()

  resetForRace() {
    this.entries = []
    this.counter = 0
    this.raceStart = Date.now()
    this.notify()
  }

  log(level: LogLevel, category: LogCategory, msg: string, data?: unknown) {
    const entry: LogEntry = {
      id: ++this.counter,
      ts: new Date().toISOString(),
      elapsed: Date.now() - this.raceStart,
      level,
      category,
      msg,
      data,
    }
    this.entries.push(entry)
    // Also mirror to browser console for devtools
    const prefix = `[${entry.elapsed.toString().padStart(6)}ms][${category}]`
    if (level === 'error') console.error(prefix, msg, data ?? '')
    else if (level === 'warn') console.warn(prefix, msg, data ?? '')
    else console.log(prefix, msg, data ?? '')
    this.notify()
  }

  info  = (cat: LogCategory, msg: string, data?: unknown) => this.log('info',  cat, msg, data)
  warn  = (cat: LogCategory, msg: string, data?: unknown) => this.log('warn',  cat, msg, data)
  error = (cat: LogCategory, msg: string, data?: unknown) => this.log('error', cat, msg, data)
  debug = (cat: LogCategory, msg: string, data?: unknown) => this.log('debug', cat, msg, data)

  getEntries(): LogEntry[] { return this.entries }

  toText(): string {
    return this.entries
      .map((e) => `[${e.ts}] [+${e.elapsed}ms] [${e.level.toUpperCase().padEnd(5)}] [${e.category}] ${e.msg}${e.data ? '\n  ' + JSON.stringify(e.data) : ''}`)
      .join('\n')
  }

  subscribe(fn: Listener): () => void { this.listeners.add(fn); return () => { this.listeners.delete(fn) } }
  private notify() { this.listeners.forEach((fn) => fn()) }
}

export const logger = new Logger()
