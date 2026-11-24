import type { EndReason, GameState, TeamId } from './types'

export interface GameRecord {
  id: string
  startedAt: number
  endedAt: number
  playedMs: number
  durationMs: number
  teams: Record<TeamId, { name: string; score: number }>
  winner: TeamId | null
  reason: EndReason
}

const KEY = 'eggup:history:v1'
export const HISTORY_LIMIT = 50

export function toRecord(game: GameState): GameRecord | null {
  if (game.status !== 'finished' || !game.endReason || game.endReason === 'abandoned') return null
  const end = game.log.findLast((e) => e.kind === 'end')
  return {
    id: game.id,
    startedAt: game.createdAt,
    endedAt: end?.at ?? game.createdAt,
    playedMs: game.timer.elapsedMs,
    durationMs: game.timer.durationMs,
    teams: {
      red: { name: game.teams.red.name, score: game.teams.red.score },
      blue: { name: game.teams.blue.name, score: game.teams.blue.score },
    },
    winner: game.winner,
    reason: game.endReason,
  }
}

export function addRecord(list: GameRecord[], record: GameRecord): GameRecord[] {
  if (list.some((r) => r.id === record.id)) return list
  return [record, ...list].slice(0, HISTORY_LIMIT)
}

export function loadHistory(): GameRecord[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((r): r is GameRecord => typeof r?.id === 'string' && !!r?.teams) : []
  } catch {
    return []
  }
}

export function saveHistory(list: GameRecord[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    return
  }
}
