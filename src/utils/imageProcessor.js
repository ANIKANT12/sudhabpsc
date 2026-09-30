/**
 * CamScanner-Grade Image Processing Engine for Sudha BPSC Notes
 * Features:
 * - 4-corner document boundary detection
 * - Bilinear perspective warp transformation (straightens angled scans)
 * - Document filters: Magic Color, B&W, Grayscale, Enhanced
 * - Blur and low-light quality detection
 */

// Helper to create an HTML Image element from a data URL or Blob
export const loadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
};

/**
 * Automatically detects the four corners of a sheet of paper.
 * Returns normalized points { tl, tr, br, bl } with coordinates between 0 and 1.
 */
export const detectDocumentCorners = (imageOrCanvas) => {
  const width = imageOrCanvas.naturalWidth || imageOrCanvas.width;
  const height = imageOrCanvas.naturalHeight || imageOrCanvas.height;

  // Safe default: 6% inset quadrilateral covering 88% of screen
  const defaultCorners = {
    tl: { x: 0.06, y: 0.06 },
    tr: { x: 0.94, y: 0.06 },
    br: { x: 0.94, y: 0.94 },
    bl: { x: 0.06, y: 0.94 },
  };

  try {
    // Process on a small thumbnail canvas for fast edge detection
    const sampleCanvas = document.createElement('canvas');
    const scale = Math.min(300 / width, 400 / height);
    const sw = Math.round(width * scale);
    const sh = Math.round(height * scale);
    sampleCanvas.width = sw;
    sampleCanvas.height = sh;

    const ctx = sampleCanvas.getContext('2d');
    ctx.drawImage(imageOrCanvas, 0, 0, sw, sh);
    const imgData = ctx.getImageData(0, 0, sw, sh);
    const data = imgData.data;

    // Convert to grayscale & compute average luminance
    let totalLum = 0;
    const gray = new Uint8Array(sw * sh);
    for (let i = 0; i < data.length; i += 4) {
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      gray[i / 4] = lum;
      totalLum += lum;
    }
    const avgLum = totalLum / (sw * sh);

    // Simple Sobel edge detection to find paper margins
    let minX = sw * 0.05, maxX = sw * 0.95;
    let minY = sh * 0.05, maxY = sh * 0.95;

    // Find top boundary
    for (let y = Math.floor(sh * 0.03); y < sh * 0.4; y++) {
      let edgeCount = 0;
      for (let x = Math.floor(sw * 0.15); x < sw * 0.85; x++) {
        const diff = Math.abs(gray[y * sw + x] - gray[(y + 3) * sw + x]);
        if (diff > 35) edgeCount++;
      }
      if (edgeCount > sw * 0.2) {
        minY = y;
        break;
      }
    }

    // Find bottom boundary
    for (let y = Math.floor(sh * 0.97); y > sh * 0.6; y--) {
      let edgeCount = 0;
      for (let x = Math.floor(sw * 0.15); x < sw * 0.85; x++) {
        const diff = Math.abs(gray[y * sw + x] - gray[(y - 3) * sw + x]);
        if (diff > 35) edgeCount++;
      }
      if (edgeCount > sw * 0.2) {
        maxY = y;
        break;
      }
    }

    // Find left boundary
    for (let x = Math.floor(sw * 0.03); x < sw * 0.4; x++) {
      let edgeCount = 0;
      for (let y = Math.floor(sh * 0.15); y < sh * 0.85; y++) {
        const diff = Math.abs(gray[y * sw + x] - gray[y * sw + (x + 3)]);
        if (diff > 35) edgeCount++;
      }
      if (edgeCount > sh * 0.2) {
        minX = x;
        break;
      }
    }

    // Find right boundary
    for (let x = Math.floor(sw * 0.97); x > sw * 0.6; x--) {
      let edgeCount = 0;
      for (let y = Math.floor(sh * 0.15); y < sh * 0.85; y++) {
        const diff = Math.abs(gray[y * sw + x] - gray[y * sw + (x - 3)]);
        if (diff > 35) edgeCount++;
      }
      if (edgeCount > sh * 0.2) {
        maxX = x;
        break;
      }
    }

    // Ensure valid bounding box
    if (maxX - minX > sw * 0.4 && maxY - minY > sh * 0.4) {
      return {
        tl: { x: Math.max(0.02, minX / sw), y: Math.max(0.02, minY / sh) },
        tr: { x: Math.min(0.98, maxX / sw), y: Math.max(0.02, minY / sh) },
        br: { x: Math.min(0.98, maxX / sw), y: Math.min(0.98, maxY / sh) },
        bl: { x: Math.max(0.02, minX / sw), y: Math.min(0.98, maxY / sh) },
      };
    }
  } catch (err) {
    console.warn('Corner detection fallback to defaults:', err);
  }

  return defaultCorners;
};

