import { createContext, useContext } from 'react'
import type { GameRecord } from './history'
import type { GameAction } from './reducer'
import type { GameSetup, GameState, TeamId } from './types'

type Payload<A> = A extends { now: number } ? Omit<A, 'now'> : never
export type GameCommand = Payload<GameAction>

export interface GameApi {
  game: GameState | null
  now: number
  remaining: number | null
  elapsed: number
  canUndo: boolean
  records: GameRecord[]
  clearRecords: () => void
  newGame: (setup: GameSetup) => void
  clearGame: () => void
  undo: () => void
  dispatch: (command: GameCommand) => void
  roll: () => [number, number] | null
  land: () => void
  answer: (correct: boolean) => void
  challenge: (winner: TeamId | null) => void
  bonus: (keep: boolean) => void
  malus: (shield: boolean) => void
  useKept: (team: TeamId, cardId: string) => void
  next: () => void
  hatch: () => void
  adjustScore: (team: TeamId, delta: number) => void
  movePawn: (pawn: string, delta: number) => void
  fixMove: (delta: number) => void
  pause: () => void
  resume: () => void
  abandon: () => void
}

export const GameContext = createContext<GameApi | null>(null)

export function useGame(): GameApi {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used inside <GameProvider>')
  return ctx
}
