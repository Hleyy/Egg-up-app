import { canHatch } from './rules'
import type { GameState, Pawn, Player, TeamId, Timer } from './types'

export function currentPlayer(state: GameState): Player {
  return state.players[state.turn % state.players.length]
}

export function pawnOf(state: GameState, player: Player): Pawn {
  return state.pawns.find((p) => p.id === player.pawn) ?? state.pawns[0]
}

export function teamPawns(state: GameState, team: TeamId): Pawn[] {
  return state.pawns.filter((p) => p.team === team)
}

export function teamCanHatch(state: GameState, team: TeamId): boolean {
  return canHatch(
    state.teams[team].score,
    teamPawns(state, team).map((p) => p.distance),
  )
}

export function elapsedMs(timer: Timer, now: number): number {
  return timer.elapsedMs + (timer.runningSince === null ? 0 : Math.max(0, now - timer.runningSince))
}

export function remainingMs(timer: Timer, now: number): number | null {
  if (timer.limitMs === null) return null
  return Math.max(0, timer.limitMs - elapsedMs(timer, now))
}
