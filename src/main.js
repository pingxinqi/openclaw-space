import './style.css'
import * as THREE from 'three'

const cityData = [
  { name: 'Shanghai', lat: 31.2304, lon: 121.4737, value: 96, color: '#4df0ff' },
  { name: 'Tokyo', lat: 35.6762, lon: 139.6503, value: 92, color: '#7c8cff' },
  { name: 'Singapore', lat: 1.3521, lon: 103.8198, value: 88, color: '#58f6c3' },
  { name: 'Dubai', lat: 25.2048, lon: 55.2708, value: 79, color: '#ffd166' },
  { name: 'London', lat: 51.5072, lon: -0.1276, value: 73, color: '#ff8fab' },
  { name: 'New York', lat: 40.7128, lon: -74.006, value: 85, color: '#ff6b6b' },
  { name: 'San Francisco', lat: 37.7749, lon: -122.4194, value: 67, color: '#fca311' },
  { name: 'Sao Paulo', lat: -23.5505, lon: -46.6333, value: 62, color: '#ff9f1c' },
  { name: 'Lagos', lat: 6.5244, lon: 3.3792, value: 58, color: '#2ec4b6' },
  { name: 'Sydney', lat: -33.8688, lon: 151.2093, value: 64, color: '#9b5de5' },
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
      <p class="lede">用 Three.js 构建的实时活动地球概念站点，展示全球节点热度、轨道飞线和昼夜变化。</p>
      <div class="legend">
        <span><i class="dot dot-cyan"></i> 高活跃节点</span>
        <span><i class="dot dot-purple"></i> 数据链路</span>
        <span><i class="dot dot-gold"></i> 城市脉冲</span>
      </div>
    </div>

    <div class="scene-wrap">
      <canvas id="earth-canvas" aria-label="Realtime active earth visualization"></canvas>
      <div class="grid-overlay"></div>
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
      <div class="panel">
        <p class="panel-title">Network Pulse</p>
        <div id="city-list" class="city-list"></div>
      </div>
      <div class="panel small-panel">
        <p class="panel-title">Engine</p>
        <ul>
          <li>Three.js WebGL scene</li>
          <li>Atmosphere + fresnel glow</li>
          <li>Bezier arc traffic lines</li>
          <li>Responsive landing page shell</li>
        </ul>
      </div>
    </div>
  </div>
`

const cityList = document.querySelector('#city-list')
cityList.innerHTML = cityData
  .map(
    (city) => `
      <div class="city-row">
        <div>
          <strong>${city.name}</strong>
          <span>Activity index</span>
        </div>
        <b>${city.value}</b>
      </div>
    `,
  )
  .join('')

const syncTime = document.querySelector('#sync-time')
const updateClock = () => {
  syncTime.textContent = new Date().toUTCString().split(' ')[4] + ' UTC'
}
updateClock()
setInterval(updateClock, 1000)

const canvas = document.querySelector('#earth-canvas')
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100)
camera.position.set(0, 0.2, 5.3)

const group = new THREE.Group()
scene.add(group)

const ambientLight = new THREE.AmbientLight(0x7aa2ff, 1.1)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 2.6)
directionalLight.position.set(5, 2, 5)
scene.add(directionalLight)

const rimLight = new THREE.PointLight(0x4df0ff, 2.5, 20)
rimLight.position.set(-4, -1, -3)
scene.add(rimLight)

const radius = 1.55
const earthGeometry = new THREE.SphereGeometry(radius, 96, 96)
const earthMaterial = new THREE.MeshStandardMaterial({
  color: 0x0f1b2d,
  metalness: 0.15,
  roughness: 0.75,
  emissive: 0x07101d,
  emissiveIntensity: 1.2,
})
const earth = new THREE.Mesh(earthGeometry, earthMaterial)
group.add(earth)

const atmosphereMaterial = new THREE.ShaderMaterial({
  transparent: true,
  side: THREE.BackSide,
  blending: THREE.AdditiveBlending,
  uniforms: {
    glowColor: { value: new THREE.Color('#4df0ff') },
  },
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
      float intensity = pow(0.72 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.8);
      gl_FragColor = vec4(glowColor, intensity * 0.9);
    }
  `,
})
const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.1, 96, 96), atmosphereMaterial)
group.add(atmosphere)

