import { ref } from 'vue'
import {
  WebGLRenderer, Scene, OrthographicCamera, PerspectiveCamera, Color, FogExp2,
  AmbientLight, DirectionalLight, HemisphereLight,
  BoxGeometry, PlaneGeometry, ConeGeometry, CylinderGeometry, SphereGeometry,
  MeshLambertMaterial, MeshStandardMaterial, ShaderMaterial,
  InstancedMesh, Mesh, Group,
  Matrix4, Vector3,
  Points, PointsMaterial, BufferGeometry, Float32BufferAttribute,
  BackSide, SRGBColorSpace, ACESFilmicToneMapping, TextureLoader,
} from 'three'
import { GLTFLoader }    from 'three/addons/loaders/GLTFLoader.js'
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js'

// ── Constants ──────────────────────────────────────────────────────────────────
const WORLD_SCALE     = 80
const PLOT_RADIUS     = 13
const ROAD_WIDTH      = 7
const SIDEWALK_W      = 2.5
const CURB_W          = 0.35
const HALF_ROAD_TOTAL = ROAD_WIDTH / 2 + CURB_W + SIDEWALK_W
const CORNER_OFFSET   = Math.ceil(HALF_ROAD_TOTAL + 3 + PLOT_RADIUS)
const ROAD_REACH      = 1800
const ROAD_GRID_N     = 5
const MAX_TREES       = 2800
const TERRAIN_HALF    = 420
const ENTER_DIST      = 6
const DASH_LEN        = 4
const GAP_LEN         = 6

const DAY_SPEED = 1 / 180 // full cycle in 3 real minutes

// t: 0=midnight, 0.25=sunrise, 0.5=noon, 0.75=sunset
const PHASES = [
  { t: 0.00, top: new Color(0x04081a), bot: new Color(0x060c20), sun: new Color(0xb0baee), fog: new Color(0x020510), aI: 0.09, hI: 0.04, sI: 0.05, fd: 0.006,  st: 0.90 },
  { t: 0.20, top: new Color(0x0d0c22), bot: new Color(0x3d1a2a), sun: new Color(0xff6622), fog: new Color(0x1a0b10), aI: 0.22, hI: 0.12, sI: 0.28, fd: 0.005,  st: 0.45 },
  { t: 0.25, top: new Color(0x18103e), bot: new Color(0xff7744), sun: new Color(0xffaa44), fog: new Color(0x441820), aI: 0.42, hI: 0.22, sI: 0.62, fd: 0.0045, st: 0.00 },
  { t: 0.35, top: new Color(0x2a5cbf), bot: new Color(0x88c8e8), sun: new Color(0xfff4d6), fog: new Color(0x70b8d4), aI: 0.65, hI: 0.32, sI: 0.88, fd: 0.0035, st: 0.00 },
  { t: 0.50, top: new Color(0x3868d4), bot: new Color(0x87ceeb), sun: new Color(0xfff8e8), fog: new Color(0x87ceeb), aI: 0.78, hI: 0.38, sI: 1.00, fd: 0.0028, st: 0.00 },
  { t: 0.65, top: new Color(0x2a5cbf), bot: new Color(0x88c8e8), sun: new Color(0xfff4d6), fog: new Color(0x70b8d4), aI: 0.65, hI: 0.32, sI: 0.88, fd: 0.0035, st: 0.00 },
  { t: 0.75, top: new Color(0x180f38), bot: new Color(0xff6622), sun: new Color(0xff9933), fog: new Color(0x441820), aI: 0.42, hI: 0.22, sI: 0.62, fd: 0.0045, st: 0.00 },
  { t: 0.80, top: new Color(0x0e0b22), bot: new Color(0x3d1520), sun: new Color(0xff4411), fog: new Color(0x180a10), aI: 0.22, hI: 0.12, sI: 0.28, fd: 0.005,  st: 0.45 },
  { t: 1.00, top: new Color(0x04081a), bot: new Color(0x060c20), sun: new Color(0xb0baee), fog: new Color(0x020510), aI: 0.09, hI: 0.04, sI: 0.05, fd: 0.006,  st: 0.90 },
]

const noise = new SimplexNoise()

function seededRng(seed) {
  let s = (seed ^ 0xdeadbeef) >>> 0
  return () => {
    s = Math.imul(s ^ (s >>> 15), s | 1)
    s ^= s + Math.imul(s ^ (s >>> 7), s | 61)
    return ((s ^ (s >>> 14)) >>> 0) / 0xffffffff
  }
}

function groundY() { return 0 }

// Centro dos tiles iniciais (0,0)-(1,1) do grid 5×5
function cityVisualPos(city) {
  const tileSize = (WORLD_SCALE - 2 * HALF_ROAD_TOTAL) / 5
  const offset   = HALF_ROAD_TOTAL + tileSize  // centro do bloco 2×2
  return new Vector3(
    city.worldX * WORLD_SCALE + offset,
    0,
    city.worldZ * WORLD_SCALE + offset,
  )
}

function _lerp(a, b, t) { return a + (b - a) * t }

