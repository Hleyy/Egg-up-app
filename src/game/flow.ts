import { cardsOfDeck } from '../data/cards'
import { GOAL_POINTS, STAGE_STEP, eggStageOf, otherTeam } from './rules'
import { currentPlayer, elapsedMs, teamCanHatch } from './selectors'
import type { DeckId, Effect, EggStage, GameEvent, GameState, Phase, Player, Team, TeamId, Timer } from './types'

const LOG_LIMIT = 400

export function applyEffect(state: GameState, player: Player, effect: Effect | undefined): [GameState, boolean] {
  if (!effect) return [state, false]
  let next = state
  const before = state.teams[player.team].score
  if (effect.points) next = updateTeam(next, player.team, (t) => ({ ...t, score: Math.max(0, t.score + Math.trunc(effect.points!)) }))
  if (effect.move) next = movePawn(next, player.pawn, Math.trunc(effect.move))
  if (effect.skipTurn && !next.skip.includes(player.id)) next = { ...next, skip: [...next.skip, player.id] }
  if (effect.points && effect.points > 0) next = milestones(next, player.team, before)
  if (teamCanHatch(next, player.team)) next = { ...next, queue: [{ kind: 'hatch', team: player.team }] }
  return [next, !!effect.rollAgain]
}

export function milestones(state: GameState, team: TeamId, before: number): GameState {
  const after = state.teams[team].score
  if (teamCanHatch(state, team)) return { ...state, queue: [{ kind: 'hatch', team }] }
  if (after <= before) return state
  const queue: Phase[] = [...state.queue]
  let teams = state.teams
  const reached = Math.floor(after / STAGE_STEP)
  if (reached > Math.floor(before / STAGE_STEP) && reached >= 1) {
    if (after >= GOAL_POINTS) {
      if (!teams[team].springNotified) {
        queue.push({ kind: 'spring', team })
        teams = { ...teams, [team]: { ...teams[team], springNotified: true } }
      }
    } else {
      queue.push({ kind: 'evolve', team, stage: eggStageOf(after) as EggStage })
    }
  }
  return { ...state, teams, queue }
}

export function checkHatchNow(state: GameState): GameState {
  if (state.status !== 'playing' || state.phase.kind !== 'roll') return state
  const team = currentPlayer(state).team
  for (const id of [team, otherTeam(team)]) if (teamCanHatch(state, id)) return { ...state, phase: { kind: 'hatch', team: id } }
  return state
}

export function next(state: GameState, again: boolean, now: number): GameState {
  let queue = state.queue
  if (again || state.bonusRoll) queue = [...queue, { kind: 'roll' }]
  const base = { ...state, bonusRoll: false }
  if (queue.length) {
    const [head, ...rest] = queue
    const nextState: GameState = { ...base, phase: head, queue: rest }
    return head.kind === 'evolve' ? log(nextState, { kind: 'evolve', at: now, team: head.team, stage: head.stage }) : nextState
  }
  let turn = state.turn
  let round = state.round
  let skip = state.skip
  for (let i = 0; i < state.players.length; i++) {
    turn = turn + 1
    if (turn >= state.players.length) {
      turn = 0
      round += 1
    }
    const id = state.players[turn].id
    if (!skip.includes(id)) break
    skip = skip.filter((s) => s !== id)
  }
  return { ...base, turn, round, skip, phase: { kind: 'roll' } }
}

export function draw(state: GameState, deck: DeckId, random: number): [string | null, string[]] {
  const all = cardsOfDeck(deck).map((c) => c.id)
  if (!all.length) return [null, []]
  let used = state.used[deck] ?? []
  let left = all.filter((id) => !used.includes(id))
  if (!left.length) {
    used = []
    left = all
  }
  const id = left[Math.min(left.length - 1, Math.floor(Math.max(0, random) * left.length))]
  return [id, [...used, id]]
}

export function finish(state: GameState, reason: GameState['endReason'] & string, winner: TeamId | null, now: number): GameState {
  return log({ ...state, status: 'finished', timer: stopTimer(state.timer, now), winner, endReason: reason }, { kind: 'end', at: now, reason, winner })
}

export function stopTimer(timer: Timer, now: number): Timer {
  if (timer.runningSince === null) return timer
  return { ...timer, elapsedMs: elapsedMs(timer, now), runningSince: null }
}

export function movePawn(state: GameState, id: string, delta: number): GameState {
  return { ...state, pawns: state.pawns.map((p) => (p.id === id ? { ...p, distance: Math.max(0, p.distance + delta) } : p)) }
}

export function updateTeam(state: GameState, id: TeamId, fn: (t: Team) => Team): GameState {
  return { ...state, teams: { ...state.teams, [id]: fn(state.teams[id]) } }
}

export function log(state: GameState, event: GameEvent): GameState {
  const entries = [...state.log, event]
  return { ...state, log: entries.length > LOG_LIMIT ? entries.slice(-LOG_LIMIT) : entries }
}

export function removeOnce(list: string[], id: string): string[] {
  const i = list.indexOf(id)
  return i < 0 ? list : [...list.slice(0, i), ...list.slice(i + 1)]
}

export function clampInt(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(n)))
}

export function makeId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2)
}
