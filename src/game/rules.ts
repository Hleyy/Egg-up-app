import type { EggStage, Season, TeamId } from './types'

export const BOARD_SIZE = 40
export const SEASONS: Season[] = ['summer', 'autumn', 'winter', 'spring']
export const SQUARES_PER_SEASON = BOARD_SIZE / SEASONS.length

export const POINTS_PER_CORRECT_ANSWER = 2
export const GOAL_POINTS = 40
export const HATCH_SEASON: Season = 'spring'

export const DIE_FACES = 6
export const DEFAULT_DURATION_MINUTES = 30
export const MIN_DURATION_MINUTES = 5
export const MAX_DURATION_MINUTES = 90

export const EGG_STAGE_THRESHOLDS: { stage: Exclude<EggStage, 'hatched'>; from: number }[] = [
  { stage: 'egg', from: 0 },
  { stage: 'wobble', from: 10 },
  { stage: 'crack', from: 20 },
  { stage: 'peek', from: 30 },
]

export const TEAM_IDS: TeamId[] = ['red', 'blue']

export function otherTeam(team: TeamId): TeamId {
  return team === 'red' ? 'blue' : 'red'
}

export function squareOf(distance: number): number {
  return ((distance % BOARD_SIZE) + BOARD_SIZE) % BOARD_SIZE
}

export function lapOf(distance: number): number {
  return Math.floor(Math.max(0, distance) / BOARD_SIZE) + 1
}

export function seasonOf(distance: number): Season {
  return SEASONS[Math.floor(squareOf(distance) / SQUARES_PER_SEASON)]
}

export function eggStageOf(score: number, hatched = false): EggStage {
  if (hatched) return 'hatched'
  let stage: EggStage = 'egg'
  for (const t of EGG_STAGE_THRESHOLDS) if (score >= t.from) stage = t.stage
  return stage
}

export function canHatch(score: number, distance: number): boolean {
  return score >= GOAL_POINTS && seasonOf(distance) === HATCH_SEASON
}

export function rollDie(random: () => number = Math.random): number {
  return Math.floor(random() * DIE_FACES) + 1
}
