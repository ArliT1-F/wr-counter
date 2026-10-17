// Dependency-free PNG drawing helpers (used for placeholder app icons + OG images).
// Pure Node: zlib + a tiny 5x7 bitmap font. No canvas, no native deps.
import zlib from 'node:zlib';

// ---------------------------------------------------------------------------
// PNG encoding
// ---------------------------------------------------------------------------
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crc]);
}

export function encodePNG(canvas) {
  const { width, height, data } = canvas;
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    data.copy ? data.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
              : raw.set(data.subarray(y * stride, (y + 1) * stride), y * (stride + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

export function createCanvas(width, height) {
  return { width, height, data: Buffer.alloc(width * height * 4) };
}

function hex(color) {
  const h = color.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
    255,
  ];
}

export function fillRect(canvas, x, y, w, h, color) {
  const [r, g, b, a] = hex(color);
  for (let py = Math.max(0, y | 0); py < Math.min(canvas.height, (y + h) | 0); py++) {
    for (let px = Math.max(0, x | 0); px < Math.min(canvas.width, (x + w) | 0); px++) {
      const i = (py * canvas.width + px) * 4;
      canvas.data[i] = r;
      canvas.data[i + 1] = g;
      canvas.data[i + 2] = b;
      canvas.data[i + 3] = a;
    }
  }
}

export function fillCircle(canvas, cx, cy, radius, color) {
  const [r, g, b, a] = hex(color);
  const r2 = radius * radius;
  for (let py = Math.max(0, (cy - radius) | 0); py < Math.min(canvas.height, (cy + radius + 1) | 0); py++) {
    for (let px = Math.max(0, (cx - radius) | 0); px < Math.min(canvas.width, (cx + radius + 1) | 0); px++) {
      const dx = px - cx;
      const dy = py - cy;
      if (dx * dx + dy * dy <= r2) {
        const i = (py * canvas.width + px) * 4;
        canvas.data[i] = r;
        canvas.data[i + 1] = g;
        canvas.data[i + 2] = b;
        canvas.data[i + 3] = a;
      }
    }
  }
}

export function fillRoundedRect(canvas, x, y, w, h, radius, color) {
  const [r, g, b, a] = hex(color);
  for (let py = Math.max(0, y | 0); py < Math.min(canvas.height, (y + h) | 0); py++) {
    for (let px = Math.max(0, x | 0); px < Math.min(canvas.width, (x + w) | 0); px++) {
      const dx = Math.max(x + radius - px, 0, px - (x + w - radius - 1));
      const dy = Math.max(y + radius - py, 0, py - (y + h - radius - 1));
      if (dx * dx + dy * dy <= radius * radius) {
        const i = (py * canvas.width + px) * 4;
        canvas.data[i] = r;
        canvas.data[i + 1] = g;
        canvas.data[i + 2] = b;
        canvas.data[i + 3] = a;
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 5x7 bitmap font (A-Z, 0-9, space, hyphen, period, exclamation, colon, %)
// ---------------------------------------------------------------------------
const FONT = {
  A: [' XXX ', 'X   X', 'X   X', 'XXXXX', 'X   X', 'X   X', 'X   X'],
  B: ['XXXX ', 'X   X', 'X   X', 'XXXX ', 'X   X', 'X   X', 'XXXX '],
  C: [' XXX ', 'X   X', 'X    ', 'X    ', 'X    ', 'X   X', ' XXX '],
  D: ['XXXX ', 'X   X', 'X   X', 'X   X', 'X   X', 'X   X', 'XXXX '],
  E: ['XXXXX', 'X    ', 'X    ', 'XXXX ', 'X    ', 'X    ', 'XXXXX'],
  F: ['XXXXX', 'X    ', 'X    ', 'XXXX ', 'X    ', 'X    ', 'X    '],
  G: [' XXX ', 'X   X', 'X    ', 'X  XX', 'X   X', 'X   X', ' XXX '],
  H: ['X   X', 'X   X', 'X   X', 'XXXXX', 'X   X', 'X   X', 'X   X'],
  I: ['XXXXX', '  X  ', '  X  ', '  X  ', '  X  ', '  X  ', 'XXXXX'],
  J: ['XXXXX', '    X', '    X', '    X', '    X', 'X   X', ' XXX '],
  K: ['X   X', 'X  X ', 'X X  ', 'XX   ', 'X X  ', 'X  X ', 'X   X'],
  L: ['X    ', 'X    ', 'X    ', 'X    ', 'X    ', 'X    ', 'XXXXX'],
  M: ['X   X', 'XX XX', 'X X X', 'X X X', 'X   X', 'X   X', 'X   X'],
  N: ['X   X', 'XX  X', 'XX  X', 'X X X', 'X  XX', 'X  XX', 'X   X'],
  O: [' XXX ', 'X   X', 'X   X', 'X   X', 'X   X', 'X   X', ' XXX '],
  P: ['XXXX ', 'X   X', 'X   X', 'XXXX ', 'X    ', 'X    ', 'X    '],
  Q: [' XXX ', 'X   X', 'X   X', 'X   X', 'X X X', 'X  X ', ' XX X'],
  R: ['XXXX ', 'X   X', 'X   X', 'XXXX ', 'X X  ', 'X  X ', 'X   X'],
  S: [' XXX ', 'X   X', 'X    ', ' XXX ', '    X', 'X   X', ' XXX '],
  T: ['XXXXX', '  X  ', '  X  ', '  X  ', '  X  ', '  X  ', '  X  '],
  U: ['X   X', 'X   X', 'X   X', 'X   X', 'X   X', 'X   X', ' XXX '],
  V: ['X   X', 'X   X', 'X   X', 'X   X', 'X   X', ' X X ', '  X  '],
  W: ['X   X', 'X   X', 'X   X', 'X X X', 'X X X', 'XX XX', 'X   X'],
  X: ['X   X', 'X   X', ' X X ', '  X  ', ' X X ', 'X   X', 'X   X'],
  Y: ['X   X', 'X   X', ' X X ', '  X  ', '  X  ', '  X  ', '  X  '],
  Z: ['XXXXX', '    X', '   X ', '  X  ', ' X   ', 'X    ', 'XXXXX'],
  0: [' XXX ', 'X   X', 'X  XX', 'X X X', 'XX  X', 'X   X', ' XXX '],
  1: ['  X  ', ' XX  ', '  X  ', '  X  ', '  X  ', '  X  ', ' XXX '],
  2: [' XXX ', 'X   X', '    X', '   X ', '  X  ', ' X   ', 'XXXXX'],
  3: [' XXX ', 'X   X', '    X', '  XX ', '    X', 'X   X', ' XXX '],
  4: ['   X ', '  XX ', ' X X ', 'X  X ', 'XXXXX', '   X ', '   X '],
  5: ['XXXXX', 'X    ', 'XXXX ', '    X', '    X', 'X   X', ' XXX '],
  6: [' XXX ', 'X    ', 'X    ', 'XXXX ', 'X   X', 'X   X', ' XXX '],
  7: ['XXXXX', '    X', '   X ', '  X  ', ' X   ', ' X   ', ' X   '],
  8: [' XXX ', 'X   X', 'X   X', ' XXX ', 'X   X', 'X   X', ' XXX '],
  9: [' XXX ', 'X   X', 'X   X', ' XXX ', '    X', '    X', ' XXX '],
  ' ': ['     ', '     ', '     ', '     ', '     ', '     ', '     '],
  '-': ['     ', '     ', '     ', 'XXXXX', '     ', '     ', '     '],
  '.': ['     ', '     ', '     ', '     ', '     ', ' XX  ', ' XX  '],
  '!': ['  X  ', '  X  ', '  X  ', '  X  ', '  X  ', '     ', '  X  '],
  ':': ['     ', ' XX  ', ' XX  ', '     ', ' XX  ', ' XX  ', '     '],
  "'": [' XX  ', ' XX  ', ' X   ', '     ', '     ', '     ', '     '],
  '%': ['XX  X', 'XX  X', '   X ', '  X  ', ' X   ', 'X  XX', 'X  XX'],
  '/': ['    X', '    X', '   X ', '  X  ', ' X   ', 'X    ', 'X    '],
  '+': ['     ', '  X  ', '  X  ', 'XXXXX', '  X  ', '  X  ', '     '],
};

export function textWidth(text, scale = 1) {
  return text.length * 6 * scale - scale;
}

export function drawText(canvas, x, y, text, color, scale = 1, align = 'left') {
  const up = String(text).toUpperCase();
  let ox = x;
  if (align === 'center') ox = x - textWidth(up, scale) / 2;
  if (align === 'right') ox = x - textWidth(up, scale);
  for (const ch of up) {
    const glyph = FONT[ch] || FONT[' '];
    for (let gy = 0; gy < 7; gy++) {
      for (let gx = 0; gx < 5; gx++) {
        if (glyph[gy][gx] === 'X') {
          fillRect(canvas, ox + gx * scale, y + gy * scale, scale, scale, color);
        }
      }
    }
    ox += 6 * scale;
  }
}
