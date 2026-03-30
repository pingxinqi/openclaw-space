import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'

const cityData = [
  { name: 'Shanghai', lat: 31.2304, lon: 121.4737, value: 96, color: '#4df0ff', region: 'Asia Pacific' },
  { name: 'Tokyo', lat: 35.6762, lon: 139.6503, value: 92, color: '#7c8cff', region: 'Asia Pacific' },
  { name: 'Singapore', lat: 1.3521, lon: 103.8198, value: 88, color: '#58f6c3', region: 'Asia Pacific' },
  { name: 'Dubai', lat: 25.2048, lon: 55.2708, value: 79, color: '#ffd166', region: 'Middle East' },
  { name: 'London', lat: 51.5072, lon: -0.1276, value: 73, color: '#ff8fab', region: 'Europe' },
  { name: 'New York', lat: 40.7128, lon: -74.006, value: 85, color: '#ff6b6b', region: 'North America' },
  { name: 'San Francisco', lat: 37.7749, lon: -122.4194, value: 67, color: '#fca311', region: 'North America' },
  { name: 'Sao Paulo', lat: -23.5505, lon: -46.6333, value: 62, color: '#ff9f1c', region: 'South America' },
  { name: 'Lagos', lat: 6.5244, lon: 3.3792, value: 58, color: '#2ec4b6', region: 'Africa' },
  { name: 'Sydney', lat: -33.8688, lon: 151.2093, value: 64, color: '#9b5de5', region: 'Oceania' },
]

const links = [
  ['Shanghai', 'Singapore'],
  ['Shanghai', 'Tokyo'],
  ['Shanghai', 'London'],
  ['Tokyo', 'San Francisco'],
  ['Singapore', 'Dubai'],
  ['London', 'New York'],
  ['New York', 'Sao Paulo'],
  ['Dubai', 'Lagos'],
  ['Sydney', 'Singapore'],
]

const app = document.querySelector('#app')
app.innerHTML = `
  <div class="page-shell">
    <div class="hud hud-left">
      <p class="eyebrow">OpenClaw Space</p>
      <h1>Realtime Active Earth</h1>
      <p class="lede">更真实的活动地球视觉：夜光城市、云层扫描、轨道飞线、辉光后处理和实时城市悬停提示。</p>

      <div class="legend glass-card">
        <span><i class="dot dot-cyan"></i> 高活跃节点</span>
        <span><i class="dot dot-purple"></i> 数据链路</span>
        <span><i class="dot dot-gold"></i> 城市夜光</span>
      </div>

      <div class="metrics glass-card">
        <div>
          <small>Global activity</small>
          <strong id="metric-activity">87%</strong>
        </div>
        <div>
          <small>Sync latency</small>
          <strong id="metric-latency">19ms</strong>
        </div>
      </div>
    </div>

    <div class="scene-wrap">
      <canvas id="earth-canvas" aria-label="Realtime active earth visualization"></canvas>
      <div class="grid-overlay"></div>
      <div class="aurora aurora-a"></div>
      <div class="aurora aurora-b"></div>

      <div class="floating-tip glass-card" id="floating-tip">
        <span class="tip-label">Hover city</span>
        <strong id="tip-name">—</strong>
        <small id="tip-meta">Move over a marker</small>
      </div>

      <div class="status-bar">
        <div>
          <span class="label">World Sync</span>
          <strong id="sync-time">--:--:-- UTC</strong>
        </div>
        <div>
          <span class="label">Tracked cities</span>
          <strong>${cityData.length}</strong>
        </div>
        <div>
          <span class="label">Active links</span>
          <strong>${links.length}</strong>
        </div>
      </div>
    </div>

    <div class="hud hud-right">
      <div class="panel glass-card">
        <p class="panel-title">Network Pulse</p>
        <div id="city-list" class="city-list"></div>
      </div>
      <div class="panel glass-card small-panel">
        <p class="panel-title">Enhancements</p>
        <ul>
          <li>OrbitControls camera damping</li>
          <li>Procedural cloud shell</li>
          <li>Night-side city lights</li>
          <li>Bloom glow post-processing</li>
          <li>Hover raycast interactions</li>
        </ul>
      </div>
    </div>
  </div>
`

