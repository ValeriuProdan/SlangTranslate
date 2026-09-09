/**
 * Generates the extension icons as PNGs with no dependencies.
 *
 * The mark: a rounded tile in the Romanian tricolour with a speech bubble
 * punched out of it. Everything is drawn as signed geometry and 4x
 * supersampled, so the small sizes stay clean.
 *
 * Usage: npm run icons
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const SIZES = [16, 32, 48, 128];
const SS = 4; // supersampling factor

const BLUE = [0x00, 0x2b, 0x7f];
const YELLOW = [0xfc, 0xd1, 0x16];
const RED = [0xce, 0x11, 0x26];
const WHITE = [0xff, 0xff, 0xff];
const INK = [0x14, 0x16, 0x1c];

function insideRoundedRect(x, y, x0, y0, x1, y1, r) {
  if (x < x0 || x > x1 || y < y0 || y > y1) return false;
  const cx = Math.min(Math.max(x, x0 + r), x1 - r);
  const cy = Math.min(Math.max(y, y0 + r), y1 - r);
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= r * r;
}

function insideCircle(x, y, cx, cy, r) {
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= r * r;
}

// Barycentric point-in-triangle, used for the bubble's tail.
function insideTriangle(x, y, ax, ay, bx, by, cx, cy) {
  const d = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy);
  const a = ((by - cy) * (x - cx) + (cx - bx) * (y - cy)) / d;
  const b = ((cy - ay) * (x - cx) + (ax - cx) * (y - cy)) / d;
  return a >= 0 && b >= 0 && a + b <= 1;
}

/** Colour at a point in unit space, or null for transparent. */
function sample(x, y) {
  if (!insideRoundedRect(x, y, 0, 0, 1, 1, 0.22)) return null;

  const bubble = insideRoundedRect(x, y, 0.14, 0.20, 0.86, 0.64, 0.16) ||
    insideTriangle(x, y, 0.30, 0.60, 0.50, 0.60, 0.31, 0.86);

  if (bubble) {
    const dotY = 0.42;
    for (const dotX of [0.32, 0.50, 0.68]) {
      if (insideCircle(x, y, dotX, dotY, 0.058)) return INK;
    }
    return WHITE;
  }

  if (x < 1 / 3) return BLUE;
  if (x < 2 / 3) return YELLOW;
  return RED;
}

function render(size) {
  const rgba = Buffer.alloc(size * size * 4);
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const x = (px + (sx + 0.5) / SS) / size;
          const y = (py + (sy + 0.5) / SS) / size;
          const c = sample(x, y);
          if (c) { r += c[0]; g += c[1]; b += c[2]; a += 255; }
        }
      }
      const n = SS * SS;
      const i = (py * size + px) * 4;
      const covered = a / 255;
      // Un-premultiply so edge pixels keep their colour instead of going grey.
      rgba[i] = covered ? Math.round(r / covered) : 0;
      rgba[i + 1] = covered ? Math.round(g / covered) : 0;
      rgba[i + 2] = covered ? Math.round(b / covered) : 0;
      rgba[i + 3] = Math.round(a / n);
    }
  }
  return rgba;
}

// ---- minimal PNG encoder -------------------------------------------------

const CRC_TABLE = (function () {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function encodePng(size, rgba) {
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0; // filter type: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // colour type: RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

const outDir = path.join(__dirname, '..', 'icons');
fs.mkdirSync(outDir, { recursive: true });
SIZES.forEach(function (size) {
  const file = path.join(outDir, 'icon' + size + '.png');
  fs.writeFileSync(file, encodePng(size, render(size)));
  console.log('wrote ' + path.relative(process.cwd(), file));
});
