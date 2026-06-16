import { createClient } from '@supabase/supabase-js'

declare global {
  interface Window {
    __SOF_CONFIG__?: {
      supabaseUrl: string
      supabaseAnonKey: string
    }
  }
}

const cfg = window.__SOF_CONFIG__
const supabaseUrl = cfg?.supabaseUrl ?? ''
const supabaseAnonKey = cfg?.supabaseAnonKey ?? ''

export const supabase = supabaseUrl
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export async function saveRace(race: {
  id: string
  seed_label: string
  start_page_title: string
  target_page_title: string
  max_clicks: number
  mode: string
  host_prompt: string
  status: string
}) {
  if (!supabase) return
  await supabase.from('races').upsert(race)
}

export async function saveRacerRun(run: {
  id: string
  race_id: string
  competitor_name: string
  provider: string
  model_id: string
  status: string
  clicks: number
  elapsed_ms: number
  invalid_attempts: number
  total_input_tokens: number
  total_output_tokens: number
  total_cost_usd: number
}) {
  if (!supabase) return
  await supabase.from('racer_runs').upsert(run)
}

export async function saveTurn(turn: {
  id: string
  racer_run_id: string
  turn_index: number
  current_page_title: string
  chosen_link: string
  resulting_page_title: string
  public_scratchpad: string
  confidence: number
  latency_ms: number
  validation_status: string
  input_tokens: number
  output_tokens: number
  cost_usd: number
}) {
  if (!supabase) return
  await supabase.from('turns').upsert(turn)
}

export async function loadRecentRaces(limit = 20) {
  if (!supabase) return []
  const { data } = await supabase
    .from('races')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  return data ?? []
}
