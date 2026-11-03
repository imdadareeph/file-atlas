// Scan folders the user picked via the browser's folder picker (File System Access API, Chromium).
// Works where the Node server is blocked by the OS, because the browser holds the permission.
export const supported = () => typeof window.showDirectoryPicker === 'function'
const HIDE = (n) => n.startsWith('.') || n === 'node_modules'

export async function walk(dir, id, depth, budget) {
  const files = []
  let truncated = false
  const rec = async (d, rel, level) => {
    const fileEntries = [], dirs = []
    for await (const [name, h] of d.entries()) {
      if (HIDE(name)) continue
      ;(h.kind === 'directory' ? dirs : fileEntries).push([name, h])
    }
    await Promise.all(fileEntries.map(async ([name, h]) => {
      if (files.length >= budget) { truncated = true; return }
      let f; try { f = await h.getFile() } catch { return }
      files.push({ name, root: dir.name, rootPath: 'browser:' + id, rel: rel + name, abs: null, handle: h, ext: (name.includes('.') ? name.split('.').pop() : 'file').toLowerCase(), size: f.size, mtime: f.lastModified })
    }))
    if (level < depth) for (const [name, h] of dirs) await rec(h, rel + name + '/', level + 1)
  }
  await rec(dir, '', 0)
  return { files, truncated }
}

// Handles survive reloads in IndexedDB; the browser only asks for a one-click re-allow.
const db = () => new Promise((ok, err) => {
  const r = indexedDB.open('fileatlas', 1)
  r.onupgradeneeded = () => r.result.createObjectStore('h', { keyPath: 'id' })
  r.onsuccess = () => ok(r.result); r.onerror = () => err(r.error)
})
export async function saveHandles(list) {
  try {
    const d = await db(), tx = d.transaction('h', 'readwrite'), s = tx.objectStore('h')
    s.clear(); list.forEach((p) => s.put({ id: p.id, name: p.name, handle: p.handle }))
    await new Promise((ok) => (tx.oncomplete = ok))
  } catch { /* private mode etc: picks just won't persist */ }
}
export async function loadHandles() {
  try { const d = await db(); return await new Promise((ok) => { const r = d.transaction('h').objectStore('h').getAll(); r.onsuccess = () => ok(r.result) }) } catch { return [] }
}
export const granted = async (h) => (await h.queryPermission({ mode: 'read' })) === 'granted'
export const regrant = async (h) => (await h.requestPermission({ mode: 'read' })) === 'granted'

export async function pick(existing) {
  const h = await window.showDirectoryPicker({ mode: 'read' })
  for (const p of existing) if (await p.handle.isSameEntry(h)) return null
  return { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name: h.name, handle: h, allowed: true }
}

export const blobUrl = async (file) => URL.createObjectURL(await file.handle.getFile())
