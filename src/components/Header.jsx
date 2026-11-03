import { forwardRef } from 'react'

const Header = forwardRef(function Header({ onSearch, onFolders }, ref) {
  return (
    <header className="absolute inset-x-0 top-0 z-5 flex h-[65px] items-center border-b border-white/[.035] bg-gradient-to-b from-[#04060bd9] to-transparent px-4 transition-opacity duration-400 md:h-[78px] md:px-8">
      <div className="flex items-center gap-2.5">
        <div className="size-[35px] rotate-[35deg] rounded-full border-2 border-[#6d5cff] border-l-transparent shadow-[0_0_18px_#5149ff55]" />
        <div>
          <b className="font-display text-2xl leading-none">File<span className="text-[#8377ff]">Atlas</span></b>
          <div className="mt-1.5 hidden font-mono text-[8px] tracking-[2px] text-[#69758c] md:block">EXPLORE · UNDERSTAND · BUILD</div>
        </div>
      </div>
      <div className="ml-auto flex items-center gap-2.5">
        <label className="hidden h-10 w-[315px] items-center rounded-[10px] border border-line bg-[#0a0f1ab0] px-3 text-[#758198] backdrop-blur-xl md:flex">
          ⌕&nbsp;
          <input ref={ref} onKeyDown={(e) => e.key === 'Enter' && onSearch(e.currentTarget.value)} placeholder="Search files, folders, types..." className="flex-1 border-0 bg-transparent text-xs text-white outline-0" />
          <kbd className="rounded border border-line px-1.5 py-[3px] font-mono text-[9px]">⌘ K</kbd>
        </label>
        <button onClick={onFolders} className="h-10 rounded-[10px] border border-line bg-[#0a0f1ab0] px-4 text-xs font-semibold text-[#eaf0ff] backdrop-blur-xl hover:brightness-125">⚙ Folders</button>
      </div>
    </header>
  )
})
export default Header
