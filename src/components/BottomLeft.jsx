import { useEffect, useState } from 'react'
import { TYPE_COLOR } from '../lib/fmt.js'

const KINDS = [['#7d6cff', 'same folder'], ['#45d7ff', 'parent'], ['#ff6ccf', 'peer folders']]
const Row = ({ color, label, n }) => (
  <div className="flex items-center gap-[7px] text-[9px] text-[#a5aec0]">
    <i className="size-1.5 shrink-0 rounded-full" style={{ color, background: color, boxShadow: '0 0 8px currentColor' }} />
    <span className="truncate">{label}</span><b className="ml-auto pl-2 font-mono text-[9px] font-normal text-[#647188]">{n}</b>
  </div>
)

function Legend({ model }) {
  const [tab, setTab] = useState('folders'), [all, setAll] = useState(false)
  const rows = tab === 'folders' ? model.groups.map((g) => [g.color, g.label, g.count]) : model.types.map((t) => [TYPE_COLOR[t.label], t.label, t.count])
  const tabCls = (k) => `font-mono text-[8px] tracking-[2px] ${tab === k ? 'text-white' : 'text-[#66738a]'}`
  return (
    <div className="atlas-legend rounded-[11px] border border-line bg-glass px-[17px] py-[15px] backdrop-blur-xl">
      <div className="mb-[11px] flex justify-between">
        <div className="flex gap-3"><button className={tabCls('folders')} onClick={() => setTab('folders')}>TOP FOLDERS</button><button className={tabCls('types')} onClick={() => setTab('types')}>FILE TYPES</button></div>
        {rows.length > 8 && <button onClick={() => setAll(!all)} className="font-mono text-[8px] text-[#7885ff]">{all ? 'SHOW LESS ←' : 'VIEW ALL →'}</button>}
      </div>
      <div className={`grid grid-cols-2 gap-x-5 gap-y-2 ${all ? 'max-h-48 overflow-auto pr-1' : ''}`}>
        {(all ? rows : rows.slice(0, 8)).map(([c, l, n]) => <Row key={l} color={c} label={l} n={n} />)}
        {!rows.length && <span className="col-span-2 text-[9px] text-[#647188]">No folders scanned yet</span>}
      </div>
      <div className="mt-3 font-mono text-[8px] text-[#78849a]">{KINDS.map(([c, l]) => <span key={l} className="mr-3"><span style={{ color: c }}>━</span> {l}</span>)}</div>
    </div>
  )
}

function Slider({ label, value, min, max, step = 1, unit, onChange }) {
  return (
    <label className="grid grid-cols-[62px_1fr_38px] items-center gap-2.5">
      {label}<input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="h-0.5 w-full" />
      <output className="text-right text-[#647188]">{Math.round(value * 10) / 10}{unit}</output>
    </label>
  )
}

function Rotation({ atlasRef }) {
  const [s, setS] = useState({ rx: 0, ry: 0, rz: 0, ay: 0, auto: true, spd: 1 }), [open, setOpen] = useState(false)
  useEffect(() => atlasRef.current?.subscribe((v) => open && setS(v)), [open, atlasRef.current])
  const D = Math.PI / 180, r = atlasRef.current?.rot
  const set = (patch) => { Object.assign(r, patch); setS({ ...r }) }
  const yaw = (((s.ay + s.ry) / D) % 360 + 540) % 360 - 180
  const btn = 'rounded-md border border-line bg-white/[.04] px-2.5 py-1.5 font-mono text-[9px] text-[#a5aec0] hover:text-white'
  return (
    <details onToggle={(e) => setOpen(e.currentTarget.open)} className="group rounded-[11px] border border-line bg-glass font-mono text-[9px] text-[#a5aec0] backdrop-blur-xl">
      <summary className="flex cursor-pointer list-none items-center justify-between px-[17px] py-3 text-[8px] tracking-[2px] text-[#66738a] select-none [&::-webkit-details-marker]:hidden">
        ROTATION<span className="text-sm text-[#7885ff] transition-transform group-open:rotate-45">+</span>
      </summary>
      <div className="grid gap-[11px] px-[17px] pb-[15px]">
        <div className="flex items-center justify-between"><span>Auto-rotate</span>
          <span className="flex gap-1.5">
            <button className={`${btn} ${s.auto ? 'border-[#7766ff88] bg-[#6f62ff30] text-white' : ''}`} onClick={() => set({ auto: !r.auto })}>{s.auto ? 'ON' : 'OFF'}</button>
            <button className={btn} onClick={() => set({ rx: 0, ry: 0, rz: 0, ay: 0, spd: 1, auto: true })}>RESET</button>
          </span>
        </div>
        <Slider label="Speed" value={s.spd} min={0} max={8} step={0.1} unit="×" onChange={(v) => set({ spd: v })} />
        <Slider label="Yaw Y" value={yaw} min={-180} max={180} unit="°" onChange={(v) => set({ ry: v * D - r.ay })} />
        <Slider label="Pitch X" value={s.rx / D} min={-40} max={40} unit="°" onChange={(v) => set({ rx: v * D })} />
        <Slider label="Roll Z" value={s.rz / D} min={-90} max={90} unit="°" onChange={(v) => set({ rz: v * D })} />
      </div>
    </details>
  )
}

export default function BottomLeft({ model, atlasRef }) {
  return (
    <div className="atlas-bl absolute bottom-[50px] left-8 z-4 hidden w-[375px] flex-col gap-2.5 transition-opacity duration-400 md:flex">
      <Legend model={model} /><Rotation atlasRef={atlasRef} />
    </div>
  )
}
