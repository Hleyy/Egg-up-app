import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { assetExists } from '../../lib/assetExists'
import type { EggStage, TeamId } from '../../game/types'

const EGG_H = 0.76

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
    out.push(new THREE.Vector2(Math.max(0, r) * 0.3, ((y + 1) * EGG_H) / 2))
  }
  return out
}

function ShapeEgg({ color }: { color: string }) {
  const shell = useMemo(() => new THREE.LatheGeometry(eggShape(), 48), [])
  const band = useMemo(() => new THREE.LatheGeometry(eggShape(true), 48), [])
  return (
    <>
      <mesh geometry={shell} castShadow>
        <meshStandardMaterial color="#FFF4E2" roughness={0.45} />
      </mesh>
      <mesh geometry={band} scale={[1.012, 1, 1.012]}>
        <meshStandardMaterial color={color} roughness={0.4} />
      </mesh>
    </>
  )
}

function ModelEgg({ src }: { src: string }) {
  const { scene } = useGLTF(src, false)
  const model = useMemo(() => {
    const copy = scene.clone(true)
    const box = new THREE.Box3().setFromObject(copy)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const scale = EGG_H / Math.max(size.y, 0.0001)
    copy.scale.setScalar(scale)
    copy.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale)
    copy.traverse((o) => {
      if (o instanceof THREE.Mesh) o.castShadow = true
    })
    return copy
  }, [scene])
  return <primitive object={model} />
}

function useModel(src: string): boolean {
  const [found, setFound] = useState<{ src: string; ok: boolean } | null>(null)
  useEffect(() => {
    let alive = true
    void assetExists(src, 'glTF').then((ok) => alive && setFound({ src, ok }))
    return () => {
      alive = false
    }
  }, [src])
  return found?.src === src && found.ok
}

export function Egg3D({ team, stage, color, position }: { team: TeamId; stage: EggStage; color: string; position: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null)
  const src = `/models/egg-${team}.glb`
  const hasModel = useModel(src)
  const size = 0.75 + stage * 0.08
  useFrame(({ clock }) => {
    const g = ref.current
    if (!g) return
    const t = clock.elapsedTime + (team === 'red' ? 0.7 : 0)
    g.rotation.z = stage >= 1 ? Math.sin(t * (2 + stage)) * 0.04 * stage : 0
    g.scale.set(size * (1 + Math.sin(t * 2) * 0.012), size * (1 - Math.sin(t * 2) * 0.012), size)
  })
  const shape = <ShapeEgg color={color} />
  return (
    <group ref={ref} position={position}>
      {hasModel ? (
        <Suspense fallback={shape}>
          <ModelEgg src={src} />
        </Suspense>
      ) : (
        shape
      )}
    </group>
  )
}
