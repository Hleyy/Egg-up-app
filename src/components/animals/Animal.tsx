import { lazy, Suspense, useEffect, useState } from 'react'
import type { AnimalId } from '../../game/types'
import { RIVE_ANIMALS, riveFileExists } from './riveConfig'

const RiveAnimal = lazy(() => import('./RiveAnimal'))

export type AnimalCue = 'hello' | 'correct' | 'wrong' | 'ask'

const CUE_CLASS: Record<AnimalCue, string> = {
  hello: 'cue-hello',
  correct: 'cue-correct',
  wrong: 'cue-wrong',
  ask: 'cue-ask',
}

export function AnimalArt({
  animal,
  talking = false,
  cue,
  cueKey,
  className = '',
}: {
  animal: AnimalId
  talking?: boolean
  cue?: AnimalCue
  cueKey?: string | number
  className?: string
}) {
  return (
    <div className={`animal ${talking ? 'is-talking' : ''} ${className}`} aria-hidden="true">
      <div key={`${cue}-${cueKey}`} className={`animal-cue ${cue ? CUE_CLASS[cue] : ''}`}>
        <div className="animal-body">
          <img src={`/animals/${animal}.svg`} alt="" draggable={false} />
        </div>
      </div>
    </div>
  )
}

export function Animal(props: { animal: AnimalId; talking?: boolean; viseme?: number; cue?: AnimalCue; cueKey?: string | number; className?: string }) {
  const config = RIVE_ANIMALS[props.animal]
  const [rive, setRive] = useState<{ src: string; ok: boolean } | null>(null)
  useEffect(() => {
    let alive = true
    void riveFileExists(config.src).then((ok) => alive && setRive({ src: config.src, ok }))
    return () => {
      alive = false
    }
  }, [config.src])
  const fallback = <AnimalArt animal={props.animal} talking={props.talking} cue={props.cue} cueKey={props.cueKey} className={props.className} />
  if (!rive || rive.src !== config.src || !rive.ok) return fallback
  return (
    <Suspense fallback={fallback}>
      <RiveAnimal config={config} talking={!!props.talking} viseme={props.viseme ?? 0} cue={props.cue} cueKey={props.cueKey} className={props.className} />
    </Suspense>
  )
}
