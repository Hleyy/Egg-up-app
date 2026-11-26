import { assetExists } from '../../lib/assetExists'
import type { AnimalId } from '../../game/types'

export interface RiveAnimalConfig {
  src: string
  artboard: string
  stateMachine: string
  viewModel: string
}

export const RIVE_ANIMALS: Record<AnimalId, RiveAnimalConfig> = {
  fox: { src: '/rive/fox.riv', artboard: 'Fox v2', stateMachine: 'Fox', viewModel: 'FoxTriggers' },
  frog: { src: '/rive/frog.riv', artboard: 'Frog v2', stateMachine: 'Frog', viewModel: 'FrogTriggers' },
  goat: { src: '/rive/goat.riv', artboard: 'Goat v2', stateMachine: 'Goat', viewModel: 'GoatTriggers' },
  koala: { src: '/rive/koala.riv', artboard: 'Koala v2', stateMachine: 'Koala', viewModel: 'KoalaTriggers' },
}

export function riveFileExists(src: string): Promise<boolean> {
  return assetExists(src, 'RIVE')
}
