import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { AnimalFace } from '../animals/AnimalFace'
import { Html, OrbitControls, RoundedBox, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { SQUARES } from '../../data/board'
import { squareOf } from '../../game/rules'
import type { EggStage, TeamId } from '../../game/types'
import type { BoardPawn } from './types'

const W = 8.48
const H = 6
const TOP = 0.14

const TEAM_HEX: Record<TeamId, [string, string]> = {
  red: ['#FF4B4B', '#FF8A6B'],
  blue: ['#1CB0F6', '#00D9E0'],
}

function tilePos(index: number): [number, number] {
  const s = SQUARES[squareOf(index)]
  return [(s.x - 0.5) * W, (s.y - 0.5) * H]
}

function prepareTexture(texture: THREE.Texture) {
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 16
  texture.needsUpdate = true
}

function BoardSlab() {
  const texture = useTexture('/board/board.svg', prepareTexture)
  return (
    <group>
      <RoundedBox args={[W + 0.12, 0.26, H + 0.12]} radius={0.12} smoothness={4} position={[0, -0.02, 0]} receiveShadow castShadow>
        <meshStandardMaterial color="#E7C58E" roughness={0.85} />
      </RoundedBox>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.112, 0]} receiveShadow>
        <planeGeometry args={[W, H]} />
        <meshStandardMaterial map={texture} roughness={0.9} metalness={0} />
      </mesh>
    </group>
  )
}

function pawnShape(): THREE.Vector2[] {
  const pts: [number, number][] = [
    [0, 0],
    [0.2, 0],
    [0.21, 0.03],
    [0.19, 0.07],
    [0.13, 0.1],
    [0.1, 0.16],
    [0.075, 0.27],
    [0.07, 0.33],
    [0.115, 0.35],
    [0.12, 0.37],
    [0.08, 0.385],
    [0.105, 0.43],
    [0.115, 0.48],
    [0.1, 0.53],
    [0.06, 0.565],
    [0, 0.575],
  ]
  return pts.map(([x, y]) => new THREE.Vector2(x, y))
}

function eggShape(bottomOnly = false): THREE.Vector2[] {
  const out: THREE.Vector2[] = []
  const steps = 28
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const a = -Math.PI / 2 + t * Math.PI
    const y = Math.sin(a)
    const k = y > 0 ? 0.82 : 1
    const r = Math.cos(a) * (1 - 0.18 * y) * k
    if (bottomOnly && y > -0.15) break
    out.push(new THREE.Vector2(Math.max(0, r) * 0.3, (y + 1) * 0.38))
  }
  return out
}

interface PawnView extends BoardPawn {
  slot: number
  slots: number
}

function Pawn({ pawn, onArrive }: { pawn: PawnView; onArrive?: () => void }) {
  const ref = useRef<THREE.Group>(null)
  const shown = useRef(pawn.distance)
  const hop = useRef(0)
  const geo = useMemo(() => new THREE.LatheGeometry(pawnShape(), 40), [])
  const [base, light] = TEAM_HEX[pawn.team]
  const offset = useMemo(() => {
    if (pawn.slots <= 1) return [0, 0]
    const angle = (pawn.slot / pawn.slots) * Math.PI * 2 + Math.PI / 4
    return [Math.cos(angle) * 0.16, Math.sin(angle) * 0.16]
  }, [pawn.slot, pawn.slots])

  useFrame((_, dt) => {
    const g = ref.current
    if (!g) return
    const target = pawn.distance
    if (shown.current !== target) {
      hop.current += dt / 0.2
      if (hop.current >= 1) {
        hop.current = 0
        shown.current += Math.sign(target - shown.current)
        if (shown.current === target) onArrive?.()
      }
    }
    const from = tilePos(shown.current)
    const to = shown.current === target ? from : tilePos(shown.current + Math.sign(target - shown.current))
    const t = shown.current === target ? 0 : hop.current
    const e = t * t * (3 - 2 * t)
    g.position.set(from[0] + (to[0] - from[0]) * e + offset[0], TOP + Math.sin(Math.PI * t) * 0.32, from[1] + (to[1] - from[1]) * e + offset[1])
    const squash = shown.current === target ? 1 : 1 - Math.sin(Math.PI * t) * 0.08
    g.scale.set(1, squash, 1)
    if (pawn.active) g.rotation.y += dt * 0.8
  })

  return (
    <group ref={ref}>
      <mesh geometry={geo} castShadow receiveShadow scale={[1.15, 1.15, 1.15]}>
        <meshPhysicalMaterial color={base} roughness={0.32} clearcoat={0.8} clearcoatRoughness={0.25} />
      </mesh>
      <mesh position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.24, 0.3, 40]} />
        <meshBasicMaterial color={pawn.active ? '#FFC800' : light} transparent opacity={pawn.active ? 1 : 0} />
      </mesh>
      <Html position={[0, 0.95, 0]} center distanceFactor={7} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <span
          className="block rounded-full"
          style={{
            boxShadow: pawn.active ? `0 0 0 2.5px ${base}, 0 0 0 5px #FFC800` : `0 0 0 2.5px ${base}, 0 0 0 4.5px #fff`,
            opacity: pawn.active ? 1 : 0.92,
          }}
        >
          <AnimalFace animal={pawn.animal} size={30} />
        </span>
      </Html>
    </group>
  )
}

