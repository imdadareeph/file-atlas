import { useEffect, useMemo, useRef, useState } from 'react'
import { getConfig, scanPaths } from './lib/api.js'
import { buildModel } from './lib/model.js'
import Scene from './components/Scene.jsx'
import Header from './components/Header.jsx'
import Hero from './components/Hero.jsx'
import Summary from './components/Summary.jsx'
import BottomLeft from './components/BottomLeft.jsx'
import HoverCard from './components/HoverCard.jsx'
import Detail from './components/Detail.jsx'
import ScanModal from './components/ScanModal.jsx'
import { walk, pick, saveHandles, loadHandles, granted, regrant } from './lib/browserScan.js'

const KEY = 'fileatlas.settings'
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) } catch { return null } }

export default function App() {
  const [cfg, setCfg] = useState({ defaultPaths: [], depth: 3, maxFiles: 5000 })
  const [settings, setSettings] = useState({ paths: [], depth: 3 })
  const [data, setData] = useState({ files: [], roots: [], truncated: false })
  const [loading, setLoading] = useState(false)
  const [picked, setPicked] = useState([]) // folders chosen via the browser picker
  const [serverOK, setServerOK] = useState(true)
  const [modal, setModal] = useState(false)
  const [selected, setSelected] = useState(-1)
  const [hover, setHover] = useState({ i: -1, x: 0, y: 0 })
  const [bare, setBare] = useState(false)
  const atlas = useRef(null), search = useRef(null)
  const model = useMemo(() => buildModel(data.files), [data])

  // One pass over every source: browser-picked folders (no server needed) + typed paths (server).
  async function scan(paths, depth, list = picked, max = cfg.maxFiles) {
    setLoading(true); setSelected(-1)
    try {
      let files = [], roots = [], truncated = false
      for (const p of list) {
        if (!p.allowed) { roots.push({ path: p.name, name: p.name, ok: false, error: 'needs re-allow' }); continue }
        try { const r = await walk(p.handle, p.id, depth, max - files.length); files.push(...r.files); truncated ||= r.truncated; roots.push({ path: p.name, name: p.name, ok: true, browser: true, count: r.files.length }) }
        catch (e) { roots.push({ path: p.name, name: p.name, ok: false, error: e.message }) }
      }
      if (paths.length) {
        try { const r = await scanPaths(paths, depth); files.push(...r.files); roots.push(...r.roots); truncated ||= r.truncated }
        catch { paths.forEach((x) => roots.push({ path: x, name: x, ok: false, error: 'server unavailable' })) }
      }
      if (files.length > max) { files = files.slice(0, max); truncated = true }
      setData({ files, roots, truncated }); const next = { paths: paths.filter((x) => roots.some((r) => r.path === x && r.ok)), depth }; setSettings(next); // failed typed paths are reported once, then dropped
       localStorage.setItem(KEY, JSON.stringify(next))
      if (roots.length && roots.every((x) => x.ok)) setModal(false)
    } finally { setLoading(false) }
  }
  async function onPick(depth) {
    let p; try { p = await pick(picked) } catch { return } // user cancelled the picker
    if (!p) return
    const next = [...picked, p]; setPicked(next); saveHandles(next); scan(settings.paths, depth, next)
  }
  function onRemove(id) { const next = picked.filter((p) => p.id !== id); setPicked(next); saveHandles(next); scan(settings.paths, settings.depth, next) }
  async function onReallow() {
    const next = []; for (const p of picked) next.push(p.allowed ? p : { ...p, allowed: await regrant(p.handle).catch(() => false) })
    setPicked(next); scan(settings.paths, settings.depth, next)
  }

  useEffect(() => { // saved settings win; otherwise server defaults (blank unless FILEATLAS_PATHS is set)
    (async () => {
      let c = cfg
      try { c = await getConfig(); setCfg(c) } catch { setServerOK(false) }
      const s = load(), paths = s?.paths ?? c.defaultPaths, depth = s?.depth ?? c.depth
      const saved = await loadHandles(), list = []
      for (const h of saved) list.push({ id: h.id, name: h.name, handle: h.handle, allowed: await granted(h.handle).catch(() => false) })
      setPicked(list); setSettings({ paths, depth })
      list.some((p) => p.allowed) || paths.length ? scan(paths, depth, list.filter((p) => p.allowed), c.maxFiles) : setModal(true)
    })()
  }, [])

  useEffect(() => {
    const k = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); search.current?.focus() }
      if (e.key === 'Escape') { setSelected(-1); setModal(false) }
    }
    addEventListener('keydown', k); return () => removeEventListener('keydown', k)
  }, [])

  const find = (q) => { q = q.toLowerCase().trim(); const i = q ? model.files.findIndex((f) => (f.rel + ' ' + f.group + ' ' + f.ext + ' ' + f.type).toLowerCase().includes(q)) : -1; if (i >= 0) setSelected(i) }
  const fade = `transition-opacity duration-400 ${bare ? 'opacity-0 pointer-events-none' : ''}`

  return (
    <div className="absolute inset-0 overflow-hidden bg-bg">
      <Scene model={model} selected={selected} atlasRef={atlas} onBare={setBare}
        onHover={(i, x, y) => setHover({ i, x, y })} onSelect={setSelected} />
      <div className={fade}><Header ref={search} onSearch={find} onFolders={() => setModal(true)} />
        <Hero model={model} roots={data.roots.filter((r) => r.ok)} onExplore={() => atlas.current.dive()} onFolders={() => setModal(true)} />
        <Summary model={model} maxFiles={cfg.maxFiles} truncated={data.truncated} faded={selected >= 0} />
        <footer className="absolute inset-x-8 bottom-[11px] z-4 hidden justify-between font-mono text-[7px] text-[#424c5e] md:flex"><span>FileAtlas · {settings.paths.length + picked.length} folder{settings.paths.length + picked.length === 1 ? '' : 's'} · depth {settings.depth}</span><span>Every dot is a file.</span></footer>
      </div>
      <div className={fade}><BottomLeft model={model} atlasRef={atlas} /></div>
      <div className="pointer-events-none absolute bottom-7 left-1/2 z-4 -translate-x-1/2 rounded-lg border border-white/[.05] bg-[#05091080] px-[15px] py-[9px] font-mono text-[8px] whitespace-nowrap text-[#69758b] backdrop-blur-md">
        ↔ <b className="font-medium text-[#a0aabb]">Drag</b> to rotate &nbsp;&nbsp; ◉ <b className="font-medium text-[#a0aabb]">Scroll</b> to zoom in / out &nbsp;&nbsp; ✦ <b className="font-medium text-[#a0aabb]">Hover</b> a dot &nbsp;&nbsp; ⌁ <b className="font-medium text-[#a0aabb]">Click</b> to view details
      </div>
      <HoverCard file={hover.i >= 0 ? model.files[hover.i] : null} x={hover.x} y={hover.y} />
      <Detail model={model} index={selected} onClose={() => setSelected(-1)} onSelect={setSelected} />
      <ScanModal open={modal} initial={settings} picked={picked} serverOK={serverOK} results={data.roots} loading={loading} onScan={(p, d) => scan(p, d)} onPick={onPick} onRemove={onRemove} onReallow={onReallow} onClose={() => setModal(false)} />
    </div>
  )
}
