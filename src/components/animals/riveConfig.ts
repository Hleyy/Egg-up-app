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

const cache = new Map<string, Promise<boolean>>()

export function riveFileExists(src: string): Promise<boolean> {
  let found = cache.get(src)
  if (!found) {
    found = fetch(src)
      .then(async (res) => {
        if (!res.ok) return false
        const head = new Uint8Array(await res.arrayBuffer()).slice(0, 4)
        return String.fromCharCode(...head) === 'RIVE'
      })
      .catch(() => false)
    cache.set(src, found)
  }
  return found
}
