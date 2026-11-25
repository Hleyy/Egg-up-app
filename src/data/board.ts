import data from './board.json'
import { BOARD_SIZE, squareOf } from '../game/rules'
import type { SquareType } from '../game/types'

export interface Square {
  type: SquareType
  x: number
  y: number
}

export const BOARD = data as { width: number; height: number; squares: Square[] }
export const SQUARES = BOARD.squares

if (SQUARES.length !== BOARD_SIZE) throw new Error(`board.json must have ${BOARD_SIZE} squares`)

export function squareTypeAt(distance: number): SquareType {
  return SQUARES[squareOf(distance)].type
}
