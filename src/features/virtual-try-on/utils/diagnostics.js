/**
 * Checks the distance of the hand from the camera.
 * Returns 'TOO_FAR' if the hand is too far away, 'TOO_CLOSE' if too close, and 'OK' otherwise.
 */
export function checkHandDistance(landmarks) {
  if (!landmarks || landmarks.length < 21) return "OK";

  const wrist = landmarks[0];
  const middleMcp = landmarks[9];
  const distance = Math.hypot(middleMcp.x - wrist.x, middleMcp.y - wrist.y);

  if (distance < 0.16) {
    return "TOO_FAR";
  } else if (distance > 0.55) {
    return "TOO_CLOSE";
  }
  return "OK";
}

/**
 * Performs a fast sharpness diagnostics check on the detected hand region.
 * Crops the hand region, downsamples it to a tiny 64x64 grid, computes local Sobel-like gradients,
 * and calculates the variance. A low variance flags a blurry image (poor focus, dirty lens, or bad lighting).
 */
export function checkImageBlur(source, landmarks) {
  if (!landmarks || landmarks.length < 21) return false;

  let minX = 1.0;
  let maxX = 0.0;
  let minY = 1.0;
  let maxY = 0.0;

  for (const pt of landmarks) {
    if (pt.x < minX) minX = pt.x;
    if (pt.x > maxX) maxX = pt.x;
    if (pt.y < minY) minY = pt.y;
    if (pt.y > maxY) maxY = pt.y;
  }

  const padX = (maxX - minX) * 0.15;
  const padY = (maxY - minY) * 0.15;
  minX = Math.max(0, minX - padX);
  maxX = Math.min(1, maxX + padX);
  minY = Math.max(0, minY - padY);
  maxY = Math.min(1, maxY + padY);

  const size = 64;
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = size;
  tempCanvas.height = size;
  const ctx = tempCanvas.getContext("2d");

  const srcW =
    source instanceof HTMLVideoElement ? source.videoWidth : source.width;
  const srcH =
    source instanceof HTMLVideoElement ? source.videoHeight : source.height;

  if (srcW === 0 || srcH === 0) return false;

  const sx = minX * srcW;
  const sy = minY * srcH;
  const sw = (maxX - minX) * srcW;
  const sh = (maxY - minY) * srcH;

  try {
    ctx.drawImage(source, sx, sy, sw, sh, 0, 0, size, size);
  } catch {
    return false;
  }

  const imgData = ctx.getImageData(0, 0, size, size);
  const pixels = imgData.data;

  let sumG = 0;
  let sumG2 = 0;
  const count = (size - 2) * (size - 2);

  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      const idx = (y * size + x) * 4;
      const grayVal = (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]) / 3;

      const idxRight = (y * size + (x + 1)) * 4;
      const grayRight =
        (pixels[idxRight] + pixels[idxRight + 1] + pixels[idxRight + 2]) / 3;

      const idxDown = ((y + 1) * size + x) * 4;
      const grayDown =
        (pixels[idxDown] + pixels[idxDown + 1] + pixels[idxDown + 2]) / 3;

      const gx = grayRight - grayVal;
      const gy = grayDown - grayVal;
      const magnitude = Math.sqrt(gx * gx + gy * gy);

      sumG += magnitude;
      sumG2 += magnitude * magnitude;
    }
  }

  const mean = sumG / count;
  const variance = sumG2 / count - mean * mean;

  // Threshold calibrated for 64x64: Below 5.2 variance is considered blurry
  return variance < 5.2;
}
