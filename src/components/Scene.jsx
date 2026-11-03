import { useEffect, useRef } from 'react'
import { createAtlas } from '../lib/atlas.js'

export default function Scene({ model, selected, onHover, onSelect, onBare, atlasRef }) {
  const el = useRef(null), cbs = useRef({})
  cbs.current = { onHover, onSelect, onBare }
  useEffect(() => {
    const a = createAtlas(el.current, { onHover: (...x) => cbs.current.onHover(...x), onSelect: (i) => cbs.current.onSelect(i), onBare: (b) => cbs.current.onBare(b) })
    atlasRef.current = a
    return () => a.dispose()
  }, [])
  useEffect(() => { atlasRef.current.setModel(model) }, [model])
  useEffect(() => { atlasRef.current.setSelected(selected) }, [selected])
  return (
    <>
      <div ref={el} className="absolute inset-0" />
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(ellipse at 55% 50%,transparent 35%,rgba(0,0,0,.4) 100%)' }} />
    </>
  )
}
