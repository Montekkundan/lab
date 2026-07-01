'use client'

import { Html, OrbitControls } from '@react-three/drei'
import { ThreeEvent, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'

import { R3FCanvasLayout, R3FCanvasLayoutProps } from '@/components/layouts/r3f-layput'
import causticsFragmentShader from './shaders/caustics/fragment.glsl'
import causticsVertexShader from './shaders/caustics/vertex.glsl'
import poolFragmentShader from './shaders/pool/fragment.glsl'
import poolVertexShader from './shaders/pool/vertex.glsl'
import simulationDropFragmentShader from './shaders/simulation/drop_fragment.glsl'
import simulationNormalFragmentShader from './shaders/simulation/normal_fragment.glsl'
import simulationUpdateFragmentShader from './shaders/simulation/update_fragment.glsl'
import simulationVertexShader from './shaders/simulation/vertex.glsl'
import utilsShader from './shaders/utils.glsl'
import waterFragmentShader from './shaders/water/fragment.glsl'
import waterVertexShader from './shaders/water/vertex.glsl'
import styles from './threejs-water.module.css'

const ASSET_ROOT = '/experiments/threejs-water'
const BLACK = new THREE.Color('black')
const WATER_CLEAR = new THREE.Color(0x020a0c)
const LIGHT = new THREE.Vector3(0.755928946, 0.755928946, -0.377964473)
const WATER_TEXTURE_SIZE = 256
const INITIAL_DROP_SOURCE = { x: -0.28, y: 0.16 }
const RING_MEASUREMENT_OFFSETS = [
  { offset: new THREE.Vector2(-0.006, -0.009), radius: 0.28 },
  { offset: new THREE.Vector2(0.007, -0.002), radius: 0.52 },
  { offset: new THREE.Vector2(0.003, -0.004), radius: 0.76 },
]
const IMPACT_TIME = 1
const OBSERVATION_TIME = 15
const PLAYBACK_SPEED = 2.2
const SIMULATION_STEPS_PER_SECOND = 60
const RIPPLE_FRONT_SPEED = 0.13
const RIPPLE_SETTLED_RATIO = 0.01
const MEASUREMENT_VISIBLE_DURATION = 3
const POOL_CORNERS = [
  new THREE.Vector2(-1, -1),
  new THREE.Vector2(-1, 1),
  new THREE.Vector2(1, -1),
  new THREE.Vector2(1, 1),
]
const STONE_START_Y = 1.14
const STONE_CONTACT_Y = 0.055
const STONE_SETTLED_Y = -0.72
const STONE_SINK_DURATION = 1.1
const CAMERA_MIN_DISTANCE = 1.35
const CAMERA_MAX_DISTANCE = 4.25
const withUtils = (source: string) => source.replace('#include <utils>', utilsShader)

const EFFECTS = [
  { key: 'damping', label: 'Damping' },
  { key: 'wind', label: 'Wind' },
  { key: 'reflections', label: 'Reflections' },
  { key: 'unevenDepth', label: 'Uneven depth' },
  { key: 'dispersive', label: 'Dispersive' },
  { key: 'noise', label: 'Noise' },
  { key: 'nonlinear', label: 'Nonlinear' },
] as const

type SourcePoint = {
  x: number
  y: number
}

type EffectKey = (typeof EFFECTS)[number]['key']

type EffectState = Record<EffectKey, boolean>

type RippleSampleRing = {
  points: THREE.Vector2[]
}

type FittedRing = {
  center: THREE.Vector2
  radius: number
}

type RippleFit = {
  source: THREE.Vector2
  rings: FittedRing[]
}

type SimulationSettings = {
  damping: number
  wind: THREE.Vector2
  depthStrength: number
  dispersion: number
  noiseStrength: number
  nonlinearStrength: number
  boundaryLoss: number
}

const DEFAULT_EFFECTS = EFFECTS.reduce((state, effect) => {
  state[effect.key] = false
  return state
}, {} as EffectState)

function toVector2(point: SourcePoint) {
  return new THREE.Vector2(point.x, point.y)
}

function getNoiseOffset(index: number, sampleIndex: number, source: SourcePoint) {
  const seed = Math.sin((source.x * 37.2 + source.y * 51.7 + index * 13.1 + sampleIndex * 4.3) * 91.7)
  const nextSeed = Math.sin((source.x * 17.9 - source.y * 44.4 + index * 19.3 - sampleIndex * 7.1) * 57.3)
  return new THREE.Vector2(seed, nextSeed)
}

function getMeasuredRippleSamples(source: SourcePoint, effects: EffectState): RippleSampleRing[] {
  return RING_MEASUREMENT_OFFSETS.map(({ offset, radius }, index) => {
    const simulatedCenter = toVector2(source).add(offset)
    let measuredRadius = radius

    if (effects.wind) simulatedCenter.add(new THREE.Vector2(0.026 + index * 0.025, -0.012 - index * 0.009))
    if (effects.unevenDepth) {
      simulatedCenter.add(new THREE.Vector2(Math.sin(index + source.y) * 0.025, Math.cos(index + source.x) * 0.018))
    }
    if (effects.reflections && index === 2) simulatedCenter.add(new THREE.Vector2(-0.038, 0.032))
    if (effects.dispersive) measuredRadius += index * 0.018
    if (effects.nonlinear) measuredRadius += Math.sin(index + 0.7) * 0.012

    return {
      points: Array.from({ length: 18 }, (_, sampleIndex) => {
        const angle = (sampleIndex / 18) * Math.PI * 2
        const windStretch = effects.wind ? 1 + Math.cos(angle) * 0.055 : 1
        const depthWarp = effects.unevenDepth ? Math.sin(angle * 2 + index) * 0.018 : 0
        const reflectionWarp = effects.reflections && sampleIndex > 10 ? Math.sin(sampleIndex) * 0.022 : 0
        const nonlinearWarp = effects.nonlinear ? Math.max(0, Math.cos(angle - 0.9)) * 0.02 : 0
        const radiusAtSample = measuredRadius * windStretch + depthWarp + reflectionWarp + nonlinearWarp
        const sample = new THREE.Vector2(
          simulatedCenter.x + Math.cos(angle) * radiusAtSample,
          simulatedCenter.y + Math.sin(angle) * radiusAtSample
        )

        if (effects.noise) sample.add(getNoiseOffset(index, sampleIndex, source).multiplyScalar(0.012))

        return sample
      }),
    }
  })
}

function fitCircleToPoints(points: THREE.Vector2[]): FittedRing {
  const center = points.reduce((sum, point) => sum.add(point), new THREE.Vector2()).divideScalar(points.length)

  for (let iteration = 0; iteration < 8; iteration += 1) {
    let radius = 0
    points.forEach((point) => {
      radius += point.distanceTo(center)
    })
    radius /= points.length

    const correction = new THREE.Vector2()
    points.forEach((point) => {
      const delta = new THREE.Vector2().subVectors(point, center)
      const distance = Math.max(delta.length(), 0.0001)
      correction.add(delta.multiplyScalar((distance - radius) / distance))
    })
    center.add(correction.multiplyScalar(0.18 / points.length))
  }

  const radius = points.reduce((total, point) => total + point.distanceTo(center), 0) / points.length

  return { center, radius }
}

function calculateRippleFit(sampleRings: RippleSampleRing[]): RippleFit {
  const rings = sampleRings.map((ring) => fitCircleToPoints(ring.points))
  const source = rings.reduce((origin, ring) => origin.add(ring.center), new THREE.Vector2()).divideScalar(rings.length)

  return { source, rings }
}

function getSimulationSettings(effects: EffectState): SimulationSettings {
  return {
    damping: effects.damping ? 0.982 : 0.989,
    wind: effects.wind ? new THREE.Vector2(0.85, -0.34) : new THREE.Vector2(0, 0),
    depthStrength: effects.unevenDepth ? 1 : 0,
    dispersion: effects.dispersive ? 0.45 : 0,
    noiseStrength: effects.noise ? 1 : 0,
    nonlinearStrength: effects.nonlinear ? 1 : 0,
    boundaryLoss: effects.reflections ? 0.004 : 0.06,
  }
}

function calculateRippleEndTime(source: SourcePoint, effects: EffectState) {
  const sourceVector = toVector2(source)
  const farthestCornerDistance = Math.max(...POOL_CORNERS.map((corner) => corner.distanceTo(sourceVector)))
  const travelTime = farthestCornerDistance / RIPPLE_FRONT_SPEED
  const dampingTail =
    Math.log(RIPPLE_SETTLED_RATIO) / Math.log(getSimulationSettings(effects).damping) / SIMULATION_STEPS_PER_SECOND
  const effectTail =
    (effects.reflections ? 7 : 0) +
    (effects.dispersive ? 4 : 0) +
    (effects.unevenDepth ? 3 : 0) +
    (effects.nonlinear ? 3 : 0) +
    (effects.noise ? 2 : 0)

  return Math.ceil(IMPACT_TIME + travelTime + dampingTail + effectTail)
}

function getEffectSignature(effects: EffectState) {
  return EFFECTS.map((effect) => `${effect.key}:${effects[effect.key] ? 1 : 0}`).join('|')
}

function getSimulationStepForTime(time: number) {
  if (time < IMPACT_TIME) return -1
  return Math.max(0, Math.round((time - IMPACT_TIME) * SIMULATION_STEPS_PER_SECOND))
}

function getMeasurementRingVisibility(time: number, fitProgress: number) {
  if (fitProgress > 0) return 0.18 + fitProgress * 0.24

  const propagationVisibility = Math.max(0, (time - 3) / 16) * 0.12

  if (time < OBSERVATION_TIME) return propagationVisibility

  const measurementFade = 1 - THREE.MathUtils.clamp((time - OBSERVATION_TIME) / MEASUREMENT_VISIBLE_DURATION, 0, 1)
  return 0.22 * measurementFade
}

function getPhaseForTime(time: number, endTime: number) {
  if (time <= 0) return 'still pond'
  if (time < IMPACT_TIME) return 'stone falling'
  if (time < OBSERVATION_TIME) return 'ripples propagating'
  if (time < endTime) return 'measured snapshot'
  return 'still water'
}

function getStoneHeight(time: number) {
  if (time <= IMPACT_TIME) {
    const fallProgress = Math.min(time / IMPACT_TIME, 1)
    const easedFall = fallProgress * fallProgress
    return THREE.MathUtils.lerp(STONE_START_Y, STONE_CONTACT_Y, easedFall)
  }

  const sinkProgress = Math.min((time - IMPACT_TIME) / STONE_SINK_DURATION, 1)
  const easedSink = 1 - (1 - sinkProgress) * (1 - sinkProgress)
  return THREE.MathUtils.lerp(STONE_CONTACT_Y, STONE_SETTLED_Y, easedSink)
}

type WaterExperimentComponent = React.FC & {
  Layout?: React.FC<R3FCanvasLayoutProps>
  Title?: string
  Description?: React.ReactNode
  Tags?: string[]
  background?: 'none'
  bg?: string
}

class WaterSimulation {
  private camera = new THREE.OrthographicCamera(0, 1, 1, 0, 0, 2000)
  private geometry = new THREE.PlaneGeometry(2, 2)
  private textureA = new THREE.WebGLRenderTarget(WATER_TEXTURE_SIZE, WATER_TEXTURE_SIZE, {
    type: THREE.FloatType,
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    depthBuffer: false,
    stencilBuffer: false,
  })
  private textureB = new THREE.WebGLRenderTarget(WATER_TEXTURE_SIZE, WATER_TEXTURE_SIZE, {
    type: THREE.FloatType,
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    depthBuffer: false,
    stencilBuffer: false,
  })
  private dropMesh: THREE.Mesh<THREE.PlaneGeometry, THREE.RawShaderMaterial>
  private normalMesh: THREE.Mesh<THREE.PlaneGeometry, THREE.RawShaderMaterial>
  private updateMesh: THREE.Mesh<THREE.PlaneGeometry, THREE.RawShaderMaterial>

  texture = this.textureA

  constructor() {
    const dropMaterial = new THREE.RawShaderMaterial({
      uniforms: {
        center: { value: new THREE.Vector2(0, 0) },
        radius: { value: 0 },
        strength: { value: 0 },
        texture: { value: null },
      },
      vertexShader: simulationVertexShader,
      fragmentShader: simulationDropFragmentShader,
    })

    const normalMaterial = new THREE.RawShaderMaterial({
      uniforms: {
        delta: { value: new THREE.Vector2(1 / WATER_TEXTURE_SIZE, 1 / WATER_TEXTURE_SIZE) },
        texture: { value: null },
      },
      vertexShader: simulationVertexShader,
      fragmentShader: simulationNormalFragmentShader,
    })

    const updateMaterial = new THREE.RawShaderMaterial({
      uniforms: {
        boundaryLoss: { value: 0.06 },
        damping: { value: 0.989 },
        delta: { value: new THREE.Vector2(1 / WATER_TEXTURE_SIZE, 1 / WATER_TEXTURE_SIZE) },
        depthStrength: { value: 0 },
        dispersion: { value: 0 },
        noiseStrength: { value: 0 },
        nonlinearStrength: { value: 0 },
        texture: { value: null },
        time: { value: 0 },
        wind: { value: new THREE.Vector2(0, 0) },
      },
      vertexShader: simulationVertexShader,
      fragmentShader: simulationUpdateFragmentShader,
    })

    this.dropMesh = new THREE.Mesh(this.geometry, dropMaterial)
    this.normalMesh = new THREE.Mesh(this.geometry, normalMaterial)
    this.updateMesh = new THREE.Mesh(this.geometry, updateMaterial)
  }

  addDrop(renderer: THREE.WebGLRenderer, x: number, y: number, radius: number, strength: number) {
    this.dropMesh.material.uniforms.center.value.set(x, y)
    this.dropMesh.material.uniforms.radius.value = radius
    this.dropMesh.material.uniforms.strength.value = strength
    this.render(renderer, this.dropMesh)
  }

  clear(renderer: THREE.WebGLRenderer) {
    const previousTarget = renderer.getRenderTarget()
    const previousColor = new THREE.Color()
    renderer.getClearColor(previousColor)
    const previousAlpha = renderer.getClearAlpha()

    renderer.setClearColor(BLACK, 0)
    renderer.setRenderTarget(this.textureA)
    renderer.clear(true, true, true)
    renderer.setRenderTarget(this.textureB)
    renderer.clear(true, true, true)
    renderer.setRenderTarget(previousTarget)
    renderer.setClearColor(previousColor, previousAlpha)
    this.texture = this.textureA
  }

  step(renderer: THREE.WebGLRenderer, settings: SimulationSettings, time: number) {
    this.updateMesh.material.uniforms.boundaryLoss.value = settings.boundaryLoss
    this.updateMesh.material.uniforms.damping.value = settings.damping
    this.updateMesh.material.uniforms.depthStrength.value = settings.depthStrength
    this.updateMesh.material.uniforms.dispersion.value = settings.dispersion
    this.updateMesh.material.uniforms.noiseStrength.value = settings.noiseStrength
    this.updateMesh.material.uniforms.nonlinearStrength.value = settings.nonlinearStrength
    this.updateMesh.material.uniforms.time.value = time
    this.updateMesh.material.uniforms.wind.value.copy(settings.wind)
    this.render(renderer, this.updateMesh)
  }

  updateNormals(renderer: THREE.WebGLRenderer) {
    this.render(renderer, this.normalMesh)
  }

  dispose() {
    this.geometry.dispose()
    this.textureA.dispose()
    this.textureB.dispose()
    this.dropMesh.material.dispose()
    this.normalMesh.material.dispose()
    this.updateMesh.material.dispose()
  }

  private render(renderer: THREE.WebGLRenderer, mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.RawShaderMaterial>) {
    const oldTexture = this.texture
    const newTexture = this.texture === this.textureA ? this.textureB : this.textureA

    mesh.material.uniforms.texture.value = oldTexture.texture
    renderer.setRenderTarget(newTexture)
    renderer.render(mesh, this.camera)
    this.texture = newTexture
  }
}

class Caustics {
  private camera = new THREE.OrthographicCamera(0, 1, 1, 0, 0, 2000)
  private mesh: THREE.Mesh<THREE.BufferGeometry, THREE.RawShaderMaterial>

  texture = new THREE.WebGLRenderTarget(1024, 1024, {
    type: THREE.UnsignedByteType,
    depthBuffer: false,
    stencilBuffer: false,
  })

  constructor(lightFrontGeometry: THREE.BufferGeometry) {
    const material = new THREE.RawShaderMaterial({
      uniforms: {
        light: { value: LIGHT },
        water: { value: null },
      },
      vertexShader: withUtils(causticsVertexShader),
      fragmentShader: withUtils(causticsFragmentShader),
    })

    this.mesh = new THREE.Mesh(lightFrontGeometry, material)
  }

  update(renderer: THREE.WebGLRenderer, waterTexture: THREE.Texture) {
    this.mesh.material.uniforms.water.value = waterTexture
    renderer.setRenderTarget(this.texture)
    renderer.setClearColor(BLACK, 0)
    renderer.clear()
    renderer.render(this.mesh, this.camera)
  }

  dispose() {
    this.texture.dispose()
    this.mesh.material.dispose()
  }
}

class WaterSurface {
  geometry = new THREE.PlaneGeometry(2, 2, 200, 200)
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.RawShaderMaterial>

  constructor(tiles: THREE.Texture, sky: THREE.CubeTexture) {
    const material = new THREE.RawShaderMaterial({
      uniforms: {
        light: { value: LIGHT },
        tiles: { value: tiles },
        sky: { value: sky },
        water: { value: null },
        causticTex: { value: null },
        underwater: { value: 0 },
      },
      vertexShader: withUtils(waterVertexShader),
      fragmentShader: withUtils(waterFragmentShader),
    })

    this.mesh = new THREE.Mesh(this.geometry, material)
    material.transparent = true
    material.depthWrite = false
  }

  draw(renderer: THREE.WebGLRenderer, camera: THREE.Camera, waterTexture: THREE.Texture, causticsTexture: THREE.Texture) {
    this.mesh.material.uniforms.water.value = waterTexture
    this.mesh.material.uniforms.causticTex.value = causticsTexture

    this.mesh.material.side = THREE.FrontSide
    this.mesh.material.uniforms.underwater.value = 1
    renderer.render(this.mesh, camera)

    this.mesh.material.side = THREE.BackSide
    this.mesh.material.uniforms.underwater.value = 0
    renderer.render(this.mesh, camera)
  }

  dispose() {
    this.geometry.dispose()
    this.mesh.material.dispose()
  }
}

class Pool {
  private geometry = new THREE.BufferGeometry()
  private mesh: THREE.Mesh<THREE.BufferGeometry, THREE.RawShaderMaterial>

  constructor(tiles: THREE.Texture) {
    const vertices = new Float32Array([
      -1, -1, -1, -1, -1, 1, -1, 1, -1, -1, 1, 1,
      1, -1, -1, 1, 1, -1, 1, -1, 1, 1, 1, 1,
      -1, -1, -1, 1, -1, -1, -1, -1, 1, 1, -1, 1,
      -1, 1, -1, -1, 1, 1, 1, 1, -1, 1, 1, 1,
      -1, -1, -1, -1, 1, -1, 1, -1, -1, 1, 1, -1,
      -1, -1, 1, 1, -1, 1, -1, 1, 1, 1, 1, 1,
    ])
    const indices = new Uint32Array([
      0, 1, 2, 2, 1, 3,
      4, 5, 6, 6, 5, 7,
      12, 13, 14, 14, 13, 15,
      16, 17, 18, 18, 17, 19,
      20, 21, 22, 22, 21, 23,
    ])

    this.geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
    this.geometry.setIndex(new THREE.BufferAttribute(indices, 1))

    const material = new THREE.RawShaderMaterial({
      uniforms: {
        light: { value: LIGHT },
        tiles: { value: tiles },
        water: { value: null },
        causticTex: { value: null },
      },
      vertexShader: withUtils(poolVertexShader),
      fragmentShader: withUtils(poolFragmentShader),
      side: THREE.FrontSide,
    })

    this.mesh = new THREE.Mesh(this.geometry, material)
  }

  draw(renderer: THREE.WebGLRenderer, camera: THREE.Camera, waterTexture: THREE.Texture, causticsTexture: THREE.Texture) {
    this.mesh.material.uniforms.water.value = waterTexture
    this.mesh.material.uniforms.causticTex.value = causticsTexture
    renderer.render(this.mesh, camera)
  }

  dispose() {
    this.geometry.dispose()
    this.mesh.material.dispose()
  }
}

function createCircleLine(radius: number, color: number, opacity: number) {
  const points = Array.from({ length: 144 }, (_, index) => {
    const angle = (index / 144) * Math.PI * 2
    return new THREE.Vector3(Math.cos(angle) * radius, 0.026, Math.sin(angle) * radius)
  })
  const geometry = new THREE.BufferGeometry().setFromPoints(points)
  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    depthTest: false,
  })

  return new THREE.LineLoop(geometry, material)
}

