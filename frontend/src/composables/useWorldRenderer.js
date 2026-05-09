import { ref } from 'vue'
import {
  WebGLRenderer, Scene, OrthographicCamera, Color, FogExp2,
  AmbientLight, DirectionalLight, HemisphereLight,
  BoxGeometry, PlaneGeometry, ConeGeometry, CylinderGeometry,
  MeshLambertMaterial,
  InstancedMesh, Mesh, Group,
  Matrix4, Vector3,
} from 'three'
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js'

// ── Constants ──────────────────────────────────────────────────────────────────
const WORLD_SCALE  = 80
const PLOT_RADIUS  = 13
const ROAD_WIDTH   = 3.5
const ROAD_MARGIN  = ROAD_WIDTH * 2.8
const STUB_LENGTH  = WORLD_SCALE * 1.4   // road extending from city into open world
const MAX_TREES    = 1600
const TERRAIN_HALF = 420
const ENTER_DIST   = 5                   // distance to auto-enter vehicle

const noise = new SimplexNoise()

function seededRng(seed) {
  let s = (seed ^ 0xdeadbeef) >>> 0
  return () => {
    s = Math.imul(s ^ (s >>> 15), s | 1)
    s ^= s + Math.imul(s ^ (s >>> 7), s | 61)
    return ((s ^ (s >>> 14)) >>> 0) / 0xffffffff
  }
}

function groundY(x, z) {
  return noise.noise(x * 0.009, z * 0.009) * 0.3
       + noise.noise(x * 0.028, z * 0.028) * 0.08
}

function cityWorldPos(city) {
  return new Vector3(city.worldX * WORLD_SCALE, 0, city.worldZ * WORLD_SCALE)
}

