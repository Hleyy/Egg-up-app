export type TeamId = 'red' | 'blue'

export type Mode = 'teams' | 'class'

export type Season = 'summer' | 'autumn' | 'winter' | 'spring'

export type SquareType = 'start' | 'neutral' | 'team' | 'bonus' | 'malus'

export type Category = 'learn' | 'understand' | 'apply' | 'challenge'

export type DeckId = 'questions' | 'bonus' | 'malus'

export type EggStage = 0 | 1 | 2 | 3 | 4

export type AnimalId = 'fox' | 'frog' | 'goat' | 'koala'

export type CreatureId = 'bloom' | 'drop' | 'buzz' | 'clover'

export type Lang = 'en' | 'fr'

export type Text = Record<Lang, string>

export type BonusUse = 'now' | 'turn' | 'malus'

export interface Effect {
  points?: number
  move?: number
  skipTurn?: boolean
  rollAgain?: boolean
  shield?: boolean
}

export interface Card {
  id: string
  deck: DeckId
  category?: Category
  title?: Text
  text: Text
  choices?: Record<Lang, string[]>
  answer?: Text
  funFact?: Text
  effect?: Effect
  keep?: boolean
  use?: BonusUse
}

export interface Player {
  id: string
  name: string
  team: TeamId
  pawn: string
  animal: AnimalId
}

export interface Pawn {
  id: string
  team: TeamId
  distance: number
}

export interface Team {
  id: TeamId
  name: string
  score: number
  kept: string[]
  right: number
  wrong: number
  challenges: number
  creature: CreatureId
  students: number
  springNotified: boolean
}

export type GameStatus = 'playing' | 'paused' | 'finished'

export type EndReason = 'hatched' | 'timeout' | 'abandoned'

export interface Timer {
  limitMs: number | null
  elapsedMs: number
  runningSince: number | null
}

export type Phase =
  | { kind: 'roll' }
  | { kind: 'move'; dice: [number, number]; from: number; to: number }
  | { kind: 'question'; cardId: string; square: 'neutral' | 'team' }
  | { kind: 'feedback'; cardId: string; square: 'neutral' | 'team'; correct: boolean; points: number; team: TeamId | null }
  | { kind: 'bonus'; cardId: string }
  | { kind: 'malus'; cardId: string }
  | { kind: 'evolve'; team: TeamId; stage: EggStage }
  | { kind: 'spring'; team: TeamId }
  | { kind: 'hatch'; team: TeamId }

export type GameEvent =
  | { kind: 'start'; at: number; player: string }
  | { kind: 'roll'; at: number; player: string; dice: [number, number]; from: number; to: number }
  | { kind: 'answer'; at: number; player: string; team: TeamId; cardId: string; correct: boolean; points: number }
  | { kind: 'challenge'; at: number; player: string; cardId: string; winner: TeamId | null; points: number }
  | { kind: 'bonus'; at: number; player: string; team: TeamId; cardId: string; kept: boolean }
  | { kind: 'malus'; at: number; player: string; team: TeamId; cardId: string; shielded: boolean }
  | { kind: 'evolve'; at: number; team: TeamId; stage: EggStage }
  | { kind: 'fix'; at: number; team: TeamId; what: 'score' | 'pawn'; delta: number }
  | { kind: 'pause'; at: number }
  | { kind: 'resume'; at: number }
  | { kind: 'end'; at: number; reason: EndReason; winner: TeamId | null }

export interface GameState {
  version: 3
  id: string
  createdAt: number
  mode: Mode
  status: GameStatus
  teams: Record<TeamId, Team>
  players: Player[]
  pawns: Pawn[]
  turn: number
  round: number
  phase: Phase
  queue: Phase[]
  skip: string[]
  bonusRoll: boolean
  used: Partial<Record<DeckId, string[]>>
  timer: Timer
  winner: TeamId | null
  endReason: EndReason | null
  log: GameEvent[]
}

export interface TeamSetup {
  name: string
  players: string[]
  animals: AnimalId[]
  students: number
}

export interface GameSetup {
  mode: Mode
  teams: Record<TeamId, TeamSetup>
  firstTeam: TeamId
  timerMinutes: number | null
}
