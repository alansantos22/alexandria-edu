import { ref } from 'vue'
import {
  WebGLRenderer, Scene, OrthographicCamera, Color, FogExp2,
  AmbientLight, DirectionalLight, HemisphereLight,
  BoxGeometry, PlaneGeometry, ConeGeometry, CylinderGeometry,
  MeshLambertMaterial,
  InstancedMesh, Mesh,
  Matrix4, Vector3,
} from 'three'
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js'

// ── Constants ─────────────────────────────────────────────────────────────────

const WORLD_SCALE  = 80     // world-units between city grid-slot centers
const PLOT_RADIUS  = 13     // half-size of a city plot (no trees/roads inside)
const ROAD_WIDTH   = 3.5
const ROAD_MARGIN  = ROAD_WIDTH * 2.5    // tree exclusion zone around roads
const MAX_TREES    = 1800
const TERRAIN_HALF = 450

const noise = new SimplexNoise()

function seededRng(seed) {
  let s = (seed ^ 0xdeadbeef) >>> 0
  return () => {
    s = Math.imul(s ^ (s >>> 15), s | 1)
    s ^= s + Math.imul(s ^ (s >>> 7), s | 61)
    return ((s ^ (s >>> 14)) >>> 0) / 0xffffffff
  }
}

function terrainY(x, z) {
  return noise.noise(x * 0.007, z * 0.007) * 2.2
       + noise.noise(x * 0.022, z * 0.022) * 0.7
}

function worldPos(city) {
  return new Vector3(city.worldX * WORLD_SCALE, 0, city.worldZ * WORLD_SCALE)
}

// ── Composable ────────────────────────────────────────────────────────────────