const cityList = document.querySelector('#city-list')
cityList.innerHTML = cityData
  .map(
    (city) => `
      <div class="city-row" data-city="${city.name}">
        <div>
          <strong>${city.name}</strong>
          <span>${city.region}</span>
        </div>
        <b>${city.value}</b>
      </div>
    `,
  )
  .join('')

const syncTime = document.querySelector('#sync-time')
const metricLatency = document.querySelector('#metric-latency')
const metricActivity = document.querySelector('#metric-activity')
const updateClock = () => {
  syncTime.textContent = new Date().toUTCString().split(' ')[4] + ' UTC'
  metricLatency.textContent = `${16 + Math.floor(Math.random() * 8)}ms`
  metricActivity.textContent = `${84 + Math.floor(Math.random() * 10)}%`
}
updateClock()
setInterval(updateClock, 1000)

const canvas = document.querySelector('#earth-canvas')
const tipName = document.querySelector('#tip-name')
const tipMeta = document.querySelector('#tip-meta')
const floatingTip = document.querySelector('#floating-tip')

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.1

const scene = new THREE.Scene()
scene.fog = new THREE.FogExp2(0x020611, 0.045)

const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100)
camera.position.set(0, 0.35, 5.7)

const controls = new OrbitControls(camera, canvas)
controls.enablePan = false
controls.enableDamping = true
controls.minDistance = 3.7
controls.maxDistance = 8
controls.minPolarAngle = Math.PI * 0.26
controls.maxPolarAngle = Math.PI * 0.74
controls.autoRotate = true
controls.autoRotateSpeed = 0.45

const composer = new EffectComposer(renderer)
const renderPass = new RenderPass(scene, camera)
composer.addPass(renderPass)
const bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.95, 0.65, 0.2)
composer.addPass(bloomPass)

const root = new THREE.Group()
scene.add(root)
const globeGroup = new THREE.Group()
root.add(globeGroup)

scene.add(new THREE.AmbientLight(0x89a8ff, 0.9))

const sunLight = new THREE.DirectionalLight(0xffffff, 2.9)
sunLight.position.set(5.5, 1.8, 4.8)
scene.add(sunLight)

const fillLight = new THREE.PointLight(0x4df0ff, 3.2, 28)
fillLight.position.set(-5, -2, -4)
scene.add(fillLight)

const hemi = new THREE.HemisphereLight(0x4b70ff, 0x08101d, 0.8)
scene.add(hemi)

const radius = 1.58
const latLonToVector3 = (lat, lon, altitude = 0) => {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)
  const r = radius + altitude

  return new THREE.Vector3(
    -(r * Math.sin(phi) * Math.cos(theta)),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  )
}

