export default function Summary({ model, maxFiles, truncated }) {
  const pct = maxFiles ? Math.min(100, (model.N / maxFiles) * 100) : 0
  return (
    <div className="absolute top-[91px] right-8 z-4 hidden w-[220px] rounded-[11px] border border-line bg-glass p-3.5 backdrop-blur-xl transition-opacity duration-400 xl:block">
      <div className="font-mono text-[8px] tracking-[2px] text-[#66738a]">FILE ATLAS · LOCAL</div>
      <div className="mt-1 font-display text-[26px] font-semibold">{model.N.toLocaleString()}</div>
      <div className="text-[9px] leading-normal text-[#78849a]">files mapped across<br />{model.groups.length} folders{truncated ? ' · limit reached' : ''}</div>
      <div className="mt-[11px] h-0.5 bg-white/[.06]"><i className="block h-full bg-gradient-to-r from-[#6158ff] to-[#45d7ff] shadow-[0_0_8px_#6158ff]" style={{ width: pct + '%' }} /></div>
    </div>
  )
}
