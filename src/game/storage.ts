import { isGameState } from './setup'
import type { GameState } from './types'

const KEY = 'eggup:game:v3'

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return isGameState(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function saveGame(game: GameState | null): void {
  try {
    if (game) localStorage.setItem(KEY, JSON.stringify(game))
    else localStorage.removeItem(KEY)
  } catch {}
}
