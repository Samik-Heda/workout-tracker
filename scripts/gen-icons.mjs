// Generates simple placeholder PWA icons (dumbbell glyph) as raw PNGs.
// No external deps — hand-rolls the PNG encoder using Node's built-in zlib.
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'

const BG = [15, 23, 42, 255] // slate-900
const FG = [34, 197, 94, 255] // green-500 accent

function crc32(buf) {
  let c
  const table = crc32.table || (crc32.table = (() => {
    const t = new Uint32Array(256)
    for (let n = 0; n < 256; n++) {
      c = n
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      t[n] = c
    }
    return t
  })())
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const lenBuf = Buffer.alloc(4)
  lenBuf.writeUInt32BE(data.length, 0)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf])
}

function inShape(x, y, s) {
  const nx = x / s
  const ny = y / s
  const bar = ny >= 0.46 && ny <= 0.54 && nx >= 0.14 && nx <= 0.86
  const plateL = nx >= 0.20 && nx <= 0.30 && ny >= 0.28 && ny <= 0.72
  const plateR = nx >= 0.70 && nx <= 0.80 && ny >= 0.28 && ny <= 0.72
  const capL = nx >= 0.08 && nx <= 0.16 && ny >= 0.36 && ny <= 0.64
  const capR = nx >= 0.84 && nx <= 0.92 && ny >= 0.36 && ny <= 0.64
  return bar || plateL || plateR || capL || capR
}

function genPng(size, roundCorners = true) {
  const rowBytes = size * 4
  const raw = Buffer.alloc((rowBytes + 1) * size)
  const cornerRadius = roundCorners ? size * 0.18 : 0

  for (let y = 0; y < size; y++) {
    let offset = y * (rowBytes + 1)
    raw[offset] = 0 // filter type: none
    offset += 1
    for (let x = 0; x < size; x++) {
      // rounded-square mask
      let masked = false
      if (roundCorners) {
        const cx = x < cornerRadius ? cornerRadius : x > size - cornerRadius ? size - cornerRadius : x
        const cy = y < cornerRadius ? cornerRadius : y > size - cornerRadius ? size - cornerRadius : y
        const nearCorner = (x < cornerRadius || x > size - cornerRadius) && (y < cornerRadius || y > size - cornerRadius)
        if (nearCorner) {
          const d = Math.hypot(x - cx, y - cy)
          if (d > cornerRadius) masked = true
        }
      }
      const color = masked ? [0, 0, 0, 0] : inShape(x, y, size) ? FG : BG
      raw[offset++] = color[0]
      raw[offset++] = color[1]
      raw[offset++] = color[2]
      raw[offset++] = color[3]
    }
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  const idat = deflateSync(raw)
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

mkdirSync('public/icons', { recursive: true })
writeFileSync('public/icons/icon-192.png', genPng(192))
writeFileSync('public/icons/icon-512.png', genPng(512))
writeFileSync('public/icons/apple-touch-icon.png', genPng(180, false))
console.log('Generated icons in public/icons/')
