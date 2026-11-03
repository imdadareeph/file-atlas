const Metric = ({ v, l }) => (
  <div className="border-l border-line px-5 first:border-0 first:pl-0">
    <b className="block font-display text-xl font-semibold">{v}</b>
    <small className="mt-1 block font-mono text-[8px] text-[#68748a] uppercase">{l}</small>
  </div>
)

export default function Hero({ model, roots, onExplore, onFolders }) {
  const eyebrow = roots.length ? roots.map((r) => r.name).join(' · ') + ' · FILE UNIVERSE' : 'FILE UNIVERSE'
  return (
    <section className="rise pointer-events-none absolute top-[92px] left-[18px] z-4 w-[calc(100%-36px)] transition-opacity duration-400 md:top-32 md:left-8 md:w-[420px] xl:w-[700px]">
      <div className="mb-5 font-mono text-[9px] tracking-[4px] text-[#6578ff] uppercase">{eyebrow}</div>
      <h1 className="m-0 font-serif text-5xl leading-[.91] font-semibold tracking-[-3.5px] md:text-[clamp(52px,4.4vw,80px)]">
        Every File.<br />One <em className="bg-gradient-to-r from-white via-[#9d91ff] to-[#42d8ff] bg-clip-text text-transparent not-italic">Constellation.</em>
      </h1>
      <p className="my-[25px] max-w-[475px] text-sm leading-[1.7] text-[#a0aabd]">Point it at any folders on your machine. Every dot is a real file, colored by the folder it lives in and linked to its siblings, parents and peer folders.</p>
      <div className="pointer-events-auto flex gap-2.5">
        <button onClick={onExplore} className="h-[46px] rounded-[9px] bg-gradient-to-br from-[#5048ff] to-[#7666ff] px-[21px] font-semibold shadow-[0_12px_35px_#5148ff38] transition hover:-translate-y-0.5 hover:brightness-110">Start Exploring&nbsp; →</button>
        <button onClick={onFolders} className="h-[46px] rounded-[9px] border border-line bg-[#0a0f19a8] px-[21px] font-semibold text-[#eaf0ff] backdrop-blur-md transition hover:-translate-y-0.5 hover:brightness-110">Add Folders</button>
      </div>
      <div className="mt-[29px] flex">
        <Metric v={model.N.toLocaleString()} l="Files" /><Metric v={model.groups.length} l="Folders" /><Metric v={model.extCount} l="File types" /><Metric v={model.edges.length.toLocaleString()} l="Links" />
      </div>
    </section>
  )
}
