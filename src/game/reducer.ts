import { findCard } from '../data/cards'
import { squareTypeAt } from '../data/board'
import { DIE_FACES, POINTS, questionSquare } from './rules'
import { applyEffect, checkHatchNow, clampInt, draw, finish, log, milestones, movePawn, next, removeOnce, stopTimer, updateTeam } from './flow'
import { currentPlayer, pawnOf, remainingMs, teamCanHatch } from './selectors'
import type { DeckId, GameState, TeamId } from './types'

export type GameAction =
  | { type: 'roll'; dice: [number, number]; now: number }
  | { type: 'fixMove'; delta: number; now: number }
  | { type: 'land'; random: number; now: number }
  | { type: 'answer'; correct: boolean; now: number }
  | { type: 'challenge'; winner: TeamId | null; now: number }
  | { type: 'bonus'; keep: boolean; now: number }
  | { type: 'malus'; shield: boolean; now: number }
  | { type: 'useKept'; team: TeamId; cardId: string; now: number }
  | { type: 'continue'; now: number }
  | { type: 'hatch'; now: number }
  | { type: 'adjustScore'; team: TeamId; delta: number; now: number }
  | { type: 'movePawn'; pawn: string; delta: number; now: number }
  | { type: 'pause'; now: number }
  | { type: 'resume'; now: number }
  | { type: 'tick'; now: number }
  | { type: 'abandon'; now: number }

