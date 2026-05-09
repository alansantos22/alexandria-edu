import { ref } from 'vue'
import {
  WebGLRenderer, Scene, OrthographicCamera, PerspectiveCamera, Color, FogExp2,
  AmbientLight, DirectionalLight, HemisphereLight,
  BoxGeometry, PlaneGeometry, ConeGeometry, CylinderGeometry,
  MeshLambertMaterial,
  InstancedMesh, Mesh, Group,
  Matrix4, Vector3,
} from 'three'
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js'

// ── Constants ──────────────────────────────────────────────────────────────────
const WORLD_SCALE    = 80
const PLOT_RADIUS    = 13
const ROAD_WIDTH     = 7        // total asphalt (2 lanes)
const SIDEWALK_W     = 2.5
const CURB_W         = 0.35
const HALF_ROAD_TOTAL = ROAD_WIDTH / 2 + CURB_W + SIDEWALK_W  // 6.35
// Cities sit in the block corner, clearly off the road
const CORNER_OFFSET  = Math.ceil(HALF_ROAD_TOTAL + 3 + PLOT_RADIUS)  // 23
const ROAD_REACH     = 1800     // road extends this far from origin
const ROAD_GRID_N    = 5        // roads at n = -5 … +5 per axis
const MAX_TREES      = 1200
const TERRAIN_HALF   = 420
const ENTER_DIST     = 6
const DASH_LEN       = 4
const GAP_LEN        = 6

const noise = new SimplexNoise()

function seededRng(seed) {
  let s = (seed ^ 0xdeadbeef) >>> 0
  return () => {
    s = Math.imul(s ^ (s >>> 15), s | 1)
    s ^= s + Math.imul(s ^ (s >>> 7), s | 61)
    return ((s ^ (s >>> 14)) >>> 0) / 0xffffffff
  }
}

// Flat world — no elevation
function groundY() { return 0 }

// Visual world position of a city plot (beside road, not on it)
function cityVisualPos(city) {
  return new Vector3(
    city.worldX * WORLD_SCALE + CORNER_OFFSET,
    0,
    city.worldZ * WORLD_SCALE + CORNER_OFFSET,
  )
}

