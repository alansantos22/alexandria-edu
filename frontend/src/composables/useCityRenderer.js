import { ref } from 'vue'
import {
  WebGLRenderer, Scene, OrthographicCamera, Color, FogExp2,
  AmbientLight, DirectionalLight,
  BoxGeometry, PlaneGeometry, GridHelper,
  MeshLambertMaterial, MeshBasicMaterial,
  InstancedMesh, Mesh,
  Matrix4, Vector3,
  Raycaster, Plane,
} from 'three'

const CHUNK_SIZE = 16
const CELL       = 1.4   // world units per grid cell

// Procedural chunk type → [heightY, hex color]
const BUILDING_DEFS = {
  1: [0.9,  0xc8bfe8],  // small house   (soft lavender)
  2: [1.6,  0x8b9dc3],  // medium house  (slate blue)
  3: [0.9,  0x6c5ce7],  // commerce      (brand violet)
  4: [2.8,  0x00d9c0],  // tower         (brand teal)
  5: [0.2,  0x2ecc71],  // park          (green)
  6: [2.0,  0xff6b9d],  // landmark      (brand accent)
}

// City palette category → color
const CATEGORY_COLORS = {
  residential: 0xc8bfe8,
  commercial:  0x8b9dc3,
  nature:      0x2ecc71,
  road:        0x636e72,
  decoration:  0xff6b9d,
}

function _categoryHeight(item) {
  if (item.category === 'nature')     return 0.3 * Math.max(item.sizeX, item.sizeZ)
  if (item.category === 'decoration') return 0.5
  if (item.category === 'road')       return 0.05
  return Math.max(item.sizeX, item.sizeZ) * 0.9
}