export function useWorldRenderer(canvasRef) {
  let renderer, scene, camera, animId
  let lastTime = 0
  let camFrustum = 22
  const keysDown = new Set()
  const roadSegments = []   // { from, to, axis }
  const ambientCars  = []   // Three.js Mesh + userData

  const player = {
    mesh:      null,
    pos:       new Vector3(0, 0.5, 0),
    angle:     0,
    speed:     0,
    maxSpeed:  14,
    accel:     22,
    friction:  9,
    turnSpeed: 2.4,
  }

  // Reactive exports
  const ready       = ref(false)
  const nearbyCity  = ref(null)
  const playerPos   = ref({ x: 0, z: 0 })

  // ── Init ────────────────────────────────────────────────────────────────────

  function init() {
    const canvas = canvasRef.value
    const W = canvas.clientWidth
    const H = canvas.clientHeight

    renderer = new WebGLRenderer({ canvas, antialias: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(W, H, false)
    renderer.shadowMap.enabled = true

    scene = new Scene()
    scene.background = new Color(0x0b0f1e)
    scene.fog = new FogExp2(0x0b0f1e, 0.007)

    _buildCamera(W, H)
    _buildLights()
    _attachControls(canvas)
    _startLoop()

    ready.value = true
  }

  function _buildCamera(W, H) {
    const a = W / H
    camera = new OrthographicCamera(-camFrustum * a, camFrustum * a, camFrustum, -camFrustum, 0.1, 800)
    _syncCamera()
  }

  function _syncCamera() {
    camera.position.set(
      player.pos.x + camFrustum * 1.2,
      camFrustum * 1.1,
      player.pos.z + camFrustum * 1.2,
    )
    camera.lookAt(player.pos.x, 0, player.pos.z)
  }

  function _buildLights() {
    scene.add(new AmbientLight(0xffffff, 0.5))
    scene.add(new HemisphereLight(0x8ec6ff, 0x1e3a12, 0.38))

    const sun = new DirectionalLight(0xfff4d6, 1.05)
    sun.position.set(40, 80, 30)
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    Object.assign(sun.shadow.camera, { left: -150, right: 150, top: 150, bottom: -150 })
    scene.add(sun)
  }

  // ── World generation ────────────────────────────────────────────────────────

  function loadWorld(cities) {
    _generateTerrain()
    _generateRoads(cities)
    _generateVegetation(cities)
    _generateCityPlots(cities)
    _spawnAmbientCars()
    _spawnPlayer()
  }

  function _generateTerrain() {
    const size = TERRAIN_HALF * 2
    const segs = 96
    const geo  = new PlaneGeometry(size, size, segs, segs)
    const pos  = geo.attributes.position

    for (let i = 0; i < pos.count; i++) {
      pos.setY(i, terrainY(pos.getX(i), pos.getZ(i)))
    }
    geo.computeVertexNormals()

    const mesh = new Mesh(geo, new MeshLambertMaterial({ color: 0x16291a }))
    mesh.rotation.x = -Math.PI / 2
    mesh.receiveShadow = true
    scene.add(mesh)
  }

  function _generateRoads(cities) {
    roadSegments.length = 0

    const roadMat  = new MeshLambertMaterial({ color: 0x111118 })
    const dashMat  = new MeshLambertMaterial({ color: 0xffd166 })

    for (let i = 0; i < cities.length; i++) {
      for (let j = i + 1; j < cities.length; j++) {
        const a = cities[i], b = cities[j]
        const dx = Math.abs(a.worldX - b.worldX)
        const dz = Math.abs(a.worldZ - b.worldZ)
        if (dx + dz !== 1) continue     // only orthogonal grid-neighbors

        const from   = worldPos(a)
        const to     = worldPos(b)
        const axis   = dx === 1 ? 'x' : 'z'
        const length = WORLD_SCALE

        // Road slab
        const roadGeo = axis === 'x'
          ? new BoxGeometry(length, 0.08, ROAD_WIDTH)
          : new BoxGeometry(ROAD_WIDTH, 0.08, length)

        const road = new Mesh(roadGeo, roadMat)
        road.position.set((from.x + to.x) / 2, 0.04, (from.z + to.z) / 2)
        road.receiveShadow = true
        scene.add(road)

        // Center dashes
        const dashLen = 3, gapLen = 4
        let t = gapLen / 2
        while (t + dashLen < length) {
          const p = from.clone().lerp(to, (t + dashLen / 2) / length)
          const dg = axis === 'x'
            ? new BoxGeometry(dashLen, 0.1, 0.22)
            : new BoxGeometry(0.22, 0.1, dashLen)
          const d = new Mesh(dg, dashMat)
          d.position.set(p.x, 0.06, p.z)
          scene.add(d)
          t += dashLen + gapLen
        }

        roadSegments.push({ from: from.clone(), to: to.clone(), axis, length })
      }
    }
  }

  function _generateVegetation(cities) {
    const rng    = seededRng(0xabc123)
    const placed = []

    let attempts = 0
    while (placed.length < MAX_TREES && attempts < MAX_TREES * 6) {
      attempts++
      const x = (rng() * 2 - 1) * TERRAIN_HALF * 0.92
      const z = (rng() * 2 - 1) * TERRAIN_HALF * 0.92

      if (_nearRoad(x, z) || _nearCity(x, z, cities)) continue

      placed.push({ x, z, s: 0.6 + rng() * 0.9 })
    }

    const n = placed.length
    const trunkGeo = new CylinderGeometry(0.1, 0.16, 1.0, 5)
    const trunkMat = new MeshLambertMaterial({ color: 0x3e2a18 })
    const trunkMesh = new InstancedMesh(trunkGeo, trunkMat, n)
    trunkMesh.castShadow = true

    const coneGeo  = new ConeGeometry(0.88, 2.2, 6)
    const coneMat  = new MeshLambertMaterial({ color: 0x1a4a18 })
    const coneMesh = new InstancedMesh(coneGeo, coneMat, n)
    coneMesh.castShadow = true

    const m = new Matrix4()
    placed.forEach(({ x, z, s }, i) => {
      const y = terrainY(x, z)

      m.makeScale(s, s, s)
      m.setPosition(x, y + 0.5 * s, z)
      trunkMesh.setMatrixAt(i, m)

      m.makeScale(s, s, s)
      m.setPosition(x, y + 1.65 * s, z)
      coneMesh.setMatrixAt(i, m)
    })

    trunkMesh.instanceMatrix.needsUpdate = true
    coneMesh.instanceMatrix.needsUpdate  = true
    scene.add(trunkMesh, coneMesh)
  }

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

  function _generateCityPlots(cities) {
    const platformMat = new MeshLambertMaterial({ color: 0x1a1a2e })
    const borderMat   = new MeshLambertMaterial({ color: 0x6c5ce7 })
    const plotSize    = PLOT_RADIUS * 2

    cities.forEach(city => {
      const cx = city.worldX * WORLD_SCALE
      const cz = city.worldZ * WORLD_SCALE

      const platform = new Mesh(new BoxGeometry(plotSize, 0.25, plotSize), platformMat)
      platform.position.set(cx, 0.12, cz)
      platform.receiveShadow = true
      scene.add(platform)

      const border = new Mesh(new BoxGeometry(plotSize + 0.5, 0.14, plotSize + 0.5), borderMat)
      border.position.set(cx, 0.07, cz)
      scene.add(border)

      // Store userId reference for proximity detection
      platform.userData.city = city
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

        const t   = (i + rng() * 0.5) / count
        const pos = seg.from.clone().lerp(seg.to, t)

        // Offset into a lane
        const lane = (i % 2 === 0 ? 0.9 : -0.9)
        if (seg.axis === 'x') {
          pos.z += lane
          mesh.rotation.y = Math.PI / 2
        } else {
          pos.x += lane
        }

        mesh.position.set(pos.x, 0.42, pos.z)
        scene.add(mesh)

        mesh.userData = {
          seg,
          t,
          dir:   i % 2 === 0 ? 1 : -1,
          speed: 5 + rng() * 5,
          lane,
        }
        ambientCars.push(mesh)
      }
    })
  }

  function _spawnPlayer() {
    const geo = new BoxGeometry(1.4, 0.68, 2.8)
    const mat = new MeshLambertMaterial({ color: 0x6c5ce7 })
    player.mesh = new Mesh(geo, mat)
    player.mesh.castShadow = true

    // Headlights
    const hGeo = new BoxGeometry(0.3, 0.14, 0.1)
    const hMat = new MeshLambertMaterial({ color: 0xfff4e0, emissive: 0xfff4e0, emissiveIntensity: 0.9 })
    ;[-0.45, 0.45].forEach(ox => {
      const h = new Mesh(hGeo, hMat)
      h.position.set(ox, 0.1, -1.45)
      player.mesh.add(h)
    })

    player.mesh.position.copy(player.pos)
    scene.add(player.mesh)
  }

  // ── Game loop ────────────────────────────────────────────────────────────────

  function _startLoop() {
    const camLerp = new Vector3()

    function tick(now = 0) {
      animId = requestAnimationFrame(tick)
      const dt = Math.min((now - lastTime) / 1000, 0.05)
      lastTime = now

      _updatePlayer(dt)
      _updateAmbientCars(dt)

      // Smooth camera follow (isometric, fixed angle)
      const idealX = player.pos.x + camFrustum * 1.2
      const idealZ = player.pos.z + camFrustum * 1.2
      camLerp.x += (idealX - camLerp.x) * 0.07
      camLerp.z += (idealZ - camLerp.z) * 0.07
      camera.position.set(camLerp.x, camFrustum * 1.1, camLerp.z)
      camera.lookAt(player.pos.x, 0, player.pos.z)

      renderer.render(scene, camera)
    }

    tick()
  }

  function _updatePlayer(dt) {
    const fwd   = keysDown.has('ArrowUp')    || keysDown.has('KeyW')
    const back  = keysDown.has('ArrowDown')  || keysDown.has('KeyS')
    const left  = keysDown.has('ArrowLeft')  || keysDown.has('KeyA')
    const right = keysDown.has('ArrowRight') || keysDown.has('KeyD')

    if (fwd)  player.speed = Math.min(player.speed + player.accel * dt, player.maxSpeed)
    if (back) player.speed = Math.max(player.speed - player.accel * dt, -player.maxSpeed * 0.45)
    if (!fwd && !back) player.speed *= Math.max(0, 1 - player.friction * dt)

    if (Math.abs(player.speed) > 0.15) {
      const steer = (left ? 1 : 0) - (right ? 1 : 0)
      player.angle += steer * player.turnSpeed * dt * Math.sign(player.speed)
    }

    player.pos.x += Math.sin(player.angle) * player.speed * dt
    player.pos.z += Math.cos(player.angle) * player.speed * dt
    player.pos.y  = terrainY(player.pos.x, player.pos.z) + 0.42

    if (player.mesh) {
      player.mesh.position.copy(player.pos)
      player.mesh.rotation.y = player.angle
    }

    playerPos.value = { x: Math.round(player.pos.x), z: Math.round(player.pos.z) }
  }

  function _updateAmbientCars(dt) {
    ambientCars.forEach(car => {
      const { seg, speed, dir, lane } = car.userData
      car.userData.t += (speed * dt / seg.length) * dir

      if (car.userData.t > 1) car.userData.t = 0
      if (car.userData.t < 0) car.userData.t = 1

      const p = seg.from.clone().lerp(seg.to, car.userData.t)

      if (seg.axis === 'x') { p.z += lane }
      else                  { p.x += lane }

      car.position.set(p.x, 0.42, p.z)
    })
  }

  // Exposed for WorldView — check proximity each frame
  function checkNearbyCities(cities) {
    nearbyCity.value = null
    for (const city of cities) {
      const cx   = city.worldX * WORLD_SCALE
      const cz   = city.worldZ * WORLD_SCALE
      const dist = Math.hypot(player.pos.x - cx, player.pos.z - cz)
      if (dist < PLOT_RADIUS + 10) { nearbyCity.value = city; return }
    }
  }

  // ── Controls ────────────────────────────────────────────────────────────────

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
    const consumed = ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight']
    if (consumed.includes(e.key) && e.type === 'keydown') e.preventDefault()
    if (e.type === 'keydown') keysDown.add(e.code)
    else keysDown.delete(e.code)
  }

  function _onWheel(e) {
    e.preventDefault()
    const canvas = canvasRef.value
    const a = canvas.clientWidth / canvas.clientHeight
    camFrustum = Math.max(10, Math.min(55, camFrustum + e.deltaY * 0.018))
    camera.left   = -camFrustum * a; camera.right  =  camFrustum * a
    camera.top    =  camFrustum;      camera.bottom = -camFrustum
    camera.updateProjectionMatrix()
  }

  // ── Resize / Dispose ─────────────────────────────────────────────────────────

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

  return { ready, nearbyCity, playerPos, init, loadWorld, checkNearbyCities, resize, dispose }
}
