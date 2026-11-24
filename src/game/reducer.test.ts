import { describe, expect, it } from 'vitest'
import { createGame, gameReducer, isGameState, remainingMs, type GameAction } from './reducer'
import { eggStageOf, lapOf, seasonOf, squareOf } from './rules'
import type { GameState } from './types'
import { en } from '../i18n/en'
import { fr } from '../i18n/fr'
import { translate } from '../settings/SettingsProvider'

const T0 = 1_000_000
const setup = { teamNames: { red: 'Foxes', blue: 'Owls' }, firstTeam: 'red' as const, durationMinutes: 30 }
const start = () => createGame(setup, T0, 'test')
const run = (state: GameState, ...actions: GameAction[]) => actions.reduce(gameReducer, state)

describe('board and seasons', () => {
  it('maps distance to square, season and lap', () => {
    expect([squareOf(0), seasonOf(0), lapOf(0)]).toEqual([0, 'summer', 1])
    expect(seasonOf(10)).toBe('autumn')
    expect(seasonOf(25)).toBe('winter')
    expect(seasonOf(39)).toBe('spring')
    expect([squareOf(43), seasonOf(43), lapOf(43)]).toEqual([3, 'summer', 2])
  })
  it('gives 5 egg stages', () => {
    expect([0, 9, 10, 20, 30, 45].map((s) => eggStageOf(s))).toEqual(['egg', 'egg', 'wobble', 'crack', 'peek', 'peek'])
    expect(eggStageOf(40, true)).toBe('hatched')
  })
})

describe('turns and score', () => {
  it('starts with the chosen team and a running timer', () => {
    const g = start()
    expect(g.turn.team).toBe('red')
    expect(remainingMs(g.timer, T0 + 60_000)).toBe(29 * 60_000)
  })
  it('a correct answer gives +2 and passes the turn', () => {
    const g = run(start(), { type: 'answer', correct: true, now: T0 + 1 })
    expect(g.teams.red.score).toBe(2)
    expect(g.turn.team).toBe('blue')
  })
  it('a wrong answer gives nothing and passes the turn', () => {
    const g = run(start(), { type: 'answer', correct: false, now: T0 + 1 })
    expect(g.teams.red.score).toBe(0)
    expect(g.turn.team).toBe('blue')
  })
  it('end turn and tapping a team change the turn', () => {
    let g = run(start(), { type: 'endTurn', now: T0 + 1 })
    expect(g.turn.team).toBe('blue')
    g = run(g, { type: 'setTurn', team: 'red', now: T0 + 2 })
    expect(g.turn.team).toBe('red')
  })
  it('manual score correction never goes below 0', () => {
    const g = run(start(), { type: 'adjustScore', team: 'blue', delta: -1, now: T0 + 1 })
    expect(g.teams.blue.score).toBe(0)
  })
})

describe('die and position', () => {
  it('moves the active team by the roll, once per turn', () => {
    let g = run(start(), { type: 'roll', value: 4, now: T0 + 1 })
    expect(g.teams.red.distance).toBe(4)
    g = run(g, { type: 'roll', value: 6, now: T0 + 2 })
    expect(g.teams.red.distance).toBe(4)
    g = run(g, { type: 'endTurn', now: T0 + 3 }, { type: 'roll', value: 6, now: T0 + 4 })
    expect(g.teams.blue.distance).toBe(6)
  })
  it('allows ±1 position correction, never below the start', () => {
    const g = run(start(), { type: 'move', team: 'red', delta: -1, now: T0 + 1 }, { type: 'move', team: 'blue', delta: 1, now: T0 + 2 })
    expect(g.teams.red.distance).toBe(0)
    expect(g.teams.blue.distance).toBe(1)
  })
})

describe('winning', () => {
  it('hatches with 40 points in spring', () => {
    let g = start()
    g = { ...g, teams: { ...g.teams, red: { ...g.teams.red, score: 38, distance: 32 } } }
    g = run(g, { type: 'answer', correct: true, now: T0 + 1 })
    expect(g.status).toBe('finished')
    expect(g.winner).toBe('red')
    expect(g.endReason).toBe('hatched')
  })
  it('does not hatch with 40 points outside spring', () => {
    let g = start()
    g = { ...g, teams: { ...g.teams, red: { ...g.teams.red, score: 38, distance: 12 } } }
    g = run(g, { type: 'answer', correct: true, now: T0 + 1 })
    expect(g.status).toBe('playing')
    expect(g.teams.red.score).toBe(40)
  })
  it('hatches when a team with 40 points reaches spring by rolling', () => {
    let g = start()
    g = { ...g, teams: { ...g.teams, red: { ...g.teams.red, score: 40, distance: 27 } } }
    g = run(g, { type: 'roll', value: 3, now: T0 + 1 })
    expect(g.winner).toBe('red')
  })
  it('nobody wins when the timer reaches 0', () => {
    const g = run(start(), { type: 'tick', now: T0 + 30 * 60_000 })
    expect(g.status).toBe('finished')
    expect(g.winner).toBeNull()
    expect(g.endReason).toBe('timeout')
  })
  it('ignores actions after the end', () => {
    const end = run(start(), { type: 'abandon', now: T0 + 1 })
    expect(run(end, { type: 'answer', correct: true, now: T0 + 2 })).toBe(end)
  })
})