function createFitGuides() {
  const vertices = new Float32Array(RING_MEASUREMENT_OFFSETS.length * 4 * 2 * 3)

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))

  const material = new THREE.LineBasicMaterial({
    color: 0xffc857,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    depthTest: false,
  })

  return new THREE.LineSegments(geometry, material)
}

function updateFitGuides(line: THREE.LineSegments, fittedRings: FittedRing[], estimatedSource: THREE.Vector2) {
  const positions = line.geometry.getAttribute('position') as THREE.BufferAttribute
  let pointIndex = 0

  fittedRings.forEach(({ center, radius }, ringIndex) => {
    for (let index = 0; index < 4; index += 1) {
      const angle = ((index / 4) + ringIndex * 0.08) * Math.PI * 2
      positions.setXYZ(pointIndex, center.x + Math.cos(angle) * radius, 0.034, center.y + Math.sin(angle) * radius)
      positions.setXYZ(pointIndex + 1, estimatedSource.x, 0.034, estimatedSource.y)
      pointIndex += 2
    }
  })

  positions.needsUpdate = true
}

function setLineOpacity(line: THREE.LineLoop | THREE.LineSegments, opacity: number) {
  const material = line.material as THREE.LineBasicMaterial
  material.opacity = opacity
}

function createInferenceScene(sky: THREE.CubeTexture) {
  const scene = new THREE.Scene()

  const stone = new THREE.Mesh(
    new THREE.SphereGeometry(0.075, 36, 18),
    new THREE.MeshPhysicalMaterial({
      color: 0xf4f7f8,
      roughness: 0.42,
      metalness: 0,
      envMap: sky,
      envMapIntensity: 0.34,
    })
  )
  stone.position.set(INITIAL_DROP_SOURCE.x, STONE_START_Y, INITIAL_DROP_SOURCE.y)
  scene.add(stone)

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.12, 48),
    new THREE.MeshBasicMaterial({
      color: 0x001317,
      transparent: true,
      opacity: 0.34,
      depthWrite: false,
    })
  )
  shadow.rotation.x = -Math.PI / 2
  shadow.position.set(INITIAL_DROP_SOURCE.x, -0.995, INITIAL_DROP_SOURCE.y)
  shadow.scale.set(1.25, 0.68, 1)
  scene.add(shadow)

  const measuredRings = RING_MEASUREMENT_OFFSETS.map(({ radius }) => createCircleLine(radius, 0x5eead4, 0))
  measuredRings.forEach((ring) => {
    scene.add(ring)
  })

  const fitGuides = createFitGuides()
  scene.add(fitGuides)

  const estimate = createCircleLine(0.06, 0xffc857, 0)
  scene.add(estimate)

  const actual = createCircleLine(0.035, 0xff5757, 0)
  scene.add(actual)

  scene.add(new THREE.AmbientLight(0x7fe8ff, 0.82))

  const key = new THREE.DirectionalLight(0xffffff, 2.5)
  key.position.set(0.8, 1.4, -0.6)
  scene.add(key)

  return { scene, stone, shadow, measuredRings, fitGuides, estimate, actual }
}

