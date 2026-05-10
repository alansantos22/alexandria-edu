import { ref } from 'vue'
import {
  WebGLRenderer, Scene, OrthographicCamera, Color, FogExp2,
  AmbientLight, DirectionalLight,
  BoxGeometry, PlaneGeometry,
  MeshLambertMaterial, MeshStandardMaterial, MeshBasicMaterial,
  InstancedMesh, Mesh, Group,
  Matrix4, Vector3,
  Raycaster, Plane, TextureLoader,
  SRGBColorSpace, ACESFilmicToneMapping,
  BufferGeometry, Float32BufferAttribute, LineSegments, LineBasicMaterial,
  EdgesGeometry,
} from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

const CHUNK_SIZE = 16
const CELL       = 1.4   // world units per grid cell
export const GRID_EXTENT    = 50              // max cells across all possible tiles
export const CELLS_PER_TILE = 10             // build grid cells per land tile (tile 0–4 → cells 0–49)

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
  monuments:   0xffd700,
}

function _categoryHeight(item) {
  if (item.category === 'nature')     return 0.3 * Math.max(item.sizeX, item.sizeZ)
  if (item.category === 'decoration') return 0.5
  if (item.category === 'monuments')  return 2.5
  if (item.category === 'road')       return 0.05
  return Math.max(item.sizeX, item.sizeZ) * 0.9
}

