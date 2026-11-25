import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { SQUARES } from '../../data/board'
import { squareOf } from '../../game/rules'
import type { EggStage, TeamId } from '../../game/types'
import type { BoardPawn } from './types'

const W = 8.48
const H = 6
const TOP = 0.14
const EDGE = '#D9BD8E'
const CORNER = (40 / 848.48) * W

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
  texture.anisotropy = 4
  texture.needsUpdate = true
}

function slabGeometry(): THREE.ExtrudeGeometry {
  const r = CORNER
  const x = -W / 2
  const y = -H / 2
  const shape = new THREE.Shape()
  shape.moveTo(x + r, y)
  shape.lineTo(x + W - r, y)
  shape.quadraticCurveTo(x + W, y, x + W, y + r)
  shape.lineTo(x + W, y + H - r)
  shape.quadraticCurveTo(x + W, y + H, x + W - r, y + H)
  shape.lineTo(x + r, y + H)
  shape.quadraticCurveTo(x, y + H, x, y + H - r)
  shape.lineTo(x, y + r)
  shape.quadraticCurveTo(x, y, x + r, y)
  return new THREE.ExtrudeGeometry(shape, { depth: 0.22, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 2, curveSegments: 12 })
}

function BoardSlab() {
  const texture = useTexture('/board/board.svg', prepareTexture)
  const slab = useMemo(() => slabGeometry(), [])
  return (
    <group>
      <mesh geometry={slab} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.09, 0]} receiveShadow castShadow>
        <meshStandardMaterial color={EDGE} roughness={0.85} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.112, 0]} receiveShadow>
        <planeGeometry args={[W, H]} />
        <meshStandardMaterial map={texture} alphaTest={0.5} roughness={0.9} metalness={0} />
      </mesh>
    </group>
  )
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

const BASE_R = 0.17
const FIGURE_H = 0.8
const FIGURE_W = FIGURE_H * (1004 / 1752)
const ROW = 0.95
const GAP = 0.04

function layout(slot: number, slots: number, portrait: boolean): { x: number; z: number; scale: number } {
  if (slots <= 1) return { x: 0, z: 0, scale: 1 }
  const scale = Math.min(1, (ROW / slots - GAP) / FIGURE_W)
  const along = (slot - (slots - 1) / 2) * (FIGURE_W * scale + GAP)
  return portrait ? { x: 0, z: along, scale } : { x: along, z: 0, scale }
}

function Pawn({ pawn, portrait, onArrive }: { pawn: PawnView; portrait: boolean; onArrive?: () => void }) {
  const ref = useRef<THREE.Group>(null)
  const shown = useRef(pawn.distance)
  const hop = useRef(0)
  const face = useRef<THREE.Mesh>(null)
  const eye = useMemo(() => new THREE.Vector3(), [])
  const figure = useTexture(`/animals/${pawn.animal}.svg`, prepareTexture)
  const [base, light] = TEAM_HEX[pawn.team]
  const spot = useMemo(() => layout(pawn.slot, pawn.slots, portrait), [pawn.slot, pawn.slots, portrait])

  useFrame(({ camera, clock }, dt) => {
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
    const moving = shown.current !== target
    const from = tilePos(shown.current)
    const to = moving ? tilePos(shown.current + Math.sign(target - shown.current)) : from
    const t = moving ? hop.current : 0
    const e = t * t * (3 - 2 * t)
    const bob = pawn.active && !moving ? Math.abs(Math.sin(clock.elapsedTime * 3)) * 0.05 : 0
    g.position.set(from[0] + (to[0] - from[0]) * e + spot.x, TOP + Math.sin(Math.PI * t) * 0.32 + bob, from[1] + (to[1] - from[1]) * e + spot.z)
    const squash = moving ? 1 - Math.sin(Math.PI * t) * 0.08 : 1
    g.scale.set(spot.scale, spot.scale * squash, spot.scale)
    if (face.current) {
      g.worldToLocal(eye.copy(camera.position))
      face.current.rotation.y = Math.atan2(eye.x, eye.z)
    }
  })

  return (
    <group ref={ref}>
      <mesh position={[0, 0.03, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[BASE_R, BASE_R * 1.08, 0.06, 32]} />
        <meshStandardMaterial color={base} roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[BASE_R + 0.02, BASE_R + 0.07, 40]} />
        <meshBasicMaterial color={pawn.active ? '#FFC800' : light} transparent opacity={pawn.active ? 1 : 0} />
      </mesh>
      <mesh ref={face} position={[0, 0.06 + FIGURE_H / 2, 0]} castShadow>
        <planeGeometry args={[FIGURE_W, FIGURE_H]} />
        <meshStandardMaterial map={figure} alphaTest={0.5} side={THREE.DoubleSide} roughness={0.8} />
      </mesh>
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
        <meshStandardMaterial color="#FFF4E2" roughness={0.45} />
      </mesh>
      <mesh geometry={band} scale={[1.012, 1, 1.012]}>
        <meshStandardMaterial color={TEAM_HEX[team][0]} roughness={0.4} />
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
      <Canvas
        key={portrait ? 'p' : 'l'}
        shadows
        dpr={[1, 1.5]}
        camera={{ position: [0, 8.6, 6.4], fov: 36 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <Fit portrait={portrait} />
        <hemisphereLight args={['#FFF8EC', '#C9B48E', 1.25]} />
        <directionalLight
          position={[-4, 9, 5]}
          intensity={1.6}
          castShadow
          shadow-mapSize={[1024, 1024]}
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
              <Pawn key={p.id} pawn={p} portrait={portrait} onArrive={p.id === focus ? onArrive : undefined} />
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
