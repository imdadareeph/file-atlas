export const getConfig = () => fetch('/api/config').then((r) => r.json())
export const scanPaths = (paths, depth) =>
  fetch('/api/scan', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ paths, depth }) }).then((r) => r.json())
import { useEffect, useState } from 'react'
import { blobUrl } from './browserScan.js'
import { isImage } from './fmt.js'
export const fileUrl = (abs) => '/api/file?p=' + encodeURIComponent(abs)

// Image preview URL for a scanned file: server-served, or a blob from a browser-picked handle.
export function usePreview(f) {
  const [u, setU] = useState(null)
  useEffect(() => {
    setU(null)
    if (!f || !isImage(f.ext)) return
    if (f.abs) return setU(fileUrl(f.abs))
    let dead = false, url
    blobUrl(f).then((x) => { url = x; dead ? URL.revokeObjectURL(x) : setU(x) })
    return () => { dead = true; url && URL.revokeObjectURL(url) }
  }, [f])
  return u
}
export async function openFile(f) {
  if (f.abs) return window.open(fileUrl(f.abs), '_blank', 'noopener')
  const u = await blobUrl(f); window.open(u, '_blank', 'noopener'); setTimeout(() => URL.revokeObjectURL(u), 60000)
}
