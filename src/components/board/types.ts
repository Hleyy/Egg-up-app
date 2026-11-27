import type { AnimalId, TeamId } from '../../game/types'

export interface BoardPawn {
  id: string
  team: TeamId
  distance: number
  label: string
  animal: AnimalId
  active: boolean
}
