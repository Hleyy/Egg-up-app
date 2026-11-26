import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, useGLTF, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { assetExists } from '../../lib/assetExists'
import type { EggStage, TeamId } from '../../game/types'

const EGG_H = 0.76
const SPRITE_H = 1.25

function prepare(texture: THREE.Texture) {
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  texture.needsUpdate = true
}

function SpriteEgg({ team, stage }: { team: TeamId; stage: EggStage }) {
  const texture = useTexture(`/eggs/${team}-${stage}.svg`, prepare)
  const image = texture.image as { width: number; height: number }
  const width = SPRITE_H * (image.width / image.height)
  return (
    <Billboard>
      <mesh position={[0, SPRITE_H / 2, 0]} castShadow>
        <planeGeometry args={[width, SPRITE_H]} />
        <meshBasicMaterial map={texture} alphaTest={0.4} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
    </Billboard>
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

export function Egg3D({ team, stage, position }: { team: TeamId; stage: EggStage; position: [number, number, number] }) {
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
  const shape = (
    <Suspense fallback={null}>
      <SpriteEgg team={team} stage={stage} />
    </Suspense>
  )
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
