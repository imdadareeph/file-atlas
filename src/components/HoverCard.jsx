import { usePreview } from '../lib/api.js'
import { size } from '../lib/fmt.js'

export default function HoverCard({ file, x, y }) {
  const show = !!file, src = usePreview(file)
  return (
    <div className={`pointer-events-none fixed z-12 w-[225px] rounded-[10px] border border-white/[.09] bg-[#080c15dc] p-3 shadow-[0_20px_55px_#0008] backdrop-blur-xl transition duration-150 ${show ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'}`}
      style={{ left: Math.min(x + 18, innerWidth - 240), top: Math.max(82, Math.min(y - 25, innerHeight - 190)) }}>
      {file && <>
        <div className="font-mono text-[8px] tracking-[1.5px] text-[#7d8aff] uppercase">{file.group}</div>
        <div className="mt-[7px] font-display text-base font-semibold break-words">{file.name}</div>
        <div className="mt-[3px] font-mono text-[9px] break-all text-[#727e94]">{file.rel}</div>
        {src && <img src={src} className="mt-2 max-h-[110px] w-full rounded-md object-cover" />}
        <div className="mt-2 text-[10px] leading-normal text-[#9aa5b9]">{file.ext.toUpperCase()} · {size(file.size)}</div>
      </>}
    </div>
  )
}
