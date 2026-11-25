import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { gameReducer, type GameAction } from './reducer'
import { elapsedMs, remainingMs } from './selectors'
import { createGame } from './setup'
import { loadGame, saveGame } from './storage'
import { addRecord, loadHistory, saveHistory, toRecord, type GameRecord } from './history'
import { rollDice } from './rules'
import type { GameState } from './types'
import { useSettings } from '../settings/useSettings'
import { GameContext, type GameApi, type GameCommand } from './useGame'

const UNDO_LIMIT = 20

interface Store {
  game: GameState | null
  history: GameState[]
}

function withPlayerNames(game: GameState | null, fallback: (n: number) => string): GameState | null {
  if (!game || game.players.every((p) => p.name)) return game
  return { ...game, players: game.players.map((p) => (p.name ? p : { ...p, name: fallback(Number(p.id.split('-')[1]) || 1) })) }
}

const NOT_UNDOABLE = new Set<GameAction['type']>(['tick', 'pause', 'resume'])

export function GameProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<Store>(() => {
    const saved = loadGame()
    return { game: saved ? gameReducer(saved, { type: 'tick', now: Date.now() }) : null, history: [] }
  })
  const [now, setNow] = useState(() => Date.now())

  const { t } = useSettings()
  const game = useMemo(() => withPlayerNames(store.game, (n) => t('setup.player', { n })), [store.game, t])

  useEffect(() => saveGame(store.game), [store.game])

  const [records, setRecords] = useState<GameRecord[]>(loadHistory)
  const finishedRecord = game ? toRecord(game) : null
  if (finishedRecord && !records.some((r) => r.id === finishedRecord.id)) setRecords(addRecord(records, finishedRecord))
  useEffect(() => saveHistory(records), [records])

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
    return {
      game,
      now,
      remaining: game ? remainingMs(game.timer, now) : null,
      elapsed: game ? elapsedMs(game.timer, now) : 0,
      canUndo: store.history.length > 0 && game?.status !== 'finished',
      records,
      clearRecords: () => setRecords([]),
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
        if (!game || game.status !== 'playing' || game.phase.kind !== 'roll') return null
        const dice = rollDice()
        dispatch({ type: 'roll', dice })
        return dice
      },
      land: () => dispatch({ type: 'land', random: Math.random() }),
      answer: (correct) => dispatch({ type: 'answer', correct }),
      challenge: (winner) => dispatch({ type: 'challenge', winner }),
      bonus: (keep) => dispatch({ type: 'bonus', keep }),
      malus: (shield) => dispatch({ type: 'malus', shield }),
      useKept: (team, cardId) => dispatch({ type: 'useKept', team, cardId }),
      next: () => dispatch({ type: 'continue' }),
      hatch: () => dispatch({ type: 'hatch' }),
      adjustScore: (team, delta) => dispatch({ type: 'adjustScore', team, delta }),
      movePawn: (pawn, delta) => dispatch({ type: 'movePawn', pawn, delta }),
      fixMove: (delta) => dispatch({ type: 'fixMove', delta }),
      pause: () => dispatch({ type: 'pause' }),
      resume: () => dispatch({ type: 'resume' }),
      abandon: () => dispatch({ type: 'abandon' }),
    }
  }, [game, now, store.history.length, dispatch, records])

  return <GameContext.Provider value={api}>{children}</GameContext.Provider>
}
