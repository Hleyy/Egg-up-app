import { useEffect, useMemo, useRef } from 'react'
import { RuntimeLoader } from '@rive-app/canvas'
import wasmUrl from '@rive-app/canvas/rive.wasm?url'
import { Fit, Layout, useRive, useViewModelInstanceBoolean, useViewModelInstanceNumber, useViewModelInstanceTrigger } from '@rive-app/react-canvas'
import type { RiveAnimalConfig } from './riveConfig'
import type { AnimalCue } from './Animal'

RuntimeLoader.setWasmUrl(wasmUrl)

export default function RiveAnimal({
  config,
  talking,
  viseme,
  cue,
  cueKey,
  className = '',
}: {
  config: RiveAnimalConfig
  talking: boolean
  viseme: number
  cue?: AnimalCue
  cueKey?: string | number
  className?: string
}) {
  const { rive, RiveComponent } = useRive({
    src: config.src,
    artboard: config.artboard,
    stateMachine: config.stateMachine,
    autoplay: true,
    autoBind: false,
    layout: new Layout({ fit: Fit.Contain }),
  })
  const vm = useMemo(() => {
    if (!rive) return null
    const instance = rive.viewModelByName(config.viewModel)?.instanceByName('Default') ?? null
    if (instance) rive.bindViewModelInstance(instance)
    return instance
  }, [rive, config.viewModel])
  const talk = useViewModelInstanceBoolean('talking', vm)
  const mouth = useViewModelInstanceNumber('viseme', vm)
  const hello = useViewModelInstanceTrigger('hello', vm)
  const correct = useViewModelInstanceTrigger('correct', vm)
  const wrong = useViewModelInstanceTrigger('wrong', vm)
  const ask = useViewModelInstanceTrigger('ask', vm)

  const setTalk = talk.setValue
  const setMouth = mouth.setValue
  useEffect(() => setTalk(talking), [talking, setTalk])
  useEffect(() => setMouth(viseme), [viseme, setMouth])

  const triggers = useRef({ hello, correct, wrong, ask })
  useEffect(() => {
    triggers.current = { hello, correct, wrong, ask }
  })
  useEffect(() => {
    if (vm && cue) triggers.current[cue].trigger()
  }, [vm, cue, cueKey])

  return (
    <div className={className} style={{ aspectRatio: '4 / 5' }} aria-hidden="true">
      <RiveComponent className="size-full" />
    </div>
  )
}
