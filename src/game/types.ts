export type TeamId = 'red' | 'blue'

export type Season = 'summer' | 'autumn' | 'winter' | 'spring'

export type CardType = 'learn' | 'understand' | 'apply' | 'malus'

export type EggStage = 'egg' | 'wobble' | 'crack' | 'peek' | 'hatched'

export interface Team {
  id: TeamId
  name: string
  score: number
  distance: number
}

export type GameStatus = 'playing' | 'paused' | 'finished'

export type EndReason = 'hatched' | 'timeout' | 'abandoned'

export interface Timer {
  durationMs: number
  elapsedMs: number
  runningSince: number | null
}

export interface MalusEffect {
  scoreDelta?: number
  moveDelta?: number
  skipTurn?: boolean
}

export interface Card {
  id: string
  type: CardType
  season?: Season
  question: { en: string; fr: string }
  answer: { en: string; fr: string }
  effect?: MalusEffect
}

export type GameEvent =
  | { kind: 'start'; at: number; team: TeamId }
  | { kind: 'roll'; at: number; team: TeamId; value: number }
  | { kind: 'move'; at: number; team: TeamId; delta: number }
  | { kind: 'answer'; at: number; team: TeamId; correct: boolean; points: number }
  | { kind: 'score'; at: number; team: TeamId; delta: number }
  | { kind: 'turn'; at: number; team: TeamId }
  | { kind: 'malus'; at: number; by: TeamId; target: TeamId; cardId: string | null; effect: MalusEffect | null }
  | { kind: 'pause'; at: number }
  | { kind: 'resume'; at: number }
  | { kind: 'end'; at: number; reason: EndReason; winner: TeamId | null }

export interface TurnState {
  team: TeamId
  roll: number | null
}

export interface GameState {
  version: 1
  id: string
  createdAt: number
  status: GameStatus
  teams: Record<TeamId, Team>
  turn: TurnState
  skipNext: TeamId[]
  timer: Timer
  winner: TeamId | null
  endReason: EndReason | null
  malusSeq: number
  lastMalus: Extract<GameEvent, { kind: 'malus' }> | null
  log: GameEvent[]
}

export interface GameSetup {
  teamNames: Record<TeamId, string>
  firstTeam: TeamId
  durationMinutes: number
}