export function useCityRenderer(canvasRef) {
  let renderer, scene, camera, animId
  let ground

  // Build mode internals
  let buildGrid       = null
  let buildBorder     = null
  let ghostMesh       = null
  let ghostItem       = null    // palette item currently shown as ghost
  let ghostRotation   = 0       // radians – applied to ghostMesh.rotation.y
  let _ghostLoadToken = 0       // invalidates stale async GLB loads
  let ownedTileSet = new Set()   // "tileX,tileZ" strings
  const tileMeshes = []         // floor planes + border lines per owned tile
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
    renderer.outputColorSpace = SRGBColorSpace
    renderer.toneMapping = ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.0

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
      new MeshLambertMaterial({ color: 0x3d7a28 }),
    )
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)
    // No grid helper — clean green terrain
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
    _clearPlacedMeshes() // reset before re-render (e.g. retry)
    if (!chunks.length) {
      // Center camera on build zone when city is empty
      const zoneCenter = GRID_EXTENT * CELL / 2
      cam.target.set(zoneCenter, 0, zoneCenter)
      _positionCamera()
      return
    }

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
    _createBuildGrid()

    // Load placed buildings into scene (skip already loaded)
    for (const b of buildings) {
      if (!placedMeshes.has(b.id)) {
        _addPlacedMesh(b)
      }
    }
  }

  function _createBuildGrid() {
    if (buildGrid) return

    // Grid lines (horizontal lines parallel to Z axis)
    const extent = GRID_EXTENT * CELL
    const pts = []
    const gridSpacing = CELL // one grid line per cell
    const lineOpacity = 0.3

    // Lines along X direction
    for (let i = 0; i <= GRID_EXTENT; i++) {
      const pos = i * gridSpacing
      pts.push(0, 0.01, pos, extent, 0.01, pos)
    }

    // Lines along Z direction
    for (let i = 0; i <= GRID_EXTENT; i++) {
      const pos = i * gridSpacing
      pts.push(pos, 0.01, 0, pos, 0.01, extent)
    }

    const geo = new BufferGeometry()
    geo.setAttribute('position', new Float32BufferAttribute(new Float32Array(pts), 3))

    const mat = new LineBasicMaterial({ color: 0x00ff00, transparent: true, opacity: lineOpacity })
    buildGrid = new LineSegments(geo, mat)
    scene.add(buildGrid)
  }

  // ── Owned tile visualization ───────────────────────────────────────

  function setOwnedTiles(tiles) {
    _clearTileVisualization()
    ownedTileSet = new Set(tiles.map(t => `${t.tileX},${t.tileZ}`))
    _buildTileVisualization(tiles)
  }

  function _buildTileVisualization(tiles) {
    const size = CELLS_PER_TILE * CELL
    for (const { tileX, tileZ } of tiles) {
      const ox = tileX * size
      const oz = tileZ * size

      // Semi-transparent teal floor per owned tile
      const geo = new PlaneGeometry(size, size)
      const mat = new MeshBasicMaterial({ color: 0x00d9c0, transparent: true, opacity: 0.06, depthWrite: false })
      const floor = new Mesh(geo, mat)
      floor.rotation.x = -Math.PI / 2
      floor.position.set(ox + size / 2, 0.02, oz + size / 2)
      scene.add(floor)
      tileMeshes.push(floor)

      // Tile border outline
      const y = 0.04
      const pts = new Float32Array([
        ox,        y, oz,          ox + size, y, oz,
        ox + size, y, oz,          ox + size, y, oz + size,
        ox + size, y, oz + size,   ox,        y, oz + size,
        ox,        y, oz + size,   ox,        y, oz,
      ])
      const bgeo = new BufferGeometry()
      bgeo.setAttribute('position', new Float32BufferAttribute(pts, 3))
      const border = new LineSegments(bgeo, new LineBasicMaterial({ color: 0x00d9c0, transparent: true, opacity: 0.55 }))
      scene.add(border)
      tileMeshes.push(border)
    }
  }

  function _clearTileVisualization() {
    for (const m of tileMeshes) {
      scene.remove(m)
      m.geometry.dispose()
      if (Array.isArray(m.material)) m.material.forEach(x => x.dispose())
      else m.material.dispose()
    }
    tileMeshes.length = 0
    ownedTileSet = new Set()
  }

  // ── Pick placed building by screen coords ──────────────────────────

  function pickPlacedBuilding(clientX, clientY) {
    const canvas = canvasRef.value
    if (!canvas || !placedMeshes.size) return null
    const rect = canvas.getBoundingClientRect()
    const nx = ((clientX - rect.left) / rect.width)  * 2 - 1
    const ny = -((clientY - rect.top)  / rect.height) * 2 + 1
    raycaster.setFromCamera({ x: nx, y: ny }, camera)
    const hits = raycaster.intersectObjects(Array.from(placedMeshes.values()), true)
    if (!hits.length) return null
    // Walk up the parent chain to find the root mesh with buildingId
    let node = hits[0].object
    while (node) {
      if (node.userData.buildingId) return node.userData.buildingId
      node = node.parent
    }
    return null
  }

  function exitBuildMode() {
    buildMode = false
    _clearBuildGrid()
    _clearTileVisualization()
    _clearGhostMesh()
    // Placed building meshes are kept alive — they persist in explore mode
    _buildHoverCb = null
    _buildClickCb = null
  }

  function _clearBuildGrid() {
    if (!buildGrid) return
    scene.remove(buildGrid)
    buildGrid.geometry.dispose()
    buildGrid.material.dispose()
    buildGrid = null
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
    const gridX = Math.floor(pt.x / CELL)
    const gridZ = Math.floor(pt.z / CELL)

    // Reject clicks outside the absolute build zone
    if (gridX < 0 || gridX >= GRID_EXTENT || gridZ < 0 || gridZ >= GRID_EXTENT) return null

    // Reject clicks outside owned land tiles
    if (ownedTileSet.size > 0) {
      const tx = Math.floor(gridX / CELLS_PER_TILE)
      const tz = Math.floor(gridZ / CELLS_PER_TILE)
      if (!ownedTileSet.has(`${tx},${tz}`)) return null
    }

    return { gridX, gridZ }
  }

  function setGhostItem(item) {
    _clearGhostMesh()
    ghostItem     = item
    ghostRotation = 0

    if (item.modelUrl) {
      const token  = ++_ghostLoadToken
      const asset  = item.buildingAsset
      const loader = new GLTFLoader()
      loader.load(item.modelUrl, (gltf) => {
        if (token !== _ghostLoadToken) return
        const root = gltf.scene
        root.scale.setScalar(asset?.scaleFactor ?? 1)
        root.traverse((node) => {
          if (!node.isMesh) return
          node.material = new MeshBasicMaterial({
            color: 0x00d9c0,
            transparent: true,
            opacity: 0.55,
            depthWrite: false,
          })
          node.castShadow = false
        })
        ghostMesh = root
        ghostMesh.visible = false
        scene.add(ghostMesh)
      }, undefined, () => {
        if (token !== _ghostLoadToken) return
        _buildBoxGhost(item)
      })
    } else {
      _buildBoxGhost(item)
    }
  }

  function _buildBoxGhost(item) {
    const w = item.sizeX * CELL * 0.92
    const d = item.sizeZ * CELL * 0.92
    const h = _categoryHeight(item)
    const group = new Group()

    // Semi-transparent teal fill
    const geo  = new BoxGeometry(w, h, d)
    const mat  = new MeshBasicMaterial({ color: 0x00d9c0, transparent: true, opacity: 0.18, depthWrite: false })
    const fill = new Mesh(geo, mat)
    fill.position.y = h / 2
    group.add(fill)

    // Crisp edge outline
    const edgesGeo = new EdgesGeometry(geo)
    const edgesMat = new LineBasicMaterial({ color: 0x00ffee })
    const edges    = new LineSegments(edgesGeo, edgesMat)
    edges.position.y = h / 2
    group.add(edges)

    ghostMesh = group
    ghostMesh.visible = false
    scene.add(ghostMesh)
  }

  function setGhostRotation(radians) {
    ghostRotation = radians
    if (ghostMesh) ghostMesh.rotation.y = radians
  }

  function moveGhost(gridX, gridZ, isValid) {
    if (!ghostMesh || !ghostItem) return
    const sizeX = ghostItem.sizeX
    const sizeZ = ghostItem.sizeZ
    ghostMesh.position.set(
      gridX * CELL + sizeX * CELL / 2,
      0,
      gridZ * CELL + sizeZ * CELL / 2,
    )
    ghostMesh.rotation.y = ghostRotation
    const fillColor = isValid ? 0x00d9c0 : 0xff4444
    const edgeColor = isValid ? 0x00ffee : 0xff6666
    ghostMesh.traverse((node) => {
      if (node.isMesh && node.material) {
        node.material.color.setHex(fillColor)
        node.material.opacity = isValid ? 0.55 : 0.35
      }
      if (node.isLineSegments && node.material) {
        node.material.color.setHex(edgeColor)
      }
    })
    ghostMesh.visible = true
  }

  function clearGhost() {
    if (ghostMesh) ghostMesh.visible = false
  }

  function addPlacedBuilding(building) {
    _addPlacedMesh(building)
  }

  /** Load placed buildings in explore mode (skips already-loaded meshes). */
  function loadBuildings(buildings) {
    for (const b of buildings) {
      if (!placedMeshes.has(b.id)) {
        _addPlacedMesh(b)
      }
    }
  }

  function removePlacedBuilding(buildingId) {
    const mesh = placedMeshes.get(buildingId)
    if (!mesh) return
    scene.remove(mesh)
    _disposeObject(mesh)
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
    if (item.modelUrl) {
      _addGLBMesh(building)
    } else {
      _addBoxMesh(building)
    }
  }

  function _addBoxMesh(building) {
    const item  = building.paletteItem
    const w     = item.sizeX * CELL * 0.92
    const d     = item.sizeZ * CELL * 0.92
    const h     = _categoryHeight(item)
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
    mesh.rotation.y = (building.rotation ?? 0) * Math.PI / 180
    mesh.userData.buildingId = building.id
    scene.add(mesh)
    placedMeshes.set(building.id, mesh)
  }

  function _addGLBMesh(building) {
    const item     = building.paletteItem
    const asset    = item.buildingAsset
    const mtl      = asset?.material      // CityMaterial (may be null)
    const loader    = new GLTFLoader()
    const texLoader = new TextureLoader()

    loader.load(item.modelUrl, (gltf) => {
      const root = gltf.scene
      root.scale.setScalar(asset?.scaleFactor ?? 1)

      root.traverse((node) => {
        if (!node.isMesh) return
        const mat = new MeshStandardMaterial({
          roughness: mtl?.roughness ?? 0.7,
          metalness: mtl?.metalness ?? 0.0,
        })
        if (mtl?.textureAlbedo) {
          const isLinear = mtl.albedoColorSpace === 'linear'
          const flipY    = mtl.flipY ?? false
          const albedo   = texLoader.load(mtl.textureAlbedo)
          albedo.flipY   = flipY
          if (!isLinear) albedo.colorSpace = SRGBColorSpace
          mat.map = albedo
        }
        if (mtl?.textureNormal) {
          const normal = texLoader.load(mtl.textureNormal)
          normal.flipY = mtl.flipY ?? false
          mat.normalMap = normal
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
          const emissive = texLoader.load(mtl.textureEmissive)
          emissive.colorSpace = SRGBColorSpace
          emissive.flipY = mtl.flipY ?? false
          mat.emissiveMap = emissive
          mat.emissive.set(0xffffff)
        }
        node.material = mat
        node.castShadow = node.receiveShadow = true
      })

      root.position.set(
        building.gridX * CELL + item.sizeX * CELL / 2,
        0,
        building.gridZ * CELL + item.sizeZ * CELL / 2,
      )
      root.rotation.y = (building.rotation ?? 0) * Math.PI / 180
      root.userData.buildingId = building.id
      scene.add(root)
      placedMeshes.set(building.id, root)
    }, undefined, () => {
      // Fallback to box on load error
      _addBoxMesh(building)
    })
  }

  function _clearGhostMesh() {
    if (!ghostMesh) return
    scene.remove(ghostMesh)
    _disposeObject(ghostMesh)
    ghostMesh = null
    ghostItem = null
    ++_ghostLoadToken
  }

  function _disposeObject(obj) {
    obj.traverse((child) => {
      if (child.geometry) child.geometry.dispose()
      if (child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material]
        mats.forEach(m => m.dispose())
      }
    })
  }

  function _clearPlacedMeshes() {
    placedMeshes.forEach((mesh) => {
      scene.remove(mesh)
      _disposeObject(mesh)
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
    buildBorder?.geometry.dispose()
    buildBorder?.material.dispose()
    _clearTileVisualization()
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
    setGhostItem, setGhostRotation, moveGhost, clearGhost,
    addPlacedBuilding, removePlacedBuilding, replacePlacedBuilding,
    loadBuildings,
    setOwnedTiles, pickPlacedBuilding,
  }
}