describe('pause', () => {
  it('stops the clock while paused', () => {
    const g = run(start(), { type: 'pause', now: T0 + 60_000 }, { type: 'tick', now: T0 + 60 * 60_000 })
    expect(g.status).toBe('paused')
    expect(remainingMs(g.timer, T0 + 60 * 60_000)).toBe(29 * 60_000)
    const resumed = run(g, { type: 'resume', now: T0 + 60 * 60_000 })
    expect(remainingMs(resumed.timer, T0 + 61 * 60_000)).toBe(28 * 60_000)
  })
  it('blocks game actions while paused', () => {
    const paused = run(start(), { type: 'pause', now: T0 + 1 })
    expect(run(paused, { type: 'answer', correct: true, now: T0 + 2 })).toBe(paused)
  })
})

describe('bonus', () => {
  it('adds bonus points to the +2', () => {
    const g = run(start(), { type: 'answer', correct: true, bonus: { scoreDelta: 1 }, now: T0 + 1 })
    expect(g.teams.red.score).toBe(3)
    expect(g.turn.team).toBe('blue')
  })
  it('moves the team forward', () => {
    const g = run(start(), { type: 'answer', correct: true, bonus: { moveDelta: 2 }, now: T0 + 1 })
    expect(g.teams.red.distance).toBe(2)
  })
  it('keeps the turn with a replay bonus', () => {
    const g = run(start(), { type: 'roll', value: 3, now: T0 + 1 }, { type: 'answer', correct: true, bonus: { extraTurn: true }, now: T0 + 2 })
    expect(g.turn.team).toBe('red')
    expect(g.turn.roll).toBeNull()
  })
  it('ignores the bonus on a wrong answer', () => {
    const g = run(start(), { type: 'answer', correct: false, bonus: { scoreDelta: 5 }, now: T0 + 1 })
    expect(g.teams.red.score).toBe(0)
  })
})

describe('malus', () => {
  it('targets the other team and applies its effect', () => {
    let g = start()
    g = { ...g, teams: { ...g.teams, blue: { ...g.teams.blue, score: 10, distance: 5 } } }
    g = run(g, { type: 'playMalus', by: 'red', cardId: 'm', effect: { scoreDelta: -2, moveDelta: -3 }, now: T0 + 1 })
    expect(g.teams.blue.score).toBe(8)
    expect(g.teams.blue.distance).toBe(2)
    expect(g.malusSeq).toBe(1)
    expect(g.lastMalus?.target).toBe('blue')
  })
  it('can be played by the team that is not playing', () => {
    const g = run(start(), { type: 'playMalus', by: 'blue', now: T0 + 1 })
    expect(g.lastMalus?.target).toBe('red')
    expect(g.turn.team).toBe('red')
  })
  it('skip turn makes the turn come back', () => {
    const g = run(
      start(),
      { type: 'playMalus', by: 'red', effect: { skipTurn: true }, now: T0 + 1 },
      { type: 'endTurn', now: T0 + 2 },
    )
    expect(g.turn.team).toBe('red')
    expect(g.skipNext).toEqual([])
  })
})

describe('saving and i18n', () => {
  it('a game survives JSON round trip', () => {
    const g = run(start(), { type: 'roll', value: 3, now: T0 + 1 })
    const loaded: unknown = JSON.parse(JSON.stringify(g))
    expect(isGameState(loaded)).toBe(true)
    expect(isGameState({ version: 2 })).toBe(false)
  })
  it('translates with variables in both languages', () => {
    expect(translate(en, 'game.turnOf', { team: 'Owls' })).toBe('Owls, your turn!')
    expect(translate(fr, 'game.turnOf', { team: 'Owls' })).toBe('Au tour de Owls')
  })
  it('has the same keys in English and French', () => {
    const keys = (o: object, p = ''): string[] =>
      Object.entries(o).flatMap(([k, v]) => (typeof v === 'string' ? [p + k] : keys(v as object, `${p}${k}.`)))
    expect(keys(fr).sort()).toEqual(keys(en).sort())
  })
})
