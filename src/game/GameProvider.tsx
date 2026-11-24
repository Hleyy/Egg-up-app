import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { createGame, gameReducer, remainingMs, type GameAction } from './reducer'
import { loadGame, saveGame } from './storage'
import { rollDie } from './rules'
import type { CardEffect, GameSetup, GameState, MalusEffect, TeamId } from './types'

const UNDO_LIMIT = 20

type Payload<A> = A extends { now: number } ? Omit<A, 'now'> : never
export type GameCommand = Payload<GameAction>

interface Store {
  game: GameState | null
  history: GameState[]
}

interface GameApi {
  game: GameState | null
  remaining: number
  canUndo: boolean
  newGame: (setup: GameSetup) => void
  clearGame: () => void
  undo: () => void
  dispatch: (command: GameCommand) => void
  roll: () => number | null
  answer: (correct: boolean, bonus?: CardEffect | null) => void
  endTurn: () => void
  setTurn: (team: TeamId) => void
  move: (team: TeamId, delta: number) => void
  adjustScore: (team: TeamId, delta: number) => void
  playMalus: (by: TeamId, cardId?: string | null, effect?: MalusEffect | null) => void
  pause: () => void
  resume: () => void
  abandon: () => void
}

const GameContext = createContext<GameApi | null>(null)

const NOT_UNDOABLE = new Set<GameAction['type']>(['tick', 'pause', 'resume'])

export function GameProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<Store>(() => {
    const saved = loadGame()
    return { game: saved ? gameReducer(saved, { type: 'tick', now: Date.now() }) : null, history: [] }
  })
  const [now, setNow] = useState(() => Date.now())

  const game = store.game

  useEffect(() => saveGame(game), [game])

  const dispatch = useCallback((command: GameCommand) => {
    setStore((s) => {
      if (!s.game) return s
      const action = { ...command, now: Date.now() } as GameAction
      const next = gameReducer(s.game, action)
      if (next === s.game) return s
      const history = NOT_UNDOABLE.has(action.type) ? s.history : [...s.history, s.game].slice(-UNDO_LIMIT)
      return { game: next, history }
    })
  }, [])

  const running = game?.status === 'playing'
  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => {
      setNow(Date.now())
      dispatch({ type: 'tick' })
    }, 1000)
    return () => window.clearInterval(id)
  }, [running, dispatch])

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        setNow(Date.now())
        dispatch({ type: 'tick' })
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [dispatch])

  const api = useMemo<GameApi>(() => {
    const remaining = game ? remainingMs(game.timer, now) : 0
    return {
      game,
      remaining,
      canUndo: store.history.length > 0 && game?.status !== 'finished',
      newGame: (setup) => setStore({ game: createGame(setup, Date.now()), history: [] }),
      clearGame: () => setStore({ game: null, history: [] }),
      undo: () =>
        setStore((s) => {
          const prev = s.history[s.history.length - 1]
          if (!prev || !s.game || s.game.status === 'finished') return s
          return { game: { ...prev, timer: s.game.timer, status: s.game.status }, history: s.history.slice(0, -1) }
        }),
      dispatch,
      roll: () => {
        if (!game || game.status !== 'playing' || game.turn.roll !== null) return null
        const value = rollDie()
        dispatch({ type: 'roll', value })
        return value
      },
      answer: (correct, bonus) => dispatch({ type: 'answer', correct, bonus }),
      endTurn: () => dispatch({ type: 'endTurn' }),
      setTurn: (team) => dispatch({ type: 'setTurn', team }),
      move: (team, delta) => dispatch({ type: 'move', team, delta }),
      adjustScore: (team, delta) => dispatch({ type: 'adjustScore', team, delta }),
      playMalus: (by, cardId, effect) => dispatch({ type: 'playMalus', by, cardId, effect }),
      pause: () => dispatch({ type: 'pause' }),
      resume: () => dispatch({ type: 'resume' }),
      abandon: () => dispatch({ type: 'abandon' }),
    }
  }, [game, now, store.history.length, dispatch])

  return <GameContext.Provider value={api}>{children}</GameContext.Provider>
}

export function useGame(): GameApi {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used inside <GameProvider>')
  return ctx
}
