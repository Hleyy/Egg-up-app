import { describe, expect, it } from 'vitest'
import { gameReducer, type GameAction } from './reducer'
import { currentPlayer, remainingMs, teamCanHatch } from './selectors'
import { createGame } from './setup'
import type { GameCommand } from './useGame'
import { SQUARES } from '../data/board'
import { findCard } from '../data/cards'
import { eggStageOf, squaresToSeason } from './rules'
import type { GameSetup, GameState } from './types'

const T0 = 1_000_000

const teams: GameSetup = {
  mode: 'teams',
  teams: {
    red: { name: 'Foxes', players: ['Léa', 'Tom'], animals: ['koala', 'fox'], students: 0 },
    blue: { name: 'Rangers', players: ['Manon', 'Lou'], animals: ['koala', 'goat'], students: 0 },
  },
  firstTeam: 'red',
  timerMinutes: null,
}

const cls: GameSetup = {
  mode: 'class',
  teams: {
    red: { name: 'Window side', players: [], animals: ['frog'], students: 13 },
    blue: { name: 'Door side', players: [], animals: ['goat'], students: 12 },
  },
  firstTeam: 'blue',
  timerMinutes: 30,
}

function run(state: GameState, ...actions: GameCommand[]): GameState {
  return actions.reduce((s, a, i) => gameReducer(s, { ...a, now: T0 + i + 1 } as GameAction), state)
}

function firstSquare(type: string): number {
  return SQUARES.findIndex((s, i) => i > 0 && s.type === type)
}

function rollTo(state: GameState, target: number): GameState {
  const from = state.pawns.find((p) => p.id === currentPlayer(state).pawn)!.distance
  const total = target - from
  const a = Math.min(6, Math.max(1, total - 1))
  const s = run(state, { type: 'roll', dice: [a, Math.max(1, total - a)] })
  if (s.phase.kind !== 'move') return s
  return run(s, { type: 'fixMove', delta: target - s.phase.to })
}

describe('createGame', () => {
  it('creates 4 pawns and alternates teams in team mode', () => {
    const g = createGame(teams, T0, () => 0)
    expect(g.pawns).toHaveLength(4)
    expect(g.players.map((p) => p.name)).toEqual(['Léa', 'Manon', 'Tom', 'Lou'])
    expect(g.teams.red.creature).not.toBe(g.teams.blue.creature)
    expect(g.players.map((p) => p.animal)).toEqual(['koala', 'fox', 'frog', 'goat'])
    expect(g.timer.limitMs).toBeNull()
  })

  it('creates one pawn per group in class mode', () => {
    const g = createGame(cls, T0)
    expect(g.pawns.map((p) => p.team).sort()).toEqual(['blue', 'red'])
    expect(g.players.map((p) => p.team)).toEqual(['blue', 'red'])
    expect(g.teams.red.students).toBe(13)
    expect(g.timer.limitMs).toBe(30 * 60_000)
  })
})

describe('turns', () => {
  it('rolls two dice and moves the pawn of the player', () => {
    const g = run(createGame(teams, T0), { type: 'roll', dice: [3, 4] })
    expect(g.phase).toEqual({ kind: 'move', dice: [3, 4], from: 0, to: 7 })
    expect(g.pawns.find((p) => p.id === 'red-1')!.distance).toBe(7)
  })

  it('lets the table fix the landing square', () => {
    const g = run(createGame(teams, T0), { type: 'roll', dice: [3, 4] }, { type: 'fixMove', delta: -1 })
    expect(g.phase.kind === 'move' && g.phase.to).toBe(6)
    expect(g.pawns.find((p) => p.id === 'red-1')!.distance).toBe(6)
  })

  it('gives 2 points alone on a neutral square and passes to the next player', () => {
    let g = rollTo(createGame(teams, T0), firstSquare('neutral'))
    g = run(g, { type: 'land', random: 0.99 })
    expect(g.phase.kind).toBe('question')
    const card = g.phase.kind === 'question' ? findCard(g.phase.cardId) : undefined
    expect(card?.deck).toBe('questions')
    if (card?.category === 'challenge') return
    g = run(g, { type: 'answer', correct: true })
    expect(g.teams.red.score).toBe(2)
    expect(g.phase.kind).toBe('feedback')
    g = run(g, { type: 'continue' })
    expect(currentPlayer(g).name).toBe('Manon')
  })

  it('gives 3 points together on a team square', () => {
    let g = rollTo(createGame(teams, T0), firstSquare('team'))
    g = run(g, { type: 'land', random: 0 })
    expect(g.phase.kind === 'question' && g.phase.square).toBe('team')
    g = run(g, { type: 'answer', correct: true })
    expect(g.teams.red.score).toBe(3)
  })

  it('gives challenge points to the winning team', () => {
    let g = rollTo(createGame(teams, T0), firstSquare('neutral'))
    g = run(g, { type: 'land', random: 0.99 })
    g = { ...g, phase: { kind: 'question', cardId: 'c-1', square: 'neutral' } }
    g = run(g, { type: 'challenge', winner: 'blue' })
    expect(g.teams.blue.score).toBe(3)
    expect(g.teams.blue.challenges).toBe(1)
  })

  it('counts a new round after everybody played', () => {
    let g = createGame(teams, T0)
    for (let i = 0; i < 4; i++) {
      g = run(g, { type: 'roll', dice: [1, 1] })
      g = { ...g, phase: { kind: 'feedback', cardId: 'x', square: 'neutral', correct: false, points: 0, team: null } }
      g = run(g, { type: 'continue' })
    }
    expect(g.round).toBe(2)
    expect(currentPlayer(g).name).toBe('Léa')
  })
})