// ── Composable ────────────────────────────────────────────────────────────────
export function useWorldRenderer(canvasRef) {
  let renderer, scene, orthoCamera, perspCamera, camera, animId
  let camFrustum = 20
  let lastTime   = 0
  let cameraMode = 0

  // Day/night state
  let dayTime    = 0.30
  let skyMesh    = null
  let cloudMesh  = null
  let starPoints = null
  let ambLight   = null
  let hemiLight  = null
  let sunLight   = null

  const _phase   = { top: new Color(), bot: new Color(), sun: new Color(), fog: new Color(), aI: 0, hI: 0, sI: 0, fd: 0, st: 0 }
  const _bgColor = new Color()

  const keysDown     = new Set()
  const roadSegments = []
  const ambientCars  = []

  // ── Free camera control (mouse look) ────────────────────────────────────────
  let freeCamPitch = 0       // Up/down rotation (radians)
  let freeCamYaw   = 0       // Left/right rotation (radians)
  let freeCamRadius = 10     // Distance from player
  let freeCamHeight = 2      // Height above player
  const freeCamDrag = { active: false, lastX: 0, lastY: 0 }
  const freeCamSpeed = 0.003 // Mouse sensitivity

  let mode = 'walking'

  const npc = {
    group: null,
    pos:   new Vector3(0, 0, 8),
    angle: 0,
    speed: 0,
    maxSpeed: 5.5, accel: 18, friction: 14, turnSpeed: 3.2,
  }
  const WHEEL_RADIUS = 0.35 // raio estimado das rodas em unidades de mundo

  const vehicle = {
    mesh:        null,
    wheelMeshes: [],          // nós GLB cujo nome contém 'wheel'
    pos:         new Vector3(0, 0, 0),
    angle: 0,
    speed: 0,
    maxSpeed: 15, accel: 24, friction: 9, turnSpeed: 2.3,
  }

  const camPos    = new Vector3()
  const camLookAt = new Vector3()

  const ready         = ref(false)
  const nearbyCity    = ref(null)
  const enterCityZone = ref(null)
  const playerPos     = ref({ x: 0, z: 0 })
  const playerMode    = ref('walking')
  const cameraModeRef = ref(0)
  const timeOfDay     = ref('07:12')


  function _buildCameras(W, H) {
    const a = W / H
    orthoCamera = new OrthographicCamera(-camFrustum * a, camFrustum * a, camFrustum, -camFrustum, 0.1, 1200)
    perspCamera = new PerspectiveCamera(65, a, 0.1, 1200)
    camera = orthoCamera
    camPos.set(npc.pos.x + 20, 20, npc.pos.z + 20)
    camLookAt.copy(npc.pos)
    camera.position.copy(camPos)
    camera.lookAt(camLookAt)
  }

  function _buildLights() {
    ambLight = new AmbientLight(0xffffff, 0.78)
    scene.add(ambLight)
    hemiLight = new HemisphereLight(0xb8d4a0, 0x2a4a1a, 0.38)
    scene.add(hemiLight)
    sunLight = new DirectionalLight(0xfff4d6, 1.0)
    sunLight.position.set(40, 80, 30)
    sunLight.castShadow = true
    sunLight.shadow.mapSize.set(2048, 2048)
    Object.assign(sunLight.shadow.camera, { left: -150, right: 150, top: 150, bottom: -150 })
    scene.add(sunLight)
  }

  // ── Sky dome ──────────────────────────────────────────────────────────────────
  function _buildSky() {
    const mat = new ShaderMaterial({
      side: BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        uTopColor: { value: new Color(0x04081a) },
        uBotColor: { value: new Color(0x060c20) },
        uSunDir:   { value: new Vector3(0, 1, 0.3) },
        uSunColor: { value: new Color(0xffffff) },
        uSunSize:  { value: 0.9994 },
      },
      vertexShader: /* glsl */`
        varying vec3 vDir;
        void main() {
          vDir = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */`
        uniform vec3  uTopColor;
        uniform vec3  uBotColor;
        uniform vec3  uSunDir;
        uniform vec3  uSunColor;
        uniform float uSunSize;
        varying vec3 vDir;
        void main() {
          vec3 d = normalize(vDir);
          float h = pow(max(d.y, 0.0), 0.5);
          vec3 sky = mix(uBotColor, uTopColor, h);
          float cosA = dot(d, normalize(uSunDir));
          float disc = smoothstep(uSunSize - 0.0008, uSunSize + 0.0008, cosA);
          float halo = smoothstep(uSunSize - 0.07, uSunSize - 0.002, cosA) * 0.32;
          sky += uSunColor * disc + uSunColor * halo * 0.5;
          gl_FragColor = vec4(sky, 1.0);
        }
      `,
    })
    skyMesh = new Mesh(new SphereGeometry(700, 32, 16), mat)
    skyMesh.renderOrder = -1
    scene.add(skyMesh)
  }

  function _buildClouds() {
    const mat = new ShaderMaterial({
      side: BackSide,
      depthWrite: false,
      fog: false,
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
      },
      vertexShader: /* glsl */`
        varying vec3 vPos;
        void main() {
          vPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */`
        uniform float uTime;
        varying vec3 vPos;

        // Value noise: hash returns float in [0,1]
        float hash(vec3 p) {
          return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
        }

        // Trilinear value noise, output in [0, 1]
        float noise(vec3 p) {
          vec3 i = floor(p);
          vec3 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(mix(hash(i),               hash(i+vec3(1,0,0)), f.x),
                mix(hash(i+vec3(0,1,0)),   hash(i+vec3(1,1,0)), f.x), f.y),
            mix(mix(hash(i+vec3(0,0,1)),   hash(i+vec3(1,0,1)), f.x),
                mix(hash(i+vec3(0,1,1)),   hash(i+vec3(1,1,1)), f.x), f.y),
            f.z
          );
        }

        void main() {
          vec3 dir = normalize(vPos);
          float y = dir.y;

          // Only upper hemisphere
          if (y < 0.05) { gl_FragColor = vec4(0.0); return; }

          // Project ray to cloud layer plane (height band)
          float h = 0.35 / max(y, 0.05);
          vec3 p = dir * h;
          p.x += uTime * 0.015;
          p.z += uTime * 0.008;
          p *= 2.5;

          // FBM – each octave is strictly [0, 1], sum is [0, 1.75], divided → [0, 1]
          float n = 0.0;
          n += 1.000 * noise(p);
          n += 0.500 * noise(p * 2.0 + vec3(1.7, 9.2, 3.5));
          n += 0.250 * noise(p * 4.0 + vec3(8.3, 2.8, 5.1));
          n /= 1.75;

          // Cloud shape with gentle threshold
          float cloud = smoothstep(0.48, 0.68, n);

          // Fade softly at horizon
          float fade = smoothstep(0.05, 0.18, y);
          cloud *= fade;

          if (cloud < 0.01) { gl_FragColor = vec4(0.0); return; }

          // Slight shading: center brighter, edges slightly grey
          float shade = mix(0.88, 1.0, cloud);
          gl_FragColor = vec4(shade, shade, shade, cloud * 0.92);
        }
      `,
    })

    cloudMesh = new Mesh(new SphereGeometry(680, 32, 16), mat)
    cloudMesh.renderOrder = 1   // render after sky (renderOrder -1)
    scene.add(cloudMesh)
  }

  function _updateClouds(dt) {
    if (cloudMesh) {
      cloudMesh.material.uniforms.uTime.value += dt
    }
  }

  function _buildStars() {
    const count = 2000
    const pos   = new Float32Array(count * 3)
    const rng   = seededRng(0x57a715)
    for (let i = 0; i < count; i++) {
      const theta = rng() * Math.PI * 2
      const phi   = Math.acos(2 * rng() - 1)
      const r     = 650
      pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = Math.abs(r * Math.sin(phi) * Math.sin(theta))
      pos[i * 3 + 2] = r * Math.cos(phi)
    }
    const geo = new BufferGeometry()
    geo.setAttribute('position', new Float32BufferAttribute(pos, 3))
    const mat = new PointsMaterial({ color: 0xffffff, size: 1.4, sizeAttenuation: false, transparent: true, opacity: 0 })
    starPoints = new Points(geo, mat)
    starPoints.renderOrder = -1
    scene.add(starPoints)
  }

  // ── Day/night cycle ───────────────────────────────────────────────────────────
  function _getDayPhase(t) {
    let i = 0
    while (i < PHASES.length - 2 && PHASES[i + 1].t <= t) i++
    const a = PHASES[i], b = PHASES[i + 1]
    const f = (b.t > a.t) ? (t - a.t) / (b.t - a.t) : 0
    _phase.top.copy(a.top).lerp(b.top, f)
    _phase.bot.copy(a.bot).lerp(b.bot, f)
    _phase.sun.copy(a.sun).lerp(b.sun, f)
    _phase.fog.copy(a.fog).lerp(b.fog, f)
    _phase.aI = _lerp(a.aI, b.aI, f)
    _phase.hI = _lerp(a.hI, b.hI, f)
    _phase.sI = _lerp(a.sI, b.sI, f)
    _phase.fd = _lerp(a.fd, b.fd, f)
    _phase.st = _lerp(a.st, b.st, f)
  }

  function _updateDayNight(dt) {
    dayTime = (dayTime + DAY_SPEED * dt) % 1
    _getDayPhase(dayTime)

    // Sun orbits: dayTime=0.25→east horizon, 0.5→zenith, 0.75→west horizon
    const sa  = (dayTime - 0.25) * Math.PI * 2
    const sx  = Math.cos(sa), sy = Math.sin(sa), sz = 0.25
    const isSun = sy > -0.1
    const dx = isSun ? sx : -sx
    const dy = isSun ? sy : -sy
    const dz = isSun ? sz : -sz

    if (skyMesh) {
      const u = skyMesh.material.uniforms
      u.uTopColor.value.copy(_phase.top)
      u.uBotColor.value.copy(_phase.bot)
      u.uSunDir.value.set(dx, dy, dz)
      u.uSunColor.value.copy(_phase.sun)
    }

    _bgColor.copy(_phase.fog)
    scene.fog.color.copy(_phase.fog)
    scene.fog.density = _phase.fd

    if (ambLight)  ambLight.intensity  = _phase.aI
    if (hemiLight) hemiLight.intensity = _phase.hI
    if (sunLight) {
      sunLight.intensity = _phase.sI
      sunLight.color.copy(_phase.sun)
      sunLight.position.set(dx * 150, Math.max(dy, 0.12) * 150, dz * 150)
    }

    if (starPoints) starPoints.material.opacity = _phase.st

    const h = Math.floor(dayTime * 24)
    const m = Math.floor(((dayTime * 24) % 1) * 60)
    timeOfDay.value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }

  // ── World generation ───────────────────────────────────────────────────────────
  function loadWorld(cities, { activeVehicle = null, vehicleCatalog = [] } = {}) {
    _generateTerrain()
    _generateRoads()
    _generateVegetation(cities)
    _generateCityPlots(cities)
    _spawnAmbientCars(vehicleCatalog)
    _spawnVehicle(activeVehicle)
    _spawnNpc()
  }

  function _generateTerrain() {
    const mesh = new Mesh(
      new PlaneGeometry(TERRAIN_HALF * 2, TERRAIN_HALF * 2),
      new MeshLambertMaterial({ color: 0x3d7a28 }),
    )
    mesh.rotation.x = -Math.PI / 2
    mesh.receiveShadow = true
    scene.add(mesh)
  }

  function _generateRoads() {
    roadSegments.length = 0

    const roadMat  = new MeshLambertMaterial({ color: 0x1c1c24 })
    const swMat    = new MeshLambertMaterial({ color: 0x9e9e9e })
    const curbMat  = new MeshLambertMaterial({ color: 0x565666 })
    const dashMat  = new MeshLambertMaterial({ color: 0xffd166 })

    const len           = ROAD_REACH * 2
    const PERIOD        = DASH_LEN + GAP_LEN
    const roadCount     = ROAD_GRID_N * 2 + 1
    const dashesPerRoad = Math.floor(len / PERIOD)

    const zDashInst = new InstancedMesh(
      new BoxGeometry(0.18, 0.03, DASH_LEN), dashMat, roadCount * dashesPerRoad,
    )
    const xDashInst = new InstancedMesh(
      new BoxGeometry(DASH_LEN, 0.03, 0.18), dashMat, roadCount * dashesPerRoad,
    )
    let zIdx = 0, xIdx = 0
    const m = new Matrix4()

    for (let n = -ROAD_GRID_N; n <= ROAD_GRID_N; n++) {
      const coord = n * WORLD_SCALE

      const zRoad = new Mesh(new BoxGeometry(ROAD_WIDTH, 0.015, len), roadMat)
      zRoad.position.set(coord, 0.008, 0)
      zRoad.receiveShadow = true
      scene.add(zRoad)

      const xRoad = new Mesh(new BoxGeometry(len, 0.015, ROAD_WIDTH), roadMat)
      xRoad.position.set(0, 0.014, coord)
      xRoad.receiveShadow = true
      scene.add(xRoad)

      ;[-1, 1].forEach(side => {
        const curbOff = ROAD_WIDTH / 2 + CURB_W / 2
        const swOff   = ROAD_WIDTH / 2 + CURB_W + SIDEWALK_W / 2

        const zCurb = new Mesh(new BoxGeometry(CURB_W, 0.1, len), curbMat)
        zCurb.position.set(coord + side * curbOff, 0.05, 0)
        scene.add(zCurb)

        const zSw = new Mesh(new BoxGeometry(SIDEWALK_W, 0.04, len), swMat)
        zSw.position.set(coord + side * swOff, 0.02, 0)
        zSw.receiveShadow = true
        scene.add(zSw)

        const xCurb = new Mesh(new BoxGeometry(len, 0.1, CURB_W), curbMat)
        xCurb.position.set(0, 0.055, coord + side * curbOff)
        scene.add(xCurb)

        const xSw = new Mesh(new BoxGeometry(len, 0.04, SIDEWALK_W), swMat)
        xSw.position.set(0, 0.025, coord + side * swOff)
        xSw.receiveShadow = true
        scene.add(xSw)
      })

      for (let d = 0; d < dashesPerRoad; d++) {
        const t = -ROAD_REACH + d * PERIOD + PERIOD / 2
        m.setPosition(coord, 0.025, t); zDashInst.setMatrixAt(zIdx++, m)
        m.setPosition(t, 0.03, coord);  xDashInst.setMatrixAt(xIdx++, m)
      }

      roadSegments.push(
        { axis: 'z', coord, from: new Vector3(coord, 0, -ROAD_REACH), to: new Vector3(coord, 0, ROAD_REACH), length: ROAD_REACH * 2 },
        { axis: 'x', coord, from: new Vector3(-ROAD_REACH, 0, coord), to: new Vector3(ROAD_REACH, 0, coord), length: ROAD_REACH * 2 },
      )
    }

    zDashInst.instanceMatrix.needsUpdate = true
    xDashInst.instanceMatrix.needsUpdate = true
    scene.add(zDashInst, xDashInst)
  }

  function _generateVegetation(cities) {
    const rng     = seededRng(0xabc123)
    const placed  = []
    let   attempts = 0

    while (placed.length < MAX_TREES && attempts < MAX_TREES * 6) {
      attempts++
      const x = (rng() * 2 - 1) * TERRAIN_HALF * 0.9
      const z = (rng() * 2 - 1) * TERRAIN_HALF * 0.9
      if (_nearRoad(x, z) || _nearCity(x, z, cities)) continue
      // Tamanhos com mais variação: árvores pequenas, médias e grandes
      const sizeClass = rng()
      let s
      if (sizeClass < 0.3) s = 0.8 + rng() * 0.4     // 30% pequenas: 0.8-1.2
      else if (sizeClass < 0.65) s = 1.3 + rng() * 0.6 // 35% médias: 1.3-1.9
      else s = 2.0 + rng() * 0.9                      // 35% grandes: 2.0-2.9
      placed.push({ x, z, s, tVar: rng(), cVar: rng() })
    }

    const n        = placed.length
    const trunkMat = new MeshLambertMaterial({ color: 0x3e2a18 })
    const coneMat  = new MeshLambertMaterial({ color: 0x1e5c18 })
    
    // Criar múltiplos instanced meshes com variações de geometria
    // Troncos com diferentes espessuras
    const trunk1Inst = new InstancedMesh(new CylinderGeometry(0.12, 0.22, 1.3, 6), trunkMat, n)
    const trunk2Inst = new InstancedMesh(new CylinderGeometry(0.15, 0.28, 1.5, 6), trunkMat, Math.floor(n * 0.4))
    const trunk3Inst = new InstancedMesh(new CylinderGeometry(0.10, 0.18, 1.2, 5), trunkMat, Math.floor(n * 0.4))
    
    // Copas com diferentes formatos
    const cone1Inst = new InstancedMesh(new ConeGeometry(1.0, 2.6, 7), coneMat, n)
    const cone2Inst = new InstancedMesh(new ConeGeometry(1.15, 3.0, 8), coneMat, Math.floor(n * 0.3))
    const cone3Inst = new InstancedMesh(new ConeGeometry(0.9, 2.3, 6), coneMat, Math.floor(n * 0.3))
    
    trunk1Inst.castShadow = trunk2Inst.castShadow = trunk3Inst.castShadow = true
    cone1Inst.castShadow = cone2Inst.castShadow = cone3Inst.castShadow = true

    const mm = new Matrix4()
    let t1Idx = 0, t2Idx = 0, t3Idx = 0, c1Idx = 0, c2Idx = 0, c3Idx = 0
    
    placed.forEach(({ x, z, s, tVar, cVar }, i) => {
      // Distribuir entre diferentes variações de tronco
      let trunkType = Math.floor(tVar * 3)
      if (trunkType === 0 && t1Idx < Math.floor(n * 0.5)) {
        mm.makeScale(s, s, s); mm.setPosition(x, 0.65 * s, z); trunk1Inst.setMatrixAt(t1Idx++, mm)
      } else if (trunkType === 1 && t2Idx < Math.floor(n * 0.4)) {
        mm.makeScale(s, s, s); mm.setPosition(x, 0.75 * s, z); trunk2Inst.setMatrixAt(t2Idx++, mm)
      } else if (t3Idx < Math.floor(n * 0.4)) {
        mm.makeScale(s, s, s); mm.setPosition(x, 0.60 * s, z); trunk3Inst.setMatrixAt(t3Idx++, mm)
      }
      
      // Distribuir entre diferentes variações de copa
      let coneType = Math.floor(cVar * 3)
      if (coneType === 0 && c1Idx < Math.floor(n * 0.5)) {
        mm.makeScale(s, s, s); mm.setPosition(x, 2.0 * s, z); cone1Inst.setMatrixAt(c1Idx++, mm)
      } else if (coneType === 1 && c2Idx < Math.floor(n * 0.3)) {
        mm.makeScale(s, s, s); mm.setPosition(x, 2.25 * s, z); cone2Inst.setMatrixAt(c2Idx++, mm)
      } else if (c3Idx < Math.floor(n * 0.3)) {
        mm.makeScale(s, s, s); mm.setPosition(x, 1.85 * s, z); cone3Inst.setMatrixAt(c3Idx++, mm)
      }
    })
    
    trunk1Inst.instanceMatrix.needsUpdate = true
    trunk2Inst.instanceMatrix.needsUpdate = true
    trunk3Inst.instanceMatrix.needsUpdate = true
    cone1Inst.instanceMatrix.needsUpdate = true
    cone2Inst.instanceMatrix.needsUpdate = true
    cone3Inst.instanceMatrix.needsUpdate = true
    
    scene.add(trunk1Inst, trunk2Inst, trunk3Inst, cone1Inst, cone2Inst, cone3Inst)
  }

  function _generateCityPlots(cities) {
    // Grid 5×5 — cada tile ocupa 1/5 do espaço utilizável entre estradas
    const USABLE    = WORLD_SCALE - 2 * HALF_ROAD_TOTAL  // ~67.3 unidades
    const TILE_SIZE = USABLE / 5                           // ~13.46 unidades
    const CELL_W    = TILE_SIZE / 10                       // ~1.346 unidades por célula de grid

    const CATEGORY_COLORS = {
      residential: 0x8b9dc3,
      commercial:  0x6c5ce7,
      nature:      0x4caf50,
      road:        0x555566,
      decoration:  0xff6b9d,
    }
    const CATEGORY_HEIGHT = {
      residential: 1.8,
      commercial:  3.0,
      nature:      1.2,
      road:        0.25,
      decoration:  0.9,
    }

    const gltfLoader = new GLTFLoader()
    const texLoader  = new TextureLoader()

    cities.forEach(city => {
      const buildings = city.buildings ?? []

      // Renderiza cada prédio: GLB real se disponível, box colorido como fallback
      buildings.forEach(b => {
        const wx = city.worldX * WORLD_SCALE + HALF_ROAD_TOTAL + b.gridX * CELL_W + Math.max(b.sizeX, 1) * CELL_W / 2
        const wz = city.worldZ * WORLD_SCALE + HALF_ROAD_TOTAL + b.gridZ * CELL_W + Math.max(b.sizeZ, 1) * CELL_W / 2
        const rotY = (b.rotation ?? 0) * Math.PI / 180

        if (b.modelUrl) {
          gltfLoader.load(b.modelUrl, (gltf) => {
            const root = gltf.scene
            root.scale.setScalar(b.scaleFactor ?? 1)
            const mtl = b.material
            root.traverse((node) => {
              if (!node.isMesh) return
              const mat = new MeshStandardMaterial({
                roughness: mtl?.roughness ?? 0.7,
                metalness: mtl?.metalness ?? 0.0,
              })
              if (mtl?.textureAlbedo) {
                const isLinear = mtl.albedoColorSpace === 'linear'
                const albedo   = texLoader.load(mtl.textureAlbedo)
                albedo.flipY   = mtl.flipY ?? false
                if (!isLinear) albedo.colorSpace = SRGBColorSpace
                mat.map = albedo
              }
              if (mtl?.textureNormal) {
                const n = texLoader.load(mtl.textureNormal)
                n.flipY = mtl.flipY ?? false
                mat.normalMap = n
              }
              if (mtl?.textureRoughnessMetalness) {
                const rm = texLoader.load(mtl.textureRoughnessMetalness)
                rm.flipY = mtl.flipY ?? false
                mat.roughnessMap = rm
                mat.metalnessMap = rm
              }
              if (mtl?.textureAo) {
                const ao = texLoader.load(mtl.textureAo)
                ao.flipY = mtl.flipY ?? false
                mat.aoMap = ao
              }
              if (mtl?.textureEmissive) {
                const em = texLoader.load(mtl.textureEmissive)
                em.colorSpace = SRGBColorSpace
                em.flipY = mtl.flipY ?? false
                mat.emissiveMap = em
                mat.emissive.set(0xffffff)
              }
              node.material = mat
              node.castShadow = node.receiveShadow = true
            })
            root.position.set(wx, 0, wz)
            root.rotation.y = rotY
            scene.add(root)
          }, undefined, () => {
            // Fallback box on load error
            _addFallbackBox(b, wx, wz, rotY, CELL_W, CATEGORY_COLORS, CATEGORY_HEIGHT)
          })
        } else {
          _addFallbackBox(b, wx, wz, rotY, CELL_W, CATEGORY_COLORS, CATEGORY_HEIGHT)
        }
      })
    })
  }

  function _addFallbackBox(b, wx, wz, rotY, CELL_W, CATEGORY_COLORS, CATEGORY_HEIGHT) {
    const color = CATEGORY_COLORS[b.category] ?? 0xaaaaaa
    const bh    = CATEGORY_HEIGHT[b.category] ?? 1.5
    const bw    = Math.max(b.sizeX, 1) * CELL_W * 0.82
    const bd    = Math.max(b.sizeZ, 1) * CELL_W * 0.82
    const geo   = new BoxGeometry(bw, bh, bd)
    const mat   = new MeshLambertMaterial({ color })
    const mesh  = new Mesh(geo, mat)
    mesh.castShadow = mesh.receiveShadow = true
    mesh.position.set(wx, bh / 2, wz)
    mesh.rotation.y = rotY
    scene.add(mesh)
  }

  function _spawnAmbientCars() {
    const palette = [0x8b9dc3, 0x4a9eff, 0x00d9c0, 0xff6b9d, 0xffd166, 0xc8bfe8]
    const carGeo  = new BoxGeometry(1.5, 0.65, 2.8)
    const rng     = seededRng(0xf00dcafe)

    const nearSegs = roadSegments.filter(s => Math.abs(s.coord) <= WORLD_SCALE)

    nearSegs.forEach((seg, si) => {
      for (let i = 0; i < 3; i++) {
        const mat  = new MeshLambertMaterial({ color: palette[(si * 3 + i) % palette.length] })
        const mesh = new Mesh(carGeo, mat)
        mesh.castShadow = true

        if (seg.axis === 'x') mesh.rotation.y = Math.PI / 2

        const t    = rng()
        const lane = i % 2 === 0 ? 1.1 : -1.1
        const pos  = seg.from.clone().lerp(seg.to, t)

        if (seg.axis === 'x') pos.z += lane
        else                  pos.x += lane

        mesh.position.set(pos.x, 0.42, pos.z)
        mesh.userData = { seg, t, dir: i % 2 === 0 ? 1 : -1, speed: 8 + rng() * 7, lane }
        scene.add(mesh)
        ambientCars.push(mesh)
      }
    })
  }

  // ── Player vehicle ─────────────────────────────────────────────────────────────
  function _buildBoxVehicle(color = 0x6c5ce7) {
    const geo  = new BoxGeometry(1.4, 0.68, 2.8)
    const mesh = new Mesh(geo, new MeshLambertMaterial({ color }))
    mesh.castShadow = true
    const hMat = new MeshLambertMaterial({ color: 0xfff4e0, emissive: 0xfff4e0, emissiveIntensity: 0.8 })
    ;[-0.44, 0.44].forEach(ox => {
      const h = new Mesh(new BoxGeometry(0.28, 0.14, 0.1), hMat)
      h.position.set(ox, 0.1, -1.45)
      mesh.add(h)
    })
    return mesh
  }

  function _applyGlbMaterial(root, matData) {
    if (!matData) return
    const texLoader = new TextureLoader()
    root.traverse(node => {
      if (!node.isMesh) return
      const m = new MeshStandardMaterial({
        roughness: matData.roughness ?? 0.7,
        metalness: matData.metalness ?? 0.0,
      })
      if (matData.textureAlbedo) {
        const t = texLoader.load(matData.textureAlbedo)
        t.flipY = matData.flipY ?? false
        if (matData.albedoColorSpace !== 'linear') t.colorSpace = SRGBColorSpace
        m.map = t
      }
      if (matData.textureNormal) {
        const t = texLoader.load(matData.textureNormal); t.flipY = matData.flipY ?? false; m.normalMap = t
      }
      if (matData.textureRoughnessMetalness) {
        const t = texLoader.load(matData.textureRoughnessMetalness); t.flipY = matData.flipY ?? false
        m.roughnessMap = m.metalnessMap = t
      }
      node.material = m
    })
  }

  function _spawnVehicle(activeVehicle = null) {
    if (activeVehicle?.catalog?.modelUrl) {
      const loader = new GLTFLoader()
      const url = activeVehicle.catalog.modelUrl.startsWith('http')
        ? activeVehicle.catalog.modelUrl
        : `${import.meta.env.VITE_API_URL || ''}${activeVehicle.catalog.modelUrl}`

      loader.load(url, (gltf) => {
        const root  = gltf.scene
        const scale = activeVehicle.catalog.vehicleAsset?.scaleFactor ?? 1
        root.scale.setScalar(scale)
        root.castShadow = true
        _applyGlbMaterial(root, activeVehicle.catalog.vehicleAsset?.material)
        root.position.copy(vehicle.pos)

        // Coletar rodas para animação
        vehicle.wheelMeshes = []
        root.traverse(node => {
          if (node.isMesh && node.name.toLowerCase().includes('wheel')) {
            vehicle.wheelMeshes.push(node)
          }
        })

        scene.add(root)
        vehicle.mesh = root
      }, undefined, () => {
        vehicle.mesh = _buildBoxVehicle(0x6c5ce7)
        vehicle.mesh.position.copy(vehicle.pos)
        scene.add(vehicle.mesh)
      })
    } else {
      vehicle.mesh = _buildBoxVehicle(0x6c5ce7)
      vehicle.mesh.position.copy(vehicle.pos)
      scene.add(vehicle.mesh)
    }
  }

  // ── Ambient cars ───────────────────────────────────────────────────────────────
  function _spawnAmbientCars(vehicleCatalog = []) {
    const palette = [0x8b9dc3, 0x4a9eff, 0x00d9c0, 0xff6b9d, 0xffd166, 0xc8bfe8]
    const rng     = seededRng(0xf00dcafe)
    const nearSegs = roadSegments.filter(s => Math.abs(s.coord) <= WORLD_SCALE)

    const loader = new GLTFLoader()
    const activeGlb = vehicleCatalog.filter(v => v.isActive && v.modelUrl)

    nearSegs.forEach((seg, si) => {
      for (let i = 0; i < 3; i++) {
        const t    = rng()
        const lane = i % 2 === 0 ? 1.1 : -1.1
        const pos  = seg.from.clone().lerp(seg.to, t)
        if (seg.axis === 'x') pos.z += lane
        else                  pos.x += lane
        pos.y = 0.42

        const color = palette[(si * 3 + i) % palette.length]
        const catalogItem = activeGlb.length ? activeGlb[(si * 3 + i) % activeGlb.length] : null

        if (catalogItem) {
          const url = catalogItem.modelUrl.startsWith('http')
            ? catalogItem.modelUrl
            : `${import.meta.env.VITE_API_URL || ''}${catalogItem.modelUrl}`

          loader.load(url, (gltf) => {
            const root = gltf.scene
            const scale = catalogItem.vehicleAsset?.scaleFactor ?? 1
            root.scale.setScalar(scale)
            root.castShadow = true
            if (seg.axis === 'x') root.rotation.y = Math.PI / 2
            root.position.set(pos.x, 0, pos.z)

            // Coletar rodas para animação
            const wheelMeshes = []
            root.traverse(node => {
              if (node.isMesh && node.name.toLowerCase().includes('wheel')) {
                wheelMeshes.push(node)
              }
            })

            root.userData = { seg, t, dir: i % 2 === 0 ? 1 : -1, speed: 8 + rng() * 7, lane, wheelMeshes }
            scene.add(root)
            ambientCars.push(root)
          }, undefined, () => {
            // Fallback box car
            const mat  = new MeshLambertMaterial({ color })
            const mesh = new Mesh(new BoxGeometry(1.5, 0.65, 2.8), mat)
            mesh.castShadow = true
            if (seg.axis === 'x') mesh.rotation.y = Math.PI / 2
            mesh.position.set(pos.x, 0.42, pos.z)
            mesh.userData = { seg, t, dir: i % 2 === 0 ? 1 : -1, speed: 8 + rng() * 7, lane }
            scene.add(mesh)
            ambientCars.push(mesh)
          })
        } else {
          const mat  = new MeshLambertMaterial({ color })
          const mesh = new Mesh(new BoxGeometry(1.5, 0.65, 2.8), mat)
          mesh.castShadow = true
          if (seg.axis === 'x') mesh.rotation.y = Math.PI / 2
          mesh.position.set(pos.x, 0.42, pos.z)
          mesh.userData = { seg, t, dir: i % 2 === 0 ? 1 : -1, speed: 8 + rng() * 7, lane }
          scene.add(mesh)
          ambientCars.push(mesh)
        }
      }
    })
  }

  // ── NPC ────────────────────────────────────────────────────────────────────────
  function _spawnNpc() {
    npc.group = new Group()
    const body = new Mesh(new BoxGeometry(0.5, 1.1, 0.35), new MeshLambertMaterial({ color: 0x8e7df0 }))
    body.position.set(0, 0.55, 0)
    body.castShadow = true
    const head = new Mesh(new BoxGeometry(0.4, 0.4, 0.4), new MeshLambertMaterial({ color: 0xf0d4b0 }))
    head.position.set(0, 1.55, 0)
    head.castShadow = true
    npc.group.add(body, head)
    npc.group.position.copy(npc.pos)
    scene.add(npc.group)
  }

  // ── Enter / Exit ───────────────────────────────────────────────────────────────
  function _enterVehicle() {
    mode = 'driving'
    playerMode.value = 'driving'
    if (npc.group) npc.group.visible = false
    freeCamDrag.active = false // Stop mouse look when entering vehicle
  }

  function _exitVehicle() {
    mode = 'walking'
    playerMode.value = 'walking'
    const right = new Vector3(Math.cos(vehicle.angle), 0, -Math.sin(vehicle.angle))
    npc.pos.copy(vehicle.pos).addScaledVector(right, 2.2)
    npc.pos.y = 0
    npc.angle = vehicle.angle
    if (npc.group) {
      npc.group.position.copy(npc.pos)
      npc.group.rotation.y = npc.angle
      npc.group.visible = cameraMode !== 2
    }
    // Reset free camera to default position
    freeCamYaw = 0
    freeCamPitch = -0.3
    freeCamDrag.active = false
  }

  // ── Game loop ──────────────────────────────────────────────────────────────────
  function _startLoop() {
    function tick(now = 0) {
      animId = requestAnimationFrame(tick)
      const dt = Math.min((now - lastTime) / 1000, 0.05)
      lastTime = now
      _updateDayNight(dt)
      _updateClouds(dt)
      if (mode === 'walking') _updateNpc(dt)
      else                    _updateVehicle(dt)
      _updateAmbientCars(dt)
      _updateCamera(dt)
      renderer.render(scene, camera)
    }
    tick()
  }

  function _updateNpc(dt) {
    const fwd   = keysDown.has('ArrowUp')    || keysDown.has('KeyW')
    const back  = keysDown.has('ArrowDown')  || keysDown.has('KeyS')
    const left  = keysDown.has('ArrowLeft')  || keysDown.has('KeyA')
    const right = keysDown.has('ArrowRight') || keysDown.has('KeyD')
    if (fwd)  npc.speed = Math.min(npc.speed + npc.accel * dt, npc.maxSpeed)
    if (back) npc.speed = Math.max(npc.speed - npc.accel * dt, -npc.maxSpeed * 0.4)
    if (!fwd && !back) npc.speed *= Math.max(0, 1 - npc.friction * dt)
    
    // In first person (cameraMode 2), keyboard can also rotate
    if (cameraMode === 2) {
      if (Math.abs(npc.speed) > 0.1) {
        freeCamYaw += ((left ? 1 : 0) - (right ? 1 : 0)) * npc.turnSpeed * dt * Math.sign(npc.speed)
      }
      npc.angle = freeCamYaw
    } else {
      // In third person, use keyboard for rotation (only when moving)
      if (Math.abs(npc.speed) > 0.1) {
        npc.angle += ((left ? 1 : 0) - (right ? 1 : 0)) * npc.turnSpeed * dt * Math.sign(npc.speed)
      }
    }
    
    npc.pos.x += Math.sin(npc.angle) * npc.speed * dt
    npc.pos.z += Math.cos(npc.angle) * npc.speed * dt
    npc.pos.y  = 0
    if (npc.group) { npc.group.position.copy(npc.pos); npc.group.rotation.y = npc.angle }
    playerPos.value = { x: Math.round(npc.pos.x), z: Math.round(npc.pos.z) }
  }

  function _updateVehicle(dt) {
    const fwd   = keysDown.has('ArrowUp')    || keysDown.has('KeyW')
    const back  = keysDown.has('ArrowDown')  || keysDown.has('KeyS')
    const left  = keysDown.has('ArrowLeft')  || keysDown.has('KeyA')
    const right = keysDown.has('ArrowRight') || keysDown.has('KeyD')
    if (fwd)  vehicle.speed = Math.min(vehicle.speed + vehicle.accel * dt, vehicle.maxSpeed)
    if (back) vehicle.speed = Math.max(vehicle.speed - vehicle.accel * dt, -vehicle.maxSpeed * 0.45)
    if (!fwd && !back) vehicle.speed *= Math.max(0, 1 - vehicle.friction * dt)
    if (Math.abs(vehicle.speed) > 0.15) {
      vehicle.angle += ((left ? 1 : 0) - (right ? 1 : 0)) * vehicle.turnSpeed * dt * Math.sign(vehicle.speed)
    }
    vehicle.pos.x += Math.sin(vehicle.angle) * vehicle.speed * dt
    vehicle.pos.z += Math.cos(vehicle.angle) * vehicle.speed * dt
    vehicle.pos.y  = 0.42
    if (vehicle.mesh) { vehicle.mesh.position.copy(vehicle.pos); vehicle.mesh.rotation.y = vehicle.angle }

    // Girar rodas proporcionalmente à velocidade
    if (vehicle.wheelMeshes.length) {
      const rot = (vehicle.speed * dt) / WHEEL_RADIUS
      vehicle.wheelMeshes.forEach(w => { w.rotation.x -= rot })
    }

    playerPos.value = { x: Math.round(vehicle.pos.x), z: Math.round(vehicle.pos.z) }
  }

  function _updateAmbientCars(dt) {
    ambientCars.forEach(car => {
      const { seg, speed, dir, lane, wheelMeshes } = car.userData
      car.userData.t += (speed * dt / seg.length) * dir
      if (car.userData.t > 1) car.userData.t = 0
      if (car.userData.t < 0) car.userData.t = 1
      const p = seg.from.clone().lerp(seg.to, car.userData.t)
      if (seg.axis === 'x') p.z += lane
      else                  p.x += lane
      car.position.set(p.x, 0.42, p.z)

      // Girar rodas dos carros ambiente
      if (wheelMeshes?.length) {
        const rot = (speed * dir * dt) / WHEEL_RADIUS
        wheelMeshes.forEach(w => { w.rotation.x -= rot })
      }
    })
  }

  // ── Camera ─────────────────────────────────────────────────────────────────────
  function _updateCamera(dt) {
    const target = mode === 'driving' ? vehicle.pos : npc.pos
    const angle  = mode === 'driving' ? vehicle.angle : npc.angle
    const lerpK  = Math.min(1, 8 * dt)

    if (cameraMode === 0) {
      camera = orthoCamera
      const off = camFrustum * 1.15
      camPos.x  += (target.x + off - camPos.x) * lerpK
      camPos.z  += (target.z + off - camPos.z) * lerpK
      camPos.y   = camFrustum * 1.05
      camLookAt.x += (target.x - camLookAt.x) * lerpK
      camLookAt.z += (target.z - camLookAt.z) * lerpK
      camLookAt.y  = 0
    } else if (cameraMode === 1) {
      camera = perspCamera
      
      // Free camera look with mouse (only when walking)
      if (mode === 'walking') {
        // Position camera based on pitch and yaw
        const cosP = Math.cos(freeCamPitch)
        const sinP = Math.sin(freeCamPitch)
        const cosY = Math.cos(freeCamYaw)
        const sinY = Math.sin(freeCamYaw)
        
        const offsetX = freeCamRadius * cosP * sinY
        const offsetY = freeCamHeight + freeCamRadius * sinP
        const offsetZ = freeCamRadius * cosP * cosY
        
        camPos.set(
          target.x + offsetX,
          target.y + offsetY,
          target.z + offsetZ
        )
        
        // Look at player
        camLookAt.set(target.x, target.y + 0.5, target.z)
      } else {
        // Default third person camera when driving
        const idealX = target.x - Math.sin(angle) * 12
        const idealZ = target.z - Math.cos(angle) * 12
        camPos.x += (idealX          - camPos.x) * lerpK
        camPos.y += (target.y + 5    - camPos.y) * lerpK
        camPos.z += (idealZ          - camPos.z) * lerpK
        camLookAt.x += (target.x     - camLookAt.x) * lerpK
        camLookAt.y += (target.y + 1 - camLookAt.y) * lerpK
        camLookAt.z += (target.z     - camLookAt.z) * lerpK
      }
    } else {
      // First person camera (cameraMode === 2)
      camera = perspCamera
      const lf = Math.min(1, 18 * dt)
      camPos.x += (target.x + Math.sin(angle) * 0.3 - camPos.x) * lf
      camPos.y += (target.y + 1.6                   - camPos.y) * lf
      camPos.z += (target.z + Math.cos(angle) * 0.3 - camPos.z) * lf
      
      // Free look with mouse or default forward look
      if (freeCamDrag.active) {
        // Mouse look enabled - look in pitch/yaw direction
        const cosP = Math.cos(freeCamPitch)
        const sinP = Math.sin(freeCamPitch)
        const cosY = Math.cos(freeCamYaw)
        const sinY = Math.sin(freeCamYaw)
        
        camLookAt.set(
          camPos.x + sinY * cosP * 10,
          camPos.y + sinP * 10,
          camPos.z + cosY * cosP * 10
        )
      } else {
        // Default look - forward relative to player angle
        camLookAt.set(camPos.x + Math.sin(angle) * 10, camPos.y, camPos.z + Math.cos(angle) * 10)
      }
    }

    camera.position.copy(camPos)
    camera.lookAt(camLookAt)

    // Keep sky centered on camera
    if (skyMesh)    skyMesh.position.copy(camPos)
    if (starPoints) starPoints.position.copy(camPos)

    if (cameraMode !== 0 && canvasRef.value) {
      perspCamera.aspect = canvasRef.value.clientWidth / canvasRef.value.clientHeight
      perspCamera.updateProjectionMatrix()
    }

    if (npc.group && mode === 'walking') npc.group.visible = cameraMode !== 2
  }

  // ── Nearby city check ─────────────────────────────────────────────────────────
  function checkNearbyCities(cities) {
    nearbyCity.value    = null
    enterCityZone.value = null
    const pos = mode === 'driving' ? vehicle.pos : npc.pos
    for (const city of cities) {
      const vp   = cityVisualPos(city)
      const dist = Math.hypot(pos.x - vp.x, pos.z - vp.z)
      if (dist < PLOT_RADIUS) {
        enterCityZone.value = city
        return
      }
      if (dist < PLOT_RADIUS + 20) {
        nearbyCity.value = city
      }
    }
  }

  // ── Road / city proximity helpers ──────────────────────────────────────────────
  function _nearRoad(x, z) {
    const margin = HALF_ROAD_TOTAL + 2
    for (let n = -ROAD_GRID_N; n <= ROAD_GRID_N; n++) {
      const c = n * WORLD_SCALE
      if (Math.abs(x - c) < margin) return true
      if (Math.abs(z - c) < margin) return true
    }
    return false
  }

  function _nearCity(x, z, cities) {
    return cities.some(c => {
      const vp = cityVisualPos(c)
      return Math.abs(x - vp.x) < PLOT_RADIUS + 4 && Math.abs(z - vp.z) < PLOT_RADIUS + 4
    })
  }

  // ── Controls ───────────────────────────────────────────────────────────────────
  function _attachControls(canvas) {
    canvas.setAttribute('tabindex', '0')
    window.addEventListener('keydown', _onKey)
    window.addEventListener('keyup',   _onKey)
    canvas.addEventListener('wheel', _onWheel, { passive: false })
    canvas.addEventListener('mousedown', _onMouseDown, { passive: true })
    canvas.addEventListener('mousemove', _onMouseMove, { passive: true })
    canvas.addEventListener('mouseup',   _onMouseUp,   { passive: true })
    canvas.addEventListener('mouseleave', _onMouseUp,  { passive: true })
  }

  function _detachControls() {
    window.removeEventListener('keydown', _onKey)
    window.removeEventListener('keyup',   _onKey)
    canvasRef.value?.removeEventListener('wheel', _onWheel)
    canvasRef.value?.removeEventListener('mousedown', _onMouseDown)
    canvasRef.value?.removeEventListener('mousemove', _onMouseMove)
    canvasRef.value?.removeEventListener('mouseup',   _onMouseUp)
    canvasRef.value?.removeEventListener('mouseleave', _onMouseUp)
  }

  function _onKey(e) {
    const block = ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight']
    if (block.includes(e.key) && e.type === 'keydown') e.preventDefault()

    if (e.type === 'keydown') {
      if (e.code === 'KeyE' && !keysDown.has('KeyE')) {
        if (mode === 'driving') {
          _exitVehicle()
        } else if (npc.pos.distanceTo(vehicle.pos) < ENTER_DIST) {
          _enterVehicle()
        }
      }
      if (e.code === 'KeyC' && !keysDown.has('KeyC')) {
        cameraMode = (cameraMode + 1) % 3
        cameraModeRef.value = cameraMode
        
        // Reset free camera when entering first person (mode 2)
        if (cameraMode === 2) {
          freeCamYaw = npc.angle
          freeCamPitch = -0.1
        }
      }
      keysDown.add(e.code)
    } else {
      keysDown.delete(e.code)
    }
  }

  function _onWheel(e) {
    e.preventDefault()
    if (cameraMode !== 0) return
    const a = canvasRef.value.clientWidth / canvasRef.value.clientHeight
    camFrustum = Math.max(8, Math.min(55, camFrustum + e.deltaY * 0.018))
    orthoCamera.left = -camFrustum * a; orthoCamera.right  =  camFrustum * a
    orthoCamera.top  =  camFrustum;     orthoCamera.bottom = -camFrustum
    orthoCamera.updateProjectionMatrix()
  }

  function _onMouseDown(e) {
    // Enable mouse look in cameraMode 1 (third person) and cameraMode 2 (first person) when walking
    if ((cameraMode === 1 || cameraMode === 2) && mode === 'walking') {
      freeCamDrag.active = true
      freeCamDrag.lastX = e.clientX
      freeCamDrag.lastY = e.clientY
    }
  }

  function _onMouseMove(e) {
    if (!freeCamDrag.active) return

    const deltaX = e.clientX - freeCamDrag.lastX
    const deltaY = e.clientY - freeCamDrag.lastY

    freeCamYaw   -= deltaX * freeCamSpeed
    freeCamPitch += deltaY * freeCamSpeed

    // Clamp pitch to avoid flipping
    freeCamPitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, freeCamPitch))

    freeCamDrag.lastX = e.clientX
    freeCamDrag.lastY = e.clientY
  }

  function _onMouseUp() {
    freeCamDrag.active = false
  }

  // ── Resize / Dispose ───────────────────────────────────────────────────────────
  function resize() {
    const canvas = canvasRef.value
    if (!canvas || !renderer) return
    const W = canvas.clientWidth, H = canvas.clientHeight, a = W / H
    orthoCamera.left = -camFrustum * a; orthoCamera.right  =  camFrustum * a
    orthoCamera.top  =  camFrustum;     orthoCamera.bottom = -camFrustum
    orthoCamera.updateProjectionMatrix()
    perspCamera.aspect = a
    perspCamera.updateProjectionMatrix()
    renderer.setSize(W, H, false)
  }

  function dispose() {
    cancelAnimationFrame(animId)
    _detachControls()
    renderer?.dispose()
  }

  // ── Init ──────────────────────────────────────────────────────────────────────
  function init() {
    const canvas = canvasRef.value
    const W = canvas.clientWidth, H = canvas.clientHeight

    renderer = new WebGLRenderer({ canvas, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(W, H, false)
    renderer.shadowMap.enabled = true
    renderer.outputColorSpace = SRGBColorSpace
    renderer.toneMapping = ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.0

    scene = new Scene()
    scene.background = _bgColor
    scene.fog = new FogExp2(0x000000, 0.004)

    _buildCameras(W, H)
    _buildLights()
    _buildSky()
    _buildClouds()
    _buildStars()
    _attachControls(canvas)
    _startLoop()
    ready.value = true
  }

  return {
    ready, nearbyCity, enterCityZone, playerPos, playerMode, cameraModeRef, timeOfDay,
    init, loadWorld, checkNearbyCities, resize, dispose,
  }
}