// ── Composable ────────────────────────────────────────────────────────────────
export function useWorldRenderer(canvasRef) {
  let renderer, scene, orthoCamera, perspCamera, camera, animId
  let camFrustum = 20
  let lastTime   = 0
  let cameraMode = 0

  const keysDown    = new Set()
  const roadSegments = []
  const ambientCars  = []

  let mode = 'walking'

  const npc = {
    group: null,
    pos:   new Vector3(0, 0, 8),
    angle: 0,
    speed: 0,
    maxSpeed: 5.5, accel: 18, friction: 14, turnSpeed: 3.2,
  }
  const vehicle = {
    mesh:  null,
    pos:   new Vector3(0, 0, 0),
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

  // ── Init ──────────────────────────────────────────────────────────────────────
  function init() {
    const canvas = canvasRef.value
    const W = canvas.clientWidth, H = canvas.clientHeight

    renderer = new WebGLRenderer({ canvas, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(W, H, false)
    renderer.shadowMap.enabled = true

    scene = new Scene()
    scene.background = new Color(0x0a1808)
    scene.fog = new FogExp2(0x0a1808, 0.004)

    _buildCameras(W, H)
    _buildLights()
    _attachControls(canvas)
    _startLoop()
    ready.value = true
  }

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
    scene.add(new AmbientLight(0xffffff, 0.78))
    scene.add(new HemisphereLight(0xb8d4a0, 0x2a4a1a, 0.38))
    const sun = new DirectionalLight(0xfff4d6, 1.0)
    sun.position.set(40, 80, 30)
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    Object.assign(sun.shadow.camera, { left: -150, right: 150, top: 150, bottom: -150 })
    scene.add(sun)
  }

  // ── World generation ───────────────────────────────────────────────────────────
  function loadWorld(cities) {
    _generateTerrain()
    _generateRoads()           // independent of cities
    _generateVegetation(cities)
    _generateCityPlots(cities)
    _spawnAmbientCars()
    _spawnVehicle()
    _spawnNpc()
  }

  function _generateTerrain() {
    // Flat ground — no vertex displacement
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

    // InstancedMesh for dashes — one per axis direction
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

      // ── Z-axis road (runs along Z at x=coord) ───────────────────────────────
      const zRoad = new Mesh(new BoxGeometry(ROAD_WIDTH, 0.015, len), roadMat)
      zRoad.position.set(coord, 0.008, 0)
      zRoad.receiveShadow = true
      scene.add(zRoad)

      // ── X-axis road (runs along X at z=coord) ── slightly higher for intersect ─
      const xRoad = new Mesh(new BoxGeometry(len, 0.015, ROAD_WIDTH), roadMat)
      xRoad.position.set(0, 0.014, coord)
      xRoad.receiveShadow = true
      scene.add(xRoad)

      // Sidewalks + curbs for both axes
      ;[-1, 1].forEach(side => {
        const curbOff = ROAD_WIDTH / 2 + CURB_W / 2
        const swOff   = ROAD_WIDTH / 2 + CURB_W + SIDEWALK_W / 2

        // Z-axis road sides
        const zCurb = new Mesh(new BoxGeometry(CURB_W, 0.1, len), curbMat)
        zCurb.position.set(coord + side * curbOff, 0.05, 0)
        scene.add(zCurb)

        const zSw = new Mesh(new BoxGeometry(SIDEWALK_W, 0.04, len), swMat)
        zSw.position.set(coord + side * swOff, 0.02, 0)
        zSw.receiveShadow = true
        scene.add(zSw)

        // X-axis road sides
        const xCurb = new Mesh(new BoxGeometry(len, 0.1, CURB_W), curbMat)
        xCurb.position.set(0, 0.055, coord + side * curbOff)
        scene.add(xCurb)

        const xSw = new Mesh(new BoxGeometry(len, 0.04, SIDEWALK_W), swMat)
        xSw.position.set(0, 0.025, coord + side * swOff)
        xSw.receiveShadow = true
        scene.add(xSw)
      })

      // Center dashes — instanced
      for (let d = 0; d < dashesPerRoad; d++) {
        const t = -ROAD_REACH + d * PERIOD + PERIOD / 2
        m.setPosition(coord, 0.025, t); zDashInst.setMatrixAt(zIdx++, m)
        m.setPosition(t, 0.03, coord);  xDashInst.setMatrixAt(xIdx++, m)
      }

      // Store for ambient cars + _nearRoad
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
      placed.push({ x, z, s: 0.55 + rng() * 0.85 })
    }

    const n        = placed.length
    const trunkMat = new MeshLambertMaterial({ color: 0x3e2a18 })
    const coneMat  = new MeshLambertMaterial({ color: 0x1e5c18 })
    const trunkInst = new InstancedMesh(new CylinderGeometry(0.1, 0.16, 1.0, 5), trunkMat, n)
    const coneInst  = new InstancedMesh(new ConeGeometry(0.88, 2.2, 6), coneMat, n)
    trunkInst.castShadow = coneInst.castShadow = true

    const mm = new Matrix4()
    placed.forEach(({ x, z, s }, i) => {
      mm.makeScale(s, s, s); mm.setPosition(x, 0.5 * s, z);       trunkInst.setMatrixAt(i, mm)
      mm.makeScale(s, s, s); mm.setPosition(x, 1.65 * s, z);      coneInst.setMatrixAt(i, mm)
    })
    trunkInst.instanceMatrix.needsUpdate = coneInst.instanceMatrix.needsUpdate = true
    scene.add(trunkInst, coneInst)
  }

  function _generateCityPlots(cities) {
    const platMat   = new MeshLambertMaterial({ color: 0x1a1a2e })
    const borderMat = new MeshLambertMaterial({ color: 0x6c5ce7 })
    const size      = PLOT_RADIUS * 2

    cities.forEach(city => {
      const vp = cityVisualPos(city)
      const plat = new Mesh(new BoxGeometry(size, 0.18, size), platMat)
      plat.position.set(vp.x, 0.09, vp.z)
      plat.receiveShadow = true
      scene.add(plat)

      const border = new Mesh(new BoxGeometry(size + 0.5, 0.1, size + 0.5), borderMat)
      border.position.set(vp.x, 0.05, vp.z)
      scene.add(border)
    })
  }

  function _spawnAmbientCars() {
    const palette = [0x8b9dc3, 0x4a9eff, 0x00d9c0, 0xff6b9d, 0xffd166, 0xc8bfe8]
    const carGeo  = new BoxGeometry(1.5, 0.65, 2.8)
    const rng     = seededRng(0xf00dcafe)

    // Only spawn cars on roads near the world origin (feels populated, avoids clutter)
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
  function _spawnVehicle() {
    const geo = new BoxGeometry(1.4, 0.68, 2.8)
    vehicle.mesh = new Mesh(geo, new MeshLambertMaterial({ color: 0x6c5ce7 }))
    vehicle.mesh.castShadow = true
    const hMat = new MeshLambertMaterial({ color: 0xfff4e0, emissive: 0xfff4e0, emissiveIntensity: 0.8 })
    ;[-0.44, 0.44].forEach(ox => {
      const h = new Mesh(new BoxGeometry(0.28, 0.14, 0.1), hMat)
      h.position.set(ox, 0.1, -1.45)
      vehicle.mesh.add(h)
    })
    vehicle.mesh.position.copy(vehicle.pos)
    scene.add(vehicle.mesh)
  }

  // ── NPC ────────────────────────────────────────────────────────────────────────
  function _spawnNpc() {
    npc.group = new Group()
    const body = new Mesh(new BoxGeometry(0.5, 1.1, 0.35), new MeshLambertMaterial({ color: 0x8e7df0 }))
    body.position.set(0, 0.55, 0)
    body.castShadow = true
    const head = new Mesh(new BoxGeometry(0.4, 0.4, 0.4), new MeshLambertMaterial({ color: 0xf0d4b0 }))
    head.position.set(0, 1.3, 0)
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
  }

  // ── Game loop ──────────────────────────────────────────────────────────────────
  function _startLoop() {
    function tick(now = 0) {
      animId = requestAnimationFrame(tick)
      const dt = Math.min((now - lastTime) / 1000, 0.05)
      lastTime = now
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
    if (Math.abs(npc.speed) > 0.1) {
      npc.angle += ((left ? 1 : 0) - (right ? 1 : 0)) * npc.turnSpeed * dt * Math.sign(npc.speed)
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
    playerPos.value = { x: Math.round(vehicle.pos.x), z: Math.round(vehicle.pos.z) }
  }

  function _updateAmbientCars(dt) {
    ambientCars.forEach(car => {
      const { seg, speed, dir, lane } = car.userData
      car.userData.t += (speed * dt / seg.length) * dir
      if (car.userData.t > 1) car.userData.t = 0
      if (car.userData.t < 0) car.userData.t = 1
      const p = seg.from.clone().lerp(seg.to, car.userData.t)
      if (seg.axis === 'x') p.z += lane
      else                  p.x += lane
      car.position.set(p.x, 0.42, p.z)
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
      const idealX = target.x - Math.sin(angle) * 12
      const idealZ = target.z - Math.cos(angle) * 12
      camPos.x += (idealX          - camPos.x) * lerpK
      camPos.y += (target.y + 5    - camPos.y) * lerpK
      camPos.z += (idealZ          - camPos.z) * lerpK
      camLookAt.x += (target.x     - camLookAt.x) * lerpK
      camLookAt.y += (target.y + 1 - camLookAt.y) * lerpK
      camLookAt.z += (target.z     - camLookAt.z) * lerpK
    } else {
      camera = perspCamera
      const lf = Math.min(1, 18 * dt)
      camPos.x += (target.x + Math.sin(angle) * 0.3 - camPos.x) * lf
      camPos.y += (target.y + 1.6                   - camPos.y) * lf
      camPos.z += (target.z + Math.cos(angle) * 0.3 - camPos.z) * lf
      camLookAt.set(camPos.x + Math.sin(angle) * 10, camPos.y, camPos.z + Math.cos(angle) * 10)
    }

    camera.position.copy(camPos)
    camera.lookAt(camLookAt)

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
      if (Math.abs(x - c) < margin) return true   // Z-axis road
      if (Math.abs(z - c) < margin) return true   // X-axis road
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
  }

  function _detachControls() {
    window.removeEventListener('keydown', _onKey)
    window.removeEventListener('keyup',   _onKey)
    canvasRef.value?.removeEventListener('wheel', _onWheel)
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

  return {
    ready, nearbyCity, enterCityZone, playerPos, playerMode, cameraModeRef,
    init, loadWorld, checkNearbyCities, resize, dispose,
  }
}
