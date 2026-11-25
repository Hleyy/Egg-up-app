import { lazy, Suspense, useEffect, useState } from 'react'
import { hasWebGL } from './board/loadBoard3D'

const Dice3D = lazy(() => import('./Dice3D'))

const PIPS: Record<number, number[]> = { 1: [5], 2: [3, 7], 3: [3, 5, 7], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9] }

const FACE_ROT: Record<number, [number, number]> = { 1: [0, 0], 2: [0, -90], 3: [-90, 0], 4: [90, 0], 5: [0, 90], 6: [0, 180] }

const FACES: { n: number; t: string }[] = [
  { n: 1, t: 'translateZ(var(--h))' },
  { n: 2, t: 'rotateY(90deg) translateZ(var(--h))' },
  { n: 3, t: 'rotateX(90deg) translateZ(var(--h))' },
  { n: 4, t: 'rotateX(-90deg) translateZ(var(--h))' },
  { n: 5, t: 'rotateY(-90deg) translateZ(var(--h))' },
  { n: 6, t: 'rotateY(180deg) translateZ(var(--h))' },
]

const CORE_INSET = 0.05

export function Die({ value, spins, size = 66, tilt = 1 }: { value: number; spins: number; size?: number; tilt?: number }) {
  const [x, y] = FACE_ROT[value] ?? [0, 0]
  const turn = spins * 360
  return (
    <div style={{ width: size, height: size, perspective: size * 7 }}>
      <div
        className="relative size-full [transform-style:preserve-3d]"
        style={{
          ['--h' as string]: `${size / 2}px`,
          transform: `rotateX(${-14 * tilt + x + turn}deg) rotateY(${18 * tilt + y + turn}deg)`,
          transition: 'transform 1.05s cubic-bezier(.2,.8,.25,1.08)',
        }}
      >
        {FACES.map((f) => (
          <div
            key={`core-${f.n}`}
            className="absolute bg-[#E9E4DB]"
            style={{ inset: size * CORE_INSET, transform: f.t.replace('var(--h)', `${size / 2 - size * CORE_INSET - 0.5}px`) }}
          />
        ))}
        {FACES.map((f) => (
          <div
            key={f.n}
            className="absolute inset-0 grid grid-cols-3 grid-rows-3 bg-white [backface-visibility:hidden]"
            style={{
              transform: f.t,
              borderRadius: size * 0.2,
              padding: `${size * 0.15}px ${size * 0.15}px ${size * 0.19}px`,
              boxShadow: 'inset 0 -5px 0 #E9E4DB, 0 0 0 2px #E4DFD6',
            }}
          >
            {Array.from({ length: 9 }, (_, i) => (
              <i
                key={i}
                className="place-self-center rounded-full"
                style={{ width: size * 0.17, height: size * 0.17, background: PIPS[f.n].includes(i + 1) ? '#3C3A45' : 'transparent' }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function useDiceSpin(values: [number, number] | null) {
  const [spins, setSpins] = useState(0)
  const key = values ? values.join('-') : 'none'
  const [lastKey, setLastKey] = useState(key)
  if (key !== lastKey) {
    setLastKey(key)
    if (values) setSpins((s) => s + 2)
  }
  return spins
}

export function DicePair({
  values,
  size = 66,
  onRoll,
  label,
  className = '',
}: {
  values: [number, number] | null
  size?: number
  onRoll?: () => void
  label?: string
  className?: string
}) {
  const spins = useDiceSpin(values)
  const [webgl] = useState(hasWebGL)
  const [shake, setShake] = useState(false)
  useEffect(() => {
    if (!onRoll) return
    const id = window.setInterval(() => setShake((s) => !s), 2600)
    return () => window.clearInterval(id)
  }, [onRoll])
  const shown: [number, number] = values ?? [3, 5]
  const flat = (
    <span className="flex items-center gap-[18%]">
      <span className="-rotate-6">
        <Die value={shown[0]} spins={spins} size={size} />
      </span>
      <span className="translate-y-[-10%] rotate-6">
        <Die value={shown[1]} spins={spins + 1} size={size} tilt={-1} />
      </span>
    </span>
  )
  const content = (
    <span className="block" style={{ animation: onRoll && shake ? 'dice-shake .5s ease-in-out' : undefined }}>
      {webgl ? (
        <Suspense fallback={flat}>
          <Dice3D values={shown} spins={spins} size={size} />
        </Suspense>
      ) : (
        flat
      )}
    </span>
  )
  if (!onRoll) return <div className={className}>{content}</div>
  return (
    <button type="button" onClick={onRoll} aria-label={label} className={`rounded-3xl p-2 ${className}`}>
      {content}
    </button>
  )
}
