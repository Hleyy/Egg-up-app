import type { AnimalId, CreatureId, EggStage, Season, SquareType, TeamId } from './types'

export const BOARD_SIZE = 40
export const SEASONS: Season[] = ['summer', 'autumn', 'winter', 'spring']
export const SQUARES_PER_SEASON = BOARD_SIZE / SEASONS.length

export const GOAL_POINTS = 40
export const HATCH_SEASON: Season = 'spring'
export const STAGE_STEP = 10

export const POINTS = { neutral: 2, team: 3, challenge: 3 } as const

export const DIE_FACES = 6
export const ANSWER_SECONDS = 30

export const DEFAULT_TIMER_MINUTES = 30
export const MIN_TIMER_MINUTES = 10
export const MAX_TIMER_MINUTES = 90

export const MIN_STUDENTS = 1
export const MAX_STUDENTS = 30

export const TEAM_IDS: TeamId[] = ['red', 'blue']
export const ANIMALS: AnimalId[] = ['fox', 'frog', 'goat', 'koala']
export const CREATURES: CreatureId[] = ['bloom', 'drop', 'buzz', 'clover']

export function otherTeam(team: TeamId): TeamId {
  return team === 'red' ? 'blue' : 'red'
}

export function squareOf(distance: number): number {
  return ((distance % BOARD_SIZE) + BOARD_SIZE) % BOARD_SIZE
}

export function seasonOf(distance: number): Season {
  return SEASONS[Math.floor(squareOf(distance) / SQUARES_PER_SEASON)]
}

export function squaresToSeason(distance: number, season: Season): number {
  const target = SEASONS.indexOf(season) * SQUARES_PER_SEASON
  return (target - squareOf(distance) + BOARD_SIZE) % BOARD_SIZE
}

export function eggStageOf(score: number): EggStage {
  return Math.min(4, Math.floor(Math.max(0, score) / STAGE_STEP)) as EggStage
}

export function canHatch(score: number, distances: number[]): boolean {
  return score >= GOAL_POINTS && distances.some((d) => seasonOf(d) === HATCH_SEASON)
}

export function rollDie(random: () => number = Math.random): number {
  return Math.floor(random() * DIE_FACES) + 1
}

export function rollDice(random: () => number = Math.random): [number, number] {
  return [rollDie(random), rollDie(random)]
}

export function questionSquare(type: SquareType): 'neutral' | 'team' | null {
  if (type === 'start' || type === 'neutral') return 'neutral'
  if (type === 'team') return 'team'
  return null
}
