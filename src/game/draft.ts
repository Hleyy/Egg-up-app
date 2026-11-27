import { ANIMALS, TEAM_IDS } from './rules'
import type { GameSetup, Mode, TeamId, TeamSetup } from './types'

const KEY = 'eggup:draft:v3'

export interface Draft {
  mode: Mode
  teams: Record<Mode, Record<TeamId, TeamSetup>>
}

export function loadDraft(defaults: Draft): Draft {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return defaults
    const d = JSON.parse(raw) as Draft
    const valid = (m: Mode) =>
      TEAM_IDS.every((t) => {
        const team = d?.teams?.[m]?.[t]
        return (
          team &&
          typeof team.name === 'string' &&
          Array.isArray(team.players) &&
          team.players.every((p) => typeof p === 'string') &&
          Array.isArray(team.animals) &&
          team.animals.every((a) => ANIMALS.includes(a))
        )
      })
    return (d?.mode === 'teams' || d?.mode === 'class') && valid('teams') && valid('class') ? d : defaults
  } catch {
    return defaults
  }
}

export function saveDraft(draft: Draft): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(draft))
  } catch {
    return
  }
}

export function toSetup(draft: Draft, firstTeam: TeamId, timerMinutes: number | null): GameSetup {
  return { mode: draft.mode, teams: draft.teams[draft.mode], firstTeam, timerMinutes }
}
