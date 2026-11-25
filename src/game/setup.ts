import { CARDS } from '../data/cards'
import { ANIMALS, CREATURES, TEAM_IDS, otherTeam } from './rules'
import type { AnimalId, GameSetup, GameState, Pawn, Player, Team, TeamId } from './types'

export function createGame(setup: GameSetup, now: number, random: () => number = Math.random, id = makeId()): GameState {
  const first = setup.firstTeam
  const second = otherTeam(first)
  const name = (team: TeamId, fallback: string) => setup.teams[team].name.trim() || fallback
  const fallbackTeam = (team: TeamId) => (setup.mode === 'class' ? (team === 'red' ? 'Red group' : 'Blue group') : team === 'red' ? 'Red team' : 'Blue team')

  const taken = new Set<AnimalId>()
  const animalFor = (team: TeamId, i: number): AnimalId => {
    const wanted = setup.teams[team].animals?.[i]
    const animal = wanted && !taken.has(wanted) ? wanted : (ANIMALS.find((a) => !taken.has(a)) ?? ANIMALS[0])
    taken.add(animal)
    return animal
  }

  let players: Player[]
  let pawns: Pawn[]
  if (setup.mode === 'class') {
    players = [first, second].map((team) => ({
      id: `group-${team}`,
      name: name(team, fallbackTeam(team)),
      team,
      pawn: `pawn-${team}`,
      animal: animalFor(team, 0),
    }))
    pawns = TEAM_IDS.map((team) => ({ id: `pawn-${team}`, team, distance: 0 }))
  } else {
    const make = (team: TeamId, i: number): Player => ({
      id: `${team}-${i + 1}`,
      name: setup.teams[team].players[i]?.trim() || `Player ${i + 1}`,
      team,
      pawn: `${team}-${i + 1}`,
      animal: animalFor(team, i),
    })
    const a1 = make(first, 0)
    const b1 = make(second, 0)
    const a2 = make(first, 1)
    const b2 = make(second, 1)
    players = [a1, b1, a2, b2]
    pawns = players.map((p) => ({ id: p.pawn, team: p.team, distance: 0 })).sort((a, b) => a.id.localeCompare(b.id))
  }

  const pool = [...CREATURES]
  const pick = () => pool.splice(Math.floor(random() * pool.length) % pool.length, 1)[0]
  const team = (id: TeamId): Team => ({
    id,
    name: name(id, fallbackTeam(id)),
    score: 0,
    kept: [],
    right: 0,
    wrong: 0,
    challenges: 0,
    creature: pick(),
    students: setup.mode === 'class' ? Math.max(1, Math.round(setup.teams[id].students)) : 2,
    springNotified: false,
  })

  return {
    version: 3,
    id,
    createdAt: now,
    mode: setup.mode,
    status: 'playing',
    teams: { red: team('red'), blue: team('blue') },
    players,
    pawns,
    turn: 0,
    round: 1,
    phase: { kind: 'roll' },
    queue: [],
    skip: [],
    bonusRoll: false,
    used: {},
    timer: { limitMs: setup.timerMinutes ? setup.timerMinutes * 60_000 : null, elapsedMs: 0, runningSince: now },
    winner: null,
    endReason: null,
    log: [{ kind: 'start', at: now, player: players[0].id }],
  }
}

function makeId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2)
}

export function isGameState(value: unknown): value is GameState {
  if (!value || typeof value !== 'object') return false
  const v = value as Partial<GameState>
  return (
    v.version === 3 &&
    typeof v.id === 'string' &&
    (v.status === 'playing' || v.status === 'paused' || v.status === 'finished') &&
    !!v.teams &&
    TEAM_IDS.every((id) => typeof v.teams?.[id]?.score === 'number') &&
    Array.isArray(v.players) &&
    v.players.length > 0 &&
    Array.isArray(v.pawns) &&
    !!v.phase &&
    !!v.timer &&
    Array.isArray(v.log) &&
    CARDS.length > 0
  )
}
