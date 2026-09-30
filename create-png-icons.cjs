const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createCrcTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c >>> 0;
  }
  return table;
}

const crcTable = createCrcTable();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(12 + len);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const toCrc = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crcVal = crc32(toCrc);
  buf.writeUInt32BE(crcVal, 8 + len);
  return buf;
}

function generatePng(size) {
  const width = size;
  const height = size;

  // Raw RGBA scanlines: (1 filter byte + width * 4 bytes per pixel) * height
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter: None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;

      // Centered coordinates -1 to 1
      const nx = (x / width) * 2 - 1;
      const ny = (y / height) * 2 - 1;
      const distCenter = Math.hypot(nx, ny);

      // Background rounded rect gradient: Navy Blue to Royal Blue
      let r = 30 + Math.floor((1 - (y / height)) * 15);
      let g = 58 + Math.floor((y / height) * 50);
      let b = 138 + Math.floor((x / width) * 80);
      let a = 255;

      // Center notebook icon shape
      const inBook = Math.abs(nx) < 0.55 && Math.abs(ny) < 0.65;
      if (inBook) {
        // Spine & pages
        if (Math.abs(nx) < 0.05) {
          // Dark spine
          r = 203; g = 213; b = 225;
        } else {
          // White paper
          r = 255; g = 255; b = 255;

          // Horizontal lines on pages
          const lineY = Math.floor((ny + 0.6) * 10);
          if (lineY % 2 === 0 && Math.abs(nx) > 0.12 && Math.abs(nx) < 0.45) {
            r = 148; g = 163; b = 184;
          }
        }
      }

      // Golden star / badge on bottom right
      const starDist = Math.hypot(nx - 0.35, ny - 0.35);
      if (starDist < 0.22) {
        r = 245; g = 158; b = 11; // Amber Gold
      }
      if (starDist < 0.12) {
        r = 255; g = 255; b = 255; // White star center
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  // Compress IDAT
  const compressed = zlib.deflateSync(rawData);

  // PNG Signature
  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 6; // Color type RGBA
  ihdrData[10] = 0; // Deflate
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Non-interlaced
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // IDAT chunk
  const idatChunk = makeChunk('IDAT', compressed);

  // IEND chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

const pubDir = path.join(__dirname, 'public');
fs.writeFileSync(path.join(pubDir, 'icon-192.png'), generatePng(192));
fs.writeFileSync(path.join(pubDir, 'icon-512.png'), generatePng(512));

console.log('Generated icon-192.png and icon-512.png successfully!');
