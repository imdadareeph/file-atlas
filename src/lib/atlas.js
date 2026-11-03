import * as THREE from 'three'

const KIND = [[0.49, 0.42, 1], [0.27, 0.84, 1], [1, 0.42, 0.81]] // same folder, parent, peer
const VERT = `attribute float aSize;attribute float aGlow;varying float vG;varying vec3 vColor;varying float vA;uniform float pixel;uniform float time;
void main(){vColor=color;vG=aGlow;vec4 p=modelViewMatrix*vec4(position,1.);float ds=clamp(15./max(1.,-p.z),.35,5.);
gl_PointSize=aSize*pixel*ds*(1.+.08*sin(time*2.+position.y*1.7))*(1.+aGlow*(1.8+.3*sin(time*4.)));gl_Position=projectionMatrix*p;vA=clamp(1.-(-p.z/28.),.25,1.);}`
const FRAG = `varying float vG;varying vec3 vColor;varying float vA;
void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.05,d);
gl_FragColor=vec4(mix(vColor,vec3(1.),vG*.35)*(1.+smoothstep(.45,.02,d)*1.7+vG*1.3),min(1.,a*vA*.88*(1.+vG*.8)));}`

// Imperative three.js engine: React owns UI state, this owns the render loop.
export function createAtlas(el, cb) {
  const px = Math.min(devicePixelRatio, 1.7)
  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(48, 1, 0.1, 600)
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(px); renderer.outputColorSpace = THREE.SRGBColorSpace; el.appendChild(renderer.domElement)
  const cv = renderer.domElement, ray = new THREE.Raycaster(); ray.params.Points.threshold = 0.22
  const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexColors: true, uniforms: { pixel: { value: px }, time: { value: 0 } }, vertexShader: VERT, fragmentShader: FRAG })
  const root = new THREE.Group(); scene.add(root)
  const lineMat = (o) => new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: o, depthWrite: false, blending: THREE.AdditiveBlending })

  const st = { rx: 0, ry: 0, rz: 0, ay: 0, auto: true, spd: 1 }
  let M = null, pts = null, lines = null, hl = null, geo = null, glow, gt, jit
  let hover = -1, selected = -1, hkey = '', zoom = 14.5, home = 14.5, bare = false, drag = false, moved = 0, lx = 0, ly = 0, subs = new Set(), tick = 0
  const mouse = new THREE.Vector2()

  const lineGeo = (es, bright) => {
    const P = [], C = []
    es.forEach(([a, b, k]) => { const B = M.base; P.push(B[a * 3], B[a * 3 + 1], B[a * 3 + 2], B[b * 3], B[b * 3 + 1], B[b * 3 + 2]); const c = KIND[k].map((v) => v * bright); C.push(...c, ...c) })
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); return g
  }
  const clear = () => { while (root.children.length) { const o = root.children.pop(); o.geometry.dispose() } }

  function setModel(m) {
    clear(); M = m; hkey = ''; hover = -1
    if (!m || !m.N) { pts = null; return }
    geo = new THREE.BufferGeometry(); const pos = new Float32Array(m.base), size = new Float32Array(m.N)
    glow = new Float32Array(m.N); gt = new Float32Array(m.N); jit = new Float32Array(m.N)
    for (let i = 0; i < m.N; i++) { size[i] = 6 + ((Math.sin(i * 12.9) * 43758.5) % 1 + 1) % 1 * 4; jit[i] = ((Math.sin(i * 78.2) * 9631.3) % 1 + 1) % 1 * 6.283 }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(m.col, 3))
    geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1)); geo.setAttribute('aGlow', new THREE.BufferAttribute(glow, 1))
    pts = new THREE.Points(geo, mat); pts.frustumCulled = false; root.add(pts)
    lines = new THREE.LineSegments(lineGeo(m.edges, 1), lineMat(0.26)); lines.frustumCulled = false; root.add(lines)
    hl = new THREE.LineSegments(new THREE.BufferGeometry(), lineMat(0.95)); hl.frustumCulled = false; root.add(hl)
    home = zoom = 14.5 * m.scale
    cam.position.z = zoom * 1.6
  }

  const emitBare = (z) => { const b = z > 30 * (M ? M.scale : 1); if (b !== bare) { bare = b; cb.onBare?.(b) } }
  cv.onpointermove = (e) => {
    if (drag) { moved += Math.abs(e.clientX - lx) + Math.abs(e.clientY - ly); st.ry += (e.clientX - lx) * 0.003; st.rx = Math.max(-0.7, Math.min(0.7, st.rx + (e.clientY - ly) * 0.0015)); lx = e.clientX; ly = e.clientY; return }
    if (!pts) return
    const r = cv.getBoundingClientRect(); mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
    ray.setFromCamera(mouse, cam); const hit = ray.intersectObject(pts)[0]
    hover = hit ? hit.index : -1; cb.onHover?.(hover, e.clientX, e.clientY)
  }
  cv.onpointerdown = (e) => { drag = true; moved = 0; cv.classList.add('drag'); lx = e.clientX; ly = e.clientY }
  const up = () => { drag = false; cv.classList.remove('drag') }; window.addEventListener('pointerup', up)
  cv.onclick = () => { if (moved > 4) return; cb.onSelect?.(hover) } // empty space → -1 → closes panel
  cv.onwheel = (e) => { e.preventDefault(); hover = -1; cb.onHover?.(-1); zoom = Math.max(1.2, Math.min(60 * (M ? M.scale : 1), zoom * Math.exp(e.deltaY * 0.0015))) }

  const resize = () => { const w = el.clientWidth, h = el.clientHeight; if (!w || !h) return; cam.aspect = w / h; cam.updateProjectionMatrix(); renderer.setSize(w, h) }
  const ro = new ResizeObserver(resize); ro.observe(el); resize()

  const clock = new THREE.Clock(); let t = 0, raf
  function loop() {
    raf = requestAnimationFrame(loop); const dt = clock.getDelta(); t += dt
    if (st.auto) st.ay += dt * 0.045 * st.spd
    root.rotation.set(st.rx, st.ay + st.ry, st.rz)
    if (pts) {
      const p = geo.attributes.position.array, b = M.base
      for (let i = 0; i < M.N; i++) { const j = i * 3, ph = jit[i]; p[j] = b[j] + Math.cos(t * 0.3 + ph) * 0.012; p[j + 1] = b[j + 1] + Math.sin(t * (0.22 + (0.25 * (i % 17)) / 17) + ph + b[j + 1] * 0.7) * 0.055; p[j + 2] = b[j + 2] + Math.sin(t * 0.29 + ph) * 0.012 }
      geo.attributes.position.needsUpdate = true
      const key = selected + '|' + hover
      if (key !== hkey) {
        hkey = key; gt.fill(0); const fs = [selected, hover].filter((f) => f >= 0)
        fs.forEach((f) => M.adj[f].forEach((q) => (gt[q] = Math.max(gt[q], 0.45)))); fs.forEach((f) => (gt[f] = 1))
        hl.geometry.dispose(); hl.geometry = lineGeo(M.edges.filter((e) => fs.includes(e[0]) || fs.includes(e[1])), 1.6)
      }
      for (let i = 0; i < M.N; i++) glow[i] += (gt[i] - glow[i]) * 0.12
      geo.attributes.aGlow.needsUpdate = true
    }
    mat.uniforms.time.value = t
    cam.position.z += (zoom - cam.position.z) * 0.06; cam.position.y += (0.12 + st.rx * 0.12 - cam.position.y) * 0.04; cam.lookAt(0, 0.05, 0); emitBare(zoom)
    if (++tick % 8 === 0) subs.forEach((f) => f({ ...st }))
    renderer.render(scene, cam)
  }
  loop()

  return {
    setModel, setSelected: (i) => { selected = i },
    dive: () => { zoom = 3 }, home: () => { zoom = home },
    rot: st, subscribe: (f) => { subs.add(f); return () => subs.delete(f) },
    dispose: () => { cancelAnimationFrame(raf); ro.disconnect(); window.removeEventListener('pointerup', up); clear(); renderer.dispose(); cv.remove() },
  }
}
