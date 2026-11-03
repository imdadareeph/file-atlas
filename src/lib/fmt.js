export const size = (n) => {
  for (const u of ['B', 'KB', 'MB', 'GB']) { if (n < 1024 || u === 'GB') return (u === 'B' ? n.toFixed(0) : n.toFixed(1)) + ' ' + u; n /= 1024 }
}
export const date = (ms) => new Date(ms).toISOString().slice(0, 10)

const T = {
  image: 'png jpg jpeg gif webp svg heic bmp tiff ico', video: 'mp4 mov mkv webm avi m4v', audio: 'mp3 wav m4a flac ogg aac',
  document: 'pdf doc docx txt md rtf pages odt ppt pptx key', data: 'json csv xml yaml yml xls xlsx sql db parquet',
  code: 'js jsx ts tsx py go rs java c cpp h cs rb php swift kt sh html css scss vue', design: 'psd ai fig sketch xd', archive: 'zip tar gz tgz rar 7z dmg',
}
const EXT = {}
for (const [k, v] of Object.entries(T)) v.split(' ').forEach((e) => (EXT[e] = k))
export const typeOf = (ext) => EXT[ext] || 'other'
export const TYPE_COLOR = { image: '#45d7ff', video: '#ff6ccf', audio: '#59e59a', document: '#ffc857', data: '#ff8a45', code: '#7d6cff', design: '#e35cff', archive: '#63e6d2', other: '#8792a8' }
export const isImage = (ext) => typeOf(ext) === 'image' && ext !== 'heic' && ext !== 'tiff'