function Egg3D({ team, stage, x }: { team: TeamId; stage: EggStage; x: number }) {
  const ref = useRef<THREE.Group>(null)
  const shell = useMemo(() => new THREE.LatheGeometry(eggShape(), 48), [])
  const band = useMemo(() => new THREE.LatheGeometry(eggShape(true), 48), [])
  const size = 0.75 + stage * 0.08
  useFrame(({ clock }) => {
    const g = ref.current
    if (!g) return
    const t = clock.elapsedTime + (team === 'red' ? 0.7 : 0)
    const wob = stage >= 1 ? Math.sin(t * (2 + stage)) * 0.04 * stage : 0
    g.rotation.z = wob
    g.scale.set(size * (1 + Math.sin(t * 2) * 0.012), size * (1 - Math.sin(t * 2) * 0.012), size)
  })
  return (
    <group ref={ref} position={[x, TOP, 0]}>
      <mesh geometry={shell} castShadow>
        <meshPhysicalMaterial color="#FFF4E2" roughness={0.45} clearcoat={0.5} />
      </mesh>
      <mesh geometry={band} scale={[1.012, 1, 1.012]}>
        <meshPhysicalMaterial color={TEAM_HEX[team][0]} roughness={0.4} clearcoat={0.5} />
      </mesh>
    </group>
  )
}

const TILT = Math.atan2(6.4, 8.6)

function fitDistance(aspect: number, portrait: boolean): number {
  const across = (portrait ? H : W) + 0.6
  const deep = ((portrait ? W : H) + 0.6) * Math.cos(TILT)
  const v = Math.tan(((36 / 2) * Math.PI) / 180)
  return Math.max(across / 2 / (v * aspect), deep / 2 / v) * 1.16
}

function Fit({ portrait }: { portrait: boolean }) {
  const { camera, size } = useThree()
  useEffect(() => {
    const d = fitDistance(size.width / Math.max(1, size.height), portrait)
    camera.position.set(0, Math.cos(TILT) * d, Math.sin(TILT) * d)
    camera.lookAt(0, 0, 0)
  }, [camera, size.width, size.height, portrait])
  return null
}

function CameraRig({ focus }: { focus: [number, number] | null }) {
  const controls = useRef<{ target: THREE.Vector3; update: () => void } | null>(null)
  const goal = useMemo(() => new THREE.Vector3(), [])
  useFrame((_, dt) => {
    const c = controls.current
    if (!c) return
    goal.set(focus ? focus[0] * 0.12 : 0, 0, focus ? focus[1] * 0.12 : 0)
    c.target.lerp(goal, Math.min(1, dt * 2))
    c.update()
  })
  return (
    <OrbitControls
      ref={controls as never}
      enablePan={false}
      enableDamping
      minDistance={4}
      maxDistance={22}
      minPolarAngle={0.15}
      maxPolarAngle={1.15}
      minAzimuthAngle={-0.7}
      maxAzimuthAngle={0.7}
    />
  )
}

export interface Board3DProps {
  pawns: BoardPawn[]
  eggs: Record<TeamId, EggStage>
  focus?: string | null
  onArrive?: () => void
  className?: string
}

export default function Board3D({ pawns, eggs, focus, onArrive, className = '' }: Board3DProps) {
  const views: PawnView[] = useMemo(() => {
    const bySquare = new Map<number, string[]>()
    for (const p of pawns) {
      const k = squareOf(p.distance)
      bySquare.set(k, [...(bySquare.get(k) ?? []), p.id])
    }
    return pawns.map((p) => {
      const list = bySquare.get(squareOf(p.distance)) ?? [p.id]
      return { ...p, slot: list.indexOf(p.id), slots: list.length }
    })
  }, [pawns])
  const focused = pawns.find((p) => p.id === focus)
  const box = useRef<HTMLDivElement>(null)
  const [portrait, setPortrait] = useState(false)
  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(() => setPortrait(el.clientHeight > el.clientWidth * 1.05))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return (
    <div className={className.includes('absolute') ? className : `relative ${className}`} ref={box}>
      <Canvas key={portrait ? 'p' : 'l'} shadows dpr={[1, 2]} camera={{ position: [0, 8.6, 6.4], fov: 36 }} gl={{ antialias: true, alpha: true }}>
        <Fit portrait={portrait} />
        <hemisphereLight args={['#FFF8EC', '#C9B48E', 1.25]} />
        <directionalLight
          position={[-4, 9, 5]}
          intensity={1.6}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-6}
          shadow-camera-right={6}
          shadow-camera-top={6}
          shadow-camera-bottom={-6}
          shadow-radius={4}
          shadow-bias={-0.0004}
        />
        <Suspense fallback={null}>
          <group rotation={[0, portrait ? Math.PI / 2 : 0, 0]}>
            <BoardSlab />
            <Egg3D team="blue" stage={eggs.blue} x={-0.42} />
            <Egg3D team="red" stage={eggs.red} x={0.42} />
            {views.map((p) => (
              <Pawn key={p.id} pawn={p} onArrive={p.id === focus ? onArrive : undefined} />
            ))}
          </group>
        </Suspense>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.16, 0]} receiveShadow>
          <planeGeometry args={[40, 40]} />
          <shadowMaterial opacity={0.12} />
        </mesh>
        <CameraRig focus={focused && !portrait ? tilePos(focused.distance) : null} />
      </Canvas>
    </div>
  )
}
