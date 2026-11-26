import data from './ar.json'

export interface ArPlacement {
  model: string
  x: number
  z: number
  turn: number
  scale: number
  lying?: number
}

export interface ArItem extends ArPlacement {
  id: string
  recyclable: boolean
  word: string
  choices: string[]
  fact?: { en: string; fr: string }
}

export interface ArChallenge {
  id: string
  target: string
  seconds: number
  penalty: number
  hintAfter: number
  bin: ArPlacement
  items: ArItem[]
}

export const AR_CHALLENGE = data as ArChallenge

export const RECYCLABLE_COUNT = AR_CHALLENGE.items.filter((i) => i.recyclable).length
