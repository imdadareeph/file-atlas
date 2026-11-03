import { useEffect, useState } from 'react'
import { supported } from '../lib/browserScan.js'

const input = 'w-full rounded-lg border border-line bg-[#0a0f1ab0] px-3 py-2.5 font-mono text-xs text-white outline-0 focus:border-[#7766ff88]'
const ghost = 'h-[42px] rounded-lg border border-line px-5 text-sm font-semibold text-[#c8d0e0] hover:bg-white/[.05]'

export default function ScanModal({ open, initial, picked, results, loading, serverOK, onScan, onPick, onRemove, onReallow, onClose }) {
  const [paths, setPaths] = useState(['']), [depth, setDepth] = useState(3)
  useEffect(() => { if (open) { setPaths(initial.paths.length ? initial.paths : ['']); setDepth(initial.depth) } }, [open])
  const upd = (i, v) => setPaths(paths.map((p, k) => (k === i ? v : p)))
  const paste = (i, e) => { // multi-line paste → one row per path
    const lines = e.clipboardData.getData('text').split(/\r?\n/).map((x) => x.trim()).filter(Boolean)
    if (lines.length > 1) { e.preventDefault(); setPaths([...paths.slice(0, i), ...lines, ...paths.slice(i + 1)]) }
  }
  const clean = paths.map((p) => p.trim()).filter(Boolean)
  const stale = picked.some((p) => !p.allowed)
  const submit = (e) => { e.preventDefault(); if ((clean.length || picked.length) && !loading) onScan(serverOK ? clean : [], depth) }
  return (
    <div onMouseDown={(e) => e.target === e.currentTarget && onClose()} className={`fixed inset-0 z-20 grid place-items-center bg-black/55 p-4 backdrop-blur-sm transition duration-200 ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
      <form onSubmit={submit} className={`max-h-[92vh] w-full max-w-[520px] overflow-auto rounded-2xl border border-white/[.1] bg-[#070b14f2] p-6 shadow-[0_30px_100px_#000a] transition duration-300 ${open ? 'translate-y-0' : 'translate-y-4'}`}>
        <div className="flex items-start justify-between">
          <div><div className="font-mono text-[8px] tracking-[2px] text-[#66738a]">SCAN FOLDERS</div><div className="mt-1 font-display text-xl font-bold">Choose what to map</div></div>
          <button type="button" onClick={onClose} className="text-[22px] leading-none text-[#8a94a8] hover:text-white">×</button>
        </div>

        <button type="button" disabled={!supported() || loading} onClick={() => onPick(depth)} className="mt-4 h-12 w-full rounded-xl bg-gradient-to-br from-[#5048ff] to-[#7666ff] font-semibold shadow-[0_12px_35px_#5148ff38] transition hover:brightness-110 disabled:opacity-40">📁&nbsp; Choose folder…</button>
        <p className="mt-2 text-[11px] leading-relaxed text-[#8792a8]">{supported() ? 'Your browser asks permission for the folder you pick, so this works even where macOS blocks the server. Pick several, one at a time.' : 'This browser has no folder picker (use Chrome or Edge). Typed paths below still work.'}</p>

        {picked.length > 0 && (
          <div className="mt-3 grid gap-1.5">
            {picked.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg border border-line bg-white/[.03] px-3 py-2 font-mono text-[10px]">
                <span className="truncate text-[#c8d0e0]">📁 {p.name}{!p.allowed && <span className="ml-2 text-[#ffc857]">needs re-allow</span>}</span>
                <button type="button" onClick={() => onRemove(p.id)} className="pl-3 text-base text-[#8a94a8] hover:text-white">×</button>
              </div>
            ))}
            {stale && <button type="button" onClick={onReallow} className="mt-1 h-9 rounded-lg border border-[#ffc85766] bg-[#ffc85710] text-xs font-semibold text-[#ffc857]">Re-allow access to {picked.filter((p) => !p.allowed).length} folder(s)</button>}
          </div>
        )}

        {serverOK && (
          <details open={initial.paths.length > 0 || results?.some((r) => !r.ok && !r.browser)} className="group mt-4 border-t border-white/[.05] pt-3">
            <summary className="flex cursor-pointer list-none items-center justify-between font-mono text-[9px] tracking-[2px] text-[#66738a] [&::-webkit-details-marker]:hidden">ADVANCED · TYPE PATHS<span className="text-sm text-[#7885ff] transition-transform group-open:rotate-45">+</span></summary>
            <p className="mt-2 text-[11px] leading-relaxed text-[#8792a8]">Absolute paths read by the server (<span className="font-mono">~</span> works). Needs OS access to the folder.</p>
            <div className="mt-3 grid max-h-[200px] gap-2 overflow-auto pr-1">
              {paths.map((p, i) => (
                <div key={i} className="flex gap-2">
                  <input value={p} onChange={(e) => upd(i, e.target.value)} onPaste={(e) => paste(i, e)} placeholder="/Users/you/Documents" className={input} />
                  {paths.length > 1 && <button type="button" onClick={() => setPaths(paths.filter((_, k) => k !== i))} className="px-2 text-lg text-[#8a94a8] hover:text-white">×</button>}
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setPaths([...paths, ''])} className="mt-2.5 font-mono text-[9px] text-[#7885ff]">+ ADD PATH</button>
          </details>
        )}

        <label className="mt-4 flex items-center justify-between gap-4 border-t border-white/[.05] pt-4 text-xs text-[#a5aec0]">
          <span>Max depth<span className="ml-2 font-mono text-[9px] text-[#68748a]">subfolder levels below each folder</span></span>
          <input type="number" min={0} max={20} value={depth} onChange={(e) => setDepth(+e.target.value)} className={input + ' !w-20 text-center'} />
        </label>
        {results?.length > 0 && (
          <div className="mt-4 grid gap-1 font-mono text-[9px]">
            {results.map((r, i) => <div key={r.path + i} className={`flex justify-between gap-3 ${r.ok ? 'text-[#59e59a]' : 'text-[#ff7a7a]'}`}><span className="truncate">{r.ok ? '✓' : '✗'} {r.path}</span><span className="shrink-0">{r.ok ? `${r.count} files` : r.error}</span></div>)}
          </div>
        )}
        <div className="mt-5 flex justify-end gap-2.5">
          <button type="button" onClick={onClose} className={ghost}>Close</button>
          <button disabled={(!clean.length && !picked.length) || loading} className="h-[42px] rounded-lg border border-line bg-white/[.06] px-6 text-sm font-semibold hover:bg-white/[.1] disabled:opacity-40">{loading ? 'Scanning…' : 'Rescan'}</button>
        </div>
      </form>
    </div>
  )
}