const createEarthTexture = () => {
  const size = 2048
  const canvasEl = document.createElement('canvas')
  canvasEl.width = size
  canvasEl.height = size
  const ctx = canvasEl.getContext('2d')

  const gradient = ctx.createLinearGradient(0, 0, size, size)
  gradient.addColorStop(0, '#09111c')
  gradient.addColorStop(0.4, '#12355f')
  gradient.addColorStop(0.68, '#0e6b65')
  gradient.addColorStop(1, '#030711')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)

  const continents = [
    ['#1db68b', [
      [0.15, 0.28], [0.22, 0.22], [0.27, 0.25], [0.29, 0.34], [0.26, 0.43], [0.2, 0.46], [0.14, 0.39],
    ]],
    ['#25c49b', [
      [0.29, 0.18], [0.42, 0.12], [0.49, 0.2], [0.44, 0.3], [0.38, 0.28], [0.31, 0.24],
    ]],
    ['#18a97e', [
      [0.47, 0.22], [0.56, 0.19], [0.61, 0.28], [0.55, 0.37], [0.49, 0.33],
    ]],
    ['#34d0a0', [
      [0.49, 0.46], [0.56, 0.43], [0.6, 0.53], [0.57, 0.66], [0.51, 0.64], [0.47, 0.53],
    ]],
    ['#2dbf91', [
      [0.66, 0.52], [0.78, 0.47], [0.86, 0.55], [0.83, 0.66], [0.72, 0.7], [0.65, 0.6],
    ]],
    ['#41d7aa', [
      [0.78, 0.76], [0.84, 0.73], [0.87, 0.81], [0.82, 0.86], [0.76, 0.82],
    ]],
  ]

  continents.forEach(([color, points]) => {
    ctx.beginPath()
    points.forEach(([x, y], index) => {
      const px = x * size
      const py = y * size
      if (index === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    })
    ctx.closePath()
    ctx.fillStyle = color
    ctx.globalAlpha = 0.92
    ctx.fill()
  })

  for (let i = 0; i < 1200; i += 1) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.06})`
    ctx.fillRect(Math.random() * size, Math.random() * size, Math.random() * 2, Math.random() * 2)
  }

  const texture = new THREE.CanvasTexture(canvasEl)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  return texture
}

const createCloudTexture = () => {
  const size = 1024
  const cloudCanvas = document.createElement('canvas')
  cloudCanvas.width = size
  cloudCanvas.height = size
  const ctx = cloudCanvas.getContext('2d')
  ctx.clearRect(0, 0, size, size)

  for (let i = 0; i < 320; i += 1) {
    const x = Math.random() * size
    const y = Math.random() * size
    const r = 40 + Math.random() * 90
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, `rgba(255,255,255,${0.14 + Math.random() * 0.18})`)
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }

  const texture = new THREE.CanvasTexture(cloudCanvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

const earthMap = createEarthTexture()
const cloudMap = createCloudTexture()

const earthGeometry = new THREE.SphereGeometry(radius, 128, 128)
const earthMaterial = new THREE.MeshStandardMaterial({
  map: earthMap,
  color: 0x8fc7ff,
  roughness: 0.92,
  metalness: 0.04,
  emissive: 0x040b16,
  emissiveIntensity: 0.65,
})
const earth = new THREE.Mesh(earthGeometry, earthMaterial)
globeGroup.add(earth)

const nightLightsMaterial = new THREE.ShaderMaterial({
  transparent: true,
  blending: THREE.AdditiveBlending,
  uniforms: {
    uTime: { value: 0 },
  },
  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    void main() {
      vec3 lightDir = normalize(vec3(5.5, 1.8, 4.8));
      float night = clamp(1.0 - dot(normalize(vNormal), lightDir), 0.0, 1.0);
      float bands = sin(vWorldPosition.y * 22.0 + uTime * 0.8) * 0.5 + 0.5;
      float twinkle = sin(vWorldPosition.x * 35.0 + vWorldPosition.z * 28.0 + uTime * 2.0) * 0.5 + 0.5;
      float intensity = smoothstep(0.35, 1.0, night) * (bands * 0.35 + twinkle * 0.65) * 0.55;
      vec3 color = mix(vec3(1.0, 0.62, 0.15), vec3(0.29, 0.94, 1.0), twinkle);
      gl_FragColor = vec4(color * intensity, intensity * 0.9);
    }
  `,
})
const nightLights = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.002, 128, 128), nightLightsMaterial)
globeGroup.add(nightLights)

const cloudMaterial = new THREE.MeshPhongMaterial({
  map: cloudMap,
  transparent: true,
  opacity: 0.26,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  color: 0xe8f7ff,
})
const cloudLayer = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.028, 96, 96), cloudMaterial)
globeGroup.add(cloudLayer)