function createWaterResources() {
  const textureLoader = new THREE.TextureLoader()
  const tiles = textureLoader.load(`${ASSET_ROOT}/tiles.jpg`)
  tiles.wrapS = THREE.RepeatWrapping
  tiles.wrapT = THREE.RepeatWrapping
  tiles.colorSpace = THREE.SRGBColorSpace

  const sky = new THREE.CubeTextureLoader().load([
    `${ASSET_ROOT}/xpos.jpg`,
    `${ASSET_ROOT}/xneg.jpg`,
    `${ASSET_ROOT}/ypos.jpg`,
    `${ASSET_ROOT}/ypos.jpg`,
    `${ASSET_ROOT}/zpos.jpg`,
    `${ASSET_ROOT}/zneg.jpg`,
  ])
  sky.colorSpace = THREE.SRGBColorSpace

  const waterSimulation = new WaterSimulation()
  const water = new WaterSurface(tiles, sky)
  const caustics = new Caustics(water.geometry)
  const pool = new Pool(tiles)
  const inference = createInferenceScene(sky)

  return {
    waterSimulation,
    water,
    caustics,
    pool,
    inference,
    tiles,
    sky,
    dispose: () => {
      waterSimulation.dispose()
      caustics.dispose()
      water.dispose()
      pool.dispose()
      inference.stone.geometry.dispose()
      inference.stone.material.dispose()
      inference.shadow.geometry.dispose()
      inference.shadow.material.dispose()
      inference.measuredRings.forEach((ring) => {
        ring.geometry.dispose()
        ring.material.dispose()
      })
      inference.fitGuides.geometry.dispose()
      inference.fitGuides.material.dispose()
      inference.estimate.geometry.dispose()
      inference.estimate.material.dispose()
      inference.actual.geometry.dispose()
      inference.actual.material.dispose()
      tiles.dispose()
      sky.dispose()
    },
  }
}

