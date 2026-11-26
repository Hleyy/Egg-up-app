import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import type { ArChallenge, ArPlacement } from '../data/ar'

const MINDAR_URL = '/vendor/mindar/mindar-image.prod.js'
const CARD_RATIO = 630 / 880

interface MindController {
  inputWidth: number
  inputHeight: number
  addImageTargets(url: string): Promise<{ dimensions: [number, number][] }>
  dummyRun(video: HTMLVideoElement): Promise<void>
  processVideo(video: HTMLVideoElement): void
  stopProcessVideo(): void
  dispose(): void
  getProjectionMatrix(): number[]
}

interface MindModule {
  Controller: new (options: {
    inputWidth: number
    inputHeight: number
    filterMinCF: number
    filterBeta: number
    warmupTolerance: number
    missTolerance: number
    onUpdate: (data: { type: string; worldMatrix?: number[] | null }) => void
  }) => MindController
}

export interface StageEvents {
  onTracking: (found: boolean) => void
  onPick: (id: string) => void
}

interface Piece {
  id: string
  root: THREE.Group
  radius: number
  done: boolean
}

type Ease = (t: number) => number

const easeOut: Ease = (t) => 1 - (1 - t) ** 3
const easeInOut: Ease = (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2)
const easeBack: Ease = (t) => 1 + 2.70158 * (t - 1) ** 3 + 1.70158 * (t - 1) ** 2
const bounce: Ease = (t) => {
  const n = 7.5625
  const d = 2.75
  if (t < 1 / d) return n * t * t
  if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75
  if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375
  return n * (t -= 2.625 / d) * t + 0.984375
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

export class ArStage {
  private readonly container: HTMLElement
  private readonly challenge: ArChallenge
  private readonly events: StageEvents
  private readonly renderer: THREE.WebGLRenderer
  private readonly scene = new THREE.Scene()
  private readonly camera = new THREE.PerspectiveCamera()
  private readonly anchor = new THREE.Group()
  private readonly stage = new THREE.Group()
  private readonly ring: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>
  private readonly raycaster = new THREE.Raycaster()
  private readonly pieces: Piece[] = []
  private readonly tweens = new Set<(now: number) => boolean>()
  private readonly postMatrix = new THREE.Matrix4()
  private readonly unit = new THREE.Matrix4()
  private video: HTMLVideoElement | null = null
  private stream: MediaStream | null = null
  private controller: MindController | null = null
  private bin: THREE.Group | null = null
  private lid: THREE.Object3D | null = null
  private selected: Piece | null = null
  private frame = 0
  private scale = 1
  private found = false
  private shown = false
  private stopped = false

  constructor(container: HTMLElement, challenge: ArChallenge, events: StageEvents) {
    this.container = container
    this.challenge = challenge
    this.events = events
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.NeutralToneMapping
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFShadowMap
    this.renderer.domElement.className = 'absolute inset-0 size-full touch-none'
    container.appendChild(this.renderer.domElement)

    const pmrem = new THREE.PMREMGenerator(this.renderer)
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    this.scene.environmentIntensity = 0.75
    pmrem.dispose()

    this.anchor.matrixAutoUpdate = false
    this.anchor.visible = false
    this.stage.rotation.x = Math.PI / 2
    this.anchor.add(this.stage)
    this.scene.add(this.anchor)

    const sun = new THREE.DirectionalLight('#fff6e8', 2.1)
    sun.position.set(0.35, 1.2, 0.55)
    sun.castShadow = true
    sun.shadow.mapSize.set(1024, 1024)
    sun.shadow.radius = 4
    sun.shadow.bias = -0.0004
    sun.shadow.normalBias = 0.004
    Object.assign(sun.shadow.camera, { left: -0.7, right: 0.7, top: 0.7, bottom: -0.7, near: 0.1, far: 3 })
    this.stage.add(sun, sun.target)
    this.stage.add(new THREE.HemisphereLight('#fffaf0', '#8a7a66', 0.6))

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(1, CARD_RATIO), new THREE.ShadowMaterial({ opacity: 0.32 }))
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    this.stage.add(floor)

    this.ring = new THREE.Mesh(
      new THREE.RingGeometry(0.86, 1, 48),
      new THREE.MeshBasicMaterial({ color: '#FFC800', transparent: true, opacity: 0.95, depthWrite: false, toneMapped: false }),
    )
    this.ring.rotation.x = -Math.PI / 2
    this.ring.visible = false
    this.stage.add(this.ring)

    this.renderer.domElement.addEventListener('pointerup', this.onPointer)
    window.addEventListener('resize', this.resize)
  }

  async start() {
    const [mind] = await Promise.all([
      import(/* @vite-ignore */ new URL(MINDAR_URL, window.location.origin).href) as Promise<MindModule>,
      this.openCamera(),
      this.loadModels(),
    ])
    if (this.stopped || !this.video) return
    const video = this.video
    const controller = new mind.Controller({
      inputWidth: video.videoWidth,
      inputHeight: video.videoHeight,
      filterMinCF: 0.0001,
      filterBeta: 0.004,
      warmupTolerance: 3,
      missTolerance: 12,
      onUpdate: (data) => {
        if (data.type !== 'updateMatrix') return
        this.track(data.worldMatrix ?? null)
      },
    })
    this.controller = controller
    const { dimensions } = await controller.addImageTargets(this.challenge.target)
    const [w, h] = dimensions[0]
    this.postMatrix.compose(new THREE.Vector3(w / 2, h / 2, 0), new THREE.Quaternion(), new THREE.Vector3(w, w, w))
    this.unit.makeScale(1 / w, 1 / w, 1 / w)
    this.scale = 1 / w
    this.resize()
    await controller.dummyRun(video)
    if (this.stopped) return
    controller.processVideo(video)
    this.frame = requestAnimationFrame(this.loop)
  }

  stop() {
    this.stopped = true
    cancelAnimationFrame(this.frame)
    this.controller?.stopProcessVideo()
    this.controller?.dispose()
    this.stream?.getTracks().forEach((t) => t.stop())
    this.renderer.domElement.removeEventListener('pointerup', this.onPointer)
    window.removeEventListener('resize', this.resize)
    this.scene.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose()
        for (const m of [o.material].flat()) m.dispose()
      }
    })
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }

  select(id: string | null) {
    this.selected = this.pieces.find((p) => p.id === id && !p.done) ?? null
    this.ring.visible = !!this.selected
    if (!this.selected) return
    const { root, radius } = this.selected
    this.ring.position.set(root.position.x, 0.002, root.position.z)
    this.ring.scale.setScalar(radius)
  }

  async recycle(id: string) {
    const piece = this.take(id)
    if (!piece || !this.bin) return
    const { root } = piece
    const from = root.position.clone()
    const top = this.bin.userData.top as number
    const to = new THREE.Vector3(this.bin.position.x, top + 0.06, this.bin.position.z)
    const startScale = root.scale.x
    const spin = root.rotation.y
    void this.tween(260, easeOut, (t) => this.lid && (this.lid.rotation.x = -1.35 * t))
    await this.tween(700, easeInOut, (t) => {
      root.position.lerpVectors(from, to, t)
      root.position.y += Math.sin(t * Math.PI) * 0.16
      root.rotation.y = spin + t * Math.PI * 1.5
      root.scale.setScalar(startScale * (1 - 0.35 * t))
    })
    await this.tween(220, easeOut, (t) => {
      root.position.y = to.y - t * 0.2
      root.scale.setScalar(startScale * 0.65 * (1 - 0.6 * t))
    })
    root.visible = false
    await this.tween(420, bounce, (t) => this.lid && (this.lid.rotation.x = -1.35 * (1 - t)))
  }

  async reject(id: string) {
    const piece = this.take(id)
    if (!piece) return
    const { root } = piece
    const turn = root.rotation.y
    await this.tween(
      520,
      (t) => t,
      (t) => (root.rotation.y = turn + Math.sin(t * Math.PI * 6) * 0.3 * (1 - t)),
    )
    root.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return
      for (const m of [o.material].flat()) {
        m.transparent = true
        m.depthWrite = false
      }
      o.castShadow = false
    })
    await this.tween(400, easeOut, (t) =>
      root.traverse((o) => {
        if (o instanceof THREE.Mesh) for (const m of [o.material].flat()) m.opacity = 1 - 0.7 * t
      }),
    )
  }

  async shake(id: string) {
    const piece = this.pieces.find((p) => p.id === id)
    if (!piece) return
    const { root } = piece
    const x = root.position.x
    await this.tween(
      360,
      (t) => t,
      (t) => (root.position.x = x + Math.sin(t * Math.PI * 5) * 0.012 * (1 - t)),
    )
    root.position.x = x
  }

  private take(id: string) {
    const piece = this.pieces.find((p) => p.id === id && !p.done)
    if (!piece) return null
    piece.done = true
    if (this.selected === piece) this.select(null)
    return piece
  }

  private async openCamera() {
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
    })
    const video = document.createElement('video')
    video.setAttribute('playsinline', '')
    video.muted = true
    video.srcObject = this.stream
    await video.play()
    if (!video.videoWidth) await new Promise((resolve) => video.addEventListener('loadedmetadata', resolve, { once: true }))
    video.width = video.videoWidth
    video.height = video.videoHeight
    this.video = video
    const texture = new THREE.VideoTexture(video)
    texture.colorSpace = THREE.SRGBColorSpace
    this.scene.background = texture
  }

  private async loadModels() {
    const loader = new GLTFLoader()
    const load = async (place: ArPlacement, id: string) => {
      const gltf = await loader.loadAsync(place.model)
      const inner = gltf.scene
      inner.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.castShadow = true
          o.receiveShadow = true
        }
      })
      if (place.lying) {
        inner.rotation.z = Math.PI / 2
        inner.position.y = place.lying
      }
      const root = new THREE.Group()
      root.add(inner)
      root.userData.id = id
      root.position.set(place.x, 0, place.z)
      root.rotation.y = place.turn
      root.scale.setScalar(place.scale)
      const box = new THREE.Box3().setFromObject(root)
      root.userData.top = box.max.y
      root.userData.radius = Math.max(box.max.x - box.min.x, box.max.z - box.min.z) / 2 + 0.015
      root.visible = false
      this.stage.add(root)
      return root
    }
    const [bin, ...roots] = await Promise.all([load(this.challenge.bin, 'bin'), ...this.challenge.items.map((item) => load(item, item.id))])
    this.bin = bin
    this.lid = bin.getObjectByName('lid') ?? null
    roots.forEach((root, i) => this.pieces.push({ id: this.challenge.items[i].id, root, radius: root.userData.radius as number, done: false }))
  }

  private track(matrix: number[] | null) {
    if (!matrix) {
      this.anchor.visible = false
      if (this.found) this.events.onTracking((this.found = false))
      return
    }
    this.anchor.matrix.fromArray(matrix).premultiply(this.unit).multiply(this.postMatrix)
    this.anchor.visible = true
    if (!this.found) this.events.onTracking((this.found = true))
    if (!this.shown) {
      this.shown = true
      this.reveal()
    }
  }

  private reveal() {
    if (this.bin) {
      const bin = this.bin
      const s = this.challenge.bin.scale
      bin.visible = true
      bin.scale.setScalar(0.001)
      void this.tween(620, easeBack, (t) => bin.scale.setScalar(Math.max(0.001, s * t)))
    }
    this.pieces.forEach((piece, i) => {
      const { root } = piece
      void wait(160 + i * 90).then(() => {
        root.visible = true
        return this.tween(700, bounce, (t) => (root.position.y = 0.32 * (1 - t)))
      })
    })
  }

  private tween(duration: number, ease: Ease, update: (t: number) => unknown) {
    return new Promise<void>((resolve) => {
      const start = performance.now()
      this.tweens.add((now) => {
        const t = Math.min(1, (now - start) / duration)
        update(ease(t))
        if (t >= 1) resolve()
        return t >= 1
      })
    })
  }

  private readonly loop = (now: number) => {
    this.frame = requestAnimationFrame(this.loop)
    for (const step of this.tweens) if (step(now)) this.tweens.delete(step)
    if (this.ring.visible) {
      const pulse = 1 + Math.sin(now / 160) * 0.06
      this.ring.scale.setScalar((this.selected?.radius ?? 0.05) * pulse)
    }
    this.renderer.render(this.scene, this.camera)
  }

  private readonly onPointer = (e: PointerEvent) => {
    if (!this.anchor.visible) return
    const rect = this.renderer.domElement.getBoundingClientRect()
    const ndc = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1)
    this.raycaster.setFromCamera(ndc, this.camera)
    const targets = this.pieces.filter((p) => !p.done && p.root.visible).map((p) => p.root)
    const hit = this.raycaster.intersectObjects(targets, true)[0]
    let node: THREE.Object3D | null = hit?.object ?? null
    while (node && !node.userData.id) node = node.parent
    if (node) this.events.onPick(node.userData.id as string)
  }

  private readonly resize = () => {
    const { container, video, controller, camera } = this
    const width = container.clientWidth
    const height = container.clientHeight
    this.renderer.setSize(width, height, false)
    if (!video || !controller) return
    const videoRatio = video.videoWidth / video.videoHeight
    const containerRatio = width / height
    const texture = this.scene.background as THREE.Texture
    if (videoRatio > containerRatio) {
      texture.repeat.set(containerRatio / videoRatio, 1)
      texture.offset.set((1 - texture.repeat.x) / 2, 0)
    } else {
      texture.repeat.set(1, videoRatio / containerRatio)
      texture.offset.set(0, (1 - texture.repeat.y) / 2)
    }
    const proj = controller.getProjectionMatrix()
    const displayHeight = videoRatio > containerRatio ? height : width / videoRatio
    const fovAdjust = height / displayHeight
    camera.fov = (2 * Math.atan((1 / proj[5]) * fovAdjust) * 180) / Math.PI
    camera.near = (proj[14] / (proj[10] - 1)) * this.scale
    camera.far = (proj[14] / (proj[10] + 1)) * this.scale
    camera.aspect = containerRatio
    camera.updateProjectionMatrix()
  }
}