/**
 * Evaluates scan quality: checks for blur (Laplacian variance) and poor lighting.
 */
export const checkImageQuality = (canvas) => {
  const ctx = canvas.getContext('2d');
  const w = Math.min(canvas.width, 240);
  const h = Math.min(canvas.height, 320);

  const thumb = document.createElement('canvas');
  thumb.width = w;
  thumb.height = h;
  const tCtx = thumb.getContext('2d');
  tCtx.drawImage(canvas, 0, 0, w, h);

  const imgData = tCtx.getImageData(0, 0, w, h);
  const data = imgData.data;

  // Grayscale buffer
  const gray = new Float32Array(w * h);
  let totalLum = 0;
  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    gray[i / 4] = lum;
    totalLum += lum;
  }
  const avgLum = totalLum / (w * h);

  // Discrete Laplacian for blur detection
  let lapSum = 0;
  let lapSumSq = 0;
  let count = 0;

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      const lap =
        gray[idx - w] +
        gray[idx + w] +
        gray[idx - 1] +
        gray[idx + 1] -
        4 * gray[idx];
      lapSum += lap;
      lapSumSq += lap * lap;
      count++;
    }
  }

  const mean = lapSum / count;
  const variance = lapSumSq / count - mean * mean;

  const isTooDark = avgLum < 55;
  const isBlurry = variance < 80; // Lower variance means less high-frequency edge detail (blur)
  const isGood = !isTooDark && !isBlurry;

  let message = 'Clear document quality';
  if (isBlurry && isTooDark) {
    message = 'Image is blurry and dark. Retake recommended for best notes readability.';
  } else if (isBlurry) {
    message = 'Image appears slightly blurry. For crisp handwritten notes, retake is recommended.';
  } else if (isTooDark) {
    message = 'Lighting is dim. Turn on phone flash or room light for clearer notes.';
  }

  return {
    isGood,
    isBlurry,
    isTooDark,
    avgLum: Math.round(avgLum),
    sharpnessScore: Math.round(variance),
    message,
  };
};

/**
 * Calculates Homography Matrix for 4-point quadrilateral to rectangle transformation
 */
function getPerspectiveTransform(src, dst) {
  // src and dst are arrays of 4 points: [{x, y}, ...]
  // We solve 8 linear equations: Ah = b
  const a = [];
  const b = [];

  for (let i = 0; i < 4; i++) {
    const sx = src[i].x;
    const sy = src[i].y;
    const dx = dst[i].x;
    const dy = dst[i].y;

    a.push([sx, sy, 1, 0, 0, 0, -sx * dx, -sy * dx]);
    b.push(dx);

    a.push([0, 0, 0, sx, sy, 1, -sx * dy, -sy * dy]);
    b.push(dy);
  }

  // Gaussian elimination to solve h = a^-1 * b
  const n = 8;
  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(a[k][i]) > Math.abs(a[maxRow][i])) {
        maxRow = k;
      }
    }
    const tmpA = a[i];
    a[i] = a[maxRow];
    a[maxRow] = tmpA;

    const tmpB = b[i];
    b[i] = b[maxRow];
    b[maxRow] = tmpB;

    const pivot = a[i][i];
    if (Math.abs(pivot) < 1e-10) continue;

    for (let j = i; j < n; j++) {
      a[i][j] /= pivot;
    }
    b[i] /= pivot;

    for (let k = 0; k < n; k++) {
      if (k !== i) {
        const factor = a[k][i];
        for (let j = i; j < n; j++) {
          a[k][j] -= factor * a[i][j];
        }
        b[k] -= factor * b[i];
      }
    }
  }

  return [
    b[0], b[1], b[2],
    b[3], b[4], b[5],
    b[6], b[7], 1.0,
  ];
}

