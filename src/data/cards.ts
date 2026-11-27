import data from './cards.json'
import type { Card, DeckId } from '../game/types'

export const CARDS = (data as { cards: Card[] }).cards

export function cardsOfDeck(deck: DeckId): Card[] {
  return CARDS.filter((c) => c.deck === deck)
}

export function findCard(id: string | null | undefined): Card | undefined {
  return id ? CARDS.find((c) => c.id === id) : undefined
}
