import {
  DIE_FACES,
  POINTS_PER_CORRECT_ANSWER,
  canHatch,
  otherTeam,
  TEAM_IDS,
} from './rules'
import type { GameEvent, GameSetup, GameState, MalusEffect, TeamId, Timer } from './types'

export type GameAction =
  | { type: 'roll'; value: number; now: number }
  | { type: 'move'; team: TeamId; delta: number; now: number }
  | { type: 'answer'; correct: boolean; now: number }
  | { type: 'adjustScore'; team: TeamId; delta: number; now: number }
  | { type: 'endTurn'; now: number }
  | { type: 'setTurn'; team: TeamId; now: number }
  | { type: 'playMalus'; by: TeamId; cardId?: string | null; effect?: MalusEffect | null; now: number }
  | { type: 'pause'; now: number }
  | { type: 'resume'; now: number }
  | { type: 'tick'; now: number }
  | { type: 'abandon'; now: number }

const LOG_LIMIT = 300

export function createGame(setup: GameSetup, now: number, id = makeId()): GameState {
  const name = (team: TeamId, fallback: string) => setup.teamNames[team].trim() || fallback
  return {
    version: 1,
    id,
    createdAt: now,
    status: 'playing',
    teams: {
      red: { id: 'red', name: name('red', 'Red team'), score: 0, distance: 0 },
      blue: { id: 'blue', name: name('blue', 'Blue team'), score: 0, distance: 0 },
    },
    turn: { team: setup.firstTeam, roll: null },
    skipNext: [],
    timer: { durationMs: setup.durationMinutes * 60_000, elapsedMs: 0, runningSince: now },
    winner: null,
    endReason: null,
    malusSeq: 0,
    lastMalus: null,
    log: [{ kind: 'start', at: now, team: setup.firstTeam }],
  }
}

export function remainingMs(timer: Timer, now: number): number {
  const running = timer.runningSince === null ? 0 : Math.max(0, now - timer.runningSince)
  return Math.max(0, timer.durationMs - timer.elapsedMs - running)
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  if (state.status === 'finished') return state

  if (state.status === 'playing' && remainingMs(state.timer, action.now) === 0) {
    return finish(state, 'timeout', null, action.now)
  }

  switch (action.type) {
    case 'tick':
      return state

    case 'pause': {
      if (state.status !== 'playing') return state
      return log({ ...state, status: 'paused', timer: stopTimer(state.timer, action.now) }, { kind: 'pause', at: action.now })
    }

    case 'resume': {
      if (state.status !== 'paused') return state
      return log(
        { ...state, status: 'playing', timer: { ...state.timer, runningSince: action.now } },
        { kind: 'resume', at: action.now },
      )
    }

    case 'abandon':
      return finish(state, 'abandoned', null, action.now)
  }

  if (state.status !== 'playing') return state

  switch (action.type) {
    case 'roll': {
      if (state.turn.roll !== null) return state
      const value = clampInt(action.value, 1, DIE_FACES)
      const team = state.turn.team
      let next = log({ ...state, turn: { ...state.turn, roll: value } }, { kind: 'roll', at: action.now, team, value })
      next = moveTeam(next, team, value, action.now, false)
      return checkHatch(next, action.now)
    }

    case 'move': {
      const delta = Math.trunc(action.delta)
      if (delta === 0) return state
      return checkHatch(moveTeam(state, action.team, delta, action.now, true), action.now)
    }

    case 'answer': {
      const team = state.turn.team
      const points = action.correct ? POINTS_PER_CORRECT_ANSWER : 0
      let next = updateTeam(state, team, (t) => ({ ...t, score: t.score + points }))
      next = log(next, { kind: 'answer', at: action.now, team, correct: action.correct, points })
      next = checkHatch(next, action.now)
      return next.status === 'finished' ? next : passTurn(next, action.now)
    }

    case 'adjustScore': {
      const delta = Math.trunc(action.delta)
      if (delta === 0) return state
      let next = updateTeam(state, action.team, (t) => ({ ...t, score: Math.max(0, t.score + delta) }))
      next = log(next, { kind: 'score', at: action.now, team: action.team, delta })
      return checkHatch(next, action.now)
    }

    case 'endTurn':
      return passTurn(state, action.now)

    case 'setTurn': {
      if (action.team === state.turn.team) return state
      return log({ ...state, turn: { team: action.team, roll: null } }, { kind: 'turn', at: action.now, team: action.team })
    }

    case 'playMalus': {
      const target = otherTeam(action.by)
      const effect = action.effect ?? null
      let next: GameState = state
      if (effect?.scoreDelta) {
        const d = Math.trunc(effect.scoreDelta)
        next = updateTeam(next, target, (t) => ({ ...t, score: Math.max(0, t.score + d) }))
      }
      if (effect?.moveDelta) next = moveTeam(next, target, Math.trunc(effect.moveDelta), action.now, false)
      if (effect?.skipTurn && !next.skipNext.includes(target)) next = { ...next, skipNext: [...next.skipNext, target] }
      const event: Extract<GameEvent, { kind: 'malus' }> = {
        kind: 'malus',
        at: action.now,
        by: action.by,
        target,
        cardId: action.cardId ?? null,
        effect,
      }
      next = log({ ...next, malusSeq: next.malusSeq + 1, lastMalus: event }, event)
      return checkHatch(next, action.now)
    }
  }
}