// ── Composable ────────────────────────────────────────────────────────────────
export function useWorldRenderer(canvasRef) {
  let renderer, scene, camera, animId
  let camFrustum = 20
  let lastTime   = 0

  const keysDown     = new Set()
  const roadSegments = []
  const ambientCars  = []

  // ── Mode: 'walking' | 'driving' ─────────────────────────────────────────────
  let mode = 'walking'

  // ── NPC (body + head group) ──────────────────────────────────────────────────
  const npc = {
    group: null,
    pos:   new Vector3(4, 0, 0),
    angle: 0,
    speed: 0,
    maxSpeed:  5.5,
    accel:     18,
    friction:  14,
    turnSpeed: 3.2,
  }

  // ── Vehicle ──────────────────────────────────────────────────────────────────
  const vehicle = {
    mesh:  null,
    pos:   new Vector3(0, 0, 0),
    angle: 0,
    speed: 0,
    maxSpeed:  15,
    accel:     24,
    friction:  9,
    turnSpeed: 2.3,
  }

  // Camera lerp targets
  const camPos    = new Vector3()
  const camLookAt = new Vector3()

  // Reactive
  const ready      = ref(false)
  const nearbyCity = ref(null)
  const playerPos  = ref({ x: 0, z: 0 })
  const playerMode = ref('walking')  // exposed to template

  // ── Init ─────────────────────────────────────────────────────────────────────
  function init() {
    const canvas = canvasRef.value
    const W = canvas.clientWidth, H = canvas.clientHeight

    renderer = new WebGLRenderer({ canvas, antialias: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(W, H, false)
    renderer.shadowMap.enabled = true

    scene = new Scene()
    scene.background = new Color(0x0c1a0a)
    scene.fog = new FogExp2(0x0c1a0a, 0.006)

    _buildCamera(W, H)
    _buildLights()
    _attachControls(canvas)
    _startLoop()

    ready.value = true
  }

  function _buildCamera(W, H) {
    const a = W / H
    camera = new OrthographicCamera(-camFrustum * a, camFrustum * a, camFrustum, -camFrustum, 0.1, 900)
    camPos.set(npc.pos.x + 18, 18, npc.pos.z + 18)
    camLookAt.copy(npc.pos)
    camera.position.copy(camPos)
    camera.lookAt(camLookAt)
  }

  function _buildLights() {
    scene.add(new AmbientLight(0xffffff, 0.72))
    scene.add(new HemisphereLight(0xb8d4a0, 0x2a4a1a, 0.42))

    const sun = new DirectionalLight(0xfff4d6, 1.1)
    sun.position.set(40, 80, 30)
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    Object.assign(sun.shadow.camera, { left: -150, right: 150, top: 150, bottom: -150 })
    scene.add(sun)
  }

  // ── World generation ──────────────────────────────────────────────────────────
  function loadWorld(cities) {
    _generateTerrain()
    _generateRoads(cities)
    _generateVegetation(cities)
    _generateCityPlots(cities)
    _spawnAmbientCars()
    _spawnVehicle()
    _spawnNpc()
  }

  function _generateTerrain() {
    const size = TERRAIN_HALF * 2
    const geo  = new PlaneGeometry(size, size, 100, 100)
    const pos  = geo.attributes.position

    // PlaneGeometry is in local XY plane. After mesh.rotation.x = -PI/2:
    //   localX → worldX, localZ → worldY (height), localY → world -Z
    // So we must displace localZ to get actual vertical terrain height.
    // Sample noise using (localX, localY) ≈ (worldX, worldZ) with sign flip.
    for (let i = 0; i < pos.count; i++) {
      pos.setZ(i, groundY(pos.getX(i), pos.getY(i)))
    }
    geo.computeVertexNormals()

    const mesh = new Mesh(geo, new MeshLambertMaterial({ color: 0x3a7a28 }))
    mesh.rotation.x = -Math.PI / 2
    mesh.receiveShadow = true
    scene.add(mesh)
  }

  function _generateRoads(cities) {
    roadSegments.length = 0

    const roadMat = new MeshLambertMaterial({ color: 0x111118 })
    const dashMat = new MeshLambertMaterial({ color: 0xffd166 })

    // ── 1. City-to-city roads (orthogonal neighbors) ─────────────────────────
    for (let i = 0; i < cities.length; i++) {
      for (let j = i + 1; j < cities.length; j++) {
        const a = cities[i], b = cities[j]
        const dx = Math.abs(a.worldX - b.worldX)
        const dz = Math.abs(a.worldZ - b.worldZ)
        if (dx + dz !== 1) continue

        const from = cityWorldPos(a)
        const to   = cityWorldPos(b)
        _placeRoadSegment(from, to, roadMat, dashMat)
        roadSegments.push({ from: from.clone(), to: to.clone(), axis: dx === 1 ? 'x' : 'z', length: WORLD_SCALE })
      }
    }

    // ── 2. Stub roads from every city outward (4 cardinal dirs) ─────────────
    const dirs = [
      { dx: 1, dz: 0 }, { dx: -1, dz: 0 },
      { dx: 0, dz: 1 }, { dx: 0, dz: -1 },
    ]

    cities.forEach(city => {
      dirs.forEach(({ dx, dz }) => {
        // Skip if a city-to-city road already covers this direction
        const hasNeighbor = cities.some(c =>
          c.worldX === city.worldX + dx && c.worldZ === city.worldZ + dz,
        )
        if (hasNeighbor) return

        const cx  = city.worldX * WORLD_SCALE
        const cz  = city.worldZ * WORLD_SCALE
        const from = new Vector3(cx + dx * PLOT_RADIUS, 0, cz + dz * PLOT_RADIUS)
        const to   = new Vector3(cx + dx * (PLOT_RADIUS + STUB_LENGTH), 0, cz + dz * (PLOT_RADIUS + STUB_LENGTH))

        _placeRoadSegment(from, to, roadMat, dashMat)
        roadSegments.push({ from: from.clone(), to: to.clone(), axis: dx !== 0 ? 'x' : 'z', length: STUB_LENGTH })
      })
    })
  }

  function _placeRoadSegment(from, to, roadMat, dashMat) {
    const dx  = to.x - from.x
    const dz  = to.z - from.z
    const len = Math.sqrt(dx * dx + dz * dz)
    const cx  = (from.x + to.x) / 2
    const cz  = (from.z + to.z) / 2
    const axis = Math.abs(dx) > Math.abs(dz) ? 'x' : 'z'

    const roadGeo = axis === 'x'
      ? new BoxGeometry(len, 0.08, ROAD_WIDTH)
      : new BoxGeometry(ROAD_WIDTH, 0.08, len)

    const road = new Mesh(roadGeo, roadMat)
    road.position.set(cx, 0.04, cz)
    road.receiveShadow = true
    scene.add(road)

    // Dashed center line
    const dashLen = 3, gapLen = 4
    let t = gapLen / 2
    while (t + dashLen < len) {
      const p = from.clone().lerp(to, (t + dashLen / 2) / len)
      const dg = axis === 'x'
        ? new BoxGeometry(dashLen, 0.1, 0.22)
        : new BoxGeometry(0.22, 0.1, dashLen)
      const d = new Mesh(dg, dashMat)
      d.position.set(p.x, 0.06, p.z)
      scene.add(d)
      t += dashLen + gapLen
    }
  }

  function _generateVegetation(cities) {
    const rng     = seededRng(0xabc123)
    const placed  = []
    let   attempts = 0

    while (placed.length < MAX_TREES && attempts < MAX_TREES * 6) {
      attempts++
      const x = (rng() * 2 - 1) * TERRAIN_HALF * 0.92
      const z = (rng() * 2 - 1) * TERRAIN_HALF * 0.92
      if (_nearRoad(x, z) || _nearCity(x, z, cities)) continue
      placed.push({ x, z, s: 0.55 + rng() * 0.85 })
    }

    const n = placed.length

    const trunkGeo  = new CylinderGeometry(0.1, 0.16, 1.0, 5)
    const trunkMat  = new MeshLambertMaterial({ color: 0x3e2a18 })
    const trunkMesh = new InstancedMesh(trunkGeo, trunkMat, n)
    trunkMesh.castShadow = true

    const coneGeo  = new ConeGeometry(0.88, 2.2, 6)
    const coneMat  = new MeshLambertMaterial({ color: 0x1e5c18 })
    const coneMesh = new InstancedMesh(coneGeo, coneMat, n)
    coneMesh.castShadow = true

    const m = new Matrix4()
    placed.forEach(({ x, z, s }, i) => {
      const y = groundY(x, z)
      m.makeScale(s, s, s); m.setPosition(x, y + 0.5 * s, z)
      trunkMesh.setMatrixAt(i, m)
      m.makeScale(s, s, s); m.setPosition(x, y + 1.65 * s, z)
      coneMesh.setMatrixAt(i, m)
    })

    trunkMesh.instanceMatrix.needsUpdate = true
    coneMesh.instanceMatrix.needsUpdate  = true
    scene.add(trunkMesh, coneMesh)
  }

  function _generateCityPlots(cities) {
    const platMat   = new MeshLambertMaterial({ color: 0x1a1a2e })
    const borderMat = new MeshLambertMaterial({ color: 0x6c5ce7 })
    const size      = PLOT_RADIUS * 2

    cities.forEach(city => {
      const cx = city.worldX * WORLD_SCALE
      const cz = city.worldZ * WORLD_SCALE

      const plat = new Mesh(new BoxGeometry(size, 0.25, size), platMat)
      plat.position.set(cx, 0.12, cz)
      plat.receiveShadow = true
      plat.userData.city = city
      scene.add(plat)

      const border = new Mesh(new BoxGeometry(size + 0.5, 0.14, size + 0.5), borderMat)
      border.position.set(cx, 0.07, cz)
      scene.add(border)
    })
  }

  function _spawnAmbientCars() {
    const palette = [0x8b9dc3, 0x4a9eff, 0x00d9c0, 0xff6b9d, 0xffd166, 0xc8bfe8]
    const carGeo  = new BoxGeometry(1.5, 0.65, 2.8)
    const rng     = seededRng(0xf00dcafe)

    roadSegments.forEach((seg, si) => {
      const count = 1 + (si % 3 === 0 ? 1 : 0)
      for (let i = 0; i < count; i++) {
        const mat  = new MeshLambertMaterial({ color: palette[(si + i) % palette.length] })
        const mesh = new Mesh(carGeo, mat)
        mesh.castShadow = true

        const t    = (i + rng() * 0.5) / count
        const lane = i % 2 === 0 ? 0.9 : -0.9
        const pos  = seg.from.clone().lerp(seg.to, t)

        if (seg.axis === 'x') { pos.z += lane; mesh.rotation.y = Math.PI / 2 }
        else                  { pos.x += lane }

        mesh.position.set(pos.x, 0.42, pos.z)
        mesh.userData = { seg, t, dir: i % 2 === 0 ? 1 : -1, speed: 5 + rng() * 5, lane }
        scene.add(mesh)
        ambientCars.push(mesh)
      }
    })
  }

  // ── Player vehicle ────────────────────────────────────────────────────────────
  function _spawnVehicle() {
    const geo = new BoxGeometry(1.4, 0.68, 2.8)
    const mat = new MeshLambertMaterial({ color: 0x6c5ce7 })
    vehicle.mesh = new Mesh(geo, mat)
    vehicle.mesh.castShadow = true

    const hGeo = new BoxGeometry(0.28, 0.14, 0.1)
    const hMat = new MeshLambertMaterial({ color: 0xfff4e0, emissive: 0xfff4e0, emissiveIntensity: 0.8 })
    ;[-0.44, 0.44].forEach(ox => {
      const h = new Mesh(hGeo, hMat)
      h.position.set(ox, 0.1, -1.45)
      vehicle.mesh.add(h)
    })

    vehicle.mesh.position.copy(vehicle.pos)
    vehicle.mesh.visible = true
    scene.add(vehicle.mesh)
  }

  // ── NPC character: body (prisma) + head (cubo) ───────────────────────────────
  function _spawnNpc() {
    npc.group = new Group()

    // Body — rectangular prism
    const bodyGeo = new BoxGeometry(0.5, 1.1, 0.35)
    const bodyMat = new MeshLambertMaterial({ color: 0x8e7df0 })
    const body    = new Mesh(bodyGeo, bodyMat)
    body.position.set(0, 0.55, 0)     // feet at y=0 of group
    body.castShadow = true

    // Head — floating cube with small gap above body
    const headGeo = new BoxGeometry(0.4, 0.4, 0.4)
    const headMat = new MeshLambertMaterial({ color: 0xf0d4b0 })
    const head    = new Mesh(headGeo, headMat)
    head.position.set(0, 1.3, 0)      // 0.1 gap above body top
    head.castShadow = true

    npc.group.add(body, head)
    npc.group.position.copy(npc.pos)
    scene.add(npc.group)
  }

  // ── Enter / Exit vehicle ──────────────────────────────────────────────────────
  function _enterVehicle() {
    mode = 'driving'
    playerMode.value = 'driving'
    npc.group.visible = false
    vehicle.mesh.visible = true
  }

  function _exitVehicle() {
    mode = 'walking'
    playerMode.value = 'walking'
    // Place NPC beside vehicle (offset to right)
    const right = new Vector3(Math.cos(vehicle.angle), 0, -Math.sin(vehicle.angle))
    npc.pos.copy(vehicle.pos).addScaledVector(right, 2.2)
    npc.pos.y = groundY(npc.pos.x, npc.pos.z) + 0
    npc.angle = vehicle.angle
    npc.group.position.copy(npc.pos)
    npc.group.rotation.y = npc.angle
    npc.group.visible = true
  }

  // ── Game loop ─────────────────────────────────────────────────────────────────
  function _startLoop() {
    function tick(now = 0) {
      animId = requestAnimationFrame(tick)
      const dt = Math.min((now - lastTime) / 1000, 0.05)
      lastTime = now

      if (mode === 'walking') {
        _updateNpc(dt)
        _checkEnterVehicle()
      } else {
        _updateVehicle(dt)
      }

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
      const steer = (left ? 1 : 0) - (right ? 1 : 0)
      npc.angle += steer * npc.turnSpeed * dt * Math.sign(npc.speed)
    }

    npc.pos.x += Math.sin(npc.angle) * npc.speed * dt
    npc.pos.z += Math.cos(npc.angle) * npc.speed * dt
    npc.pos.y  = groundY(npc.pos.x, npc.pos.z)

    if (npc.group) {
      npc.group.position.copy(npc.pos)
      npc.group.rotation.y = npc.angle
    }

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
      const steer = (left ? 1 : 0) - (right ? 1 : 0)
      vehicle.angle += steer * vehicle.turnSpeed * dt * Math.sign(vehicle.speed)
    }

    vehicle.pos.x += Math.sin(vehicle.angle) * vehicle.speed * dt
    vehicle.pos.z += Math.cos(vehicle.angle) * vehicle.speed * dt
    vehicle.pos.y  = groundY(vehicle.pos.x, vehicle.pos.z) + 0.42

    if (vehicle.mesh) {
      vehicle.mesh.position.copy(vehicle.pos)
      vehicle.mesh.rotation.y = vehicle.angle
    }

    playerPos.value = { x: Math.round(vehicle.pos.x), z: Math.round(vehicle.pos.z) }
  }

  function _checkEnterVehicle() {
    if (!vehicle.mesh) return
    const dist = npc.pos.distanceTo(vehicle.pos)
    if (dist < ENTER_DIST && (keysDown.has('KeyE') || dist < 1.8)) {
      _enterVehicle()
    }
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

  function _updateCamera(dt) {
    const target = mode === 'driving' ? vehicle.pos : npc.pos
    const offset  = camFrustum * 1.15

    const idealX = target.x + offset
    const idealZ = target.z + offset
    const lerpK  = Math.min(1, 8 * dt)

    camPos.x    += (idealX - camPos.x)    * lerpK
    camPos.z    += (idealZ - camPos.z)    * lerpK
    camPos.y     = camFrustum * 1.05

    camLookAt.x += (target.x - camLookAt.x) * lerpK
    camLookAt.z += (target.z - camLookAt.z) * lerpK
    camLookAt.y  = 0

    camera.position.copy(camPos)
    camera.lookAt(camLookAt)
  }

  // Exposed: check nearby cities (called from WorldView each frame via rAF)
  function checkNearbyCities(cities) {
    nearbyCity.value = null
    const pos = mode === 'driving' ? vehicle.pos : npc.pos
    for (const city of cities) {
      const cx   = city.worldX * WORLD_SCALE
      const cz   = city.worldZ * WORLD_SCALE
      const dist = Math.hypot(pos.x - cx, pos.z - cz)
      if (dist < PLOT_RADIUS + 10) { nearbyCity.value = city; return }
    }
  }

  // ── Controls ──────────────────────────────────────────────────────────────────
  function _nearRoad(x, z) {
    for (const seg of roadSegments) {
      if (seg.axis === 'x') {
        const minX = Math.min(seg.from.x, seg.to.x) - ROAD_MARGIN
        const maxX = Math.max(seg.from.x, seg.to.x) + ROAD_MARGIN
        if (x >= minX && x <= maxX && Math.abs(z - seg.from.z) < ROAD_MARGIN) return true
      } else {
        const minZ = Math.min(seg.from.z, seg.to.z) - ROAD_MARGIN
        const maxZ = Math.max(seg.from.z, seg.to.z) + ROAD_MARGIN
        if (z >= minZ && z <= maxZ && Math.abs(x - seg.from.x) < ROAD_MARGIN) return true
      }
    }
    return false
  }

  function _nearCity(x, z, cities) {
    return cities.some(c =>
      Math.abs(x - c.worldX * WORLD_SCALE) < PLOT_RADIUS + 5 &&
      Math.abs(z - c.worldZ * WORLD_SCALE) < PLOT_RADIUS + 5,
    )
  }

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
      keysDown.add(e.code)
      if (e.code === 'KeyE' && mode === 'driving') _exitVehicle()
    } else {
      keysDown.delete(e.code)
    }
  }

  function _onWheel(e) {
    e.preventDefault()
    const canvas = canvasRef.value
    const a = canvas.clientWidth / canvas.clientHeight
    camFrustum = Math.max(8, Math.min(55, camFrustum + e.deltaY * 0.018))
    camera.left   = -camFrustum * a; camera.right  =  camFrustum * a
    camera.top    =  camFrustum;      camera.bottom = -camFrustum
    camera.updateProjectionMatrix()
  }

  // ── Resize / Dispose ──────────────────────────────────────────────────────────
  function resize() {
    const canvas = canvasRef.value
    if (!canvas || !renderer) return
    const W = canvas.clientWidth, H = canvas.clientHeight, a = W / H
    camera.left   = -camFrustum * a; camera.right  =  camFrustum * a
    camera.top    =  camFrustum;      camera.bottom = -camFrustum
    camera.updateProjectionMatrix()
    renderer.setSize(W, H, false)
  }

  function dispose() {
    cancelAnimationFrame(animId)
    _detachControls()
    renderer?.dispose()
  }

  return { ready, nearbyCity, playerPos, playerMode, init, loadWorld, checkNearbyCities, resize, dispose }
}