const atmosphereMaterial = new THREE.ShaderMaterial({
  transparent: true,
  side: THREE.BackSide,
  blending: THREE.AdditiveBlending,
  uniforms: { glowColor: { value: new THREE.Color('#4df0ff') } },
  vertexShader: `
    varying vec3 vNormal;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 glowColor;
    varying vec3 vNormal;
    void main() {
      float intensity = pow(0.78 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 4.3);
      gl_FragColor = vec4(glowColor, intensity);
    }
  `,
})
const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.12, 128, 128), atmosphereMaterial)
globeGroup.add(atmosphere)

const starsGeometry = new THREE.BufferGeometry()
const starCount = 2500
const starPositions = new Float32Array(starCount * 3)
for (let i = 0; i < starCount; i += 1) {
  const distance = THREE.MathUtils.randFloat(10, 30)
  const theta = THREE.MathUtils.randFloat(0, Math.PI * 2)
  const phi = Math.acos(THREE.MathUtils.randFloatSpread(2))
  starPositions[i * 3] = distance * Math.sin(phi) * Math.cos(theta)
  starPositions[i * 3 + 1] = distance * Math.cos(phi)
  starPositions[i * 3 + 2] = distance * Math.sin(phi) * Math.sin(theta)
}
starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3))
const stars = new THREE.Points(
  starsGeometry,
  new THREE.PointsMaterial({ color: 0xd9e6ff, size: 0.035, transparent: true, opacity: 0.9 }),
)
scene.add(stars)

const orbitRings = []
for (let i = 0; i < 3; i += 1) {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(radius * (1.33 + i * 0.12), 0.008, 16, 240),
    new THREE.MeshBasicMaterial({
      color: i % 2 ? 0x4df0ff : 0x7c8cff,
      transparent: true,
      opacity: 0.18 - i * 0.03,
    }),
  )
  ring.rotation.set(Math.PI / (2.35 + i * 0.14), i * 0.5, i * 0.2)
  orbitRings.push(ring)
  root.add(ring)
}

const markerMeshes = []
const interactiveMarkers = []
const cityObjectByName = new Map()

cityData.forEach((city) => {
  const anchor = latLonToVector3(city.lat, city.lon, 0.018)

  const marker = new THREE.Mesh(
    new THREE.SphereGeometry(0.024 + city.value / 5600, 20, 20),
    new THREE.MeshBasicMaterial({ color: city.color }),
  )
  marker.position.copy(anchor)
  marker.userData = { city, baseScale: 1 + city.value / 260 }
  earth.add(marker)
  markerMeshes.push(marker)
  interactiveMarkers.push(marker)
  cityObjectByName.set(city.name, marker)

  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(0.055 + city.value / 3000, 20, 20),
    new THREE.MeshBasicMaterial({ color: city.color, transparent: true, opacity: 0.15 }),
  )
  glow.position.copy(anchor)
  glow.userData = { baseScale: 1.2 + city.value / 180 }
  earth.add(glow)
  markerMeshes.push(glow)

  const spike = new THREE.Mesh(
    new THREE.CylinderGeometry(0.004, 0.004, 0.18 + city.value / 750, 10),
    new THREE.MeshBasicMaterial({ color: city.color, transparent: true, opacity: 0.75 }),
  )
  spike.position.copy(anchor.clone().multiplyScalar(1.055))
  spike.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), anchor.clone().normalize())
  earth.add(spike)
  markerMeshes.push(spike)
})

const createArc = (startCity, endCity) => {
  const start = latLonToVector3(startCity.lat, startCity.lon, 0.03)
  const end = latLonToVector3(endCity.lat, endCity.lon, 0.03)
  const mid = start.clone().add(end).multiplyScalar(0.5).normalize().multiplyScalar(radius + 0.82)
  const curve = new THREE.QuadraticBezierCurve3(start, mid, end)
  const points = curve.getPoints(120)
  const geometry = new THREE.BufferGeometry().setFromPoints(points)
  const material = new THREE.LineBasicMaterial({
    color: new THREE.Color(startCity.color).lerp(new THREE.Color(endCity.color), 0.5),
    transparent: true,
    opacity: 0.72,
  })
  const line = new THREE.Line(geometry, material)
  root.add(line)

  const traveler = new THREE.Mesh(
    new THREE.SphereGeometry(0.024, 14, 14),
    new THREE.MeshBasicMaterial({ color: '#ffffff' }),
  )
  traveler.userData = {
    curve,
    speed: THREE.MathUtils.randFloat(0.08, 0.16),
    offset: Math.random(),
  }
  root.add(traveler)
  return traveler
}