const starGeometry = new THREE.BufferGeometry()
const starCount = 1800
const starPositions = new Float32Array(starCount * 3)
for (let i = 0; i < starCount; i += 1) {
  const distance = THREE.MathUtils.randFloat(10, 26)
  const theta = THREE.MathUtils.randFloat(0, Math.PI * 2)
  const phi = Math.acos(THREE.MathUtils.randFloatSpread(2))
  starPositions[i * 3] = distance * Math.sin(phi) * Math.cos(theta)
  starPositions[i * 3 + 1] = distance * Math.cos(phi)
  starPositions[i * 3 + 2] = distance * Math.sin(phi) * Math.sin(theta)
}
starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3))
const stars = new THREE.Points(
  starGeometry,
  new THREE.PointsMaterial({ color: 0xbfd7ff, size: 0.045, transparent: true, opacity: 0.95 }),
)
scene.add(stars)

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

const markers = []
cityData.forEach((city) => {
  const marker = new THREE.Mesh(
    new THREE.SphereGeometry(0.028 + city.value / 5000, 18, 18),
    new THREE.MeshBasicMaterial({ color: city.color }),
  )
  marker.position.copy(latLonToVector3(city.lat, city.lon, 0.02))
  marker.userData = { baseScale: 1 + city.value / 220 }
  earth.add(marker)
  markers.push(marker)

  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(0.048 + city.value / 3200, 16, 16),
    new THREE.MeshBasicMaterial({ color: city.color, transparent: true, opacity: 0.22 }),
  )
  glow.position.copy(latLonToVector3(city.lat, city.lon, 0.01))
  glow.userData = { baseScale: 1.2 + city.value / 180 }
  earth.add(glow)
  markers.push(glow)
})

const createArc = (startCity, endCity) => {
  const start = latLonToVector3(startCity.lat, startCity.lon, 0.03)
  const end = latLonToVector3(endCity.lat, endCity.lon, 0.03)
  const mid = start.clone().add(end).multiplyScalar(0.5)
  mid.normalize().multiplyScalar(radius + 0.7)
  const curve = new THREE.QuadraticBezierCurve3(start, mid, end)
  const points = curve.getPoints(90)
  const geometry = new THREE.BufferGeometry().setFromPoints(points)
  const material = new THREE.LineBasicMaterial({
    color: new THREE.Color(startCity.color).lerp(new THREE.Color(endCity.color), 0.5),
    transparent: true,
    opacity: 0.75,
  })
  const line = new THREE.Line(geometry, material)
  group.add(line)

  const traveler = new THREE.Mesh(
    new THREE.SphereGeometry(0.022, 14, 14),
    new THREE.MeshBasicMaterial({ color: '#ffffff' }),
  )
  traveler.userData = {
    curve,
    speed: THREE.MathUtils.randFloat(0.08, 0.16),
    offset: Math.random(),
  }
  group.add(traveler)
  return traveler
}

const travelers = links.map(([from, to]) => {
  const startCity = cityData.find((city) => city.name === from)
  const endCity = cityData.find((city) => city.name === to)
  return createArc(startCity, endCity)
})

const haloRing = new THREE.Mesh(
  new THREE.TorusGeometry(radius * 1.3, 0.01, 16, 240),
  new THREE.MeshBasicMaterial({ color: 0x7c8cff, transparent: true, opacity: 0.32 }),
)
haloRing.rotation.x = Math.PI / 2.4
group.add(haloRing)

const resize = () => {
  const { clientWidth, clientHeight } = canvas.parentElement
  renderer.setSize(clientWidth, clientHeight, false)
  camera.aspect = clientWidth / clientHeight
  camera.updateProjectionMatrix()
}
window.addEventListener('resize', resize)
resize()

const pointer = { x: 0, y: 0 }
window.addEventListener('pointermove', (event) => {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1
  pointer.y = (event.clientY / window.innerHeight) * 2 - 1
})

const clock = new THREE.Clock()
const animate = () => {
  const elapsed = clock.getElapsedTime()
  earth.rotation.y = elapsed * 0.18
  earth.rotation.z = Math.sin(elapsed * 0.12) * 0.05
  group.rotation.y += (pointer.x * 0.25 - group.rotation.y) * 0.02
  group.rotation.x += (-pointer.y * 0.12 - group.rotation.x) * 0.02
  haloRing.rotation.z = elapsed * 0.12
  stars.rotation.y = elapsed * 0.01

  markers.forEach((marker, index) => {
    const pulse = 1 + Math.sin(elapsed * 2.5 + index) * 0.16
    marker.scale.setScalar((marker.userData.baseScale || 1) * pulse)
  })

  travelers.forEach((traveler) => {
    const t = (elapsed * traveler.userData.speed + traveler.userData.offset) % 1
    traveler.position.copy(traveler.userData.curve.getPointAt(t))
  })

  renderer.render(scene, camera)
  requestAnimationFrame(animate)
}
animate()