/**
 * Warps a perspective quad into a flat rectangular canvas
 * @param {HTMLImageElement|HTMLCanvasElement} sourceImage
 * @param {Object} corners - { tl: {x,y}, tr: {x,y}, br: {x,y}, bl: {x,y} } in normalized [0..1]
 * @param {number} [targetWidth]
 * @param {number} [targetHeight]
 * @returns {HTMLCanvasElement}
 */
export const warpPerspective = (sourceImage, corners, targetWidth, targetHeight) => {
  const origW = sourceImage.naturalWidth || sourceImage.width;
  const origH = sourceImage.naturalHeight || sourceImage.height;

  // Convert normalized corners to pixel coordinates
  const pTL = { x: corners.tl.x * origW, y: corners.tl.y * origH };
  const pTR = { x: corners.tr.x * origW, y: corners.tr.y * origH };
  const pBR = { x: corners.br.x * origW, y: corners.br.y * origH };
  const pBL = { x: corners.bl.x * origW, y: corners.bl.y * origH };

  // Calculate geometric width & height of document
  const topWidth = Math.hypot(pTR.x - pTL.x, pTR.y - pTL.y);
  const bottomWidth = Math.hypot(pBR.x - pBL.x, pBR.y - pBL.y);
  const leftHeight = Math.hypot(pBL.x - pTL.x, pBL.y - pTL.y);
  const rightHeight = Math.hypot(pBR.x - pTR.x, pBR.y - pTR.y);

  const outW = Math.round(targetWidth || Math.max(topWidth, bottomWidth));
  const outH = Math.round(targetHeight || Math.max(leftHeight, rightHeight));

  // Cap max resolution to 1600px for high-definition clarity while keeping payload under 350KB
  const maxDim = 1600;
  const scale = Math.min(1, maxDim / Math.max(outW, outH));
  const finalW = Math.round(outW * scale);
  const finalH = Math.round(outH * scale);

  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = finalW;
  outputCanvas.height = finalH;
  const outCtx = outputCanvas.getContext('2d');

  // Source canvas to sample from
  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = origW;
  srcCanvas.height = origH;
  const srcCtx = srcCanvas.getContext('2d');
  srcCtx.drawImage(sourceImage, 0, 0);

  const srcImgData = srcCtx.getImageData(0, 0, origW, origH);
  const srcPixels = srcImgData.data;

  const outImgData = outCtx.createImageData(finalW, finalH);
  const outPixels = outImgData.data;

  // Destination quad is rectangle: (0,0) to (finalW, finalH)
  const dstPoints = [
    { x: 0, y: 0 },
    { x: finalW, y: 0 },
    { x: finalW, y: finalH },
    { x: 0, y: finalH },
  ];
  const srcPoints = [pTL, pTR, pBR, pBL];

  // We want mapping from DESTINATION (dx, dy) back to SOURCE (sx, sy)
  const H = getPerspectiveTransform(dstPoints, srcPoints);

  for (let dy = 0; dy < finalH; dy++) {
    for (let dx = 0; dx < finalW; dx++) {
      // Perspective projection
      const denom = H[6] * dx + H[7] * dy + H[8];
      const sx = (H[0] * dx + H[1] * dy + H[2]) / denom;
      const sy = (H[3] * dx + H[4] * dy + H[5]) / denom;

      const outIdx = (dy * finalW + dx) * 4;

      if (sx >= 0 && sx < origW - 1 && sy >= 0 && sy < origH - 1) {
        // Bilinear interpolation for crystal clarity
        const x0 = Math.floor(sx);
        const x1 = x0 + 1;
        const y0 = Math.floor(sy);
        const y1 = y0 + 1;

        const fx = sx - x0;
        const fy = sy - y0;

        const i00 = (y0 * origW + x0) * 4;
        const i10 = (y0 * origW + x1) * 4;
        const i01 = (y1 * origW + x0) * 4;
        const i11 = (y1 * origW + x1) * 4;

        for (let c = 0; c < 3; c++) {
          const val =
            (1 - fx) * (1 - fy) * srcPixels[i00 + c] +
            fx * (1 - fy) * srcPixels[i10 + c] +
            (1 - fx) * fy * srcPixels[i01 + c] +
            fx * fy * srcPixels[i11 + c];
          outPixels[outIdx + c] = val;
        }
        outPixels[outIdx + 3] = 255;
      } else {
        outPixels[outIdx] = 255;
        outPixels[outIdx + 1] = 255;
        outPixels[outIdx + 2] = 255;
        outPixels[outIdx + 3] = 255;
      }
    }
  }

  outCtx.putImageData(outImgData, 0, 0);
  return outputCanvas;
};

