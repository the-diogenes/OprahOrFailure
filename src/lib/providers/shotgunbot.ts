import type { LLMProviderAdapter } from './types'
import type { AgentRequest, AgentResponse } from '../../types'

// Priority tiers from the brief
const OPRAH_ADJACENT = ['Oprah Winfrey', 'The Oprah Winfrey Show', 'Harpo Productions', "O, The Oprah Magazine", 'OWN: Oprah Winfrey Network']
const MEDIA_HUBS = ['Television', 'Television show', 'Film', 'Actor', 'Producer', 'Mass media', 'Talk show', 'Variety show', 'Reality television']
const BIO_HUBS = ['Celebrity', 'Journalist', 'Author', 'Presenter', 'Entertainer', 'Television presenter']
const GEO_HUBS = ['United States', 'Chicago', 'Mississippi', 'Tennessee', 'Illinois', 'North America']
const INSTITUTION_HUBS = ['ABC', 'CBS', 'CNN', 'Time (magazine)', 'Forbes', 'Academy Awards', 'Emmy Awards', 'Golden Globe Awards']
const BROAD_HUBS = ['Person', 'People', 'Country', 'Culture', 'History', 'Society', 'Politics', 'Economics', 'Science', 'Art', 'Music']

function tierScore(link: string): number {
  const l = link.toLowerCase()
  if (OPRAH_ADJACENT.some((o) => o.toLowerCase() === l)) return 100
  if (MEDIA_HUBS.some((m) => m.toLowerCase() === l)) return 80
  if (BIO_HUBS.some((b) => b.toLowerCase() === l)) return 60
  if (GEO_HUBS.some((g) => g.toLowerCase() === l)) return 50
  if (INSTITUTION_HUBS.some((i) => i.toLowerCase() === l)) return 40
  if (BROAD_HUBS.some((b) => b.toLowerCase() === l)) return 20
  return 0
}

export const shotgunBotAdapter: LLMProviderAdapter = {
  id: 'shotgunbot',
  displayName: 'ShotgunBot',
  defaultModels: ['shotgunbot-v1'],

  async callAgent(request: AgentRequest, _apiKey: string): Promise<AgentResponse> {
    const { availableLinks } = request.gameState.currentPage
    const { visitedPages } = request.gameState

    const unvisited = availableLinks.filter(
      (l) => !visitedPages.map((v) => v.toLowerCase()).includes(l.toLowerCase()),
    )

    const scored = unvisited.map((l) => ({ link: l, score: tierScore(l) }))
    scored.sort((a, b) => b.score - a.score)

    const best = scored[0]?.link ?? unvisited[0] ?? availableLinks[0] ?? ''

    const tier =
      best ? (
        OPRAH_ADJACENT.some((o) => o.toLowerCase() === best.toLowerCase()) ? 'Oprah-adjacent'
        : MEDIA_HUBS.some((m) => m.toLowerCase() === best.toLowerCase()) ? 'media hub'
        : BIO_HUBS.some((b) => b.toLowerCase() === best.toLowerCase()) ? 'biography hub'
        : GEO_HUBS.some((g) => g.toLowerCase() === best.toLowerCase()) ? 'geography hub'
        : INSTITUTION_HUBS.some((i) => i.toLowerCase() === best.toLowerCase()) ? 'institution hub'
        : 'broad hub'
      ) : 'fallback'

    return {
      chosenLink: best,
      publicScratchpad: `Ranked ${unvisited.length} unvisited links. Best match: "${best}" (${tier}).`,
      confidence: scored[0]?.score ? scored[0].score / 100 : 0.1,
      inputTokens: 0,
      outputTokens: 0,
      costUsd: 0,
    }
  },
}