export function gameReducer(state: GameState, action: GameAction): GameState {
  if (state.status === 'finished') return state

  if (state.status === 'playing' && remainingMs(state.timer, action.now) === 0) {
    return finish(state, 'timeout', null, action.now)
  }

  switch (action.type) {
    case 'tick':
      return state
    case 'pause':
      if (state.status !== 'playing') return state
      return log({ ...state, status: 'paused', timer: stopTimer(state.timer, action.now) }, { kind: 'pause', at: action.now })
    case 'resume':
      if (state.status !== 'paused') return state
      return log({ ...state, status: 'playing', timer: { ...state.timer, runningSince: action.now } }, { kind: 'resume', at: action.now })
    case 'abandon':
      return finish(state, 'abandoned', null, action.now)
    case 'adjustScore': {
      const delta = Math.trunc(action.delta)
      if (!delta) return state
      const next = updateTeam(state, action.team, (t) => ({ ...t, score: Math.max(0, t.score + delta) }))
      return checkHatchNow(log(next, { kind: 'fix', at: action.now, team: action.team, what: 'score', delta }))
    }
    case 'movePawn': {
      const delta = Math.trunc(action.delta)
      const pawn = state.pawns.find((p) => p.id === action.pawn)
      if (!delta || !pawn) return state
      const next = movePawn(state, pawn.id, delta)
      return checkHatchNow(log(next, { kind: 'fix', at: action.now, team: pawn.team, what: 'pawn', delta }))
    }
  }

  if (state.status !== 'playing') return state

  const player = currentPlayer(state)
  const phase = state.phase

  switch (action.type) {
    case 'roll': {
      if (phase.kind !== 'roll') return state
      const dice: [number, number] = [clampInt(action.dice[0], 1, DIE_FACES), clampInt(action.dice[1], 1, DIE_FACES)]
      const from = pawnOf(state, player).distance
      const to = from + dice[0] + dice[1]
      const next = movePawn(state, player.pawn, to - from)
      return log({ ...next, phase: { kind: 'move', dice, from, to } }, { kind: 'roll', at: action.now, player: player.id, dice, from, to })
    }

    case 'fixMove': {
      if (phase.kind !== 'move') return state
      const to = Math.max(0, phase.to + Math.trunc(action.delta))
      if (to === phase.to) return state
      return { ...movePawn(state, player.pawn, to - phase.to), phase: { ...phase, to } }
    }

    case 'land': {
      if (phase.kind !== 'move') return state
      if (teamCanHatch(state, player.team)) return { ...state, phase: { kind: 'hatch', team: player.team } }
      const type = squareTypeAt(phase.to)
      const square = questionSquare(type)
      const deck: DeckId = square ? 'questions' : (type as 'bonus' | 'malus')
      const [cardId, used] = draw(state, deck, action.random)
      if (!cardId) return next({ ...state, phase: { kind: 'roll' } }, false, action.now)
      const withUsed = { ...state, used: { ...state.used, [deck]: used } }
      if (square) return { ...withUsed, phase: { kind: 'question', cardId, square } }
      return { ...withUsed, phase: { kind: type as 'bonus' | 'malus', cardId } }
    }

    case 'answer': {
      if (phase.kind !== 'question') return state
      const card = findCard(phase.cardId)
      if (card?.category === 'challenge') return state
      const points = action.correct ? POINTS[phase.square] : 0
      let next = updateTeam(state, player.team, (t) => ({
        ...t,
        score: t.score + points,
        right: t.right + (action.correct ? 1 : 0),
        wrong: t.wrong + (action.correct ? 0 : 1),
      }))
      next = milestones(next, player.team, state.teams[player.team].score)
      next = log(next, { kind: 'answer', at: action.now, player: player.id, team: player.team, cardId: phase.cardId, correct: action.correct, points })
      return { ...next, phase: { kind: 'feedback', cardId: phase.cardId, square: phase.square, correct: action.correct, points, team: player.team } }
    }

    case 'challenge': {
      if (phase.kind !== 'question') return state
      const winner = action.winner
      const points = winner ? POINTS.challenge : 0
      let next = state
      if (winner) {
        next = updateTeam(next, winner, (t) => ({ ...t, score: t.score + points, challenges: t.challenges + 1 }))
        next = milestones(next, winner, state.teams[winner].score)
      }
      next = log(next, { kind: 'challenge', at: action.now, player: player.id, cardId: phase.cardId, winner, points })
      return { ...next, phase: { kind: 'feedback', cardId: phase.cardId, square: phase.square, correct: winner !== null, points, team: winner } }
    }

    case 'bonus': {
      if (phase.kind !== 'bonus') return state
      const card = findCard(phase.cardId)
      const keep = action.keep && !!card?.keep
      let nextState = log(state, { kind: 'bonus', at: action.now, player: player.id, team: player.team, cardId: phase.cardId, kept: keep })
      if (keep) {
        nextState = updateTeam(nextState, player.team, (t) => ({ ...t, kept: [...t.kept, phase.cardId] }))
        return next(nextState, false, action.now)
      }
      const [applied, again] = applyEffect(nextState, player, card?.effect)
      return next(applied, again, action.now)
    }

    case 'malus': {
      if (phase.kind !== 'malus') return state
      const card = findCard(phase.cardId)
      const shieldId = state.teams[player.team].kept.find((id) => findCard(id)?.effect?.shield)
      const shielded = action.shield && !!shieldId
      let nextState = log(state, { kind: 'malus', at: action.now, player: player.id, team: player.team, cardId: phase.cardId, shielded })
      if (shielded) {
        nextState = updateTeam(nextState, player.team, (t) => ({ ...t, kept: removeOnce(t.kept, shieldId!) }))
        return next(nextState, false, action.now)
      }
      const [applied] = applyEffect(nextState, player, card?.effect)
      return next(applied, false, action.now)
    }

    case 'useKept': {
      if (phase.kind !== 'roll' || action.team !== player.team) return state
      const team = state.teams[action.team]
      if (!team.kept.includes(action.cardId)) return state
      const card = findCard(action.cardId)
      if (!card?.effect || card.effect.shield) return state
      let nextState = updateTeam(state, action.team, (t) => ({ ...t, kept: removeOnce(t.kept, action.cardId) }))
      nextState = log(nextState, { kind: 'bonus', at: action.now, player: player.id, team: action.team, cardId: action.cardId, kept: false })
      const [applied, again] = applyEffect(nextState, player, card.effect)
      const withRoll = again ? { ...applied, bonusRoll: true } : applied
      if (!withRoll.queue.length) return withRoll
      const [head, ...rest] = withRoll.queue
      return { ...withRoll, phase: head, queue: [...rest, { kind: 'roll' }] }
    }

    case 'continue': {
      if (phase.kind === 'feedback' || phase.kind === 'evolve' || phase.kind === 'spring') return next(state, false, action.now)
      return state
    }

    case 'hatch': {
      if (phase.kind !== 'hatch') return state
      return finish(state, 'hatched', phase.team, action.now)
    }
  }
}
