import { openFile, usePreview } from '../lib/api.js'
import { date, size } from '../lib/fmt.js'

const Stat = ({ v, l }) => (<div className="border-l border-white/[.04] pl-3 first:border-0 first:pl-0"><b className="font-display text-sm font-semibold">{v}</b><small className="mt-[3px] block font-mono text-[8px] text-[#68748a]">{l}</small></div>)
const Sec = ({ t, children }) => (<div className="mt-3.5 border-t border-white/[.04] pt-3.5"><div className="mb-2.5 font-mono text-[8px] tracking-[1.5px] text-[#69758d] uppercase">{t}</div>{children}</div>)
const chip = 'rounded-[5px] border border-[#6f62ff26] bg-[#6f62ff12] px-[7px] py-1 font-mono text-[8px] text-[#a7adff]'

export default function Detail({ model, index, onClose, onSelect }) {
  const f = index >= 0 ? model.files[index] : null
  const sibs = f ? model.files.map((q, i) => [q, i]).filter(([q, i]) => i !== index && q.dirKey === f.dirKey).slice(0, 5) : []
  const src = usePreview(f)
  const parts = f ? f.rel.split('/') : []
  return (
    <aside className={`absolute top-1/2 right-3 z-10 max-h-[calc(100vh-165px)] w-[calc(100%-24px)] overflow-auto rounded-[14px] border border-white/[.1] bg-[#070b14e8] p-[21px] shadow-[0_30px_100px_#0009] backdrop-blur-2xl transition duration-300 ease-[cubic-bezier(.2,.8,.2,1)] md:right-8 md:w-[405px] ${f ? 'pointer-events-auto -translate-y-[45%] opacity-100' : 'pointer-events-none -translate-y-[45%] translate-x-8 opacity-0'}`}>
      {f && <>
        <button onClick={onClose} className="absolute top-2.5 right-3 text-[22px] text-[#8a94a8] hover:text-white">×</button>
        <div className="flex gap-3">
          <div className="grid size-[52px] shrink-0 place-items-center rounded-[13px] bg-gradient-to-br from-[#2149a9] to-[#315fff] font-display text-[15px] font-bold">{f.ext.slice(0, 3).toUpperCase()}</div>
          <div className="min-w-0 pr-5">
            <div className="font-display text-xl font-bold break-words">{f.name}</div>
            <div className="mt-1 font-mono text-[9px] break-all text-[#707c91]">{f.rel}</div>
            <div className="mt-2 flex flex-wrap gap-1.5"><span className={chip}>{f.ext.toUpperCase()}</span><span className={chip}>{f.group}</span></div>
          </div>
        </div>
        {src && <img src={src} className="mt-3.5 max-h-[200px] w-full rounded-lg bg-black/20 object-contain" />}
        <div className="mt-4 truncate rounded-[7px] border border-white/[.05] px-2.5 py-[9px] font-mono text-[8px] text-[#8793a8]" title={f.abs ?? f.root + '/' + f.rel}>{f.abs ?? f.root + '/' + f.rel}</div>
        <div className="my-[15px] grid grid-cols-3"><Stat v={size(f.size)} l="Size" /><Stat v={f.type} l="Type" /><Stat v={date(f.mtime)} l="Modified" /></div>
        <Sec t="Taxonomy"><div className="text-[10px] leading-[1.8] text-[#9aa5b8]">{parts.map((p, k) => <div key={k} style={{ paddingLeft: k * 12 }}>{k ? '└─ ' : ''}{k === parts.length - 1 ? <strong className="font-medium text-[#63d1ff]">{p}</strong> : p}</div>)}</div></Sec>
        <Sec t="Same folder"><div className="grid gap-[7px]">
          {sibs.map(([q, i]) => <button key={i} onClick={() => onSelect(i)} className="flex justify-between gap-3 text-left text-[10px] text-[#a5aec0] hover:text-white"><b className="truncate">{q.name}</b><span className="font-mono text-[8px] text-[#68748a]">{q.ext}</span></button>)}
          {!sibs.length && <span className="font-mono text-[8px] text-[#68748a]">only file in folder</span>}
        </div></Sec>
        <button onClick={() => openFile(f)} className="mt-[17px] h-[42px] w-full rounded-lg border border-white/[.05] bg-white/[.03] font-semibold text-[#dbe3f4] hover:bg-white/[.08]">Open File&nbsp; →</button>
      </>}
    </aside>
  )
}