function configureCamera(camera: THREE.Camera) {
  if (camera instanceof THREE.PerspectiveCamera) {
    camera.fov = 75
    camera.near = 0.01
    camera.far = 100
    camera.position.set(0.42, 0.76, -2.72)
    camera.lookAt(0, -0.24, 0)
    camera.updateProjectionMatrix()
  }
}

function configureRenderer(renderer: THREE.WebGLRenderer) {
  renderer.autoClear = false
  renderer.setClearColor(WATER_CLEAR, 1)
}

function CameraSetup() {
  const camera = useThree((state) => state.camera)

  useEffect(() => {
    configureCamera(camera)
  }, [camera])

  return null
}

function InverseWaterScene({
  time,
  fitProgress,
  dropSource,
  rippleFit,
  simulationSettings,
  effectSignature,
  onMoveSource,
}: {
  time: number
  fitProgress: number
  dropSource: SourcePoint
  rippleFit: RippleFit
  simulationSettings: SimulationSettings
  effectSignature: string
  onMoveSource: (source: SourcePoint) => void
}) {
  const resources = useMemo(() => createWaterResources(), [])
  const gl = useThree((state) => state.gl)
  const camera = useThree((state) => state.camera)
  const impactDoneRef = useRef(false)
  const lastSimulatedTimeRef = useRef<number | null>(null)
  const lastSimulationStepRef = useRef(-1)
  const sourceKey = `${dropSource.x.toFixed(4)}:${dropSource.y.toFixed(4)}:${effectSignature}`
  const lastSourceKeyRef = useRef(sourceKey)
  const [isDraggingSource, setIsDraggingSource] = useState(false)

  useEffect(() => {
    configureRenderer(gl)
    resources.waterSimulation.clear(gl)
    resources.inference.stone.position.set(INITIAL_DROP_SOURCE.x, STONE_START_Y, INITIAL_DROP_SOURCE.y)

    return () => {
      resources.dispose()
    }
  }, [gl, resources])

  const addImpact = () => {
    resources.waterSimulation.addDrop(gl, dropSource.x, dropSource.y, 0.035, 0.14)
    resources.waterSimulation.addDrop(gl, dropSource.x + 0.012, dropSource.y - 0.008, 0.018, -0.045)
    impactDoneRef.current = true
  }

  const rebuildWaterToTime = (targetTime: number) => {
    resources.waterSimulation.clear(gl)
    impactDoneRef.current = false
    lastSimulationStepRef.current = -1

    if (targetTime >= IMPACT_TIME) {
      addImpact()
      const steps = getSimulationStepForTime(targetTime)
      for (let index = 0; index < steps; index += 1) {
        resources.waterSimulation.step(gl, simulationSettings, IMPACT_TIME + index / SIMULATION_STEPS_PER_SECOND)
      }
      resources.waterSimulation.updateNormals(gl)
      lastSimulationStepRef.current = steps
    }
  }

  useFrame(() => {
    const previousTime = lastSimulatedTimeRef.current
    const sourceChanged = lastSourceKeyRef.current !== sourceKey
    const needsFullRebuild =
      previousTime === null ||
      sourceChanged ||
      time < previousTime ||
      Math.abs(time - previousTime) > 0.75 ||
      (previousTime < IMPACT_TIME && time >= IMPACT_TIME)

    if (needsFullRebuild) {
      rebuildWaterToTime(time)
      lastSourceKeyRef.current = sourceKey
    } else if (time >= IMPACT_TIME && previousTime !== null) {
      if (!impactDoneRef.current) addImpact()
      const targetStep = getSimulationStepForTime(time)
      const stepCount = targetStep - lastSimulationStepRef.current

      if (stepCount > 0) {
        for (let index = 0; index < stepCount; index += 1) {
          resources.waterSimulation.step(
            gl,
            simulationSettings,
            IMPACT_TIME + (lastSimulationStepRef.current + index + 1) / SIMULATION_STEPS_PER_SECOND
          )
        }
        resources.waterSimulation.updateNormals(gl)
        lastSimulationStepRef.current = targetStep
      }
    }

    lastSimulatedTimeRef.current = time

    resources.inference.stone.position.set(dropSource.x, getStoneHeight(time), dropSource.y)
    resources.inference.shadow.position.set(dropSource.x, -0.995, dropSource.y)
    resources.inference.actual.position.set(dropSource.x, 0.004, dropSource.y)
    resources.inference.estimate.position.set(rippleFit.source.x, 0, rippleFit.source.y)

    rippleFit.rings.forEach((measurement, index) => {
      resources.inference.measuredRings[index].position.set(measurement.center.x, 0, measurement.center.y)
      const baseRadius = RING_MEASUREMENT_OFFSETS[index].radius
      resources.inference.measuredRings[index].scale.setScalar(measurement.radius / baseRadius)
    })
    updateFitGuides(resources.inference.fitGuides, rippleFit.rings, rippleFit.source)

    const ringVisibility = getMeasurementRingVisibility(time, fitProgress)
    resources.inference.measuredRings.forEach((ring, index) => {
      setLineOpacity(ring, ringVisibility * (1 - index * 0.08))
    })

    setLineOpacity(resources.inference.fitGuides, Math.sin(fitProgress * Math.PI) * 0.55 + (fitProgress >= 1 ? 0.14 : 0))
    setLineOpacity(resources.inference.estimate, fitProgress)
    resources.inference.estimate.scale.setScalar(0.3 + fitProgress * 0.7)
    setLineOpacity(resources.inference.actual, THREE.MathUtils.clamp((fitProgress - 0.72) / 0.28, 0, 1))

    const waterTexture = resources.waterSimulation.texture.texture
    resources.caustics.update(gl, waterTexture)

    gl.setRenderTarget(null)
    gl.setClearColor(WATER_CLEAR, 1)
    gl.clear()

    const causticsTexture = resources.caustics.texture.texture
    resources.pool.draw(gl, camera, waterTexture, causticsTexture)
    gl.render(resources.inference.scene, camera)
    resources.water.draw(gl, camera, waterTexture, causticsTexture)
    gl.render(resources.inference.scene, camera)
  }, 1)

  const updateSourceFromEvent = (event: ThreeEvent<PointerEvent>) => {
    onMoveSource({
      x: THREE.MathUtils.clamp(event.point.x, -0.92, 0.92),
      y: THREE.MathUtils.clamp(event.point.z, -0.92, 0.92),
    })
  }

  const handlePlacementPointerDown = (event: ThreeEvent<PointerEvent>) => {
    if (time > 0.001) return
    event.stopPropagation()
    if (event.target instanceof Element) event.target.setPointerCapture(event.pointerId)
    setIsDraggingSource(true)
    updateSourceFromEvent(event)
  }

  const handlePlacementPointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (!isDraggingSource) return
    event.stopPropagation()
    updateSourceFromEvent(event)
  }

  const handlePlacementPointerUp = (event: ThreeEvent<PointerEvent>) => {
    if (!isDraggingSource) return
    event.stopPropagation()
    if (event.target instanceof Element) event.target.releasePointerCapture(event.pointerId)
    setIsDraggingSource(false)
  }

  return (
    <>
      <CameraSetup />
      <mesh
        position={[0, 0.08, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerDown={handlePlacementPointerDown}
        onPointerMove={handlePlacementPointerMove}
        onPointerUp={handlePlacementPointerUp}
        onPointerCancel={handlePlacementPointerUp}
      >
        <planeGeometry args={[2, 2]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <OrbitControls
        enabled={!isDraggingSource}
        enableDamping
        dampingFactor={0.12}
        rotateSpeed={0.75}
        zoomSpeed={0.7}
        panSpeed={0.35}
        minDistance={CAMERA_MIN_DISTANCE}
        maxDistance={CAMERA_MAX_DISTANCE}
        target={[0, -0.24, 0]}
      />
    </>
  )
}

const ThreejsWater: WaterExperimentComponent = () => {
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [fitProgress, setFitProgress] = useState(0)
  const [fitRunId, setFitRunId] = useState(0)
  const [dropSource, setDropSource] = useState<SourcePoint>(INITIAL_DROP_SOURCE)
  const [effects, setEffects] = useState<EffectState>(DEFAULT_EFFECTS)
  const effectSignature = useMemo(() => getEffectSignature(effects), [effects])
  const simulationSettings = useMemo(() => getSimulationSettings(effects), [effects])
  const measuredRippleSamples = useMemo(() => getMeasuredRippleSamples(dropSource, effects), [dropSource, effects])
  const rippleFit = useMemo(() => calculateRippleFit(measuredRippleSamples), [measuredRippleSamples])
  const endTime = useMemo(() => calculateRippleEndTime(dropSource, effects), [dropSource, effects])
  const phase = getPhaseForTime(currentTime, endTime)
  const endTimeLabel = endTime.toFixed(0)
  const estimateError = rippleFit.source.distanceTo(toVector2(dropSource))
  const estimateLabel =
    fitProgress >= 1
      ? `(${rippleFit.source.x.toFixed(2)}, ${rippleFit.source.y.toFixed(2)})`
      : fitProgress > 0
        ? 'solving...'
        : 'not run'

  useEffect(() => {
    if (!isPlaying) return

    let animationFrame = 0
    let lastFrame = performance.now()

    const tick = (now: number) => {
      const deltaSeconds = (now - lastFrame) / 1000
      lastFrame = now

      setCurrentTime((time) => {
        const nextTime = Math.min(endTime, time + deltaSeconds * PLAYBACK_SPEED)
        if (nextTime >= endTime) setIsPlaying(false)
        return nextTime
      })

      animationFrame = requestAnimationFrame(tick)
    }

    animationFrame = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(animationFrame)
  }, [endTime, isPlaying])

  useEffect(() => {
    if (fitRunId === 0) return

    let animationFrame = 0
    const startedAt = performance.now()

    const tick = (now: number) => {
      const nextProgress = Math.min(1, (now - startedAt) / 1800)
      setFitProgress(nextProgress)
      if (nextProgress < 1) animationFrame = requestAnimationFrame(tick)
    }

    animationFrame = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(animationFrame)
  }, [fitRunId])

  const dropStone = () => {
    setCurrentTime(0)
    setFitProgress(0)
    setIsPlaying(true)
  }

  const togglePlayback = () => {
    setFitProgress(0)
    setIsPlaying((playing) => {
      if (playing) return false
      if (currentTime >= endTime) setCurrentTime(0)
      return true
    })
  }

  const resetTimeline = () => {
    setIsPlaying(false)
    setCurrentTime(0)
    setFitProgress(0)
  }

  const runFit = () => {
    setIsPlaying(false)
    setCurrentTime(OBSERVATION_TIME)
    setFitProgress(0)
    setFitRunId((runId) => runId + 1)
  }

  const scrubTimeline = (value: string) => {
    setIsPlaying(false)
    setFitProgress(0)
    setCurrentTime(Number(value))
  }

  const moveDropSource = (source: SourcePoint) => {
    if (currentTime > 0.001) return
    setFitProgress(0)
    setDropSource(source)
  }

  const toggleEffect = (key: EffectKey) => {
    setIsPlaying(false)
    setFitProgress(0)
    setEffects((currentEffects) => {
      const nextEffects = {
        ...currentEffects,
        [key]: !currentEffects[key],
      }
      const nextEndTime = calculateRippleEndTime(dropSource, nextEffects)
      setCurrentTime((time) => Math.min(time, nextEndTime))
      return nextEffects
    })
  }

  const stopTimelineEvent = (event: React.SyntheticEvent) => {
    event.stopPropagation()
  }

  return (
    <>
      <InverseWaterScene
        time={currentTime}
        fitProgress={fitProgress}
        dropSource={dropSource}
        rippleFit={rippleFit}
        simulationSettings={simulationSettings}
        effectSignature={effectSignature}
        onMoveSource={moveDropSource}
      />
      <Html fullscreen style={{ pointerEvents: 'none' }}>
        <main className={styles.overlay} aria-label="Ripple source inversion experiment">
          <aside className={styles.panel} aria-label="WebGL Water notes">
            <h1 className={styles.title}>Ripple Source Inversion</h1>
            <p className={styles.byline}>Made by Montek.</p>
            <p>Fit circles to the t=15 rings. Compare only after the prediction.</p>

            <dl className={styles.readout}>
              <div>
                <dt>time</dt>
                <dd>t={currentTime.toFixed(1)}</dd>
              </div>
              <div>
                <dt>state</dt>
                <dd>{phase}</dd>
              </div>
              <div>
                <dt>estimate</dt>
                <dd>{estimateLabel}</dd>
              </div>
              <div>
                <dt>true hit</dt>
                <dd>({dropSource.x.toFixed(2)}, {dropSource.y.toFixed(2)})</dd>
              </div>
              <div>
                <dt>error</dt>
                <dd>{fitProgress >= 1 ? estimateError.toFixed(3) : '-'}</dd>
              </div>
            </dl>

            <button className={styles.dropButton} type="button" onClick={dropStone}>
              Drop stone
            </button>

            <h2 className={styles.sectionTitle}>Use</h2>
            <ul className={styles.list}>
              <li>At t0, drag the stone to move the source</li>
              <li>Drop the stone</li>
              <li>Yellow = circle-fit prediction</li>
              <li>Drag / scroll camera</li>
            </ul>

            <h2 className={styles.sectionTitle}>Effects</h2>
            <div className={styles.effectsGrid}>
              {EFFECTS.map((effect) => (
                <label key={effect.key} className={styles.effectToggle}>
                  <input
                    type="checkbox"
                    checked={effects[effect.key]}
                    onChange={() => toggleEffect(effect.key)}
                  />
                  <span>{effect.label}</span>
                </label>
              ))}
            </div>

            <h2 className={styles.sectionTitle}>Answer</h2>
            <ul className={styles.list}>
              <li>Ideal full rings recover the center.</li>
              <li>Real effects make it an estimate.</li>
              <li>One sensor point is not enough.</li>
            </ul>

            <p className={styles.finePrint}>
              Fit uses measured ring points, not the stored hit. Red is revealed after.
            </p>
          </aside>

          <section
            className={styles.timeline}
            aria-label="Simulation timeline"
            onPointerDownCapture={stopTimelineEvent}
            onPointerMoveCapture={stopTimelineEvent}
            onPointerUpCapture={stopTimelineEvent}
            onWheelCapture={stopTimelineEvent}
          >
            <div className={styles.timelineTop}>
              <button className={styles.controlButton} type="button" onClick={togglePlayback}>
                {isPlaying ? 'Pause' : 'Play'}
              </button>
              <button className={styles.controlButton} type="button" onClick={resetTimeline}>
                Reset
              </button>
              <button className={styles.controlButton} type="button" onClick={dropStone}>
                Drop
              </button>
              <button className={styles.solveButton} type="button" onClick={runFit}>
                Run fit
              </button>
              <span className={styles.timeCode}>t={currentTime.toFixed(1)} / {endTimeLabel}</span>
            </div>

            <div className={styles.scrubberRow}>
              <span>0</span>
              <input
                className={styles.scrubber}
                type="range"
                min={0}
                max={endTime}
                step={0.1}
                value={currentTime}
                onChange={(event) => scrubTimeline(event.target.value)}
                aria-label="Simulation time"
              />
              <span>{endTimeLabel}</span>
            </div>

            <div className={styles.markers}>
              <span>t0 still</span>
              <span>t1 hit</span>
              <span>t15 measure</span>
              <span>t{endTimeLabel} stop</span>
            </div>

            <ol className={styles.algorithm}>
              <li className={currentTime >= IMPACT_TIME ? styles.activeStep : undefined}>impact</li>
              <li className={currentTime >= OBSERVATION_TIME ? styles.activeStep : undefined}>detect rings</li>
              <li className={fitProgress > 0 ? styles.activeStep : undefined}>fit center</li>
              <li className={fitProgress >= 1 ? styles.activeStep : undefined}>source {estimateLabel}</li>
            </ol>
          </section>
        </main>
      </Html>
    </>
  )
}

ThreejsWater.Layout = R3FCanvasLayout
ThreejsWater.Title = 'Ripple Source Inversion'
ThreejsWater.Description = 'Can a t=15 ripple pattern reveal where a stone hit a still pond at t=1?'
ThreejsWater.Tags = ['r3f', 'webgl', 'simulation']
ThreejsWater.background = 'none'
ThreejsWater.bg = '#00090a'

export default ThreejsWater