/**
 * CamScanner-style enhancement filters
 * Modes: 'magic_color' (Document), 'bw' (Clean B&W), 'grayscale', 'enhanced', 'original'
 */
export const applyFilter = (canvas, filterType) => {
  if (filterType === 'original') {
    return canvas;
  }

  const w = canvas.width;
  const h = canvas.height;
  const filteredCanvas = document.createElement('canvas');
  filteredCanvas.width = w;
  filteredCanvas.height = h;
  const ctx = filteredCanvas.getContext('2d');
  ctx.drawImage(canvas, 0, 0);

  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  if (filterType === 'magic_color' || filterType === 'document') {
    // Magic Color / Document: Removes yellow cast, shadows, brightens paper background, keeps ink vivid
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      const lum = 0.299 * r + 0.587 * g + 0.114 * b;

      if (lum > 140) {
        // Paper background: push towards clean white
        const boost = Math.min(255, lum * 1.25);
        r = Math.min(255, r * 1.25);
        g = Math.min(255, g * 1.25);
        b = Math.min(255, b * 1.25);
      } else {
        // Dark ink: increase contrast & saturation
        r = Math.max(0, r * 0.85);
        g = Math.max(0, g * 0.85);
        b = Math.max(0, b * 0.85);
      }

      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }
  } else if (filterType === 'bw') {
    // High-contrast clean black-and-white
    const threshold = 145;
    for (let i = 0; i < data.length; i += 4) {
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      const val = lum > threshold ? 255 : 0;
      data[i] = val;
      data[i + 1] = val;
      data[i + 2] = val;
    }
  } else if (filterType === 'grayscale') {
    // Clean, smooth monochrome
    for (let i = 0; i < data.length; i += 4) {
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      data[i] = lum;
      data[i + 1] = lum;
      data[i + 2] = lum;
    }
  } else if (filterType === 'enhanced') {
    // Contrast boost & slight color saturation
    for (let i = 0; i < data.length; i += 4) {
      for (let c = 0; c < 3; c++) {
        let val = data[i + c];
        // S-curve contrast
        val = ((val - 128) * 1.35) + 128;
        data[i + c] = Math.max(0, Math.min(255, val));
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return filteredCanvas;
};

/**
 * Rotates an image/canvas by 90, 180, or 270 degrees
 */
export const rotateCanvas = (canvas, degrees = 90) => {
  const rad = (degrees * Math.PI) / 180;
  const isSwap = degrees % 180 !== 0;

  const targetW = isSwap ? canvas.height : canvas.width;
  const targetH = isSwap ? canvas.width : canvas.height;

  const rotated = document.createElement('canvas');
  rotated.width = targetW;
  rotated.height = targetH;
  const ctx = rotated.getContext('2d');

  ctx.translate(targetW / 2, targetH / 2);
  ctx.rotate(rad);
  ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);

  return rotated;
};

/**
 * Compresses and downscales any image/canvas to a lightweight HD format (max 1600px, JPEG 0.82)
 * Ensures photos taken on 12MP/48MP phones fit easily within cloud limits (< 400KB).
 */
export const compressImage = async (dataUrlOrFile, maxDim = 1600, quality = 0.82) => {
  try {
    let img;
    if (typeof dataUrlOrFile === 'string') {
      img = await loadImage(dataUrlOrFile);
    } else {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(dataUrlOrFile);
      });
      img = await loadImage(dataUrl);
    }

    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;

    let targetW = w;
    let targetH = h;
    if (w > maxDim || h > maxDim) {
      if (w > h) {
        targetW = maxDim;
        targetH = Math.round((h * maxDim) / w);
      } else {
        targetH = maxDim;
        targetW = Math.round((w * maxDim) / h);
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, targetW, targetH);

    return canvas.toDataURL('image/jpeg', quality);
  } catch (err) {
    console.warn('Image compression fallback:', err);
    if (typeof dataUrlOrFile === 'string') return dataUrlOrFile;
    throw err;
  }
};