function passTurn(state: GameState, now: number): GameState {
  let team = otherTeam(state.turn.team)
  let skipNext = state.skipNext
  if (skipNext.includes(team)) {
    skipNext = skipNext.filter((t) => t !== team)
    team = otherTeam(team)
  }
  return log({ ...state, skipNext, turn: { team, roll: null } }, { kind: 'turn', at: now, team })
}

function moveTeam(state: GameState, team: TeamId, delta: number, now: number, logIt: boolean): GameState {
  const next = updateTeam(state, team, (t) => ({ ...t, distance: Math.max(0, t.distance + delta) }))
  return logIt ? log(next, { kind: 'move', at: now, team, delta }) : next
}

function checkHatch(state: GameState, now: number): GameState {
  const order = [state.turn.team, otherTeam(state.turn.team)]
  for (const id of order) {
    const t = state.teams[id]
    if (canHatch(t.score, t.distance)) return finish(state, 'hatched', id, now)
  }
  return state
}

function finish(state: GameState, reason: GameState['endReason'] & string, winner: TeamId | null, now: number): GameState {
  const timer = stopTimer(state.timer, now)
  return log({ ...state, status: 'finished', timer, winner, endReason: reason }, { kind: 'end', at: now, reason, winner })
}

function stopTimer(timer: Timer, now: number): Timer {
  if (timer.runningSince === null) return timer
  const elapsedMs = Math.min(timer.durationMs, timer.elapsedMs + Math.max(0, now - timer.runningSince))
  return { ...timer, elapsedMs, runningSince: null }
}

function updateTeam(state: GameState, id: TeamId, fn: (t: GameState['teams'][TeamId]) => GameState['teams'][TeamId]): GameState {
  return { ...state, teams: { ...state.teams, [id]: fn(state.teams[id]) } }
}

function log(state: GameState, event: GameEvent): GameState {
  const entries = [...state.log, event]
  return { ...state, log: entries.length > LOG_LIMIT ? entries.slice(-LOG_LIMIT) : entries }
}

function clampInt(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(n)))
}

function makeId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)
}

export function isGameState(value: unknown): value is GameState {
  if (!value || typeof value !== 'object') return false
  const v = value as Partial<GameState>
  return (
    v.version === 1 &&
    typeof v.id === 'string' &&
    (v.status === 'playing' || v.status === 'paused' || v.status === 'finished') &&
    !!v.teams &&
    TEAM_IDS.every((id) => typeof v.teams?.[id]?.score === 'number' && typeof v.teams?.[id]?.distance === 'number') &&
    !!v.timer &&
    typeof v.timer.durationMs === 'number' &&
    !!v.turn &&
    Array.isArray(v.log)
  )
}

