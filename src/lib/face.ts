/**
 * Lightweight face locator used for auto-framing the uploaded photo.
 *
 * Uses the native FaceDetector when the browser ships it, and otherwise falls
 * back to a skin-tone + centre-bias heuristic on a downscaled copy of the
 * image. Everything is returned in normalised image coordinates (0..1).
 */
export type FaceBox = { cx: number; cy: number; w: number; h: number };

const DEFAULT_FACE: FaceBox = { cx: 0.5, cy: 0.42, w: 0.42, h: 0.5 };

async function nativeDetect(img: HTMLImageElement): Promise<FaceBox | null> {
  const FD = (globalThis as unknown as { FaceDetector?: new (o?: unknown) => { detect(i: unknown): Promise<Array<{ boundingBox: DOMRectReadOnly }>> } }).FaceDetector;
  if (!FD) return null;
  try {
    const faces = await new FD({ fastMode: true, maxDetectedFaces: 5 }).detect(img);
    if (!faces?.length) return null;
    const best = faces.reduce((a, b) =>
      a.boundingBox.width * a.boundingBox.height >= b.boundingBox.width * b.boundingBox.height ? a : b,
    );
    const b = best.boundingBox;
    const W = img.naturalWidth || img.width;
    const H = img.naturalHeight || img.height;
    return { cx: (b.x + b.width / 2) / W, cy: (b.y + b.height / 2) / H, w: b.width / W, h: b.height / H };
  } catch {
    return null;
  }
}

function skinDetect(img: HTMLImageElement): FaceBox | null {
  try {
    const w = 120;
    const h = Math.max(1, Math.round((w * (img.naturalHeight || img.height)) / (img.naturalWidth || img.width)));
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d", { willReadFrequently: true })!;
    ctx.drawImage(img, 0, 0, w, h);
    const d = ctx.getImageData(0, 0, w, h).data;

    const skin = new Uint8Array(w * h);
    let n = 0;
    for (let p = 0; p < w * h; p++) {
      const r = d[p * 4]!;
      const g = d[p * 4 + 1]!;
      const b = d[p * 4 + 2]!;
      const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
      const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const ok =
        r > 60 && g > 32 && b > 18 && max - min > 12 && r > g && r > b &&
        cb >= 77 && cb <= 133 && cr >= 133 && cr <= 180;
      if (ok) {
        skin[p] = 1;
        n++;
      }
    }
    if (n < w * h * 0.01) return null;

    // weight towards the upper-middle of the frame: portraits put the head there
    let sx = 0;
    let sy = 0;
    let sw = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (!skin[y * w + x]) continue;
        const nx = x / w;
        const ny = y / h;
        const weight = Math.exp(-(((nx - 0.5) ** 2) / 0.14 + ((ny - 0.34) ** 2) / 0.2));
        sx += nx * weight;
        sy += ny * weight;
        sw += weight;
      }
    }
    if (sw <= 0) return null;
    const cx = sx / sw;
    const cy = sy / sw;

    // spread of skin pixels around that centre gives a rough face size
    let vx = 0;
    let vy = 0;
    let cnt = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (!skin[y * w + x]) continue;
        const dx = x / w - cx;
        const dy = y / h - cy;
        if (Math.abs(dx) > 0.35 || Math.abs(dy) > 0.35) continue;
        vx += dx * dx;
        vy += dy * dy;
        cnt++;
      }
    }
    if (!cnt) return null;
    const fw = Math.min(0.9, Math.max(0.18, Math.sqrt(vx / cnt) * 4.2));
    const fh = Math.min(0.95, Math.max(0.2, Math.sqrt(vy / cnt) * 4.2));
    return { cx, cy, w: fw, h: fh };
  } catch {
    return null;
  }
}

export async function detectFace(img: HTMLImageElement): Promise<FaceBox> {
  return (await nativeDetect(img)) ?? skinDetect(img) ?? DEFAULT_FACE;
}
