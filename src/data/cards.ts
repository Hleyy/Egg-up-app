import data from './cards.json'
import type { Card, CardType } from '../game/types'

export const CARDS = (data as { cards: Card[] }).cards

export function cardsOfType(type: CardType): Card[] {
  return CARDS.filter((c) => c.type === type)
}

export function findCard(id: string | null | undefined): Card | undefined {
  return id ? CARDS.find((c) => c.id === id) : undefined
}
