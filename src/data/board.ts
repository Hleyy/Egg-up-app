import data from './board.json'
import { BOARD_SIZE, squareOf } from '../game/rules'
import type { CardType } from '../game/types'

export type SquareType = CardType | 'start'

export const SQUARES = (data as { squares: SquareType[] }).squares

if (SQUARES.length !== BOARD_SIZE) throw new Error(`board.json must have ${BOARD_SIZE} squares`)

export function squareTypeAt(distance: number): SquareType {
  return SQUARES[squareOf(distance)]
}
