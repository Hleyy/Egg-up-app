import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { SQUARES } from '../../data/board'
import { squareOf } from '../../game/rules'
import type { EggStage, TeamId } from '../../game/types'
import type { BoardPawn } from './types'
import { Egg3D } from './Egg3D'

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

interface PawnView extends BoardPawn {
  slot: number
  slots: number
}

const BASE_R = 0.19
const FIGURE_H = 1.25
const FIGURE_SLOT = FIGURE_H * 0.75
const GAP = 0.05

function layout(slot: number, slots: number, portrait: boolean): { x: number; z: number; reach: number } {
  const along = (slot - (slots - 1) / 2) * (FIGURE_SLOT + GAP)
  const reach = Math.max(0, (portrait ? H : W) / 2 - (slots * (FIGURE_SLOT + GAP)) / 2 - 0.1)
  return portrait ? { x: 0, z: along, reach } : { x: along, z: 0, reach }
}

function clamp(value: number, limit: number): number {
  return Math.min(limit, Math.max(-limit, value))
}

function Pawn({ pawn, portrait, onArrive }: { pawn: PawnView; portrait: boolean; onArrive?: () => void }) {
  const ref = useRef<THREE.Group>(null)
  const shown = useRef(pawn.distance)
  const hop = useRef(0)
  const face = useRef<THREE.Mesh>(null)
  const eye = useMemo(() => new THREE.Vector3(), [])
  const figure = useTexture(`/animals/${pawn.animal}.webp`, prepareTexture)
  const image = figure.image as { width: number; height: number }
  const figureW = FIGURE_H * (image.width / image.height)
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
    const x = from[0] + (to[0] - from[0]) * e
    const z = from[1] + (to[1] - from[1]) * e
    g.position.set((portrait ? x : clamp(x, spot.reach)) + spot.x, TOP + Math.sin(Math.PI * t) * 0.32 + bob, (portrait ? clamp(z, spot.reach) : z) + spot.z)
    const squash = moving ? 1 - Math.sin(Math.PI * t) * 0.08 : 1
    g.scale.set(1, squash, 1)
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
        <planeGeometry args={[figureW, FIGURE_H]} />
        <meshBasicMaterial map={figure} alphaTest={0.4} side={THREE.DoubleSide} toneMapped={false} />
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
        dpr={[1, 2]}
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
            <Egg3D team="blue" stage={eggs.blue} position={[-0.42, TOP, 0]} />
            <Egg3D team="red" stage={eggs.red} position={[0.42, TOP, 0]} />
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