export function useCityRenderer(canvasRef) {
  let renderer, scene, camera, animId
  let ground, grid

  // Build mode internals
  let buildGrid    = null
  let ghostMesh    = null
  let _buildHoverCb = null
  let _buildClickCb = null
  const placedMeshes = new Map()  // buildingId → Mesh
  const raycaster    = new Raycaster()
  const groundPlane  = new Plane(new Vector3(0, 1, 0), 0)

  // Mutable camera state (not reactive — updated inside rAF)
  const cam = {
    target:     new Vector3(0, 0, 0),
    angle:      Math.PI / 4,
    radius:     28,
    elevation:  22,
    frustum:    14,
    minFrustum: 4,
    maxFrustum: 40,
  }

  // Pointer drag state
  const drag = { active: false, button: -1, startX: 0, startY: 0, lastX: 0, lastY: 0 }

  let buildMode = false

  // Public reactive state
  const ready      = ref(false)
  const cityCenter = ref({ x: 0, z: 0 })

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
    canvas.addEventListener('mouseleave',  _onMouseLeave, { passive: true })
    canvas.addEventListener('wheel',       _onWheel,      { passive: false })
    canvas.addEventListener('contextmenu', e => e.preventDefault())
  }

  function _detachControls(canvas) {
    canvas.removeEventListener('mousedown',  _onMouseDown)
    canvas.removeEventListener('mousemove',  _onMouseMove)
    canvas.removeEventListener('mouseup',    _onMouseUp)
    canvas.removeEventListener('mouseleave', _onMouseLeave)
    canvas.removeEventListener('wheel',      _onWheel)
  }

  function _onMouseDown(e) {
    drag.active  = true
    drag.button  = e.button
    drag.startX  = e.clientX
    drag.startY  = e.clientY
    drag.lastX   = e.clientX
    drag.lastY   = e.clientY
  }

  function _onMouseMove(e) {
    // Build mode hover (only when not dragging)
    if (buildMode && !drag.active && _buildHoverCb) {
      _buildHoverCb(e.clientX, e.clientY)
    }

    if (!drag.active) return
    const dx = e.clientX - drag.lastX
    const dy = e.clientY - drag.lastY
    drag.lastX = e.clientX
    drag.lastY = e.clientY

    if (drag.button === 0) {
      // Left drag → pan (works in both modes)
      const panSpeed = cam.frustum * 0.012
      const right = new Vector3(Math.cos(cam.angle), 0, -Math.sin(cam.angle))
      const fwd   = new Vector3(-Math.sin(cam.angle), 0, -Math.cos(cam.angle))
      cam.target.addScaledVector(right, -dx * panSpeed)
      cam.target.addScaledVector(fwd,    dy * panSpeed)
    } else if (drag.button === 2 && !buildMode) {
      // Right drag → orbit (disabled in build mode)
      cam.angle -= dx * 0.008
    }
    _positionCamera()
  }

  function _onMouseUp(e) {
    if (drag.active) {
      const dist = Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY)
      if (buildMode && dist < 5 && _buildClickCb) {
        _buildClickCb(e)
      }
    }
    drag.active = false
  }

  function _onMouseLeave() {
    drag.active = false
  }

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

  // ── Procedural city loading (chunk system) ─────────────────────────

  const meshes = []

  function loadCity(chunks) {
    _clearMeshes()
    if (!chunks.length) return

    const byType = new Map()
    for (const chunk of chunks) {
      for (const cell of _decodeChunk(chunk)) {
        if (!byType.has(cell.type)) byType.set(cell.type, [])
        byType.get(cell.type).push(cell)
      }
    }

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

  // ── Build mode ─────────────────────────────────────────────────────

  function enterBuildMode(buildings) {
    buildMode = true

    // Show fine build grid aligned to CELL (1.4 units): 100 cells × 1.4 = 140 units
    if (!buildGrid) {
      buildGrid = new GridHelper(140, 100, 0x6c5ce7, 0x3d2080)
      buildGrid.material.opacity = 0
      buildGrid.material.transparent = true
      scene.add(buildGrid)
    }
    buildGrid.position.set(cam.target.x, 0.01, cam.target.z)
    buildGrid.visible = true
    _fadeBuildGrid(0, 0.7, 400)

    // Load placed buildings into scene
    for (const b of buildings) {
      _addPlacedMesh(b)
    }
  }

  function exitBuildMode() {
    buildMode = false
    _fadeBuildGrid(0.7, 0, 300, () => {
      if (buildGrid) buildGrid.visible = false
    })
    _clearGhostMesh()
    _clearPlacedMeshes()
    _buildHoverCb = null
    _buildClickCb = null
  }

  function setBuildCallbacks(onHover, onClick) {
    _buildHoverCb = onHover
    _buildClickCb = onClick
  }

  function raycastToGrid(clientX, clientY) {
    const canvas = canvasRef.value
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const nx = ((clientX - rect.left) / rect.width)  * 2 - 1
    const ny = -((clientY - rect.top)  / rect.height) * 2 + 1

    raycaster.setFromCamera({ x: nx, y: ny }, camera)
    const intersects = raycaster.intersectObject(ground)
    if (!intersects.length) return null

    const pt = intersects[0].point
    return {
      gridX: Math.floor(pt.x / CELL),
      gridZ: Math.floor(pt.z / CELL),
    }
  }

  function setGhostItem(item) {
    _clearGhostMesh()
    const w = item.sizeX * CELL * 0.92
    const d = item.sizeZ * CELL * 0.92
    const h = _categoryHeight(item)
    const geo = new BoxGeometry(w, h, d)
    const mat = new MeshBasicMaterial({
      color: 0x00d9c0,
      transparent: true,
      opacity: 0.45,
    })
    ghostMesh = new Mesh(geo, mat)
    ghostMesh.visible = false
    scene.add(ghostMesh)
  }

  function moveGhost(gridX, gridZ, isValid) {
    if (!ghostMesh) return
    const geo    = ghostMesh.geometry
    const h      = geo.parameters.height
    const halfW  = (geo.parameters.width  / 0.92 * 0.92) / 2
    const halfD  = (geo.parameters.depth  / 0.92 * 0.92) / 2
    const sizeX  = Math.round(geo.parameters.width  / (CELL * 0.92))
    const sizeZ  = Math.round(geo.parameters.depth  / (CELL * 0.92))
    ghostMesh.position.set(
      gridX * CELL + sizeX * CELL / 2,
      h / 2,
      gridZ * CELL + sizeZ * CELL / 2,
    )
    ghostMesh.material.color.setHex(isValid ? 0x00d9c0 : 0xff4444)
    ghostMesh.material.opacity = isValid ? 0.45 : 0.35
    ghostMesh.visible = true
  }

  function clearGhost() {
    if (ghostMesh) ghostMesh.visible = false
  }

  function addPlacedBuilding(building) {
    _addPlacedMesh(building)
  }

  function removePlacedBuilding(buildingId) {
    const mesh = placedMeshes.get(buildingId)
    if (!mesh) return
    scene.remove(mesh)
    mesh.geometry.dispose()
    mesh.material.dispose()
    placedMeshes.delete(buildingId)
  }

  function replacePlacedBuilding(oldId, newId) {
    const mesh = placedMeshes.get(oldId)
    if (!mesh) return
    placedMeshes.delete(oldId)
    placedMeshes.set(newId, mesh)
    mesh.userData.buildingId = newId
  }

  function _addPlacedMesh(building) {
    const item = building.paletteItem
    if (!item) return
    const w = item.sizeX * CELL * 0.92
    const d = item.sizeZ * CELL * 0.92
    const h = _categoryHeight(item)
    const color = CATEGORY_COLORS[item.category] ?? 0xaaaaaa

    const geo  = new BoxGeometry(w, h, d)
    const mat  = new MeshLambertMaterial({ color })
    const mesh = new Mesh(geo, mat)
    mesh.castShadow = mesh.receiveShadow = true
    mesh.position.set(
      building.gridX * CELL + item.sizeX * CELL / 2,
      h / 2,
      building.gridZ * CELL + item.sizeZ * CELL / 2,
    )
    mesh.userData.buildingId = building.id
    scene.add(mesh)
    placedMeshes.set(building.id, mesh)
  }

  function _clearGhostMesh() {
    if (!ghostMesh) return
    scene.remove(ghostMesh)
    ghostMesh.geometry.dispose()
    ghostMesh.material.dispose()
    ghostMesh = null
  }

  function _clearPlacedMeshes() {
    placedMeshes.forEach((mesh) => {
      scene.remove(mesh)
      mesh.geometry.dispose()
      mesh.material.dispose()
    })
    placedMeshes.clear()
  }

  function _fadeBuildGrid(from, to, durationMs, onDone) {
    if (!buildGrid) return
    const start = performance.now()
    function step(now) {
      const t = Math.min((now - start) / durationMs, 1)
      buildGrid.material.opacity = from + (to - from) * t
      if (t < 1) requestAnimationFrame(step)
      else if (onDone) onDone()
    }
    requestAnimationFrame(step)
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
    _clearPlacedMeshes()
    _clearGhostMesh()
    ground?.geometry.dispose()
    ground?.material.dispose()
    buildGrid?.geometry.dispose()
    buildGrid?.material.dispose()
    renderer?.dispose()
  }

  return {
    ready, cityCenter,
    // Core
    init, loadCity, resize, dispose,
    // Build mode
    enterBuildMode, exitBuildMode,
    setBuildCallbacks,
    raycastToGrid,
    setGhostItem, moveGhost, clearGhost,
    addPlacedBuilding, removePlacedBuilding, replacePlacedBuilding,
  }
}