const travelers = links.map(([from, to]) => {
  const startCity = cityData.find((city) => city.name === from)
  const endCity = cityData.find((city) => city.name === to)
  return createArc(startCity, endCity)
})

const raycaster = new THREE.Raycaster()
const pointer = new THREE.Vector2(2, 2)
let activeCity = null

const setActiveCity = (city) => {
  activeCity = city
  if (!city) {
    tipName.textContent = '—'
    tipMeta.textContent = 'Move over a marker'
    cityList.querySelectorAll('.city-row').forEach((row) => row.classList.remove('active'))
    return
  }

  tipName.textContent = city.name
  tipMeta.textContent = `${city.region} · Activity ${city.value}`
  cityList.querySelectorAll('.city-row').forEach((row) => {
    row.classList.toggle('active', row.dataset.city === city.name)
  })
}

window.addEventListener('pointermove', (event) => {
  const rect = canvas.getBoundingClientRect()
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  floatingTip.style.left = `${event.clientX + 18}px`
  floatingTip.style.top = `${event.clientY + 18}px`
})

window.addEventListener('pointerleave', () => {
  pointer.set(2, 2)
  setActiveCity(null)
})

const resize = () => {
  const { clientWidth, clientHeight } = canvas.parentElement
  renderer.setSize(clientWidth, clientHeight, false)
  composer.setSize(clientWidth, clientHeight)
  bloomPass.setSize(clientWidth, clientHeight)
  camera.aspect = clientWidth / clientHeight
  camera.updateProjectionMatrix()
}
window.addEventListener('resize', resize)
resize()

const clock = new THREE.Clock()
const animate = () => {
  const elapsed = clock.getElapsedTime()

  controls.update()
  globeGroup.rotation.y = elapsed * 0.09
  cloudLayer.rotation.y = elapsed * 0.12
  cloudLayer.rotation.z = Math.sin(elapsed * 0.1) * 0.04
  nightLightsMaterial.uniforms.uTime.value = elapsed
  stars.rotation.y = elapsed * 0.006
  root.rotation.z = Math.sin(elapsed * 0.08) * 0.03

  orbitRings.forEach((ring, index) => {
    ring.rotation.z += 0.001 + index * 0.0005
  })

  markerMeshes.forEach((marker, index) => {
    const baseScale = marker.userData.baseScale || 1
    const pulse = 1 + Math.sin(elapsed * 2.4 + index) * 0.12
    marker.scale.setScalar(baseScale * pulse)
  })

  travelers.forEach((traveler) => {
    const t = (elapsed * traveler.userData.speed + traveler.userData.offset) % 1
    traveler.position.copy(traveler.userData.curve.getPointAt(t))
  })

  raycaster.setFromCamera(pointer, camera)
  const hits = raycaster.intersectObjects(interactiveMarkers)
  if (hits.length > 0) {
    const city = hits[0].object.userData.city
    if (!activeCity || activeCity.name !== city.name) setActiveCity(city)
  } else if (activeCity) {
    setActiveCity(null)
  }

  composer.render()
  requestAnimationFrame(animate)
}

cityList.addEventListener('pointerover', (event) => {
  const row = event.target.closest('.city-row')
  if (!row) return
  const city = cityData.find((item) => item.name === row.dataset.city)
  setActiveCity(city)
})

cityList.addEventListener('pointerleave', () => {
  setActiveCity(null)
})

animate()
