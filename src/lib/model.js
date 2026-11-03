import { typeOf } from './fmt.js'

const frac = (n) => { const s = Math.sin(n) * 43758.5453; return s - Math.floor(s) }
const rnd = (i, s) => frac(i * 17.31 + s * 91.7)
const hash = (t) => { let v = 0; for (const c of t) v = (v * 31 + c.charCodeAt(0)) % 100003; return v }
const hsv = (h, s, v) => { const f = (n) => { const k = (n + h * 6) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)) }; return [f(5), f(3), f(1)] }
const hex = (c) => '#' + c.map((x) => Math.round(x * 255).toString(16).padStart(2, '0')).join('')

// Turns scanned files into: groups (top-level folders), 3D positions, and folder-relationship edges.
export function buildModel(files) {
  const multi = new Set(files.map((f) => f.rootPath)).size > 1
  files.forEach((f) => {
    const parts = f.rel.split('/')
    f.dir = parts.slice(0, -1).join('/')
    f.dirKey = f.rootPath + '::' + f.dir
    f.group = (multi ? f.root + '/' : '') + (parts.length > 1 ? parts[0] : multi ? '' : f.root)
    f.group = f.group.replace(/\/$/, '') || f.root
    f.type = typeOf(f.ext)
  })
  const N = files.length
  const gc = new Map(); files.forEach((f) => gc.set(f.group, (gc.get(f.group) || 0) + 1))
  const groups = [...gc].sort((a, b) => b[1] - a[1]).map(([label, count], i, all) => ({ label, count, color: hex(hsv((i * 0.618034) % 1, 0.62, 1)) }))
  const gi = new Map(groups.map((g, i) => [g.label, i]))
  const scale = Math.max(1, Math.sqrt(groups.length / 31))

  // layout: one blob per group on a vase-shaped spiral; sub-folders offset inside the blob
  const base = new Float32Array(N * 3), col = new Float32Array(N * 3)
  files.forEach((f, i) => {
    const g = gi.get(f.group), cnt = groups[g].count
    const th = g * 2.39996, t = (g * 0.618034) % 1
    const rad = (0.35 + 1.25 * Math.pow(t, 0.72) + 0.28 * Math.sin(t * Math.PI)) * 1.7 * scale
    const single = groups.length === 1
    const cx = single ? 0 : Math.cos(th) * rad * 1.04, cy = single ? 0 : (-3.9 + t * 7.8) * scale, cz = single ? 0 : Math.sin(th) * rad * 0.74
    const sub = f.rel.split('/').slice(1, -1).join('/'), sv = sub ? hash(sub) : 0
    const sa = (sv % 628) / 100, sb = ((sv % 311) / 311) * 2 - 1, sr = sv ? 0.3 : 0
    const k = 0.1 * Math.sqrt(cnt) + 0.15, u = rnd(i, 21) * 2 - 1, w = rnd(i, 22) * Math.PI * 2, q = Math.sqrt(1 - u * u) * k * (0.5 + rnd(i, 23) * 0.7)
    base.set([cx + Math.cos(sa) * sr + Math.cos(w) * q, cy + sb * sr + u * k * 0.7, cz + Math.sin(sa) * sr + Math.sin(w) * q], i * 3)
    const c = hsv((g * 0.618034) % 1, 0.62, 1).map((x) => x * (0.78 + rnd(i, 8) * 0.3)); col.set(c, i * 3)
  })

  // edges: 0 same folder (ring), 1 parent folder, 2 peer folders (siblings under one parent)
  const D = new Map(); files.forEach((f, i) => { if (!D.has(f.dirKey)) D.set(f.dirKey, []); D.get(f.dirKey).push(i) })
  const edges = [], seen = new Set(), adj = files.map(() => [])
  const edge = (a, b, k) => { if (a === b) return; const key = a < b ? a + '-' + b : b + '-' + a; if (seen.has(key)) return; seen.add(key); edges.push([a, b, k]); adj[a].push(b); adj[b].push(a) }
  const split = (key) => { const [r, d] = key.split('::'); return [r, d] }
  const upKey = (key) => { const [r, d] = split(key); return r + '::' + d.split('/').slice(0, -1).join('/') }
  const parentRep = (key) => { let [r, d] = split(key); while (d !== '') { d = d.split('/').slice(0, -1).join('/'); if (D.has(r + '::' + d)) return D.get(r + '::' + d)[0] } return -1 }
  const PG = new Map(), roots = []
  D.forEach((f, key) => {
    if (f.length > 1) f.forEach((x, k) => edge(x, f[(k + 1) % f.length], 0))
    const [, d] = split(key)
    if (d === '') { roots.push(f[0]); return }
    const pr = parentRep(key); if (pr >= 0) edge(f[0], pr, 1)
    const p = upKey(key); if (!PG.has(p)) PG.set(p, []); PG.get(p).push(f[0])
  })
  PG.forEach((r) => { if (r.length > 1) r.forEach((x, k) => edge(x, r[(k + 1) % r.length], 2)) })
  if (roots.length > 1) roots.forEach((x, k) => edge(x, roots[(k + 1) % roots.length], 2))

  const tc = new Map(); files.forEach((f) => tc.set(f.type, (tc.get(f.type) || 0) + 1))
  const types = [...tc].sort((a, b) => b[1] - a[1]).map(([label, count]) => ({ label, count }))
  return { files, N, base, col, groups, types, edges, adj, scale, extCount: new Set(files.map((f) => f.ext)).size }
}
