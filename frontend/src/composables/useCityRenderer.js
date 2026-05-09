import { ref } from 'vue'
import {
  WebGLRenderer, Scene, OrthographicCamera, Color, FogExp2,
  AmbientLight, DirectionalLight,
  BoxGeometry, PlaneGeometry, GridHelper,
  MeshLambertMaterial, MeshBasicMaterial,
  InstancedMesh, Mesh,
  Matrix4, Vector3,
} from 'three'

const CHUNK_SIZE = 16
const CELL      = 1.4   // world units per grid cell

// type index → [heightY, hex color]
const BUILDING_DEFS = {
  1: [0.9,  0xc8bfe8],  // small house   (soft lavender)
  2: [1.6,  0x8b9dc3],  // medium house  (slate blue)
  3: [0.9,  0x6c5ce7],  // commerce      (brand violet)
  4: [2.8,  0x00d9c0],  // tower         (brand teal)
  5: [0.2,  0x2ecc71],  // park          (green)
  6: [2.0,  0xff6b9d],  // landmark      (brand accent)
}

export function useCityRenderer(canvasRef) {
  let renderer, scene, camera, animId
  let ground, grid

  // Mutable camera state (not reactive — updated inside rAF)
  const cam = {
    target:  new Vector3(0, 0, 0),
    angle:   Math.PI / 4,          // horizontal rotation (radians)
    radius:  28,                    // distance from target projected on xz
    elevation: 22,                  // fixed y height
    frustum: 14,                    // orthographic half-size
    minFrustum: 4,
    maxFrustum: 40,
  }

  // Pointer drag state
  const drag = { active: false, button: -1, startX: 0, startZ: 0, lastX: 0, lastY: 0 }

  // Public reactive state
  const ready       = ref(false)
  const cityCenter  = ref({ x: 0, z: 0 })

  // ── Init ───────────────────────────────────────────────────────────

  function init() {
    const canvas = canvasRef.value
    const W = canvas.clientWidth
    const H = canvas.clientHeight

    renderer = new WebGLRenderer({ canvas, antialias: false, alpha: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(W, H, false)
    renderer.shadowMap.enabled = true

    scene = new Scene()
    scene.background = new Color(0x0e1124)
    scene.fog = new FogExp2(0x0e1124, 0.014)

    _buildCamera(W, H)
    _buildLights()
    _buildGround()

    _startLoop()
    _attachControls(canvas)

    ready.value = true
  }

  function _buildCamera(W, H) {
    const a = W / H
    camera = new OrthographicCamera(
      -cam.frustum * a, cam.frustum * a,
       cam.frustum,    -cam.frustum,
      0.1, 300,
    )
    _positionCamera()
  }

  function _positionCamera() {
    camera.position.set(
      cam.target.x + cam.radius * Math.sin(cam.angle),
      cam.elevation,
      cam.target.z + cam.radius * Math.cos(cam.angle),
    )
    camera.lookAt(cam.target)
  }

  function _buildLights() {
    scene.add(new AmbientLight(0xffffff, 0.65))

    const sun = new DirectionalLight(0xffffff, 1.1)
    sun.position.set(15, 30, 15)
    sun.castShadow = true
    sun.shadow.mapSize.set(1024, 1024)
    Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40 })
    scene.add(sun)

    // Soft fill from opposite direction
    const fill = new DirectionalLight(0x8e7df0, 0.25)
    fill.position.set(-10, 10, -10)
    scene.add(fill)
  }

  function _buildGround() {
    ground = new Mesh(
      new PlaneGeometry(400, 400),
      new MeshLambertMaterial({ color: 0x12162a }),
    )
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)

    grid = new GridHelper(400, 200, 0x1e2238, 0x181c2e)
    grid.material.opacity = 0.5
    grid.material.transparent = true
    scene.add(grid)
  }

  // ── Render loop ────────────────────────────────────────────────────

  function _startLoop() {
    function tick() {
      animId = requestAnimationFrame(tick)
      renderer.render(scene, camera)
    }
    tick()
  }

  // ── Camera controls ────────────────────────────────────────────────

  function _attachControls(canvas) {
    canvas.addEventListener('mousedown',   _onMouseDown,  { passive: true })
    canvas.addEventListener('mousemove',   _onMouseMove,  { passive: true })
    canvas.addEventListener('mouseup',     _onMouseUp,    { passive: true })
    canvas.addEventListener('mouseleave',  _onMouseUp,    { passive: true })
    canvas.addEventListener('wheel',       _onWheel,      { passive: false })
    canvas.addEventListener('contextmenu', e => e.preventDefault())
  }

  function _detachControls(canvas) {
    canvas.removeEventListener('mousedown',  _onMouseDown)
    canvas.removeEventListener('mousemove',  _onMouseMove)
    canvas.removeEventListener('mouseup',    _onMouseUp)
    canvas.removeEventListener('mouseleave', _onMouseUp)
    canvas.removeEventListener('wheel',      _onWheel)
  }

  function _onMouseDown(e) {
    drag.active = true
    drag.button = e.button
    drag.lastX  = e.clientX
    drag.lastY  = e.clientY
  }

  function _onMouseMove(e) {
    if (!drag.active) return
    const dx = e.clientX - drag.lastX
    const dy = e.clientY - drag.lastY
    drag.lastX = e.clientX
    drag.lastY = e.clientY

    if (drag.button === 0) {
      // Left drag → pan
      const panSpeed = cam.frustum * 0.012
      const right = new Vector3(Math.cos(cam.angle), 0, -Math.sin(cam.angle))
      const fwd   = new Vector3(-Math.sin(cam.angle), 0, -Math.cos(cam.angle))
      cam.target.addScaledVector(right, -dx * panSpeed)
      cam.target.addScaledVector(fwd,    dy * panSpeed)
    } else if (drag.button === 2) {
      // Right drag → orbit (horizontal only)
      cam.angle -= dx * 0.008
    }
    _positionCamera()
  }

  function _onMouseUp() { drag.active = false }

  function _onWheel(e) {
    e.preventDefault()
    const canvas = canvasRef.value
    const W = canvas.clientWidth
    const H = canvas.clientHeight
    const a = W / H

    cam.frustum = Math.max(cam.minFrustum, Math.min(cam.maxFrustum,
      cam.frustum + e.deltaY * 0.015,
    ))

    camera.left   = -cam.frustum * a
    camera.right  =  cam.frustum * a
    camera.top    =  cam.frustum
    camera.bottom = -cam.frustum
    camera.updateProjectionMatrix()
  }

  // ── City loading ───────────────────────────────────────────────────

  const meshes = []   // { type, mesh }

  function loadCity(chunks) {
    _clearMeshes()
    if (!chunks.length) return

    // Collect cell positions per type
    const byType = new Map()
    for (const chunk of chunks) {
      for (const cell of _decodeChunk(chunk)) {
        if (!byType.has(cell.type)) byType.set(cell.type, [])
        byType.get(cell.type).push(cell)
      }
    }

    // Build InstancedMesh per type
    const mat4 = new Matrix4()
    byType.forEach((cells, type) => {
      const def = BUILDING_DEFS[type]
      if (!def) return
      const [h, color] = def

      const geo  = new BoxGeometry(0.82, h, 0.82)
      const mat  = new MeshLambertMaterial({ color })
      const mesh = new InstancedMesh(geo, mat, cells.length)
      mesh.castShadow = mesh.receiveShadow = true

      cells.forEach((cell, i) => {
        mat4.makeTranslation(cell.x * CELL, h / 2, cell.z * CELL)
        mesh.setMatrixAt(i, mat4)
      })
      mesh.instanceMatrix.needsUpdate = true

      scene.add(mesh)
      meshes.push({ type, mesh })
    })

    // Center camera on city bounds
    const allX = chunks.map(c => c.chunkX)
    const allZ = chunks.map(c => c.chunkZ)
    const cx = ((Math.min(...allX) + Math.max(...allX)) / 2 + 0.5) * CHUNK_SIZE * CELL
    const cz = ((Math.min(...allZ) + Math.max(...allZ)) / 2 + 0.5) * CHUNK_SIZE * CELL
    cam.target.set(cx, 0, cz)
    cityCenter.value = { x: cx, z: cz }
    _positionCamera()
  }

  function _decodeChunk(chunk) {
    const cells = []
    const { dataHex, chunkX, chunkZ } = chunk
    for (let i = 0; i < dataHex.length; i++) {
      const type = parseInt(dataHex[i], 16)
      if (type === 0) continue
      cells.push({
        type,
        x: chunkX * CHUNK_SIZE + (i % CHUNK_SIZE),
        z: chunkZ * CHUNK_SIZE + Math.floor(i / CHUNK_SIZE),
      })
    }
    return cells
  }

  function _clearMeshes() {
    meshes.forEach(({ mesh }) => {
      scene.remove(mesh)
      mesh.geometry.dispose()
      mesh.material.dispose()
    })
    meshes.length = 0
  }

  // ── Resize ────────────────────────────────────────────────────────

  function resize() {
    const canvas = canvasRef.value
    if (!canvas || !renderer) return
    const W = canvas.clientWidth
    const H = canvas.clientHeight
    const a = W / H

    camera.left   = -cam.frustum * a
    camera.right  =  cam.frustum * a
    camera.top    =  cam.frustum
    camera.bottom = -cam.frustum
    camera.updateProjectionMatrix()
    renderer.setSize(W, H, false)
  }

  // ── Dispose ───────────────────────────────────────────────────────

  function dispose() {
    cancelAnimationFrame(animId)
    _detachControls(canvasRef.value)
    _clearMeshes()
    ground?.geometry.dispose()
    ground?.material.dispose()
    renderer?.dispose()
  }

  return { ready, cityCenter, init, loadCity, resize, dispose }
}
