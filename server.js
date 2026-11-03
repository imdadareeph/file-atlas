// FileAtlas server: folder scanner + file streamer + (dev) Vite middleware. Zero extra deps.
import http from 'node:http'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const env = process.env
const CFG = {
  port: +env.PORT || 4757,
  defaultPaths: (env.FILEATLAS_PATHS || '').split(path.delimiter).filter(Boolean), // blank unless configured
  depth: +env.FILEATLAS_DEPTH || 3,
  maxFiles: +env.FILEATLAS_MAX_FILES || 5000,
}
const SKIP = new Set(['node_modules'])
const allowed = new Set() // roots that have been scanned; /api/file only serves inside these
const MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml', mp4: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm', mp3: 'audio/mpeg', wav: 'audio/wav', pdf: 'application/pdf', txt: 'text/plain', md: 'text/plain', json: 'application/json', html: 'text/html', css: 'text/css', js: 'text/javascript' }
const mime = (p) => MIME[path.extname(p).slice(1).toLowerCase()] || 'application/octet-stream'
const expand = (p) => path.resolve(p.trim().replace(/^~(?=$|\/)/, os.homedir()))

function scan(paths, depth, maxFiles) {
  const files = []
  let truncated = false
  const roots = paths.map((raw) => {
    const root = expand(raw)
    const info = { path: raw, root, name: path.basename(root) || root, ok: false, count: 0 }
    try {
      if (!fs.statSync(root).isDirectory()) throw new Error('not a folder')
      fs.readdirSync(root) // surface permission errors instead of reporting an empty folder
    } catch (e) {
      info.error = e.code === 'ENOENT' ? 'path not found' : e.code === 'EPERM' || e.code === 'EACCES' ? 'permission denied - use “Choose folder…” instead' : e.message
      return info
    }
    info.ok = true
    allowed.add(root)
    const walk = (dir, level) => {
      let ents
      try { ents = fs.readdirSync(dir, { withFileTypes: true }) } catch { return }
      for (const e of ents) {
        if (e.name.startsWith('.') || SKIP.has(e.name)) continue
        const abs = path.join(dir, e.name)
        if (e.isDirectory()) { if (level < depth) walk(abs, level + 1) } else if (e.isFile()) {
          if (files.length >= maxFiles) { truncated = true; return }
          let st; try { st = fs.statSync(abs) } catch { continue }
          files.push({ name: e.name, root: info.name, rootPath: root, rel: path.relative(root, abs).split(path.sep).join('/'), abs, ext: path.extname(e.name).slice(1).toLowerCase() || 'file', size: st.size, mtime: st.mtimeMs })
          info.count++
        }
      }
    }
    walk(root, 0)
    return info
  })
  return { files, roots, truncated }
}

const json = (res, code, body) => { res.writeHead(code, { 'content-type': 'application/json' }); res.end(JSON.stringify(body)) }
const body = (req) => new Promise((ok) => { let s = ''; req.on('data', (c) => (s += c)); req.on('end', () => { try { ok(JSON.parse(s || '{}')) } catch { ok({}) } }) })

function sendFile(req, res, p) {
  let st; try { st = fs.statSync(p) } catch { return json(res, 404, { error: 'not found' }) }
  const m = /bytes=(\d*)-(\d*)/.exec(req.headers.range || '')
  const head = { 'content-type': mime(p), 'accept-ranges': 'bytes' }
  if (m) {
    const a = m[1] ? +m[1] : 0, b = m[2] ? +m[2] : st.size - 1
    res.writeHead(206, { ...head, 'content-range': `bytes ${a}-${b}/${st.size}`, 'content-length': b - a + 1 })
    fs.createReadStream(p, { start: a, end: b }).pipe(res)
  } else {
    res.writeHead(200, { ...head, 'content-length': st.size })
    fs.createReadStream(p).pipe(res)
  }
}

async function api(req, res, url) {
  if (url.pathname === '/api/config') return json(res, 200, { defaultPaths: CFG.defaultPaths, depth: CFG.depth, maxFiles: CFG.maxFiles })
  if (url.pathname === '/api/scan' && req.method === 'POST') {
    const b = await body(req)
    const paths = (b.paths || []).filter((p) => typeof p === 'string' && p.trim())
    const depth = Math.max(0, Math.min(20, Number.isFinite(+b.depth) ? +b.depth : CFG.depth))
    return json(res, 200, scan(paths, depth, CFG.maxFiles))
  }
  if (url.pathname === '/api/file') {
    const p = path.resolve(url.searchParams.get('p') || '')
    if (![...allowed].some((r) => p.startsWith(r + path.sep))) return json(res, 403, { error: 'outside scanned folders' })
    return sendFile(req, res, p)
  }
  json(res, 404, { error: 'no such endpoint' })
}

const here = path.dirname(fileURLToPath(import.meta.url))
const prod = env.NODE_ENV === 'production'
let vite
if (!prod) vite = await (await import('vite')).createServer({ root: here, server: { middlewareMode: true }, appType: 'spa' })

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x')
  // local-only: block DNS-rebinding (odd Host) and cross-site calls (foreign Origin) so no website can drive the scanner
  const host = (req.headers.host || '').replace(/:\d+$/, '')
  if (!['127.0.0.1', 'localhost'].includes(host) || (req.headers.origin && req.headers.origin !== 'http://' + req.headers.host)) return json(res, 403, { error: 'forbidden' })
  if (url.pathname.startsWith('/api/')) return api(req, res, url)
  if (url.pathname === '/fileatlas.html') return sendFile(req, res, path.join(here, 'fileatlas.html')) // standalone page
  if (vite) return vite.middlewares(req, res)
  let f = path.join(here, 'dist', url.pathname === '/' ? 'index.html' : url.pathname)
  if (!f.startsWith(path.join(here, 'dist')) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(here, 'dist', 'index.html')
  sendFile(req, res, f)
}).listen(CFG.port, '127.0.0.1', () => console.log(`FileAtlas → http://127.0.0.1:${CFG.port}  (default paths: ${CFG.defaultPaths.join(', ') || 'none'}, depth ${CFG.depth})`))
