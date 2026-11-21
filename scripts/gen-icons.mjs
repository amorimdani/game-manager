import fs from "node:fs";
import zlib from "node:zlib";

fs.mkdirSync("public/icons", { recursive: true });

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  crcTable[n] = c;
}

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) {
    c = (c >>> 8) ^ crcTable[(c ^ buf[i]) & 0xff];
  }
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}

function makeIcon(size, outPath) {
  const raw = Buffer.alloc(size * (1 + size * 4));
  const bg = [9, 9, 11, 255];
  const fg = [250, 250, 250, 255];
  const accent = [225, 29, 72, 255];
  const pad = Math.floor(size * 0.24);
  const thick = Math.max(4, Math.floor(size * 0.11));
  const dot = Math.max(4, Math.floor(size * 0.08));

  for (let y = 0; y < size; y++) {
    const row = y * (1 + size * 4);
    raw[row] = 0;
    for (let x = 0; x < size; x++) {
      let c = bg;
      const inVert = x >= pad && x < pad + thick && y >= pad && y < size - pad;
      const inHoriz =
        x >= pad &&
        x < size - pad - dot * 2 &&
        y >= size - pad - thick &&
        y < size - pad;
      const inDot =
        x >= size - pad - dot * 1.4 &&
        x < size - pad &&
        y >= size - pad - dot * 1.4 &&
        y < size - pad;
      if (inVert || inHoriz) c = fg;
      if (inDot) c = accent;
      const idx = row + 1 + x * 4;
      raw[idx] = c[0];
      raw[idx + 1] = c[1];
      raw[idx + 2] = c[2];
      raw[idx + 3] = c[3];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
  fs.writeFileSync(outPath, png);
}

makeIcon(192, "public/icons/icon-192.png");
makeIcon(512, "public/icons/icon-512.png");
makeIcon(180, "public/icons/apple-touch-icon.png");
console.log("Icons generated successfully");
