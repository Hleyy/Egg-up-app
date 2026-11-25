import { useEffect, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

const PIPS: Record<number, number[]> = { 1: [5], 2: [3, 7], 3: [3, 5, 7], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9] }

type Vec = [number, number, number]

const FACES: { n: number; normal: Vec; u: Vec; v: Vec }[] = [
  { n: 1, normal: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0] },
  { n: 6, normal: [0, 0, -1], u: [-1, 0, 0], v: [0, 1, 0] },
  { n: 2, normal: [1, 0, 0], u: [0, 0, -1], v: [0, 1, 0] },
  { n: 5, normal: [-1, 0, 0], u: [0, 0, 1], v: [0, 1, 0] },
  { n: 3, normal: [0, 1, 0], u: [1, 0, 0], v: [0, 0, -1] },
  { n: 4, normal: [0, -1, 0], u: [1, 0, 0], v: [0, 0, 1] },
]

const FACE_ROT: Record<number, [number, number]> = {
  1: [0, 0],
  6: [0, Math.PI],
  2: [0, -Math.PI / 2],
  5: [0, Math.PI / 2],
  3: [Math.PI / 2, 0],
  4: [-Math.PI / 2, 0],
}

const STEP = 0.27
const DEPTH = 0.455
const DURATION = 1.05

function pipPositions(): Vec[] {
  const out: Vec[] = []
  for (const f of FACES) {
    for (const cell of PIPS[f.n]) {
      const col = (cell - 1) % 3
      const row = Math.floor((cell - 1) / 3)
      const a = (col - 1) * STEP
      const b = (1 - row) * STEP
      out.push([0, 1, 2].map((k) => f.normal[k] * DEPTH + f.u[k] * a + f.v[k] * b) as Vec)
    }
  }
  return out
}

const PIP_POSITIONS = pipPositions()

function easeOut(t: number): number {
  const c = 1.4
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2)
}

function Die({ value, spins, x, tilt }: { value: number; spins: number; x: number; tilt: number }) {
  const ref = useRef<THREE.Group>(null)
  const started = useRef<number | null>(null)
  const invalidate = useThree((s) => s.invalidate)

  useEffect(() => {
    started.current = null
    invalidate()
  }, [spins, value, invalidate])

  useFrame(({ clock }) => {
    const g = ref.current
    if (!g) return
    if (started.current === null) started.current = clock.elapsedTime
    const t = spins === 0 ? 1 : Math.min(1, (clock.elapsedTime - started.current) / DURATION)
    const left = 1 - easeOut(t)
    const [rx, ry] = FACE_ROT[value] ?? [0, 0]
    g.rotation.set(rx + left * Math.PI * 4, ry + left * Math.PI * 4 * tilt, left * Math.PI * tilt)
    g.position.y = Math.sin(t * Math.PI) * 0.35
    if (t < 1) invalidate()
  })

  return (
    <group position={[x, 0, 0]} rotation={[0.38, 0.42 * tilt, 0.1 * tilt]}>
      <group ref={ref}>
        <RoundedBox args={[1, 1, 1]} radius={0.16} smoothness={5}>
          <meshStandardMaterial color="#FFFFFF" roughness={0.35} />
        </RoundedBox>
        {PIP_POSITIONS.map((p, i) => (
          <mesh key={i} position={p}>
            <sphereGeometry args={[0.085, 20, 12]} />
            <meshStandardMaterial color="#3C3A45" roughness={0.5} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

export default function Dice3D({ values, spins, size }: { values: [number, number]; spins: number; size: number }) {
  return (
    <div style={{ width: size * 2.7, height: size * 1.7 }}>
      <Canvas frameloop="demand" dpr={[1, 2]} orthographic camera={{ position: [0, 0, 10], zoom: size * 0.72 }} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={2.1} />
        <directionalLight position={[-3, 5, 6]} intensity={1.8} />
        <Die value={values[0]} spins={spins} x={-0.8} tilt={1} />
        <Die value={values[1]} spins={spins + 1} x={0.8} tilt={-1} />
      </Canvas>
    </div>
  )
}