describe('bonus and malus', () => {
  it('keeps a bonus card in the team bag and uses it later', () => {
    let g = createGame(teams, T0)
    g = { ...g, phase: { kind: 'bonus', cardId: 'bonus-3' } }
    g = run(g, { type: 'bonus', keep: true })
    expect(g.teams.red.kept).toEqual(['bonus-3'])
    g = { ...g, turn: 0, phase: { kind: 'roll' } }
    g = run(g, { type: 'useKept', team: 'red', cardId: 'bonus-3' })
    expect(g.teams.red.kept).toEqual([])
    expect(g.pawns.find((p) => p.id === 'red-1')!.distance).toBe(2)
  })

  it('applies a malus to the team that drew it', () => {
    let g = createGame(teams, T0)
    g = { ...g, teams: { ...g.teams, red: { ...g.teams.red, score: 10 } }, pawns: g.pawns.map((p) => ({ ...p, distance: 10 })) }
    g = { ...g, phase: { kind: 'malus', cardId: 'malus-1' } }
    g = run(g, { type: 'malus', shield: false })
    expect(g.teams.red.score).toBe(8)
    expect(g.pawns.find((p) => p.id === 'red-1')!.distance).toBe(7)
  })

  it('cancels a malus with a kept shield', () => {
    let g = createGame(teams, T0)
    g = { ...g, teams: { ...g.teams, red: { ...g.teams.red, score: 10, kept: ['bonus-2'] } }, phase: { kind: 'malus', cardId: 'malus-2' } }
    g = run(g, { type: 'malus', shield: true })
    expect(g.teams.red.score).toBe(10)
    expect(g.teams.red.kept).toEqual([])
  })

  it('skips the next turn of the player', () => {
    let g = createGame(teams, T0)
    g = { ...g, phase: { kind: 'malus', cardId: 'malus-3' } }
    g = run(g, { type: 'malus', shield: false })
    expect(currentPlayer(g).name).toBe('Manon')
    for (let i = 0; i < 3; i++) {
      g = { ...g, phase: { kind: 'feedback', cardId: 'x', square: 'neutral', correct: false, points: 0, team: null } }
      g = run(g, { type: 'continue' })
    }
    expect(currentPlayer(g).name).toBe('Manon')
  })

  it('lets the player roll again with a bonus', () => {
    let g = createGame(teams, T0)
    g = { ...g, phase: { kind: 'bonus', cardId: 'bonus-1' } }
    g = run(g, { type: 'bonus', keep: false })
    expect(g.phase.kind).toBe('roll')
    expect(currentPlayer(g).name).toBe('Léa')
  })
})

describe('egg and hatching', () => {
  it('shows the egg evolving every 10 points', () => {
    let g = createGame(teams, T0)
    g = { ...g, teams: { ...g.teams, red: { ...g.teams.red, score: 9 } }, phase: { kind: 'question', cardId: 'q-1', square: 'neutral' } }
    g = run(g, { type: 'answer', correct: true }, { type: 'continue' })
    expect(g.phase).toEqual({ kind: 'evolve', team: 'red', stage: 1 })
    expect(eggStageOf(39)).toBe(3)
  })

  it('asks to reach Spring at 40 points', () => {
    let g = createGame(teams, T0)
    g = { ...g, teams: { ...g.teams, red: { ...g.teams.red, score: 38 } }, phase: { kind: 'question', cardId: 'q-1', square: 'neutral' } }
    g = run(g, { type: 'answer', correct: true }, { type: 'continue' })
    expect(g.phase).toEqual({ kind: 'spring', team: 'red' })
    expect(g.teams.red.springNotified).toBe(true)
  })

  it('hatches with 40 points and one pawn in Spring', () => {
    let g = createGame(teams, T0)
    g = { ...g, teams: { ...g.teams, red: { ...g.teams.red, score: 40 } } }
    expect(teamCanHatch(g, 'red')).toBe(false)
    g = rollTo(g, 30)
    g = run(g, { type: 'land', random: 0 })
    expect(g.phase).toEqual({ kind: 'hatch', team: 'red' })
    g = run(g, { type: 'hatch' })
    expect(g.status).toBe('finished')
    expect(g.winner).toBe('red')
  })

  it('counts the squares left before Spring', () => {
    expect(squaresToSeason(25, 'spring')).toBe(5)
    expect(squaresToSeason(30, 'spring')).toBe(0)
  })
})

describe('timer', () => {
  it('has no limit by default', () => {
    expect(remainingMs(createGame(teams, T0).timer, T0 + 10 ** 9)).toBeNull()
  })

  it('ends with no winner when the optional timer runs out', () => {
    const g = gameReducer(createGame(cls, T0), { type: 'tick', now: T0 + 31 * 60_000 })
    expect(g.status).toBe('finished')
    expect(g.endReason).toBe('timeout')
    expect(g.winner).toBeNull()
  })

  it('pauses the clock', () => {
    let g = createGame(cls, T0)
    g = gameReducer(g, { type: 'pause', now: T0 + 1000 })
    g = gameReducer(g, { type: 'tick', now: T0 + 60 * 60_000 })
    expect(g.status).toBe('paused')
    expect(g.timer.elapsedMs).toBe(1000)
  })
})
