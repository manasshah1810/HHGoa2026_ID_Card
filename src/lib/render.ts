import type { PhotoSlot, TextSlot, Theme } from "./themes";
import type { FaceBox } from "./face";
import { drawIdentity } from "./card-designs";



export type PhotoTransform = { zoom: number; x: number; y: number };

export type BuilderData = {
  name: string;
  handle: string;
  stack: string;
  title: string;
  team: string;
  profileUrl: string;
};

const DISPLAY = '"Bodoni Moda", "Playfair Display", Georgia, serif';
const MONO = '"JetBrains Mono", "Space Mono", ui-monospace, monospace';
const BODY = '"DM Sans", system-ui, sans-serif';

/** Hacker House Goa identity palette */
export const HH = {
  green: "#0B2A1B",
  greenDeep: "#071c12",
  yellow: "#FEE101",
  pink: "#FF2E88",
  cream: "#F7F3E7",
};

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  t: PhotoTransform = { zoom: 1, x: 0, y: 0 },
  face: FaceBox | null = null,
) {
  const cover = Math.max(w / img.width, h / img.height);
  if (face) {
    // scale so the head reads at a consistent size in every frame shape…
    const target = Math.min(w, h) * 0.52;
    const scale = Math.max(cover, target / Math.max(1, face.h * img.height)) * t.zoom;
    const dw = img.width * scale;
    const dh = img.height * scale;
    // …and park the face on the frame's optical centre (slightly above middle)
    let dx = x + w * 0.5 - face.cx * dw + t.x * w;
    let dy = y + h * 0.42 - face.cy * dh + t.y * h;
    // never expose an empty edge
    dx = Math.min(x, Math.max(x + w - dw, dx));
    dy = Math.min(y, Math.max(y + h - dh, dy));
    ctx.drawImage(img, dx, dy, dw, dh);
    return;
  }
  const scale = cover * t.zoom;
  const dw = img.width * scale;
  const dh = img.height * scale;
  const dx = x + (w - dw) / 2 + t.x * w;
  const dy = y + (h - dh) / 2 + t.y * h;
  ctx.drawImage(img, dx, dy, dw, dh);
}


function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/** shrink font until the text fits, then ellipsize as a last resort */
function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  family: string,
  weight: string,
  size: number,
  maxW: number,
) {
  let s = size;
  ctx.font = `${weight} ${s}px ${family}`;
  // responsive shrink: go down to 42% of the base size before truncating
  while (s > size * 0.42 && ctx.measureText(text).width > maxW) {
    s -= size * 0.02;
    ctx.font = `${weight} ${s}px ${family}`;
  }
  if (ctx.measureText(text).width <= maxW) return text;
  let out = text;
  while (out.length > 1 && ctx.measureText(out + "…").width > maxW) {
    out = out.slice(0, -1);
  }
  return out === text ? text : out.trimEnd() + "…";


}

function clipPhotoPath(ctx: CanvasRenderingContext2D, slot: PhotoSlot, W: number, H: number, ox = 0, oy = 0) {
  const x = slot.x * W + ox;
  const y = slot.y * H + oy;
  const w = slot.w * W;
  const h = slot.h * H;
  if (slot.shape === "circle") {
    const r = Math.min(w, h) / 2;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2, r, 0, Math.PI * 2);
    ctx.closePath();
  } else if (slot.shape === "rounded") {
    roundRect(ctx, x, y, w, h, (slot.radius ?? 0.04) * W);
  } else {
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.closePath();
  }
  return { x, y, w, h };
}

/**
 * Reads the artwork itself and extracts the exact shape of the printed photo
 * placeholder (ellipse / tilted arch / rounded frame …) so the user's photo
 * fills it edge-to-edge instead of a guessed geometric shape.
 * Returns a mask canvas covering the whole artwork.
 */
const maskCache = new Map<string, HTMLCanvasElement | null>();

function placeholderMask(bg: HTMLImageElement, slot: PhotoSlot, key: string): HTMLCanvasElement | null {
  if (maskCache.has(key)) return maskCache.get(key)!;
  let out: HTMLCanvasElement | null = null;
  try {
    const W = bg.naturalWidth;
    const H = bg.naturalHeight;
    const pad = 0.012;
    const bx = Math.max(0, Math.round((slot.x - pad) * W));
    const by = Math.max(0, Math.round((slot.y - pad) * H));
    const bw = Math.min(W - bx, Math.round((slot.w + pad * 2) * W));
    const bh = Math.min(H - by, Math.round((slot.h + pad * 2) * H));

    const src = document.createElement("canvas");
    src.width = bw;
    src.height = bh;
    const sctx = src.getContext("2d", { willReadFrequently: true })!;
    sctx.drawImage(bg, bx, by, bw, bh, 0, 0, bw, bh);
    const d = sctx.getImageData(0, 0, bw, bh).data;

    // seed on the flat placeholder colour at the centre of the declared slot
    const cx0 = Math.round(bw / 2);
    const cy0 = Math.round(bh / 2);
    const si = (cy0 * bw + cx0) * 4;
    const sr = d[si]!, sg = d[si + 1]!, sb = d[si + 2]!;
    if (sr < 150 || sg < 140 || sb < 110) { maskCache.set(key, null); return null; }
    const flood = (TOL: number) => {
      const m = new Uint8Array(bw * bh);
      const same = (p: number) => {
        const i = p * 4;
        return (
          Math.abs(d[i]! - sr) < TOL && Math.abs(d[i + 1]! - sg) < TOL && Math.abs(d[i + 2]! - sb) < TOL
        );
      };
      const stack: number[] = [cy0 * bw + cx0];
      m[cy0 * bw + cx0] = 1;
      let count = 1;
      while (stack.length) {
        const p = stack.pop()!;
        const x = p % bw;
        const y = (p / bw) | 0;
        const push = (nx: number, ny: number) => {
          if (nx < 0 || ny < 0 || nx >= bw || ny >= bh) return;
          const np = ny * bw + nx;
          if (m[np] || !same(np)) return;
          m[np] = 1;
          count++;
          stack.push(np);
        };
        push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
      }
      return { m, count };
    };

    // 1. flood the placeholder area from the centre; widen tolerance if the
    //    print is grainy, and bail out to the geometric shape if it never opens up
    let res = flood(26);
    if (res.count < bw * bh * 0.3) res = flood(48);
    if (res.count < bw * bh * 0.25) { maskCache.set(key, null); return null; }
    const mask = res.m;


    // 2. close enclosed holes (the "YOUR PHOTO HERE" lettering) while keeping
    //    illustrated elements that overlap the frame from the outside intact
    const outside = new Uint8Array(bw * bh);
    const q: number[] = [];
    const seedOut = (x: number, y: number) => {
      const p = y * bw + x;
      if (!mask[p] && !outside[p]) { outside[p] = 1; q.push(p); }
    };
    for (let x = 0; x < bw; x++) { seedOut(x, 0); seedOut(x, bh - 1); }
    for (let y = 0; y < bh; y++) { seedOut(0, y); seedOut(bw - 1, y); }
    while (q.length) {
      const p = q.pop()!;
      const x = p % bw;
      const y = (p / bw) | 0;
      const push = (nx: number, ny: number) => {
        if (nx < 0 || ny < 0 || nx >= bw || ny >= bh) return;
        const np = ny * bw + nx;
        if (mask[np] || outside[np]) return;
        outside[np] = 1;
        q.push(np);
      };
      push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
    }

    const img = sctx.createImageData(bw, bh);
    for (let p = 0; p < bw * bh; p++) {
      if (mask[p] || !outside[p]) {
        img.data[p * 4] = 255;
        img.data[p * 4 + 1] = 255;
        img.data[p * 4 + 2] = 255;
        img.data[p * 4 + 3] = 255;
      }
    }
    const small = document.createElement("canvas");
    small.width = bw;
    small.height = bh;
    small.getContext("2d")!.putImageData(img, 0, 0);

    // 3. dilate a couple of pixels so no printed cream sliver survives
    const grow = Math.max(2, Math.round(W * 0.005));
    const full = document.createElement("canvas");
    full.width = W;
    full.height = H;
    const fctx = full.getContext("2d")!;
    for (let dx = -grow; dx <= grow; dx++) {
      for (let dy = -grow; dy <= grow; dy++) {
        fctx.drawImage(small, bx + dx, by + dy);
      }
    }
    out = full;
  } catch {
    out = null;
  }
  maskCache.set(key, out);
  return out;
}


function drawPhoto(
  ctx: CanvasRenderingContext2D,
  slot: PhotoSlot,
  photo: HTMLImageElement | null,
  transform: PhotoTransform,
  W: number,
  H: number,
  ox = 0,
  oy = 0,
  bg: HTMLImageElement | null = null,
  maskKey = "",
  face: FaceBox | null = null,
) {
  const box = { x: slot.x * W + ox, y: slot.y * H + oy, w: slot.w * W, h: slot.h * H };
  const mask = bg ? placeholderMask(bg, slot, maskKey) : null;

  if (mask) {
    // paint into a scratch layer, cut it with the artwork's own placeholder
    const layer = document.createElement("canvas");
    layer.width = W;
    layer.height = H;
    const lc = layer.getContext("2d")!;
    if (photo) {
      drawCover(lc, photo, box.x - ox, box.y - oy, box.w, box.h, transform, face);
      // sit the photo in the illustration's light: warm lift + soft edge falloff
      lc.globalCompositeOperation = "soft-light";
      lc.fillStyle = "rgba(254,225,150,0.16)";
      lc.fillRect(box.x - ox, box.y - oy, box.w, box.h);
      const vig = lc.createRadialGradient(
        box.x - ox + box.w / 2, box.y - oy + box.h / 2, Math.min(box.w, box.h) * 0.28,
        box.x - ox + box.w / 2, box.y - oy + box.h / 2, Math.max(box.w, box.h) * 0.62,
      );
      vig.addColorStop(0, "rgba(0,0,0,0)");
      vig.addColorStop(1, "rgba(7,28,18,0.32)");
      lc.globalCompositeOperation = "multiply";
      lc.fillStyle = vig;
      lc.fillRect(box.x - ox, box.y - oy, box.w, box.h);
    } else {
      lc.fillStyle = "#0B2A1B";
      lc.fillRect(box.x - ox, box.y - oy, box.w, box.h);
    }
    lc.globalCompositeOperation = "destination-in";
    lc.filter = `blur(${Math.max(1, W * 0.0012)}px)`;
    lc.drawImage(mask, 0, 0);
    lc.filter = "none";
    ctx.save();
    ctx.translate(ox, oy);
    ctx.drawImage(layer, 0, 0);
    ctx.restore();
    return;
  }

  ctx.save();
  clipPhotoPath(ctx, slot, W, H, ox, oy);
  ctx.clip();
  if (photo) {
    drawCover(ctx, photo, box.x, box.y, box.w, box.h, transform, face);
  } else {
    ctx.fillStyle = "#0B2A1B";
    ctx.fillRect(box.x, box.y, box.w, box.h);
    ctx.fillStyle = HH.cream;
    ctx.font = `500 ${Math.round(box.w * 0.08)}px ${BODY}`;
    ctx.textAlign = "center";
    ctx.fillText("your photo", box.x + box.w / 2, box.y + box.h / 2);
  }
  ctx.restore();
}


/**
 * Erases printed placeholder lettering inside a rect. Only ink pixels are
 * rewritten, using the panel colour measured on the *same row* plus matched
 * grain — so gradients, texture and any surrounding frame survive and there is
 * never a visible patch or ghost of the old glyphs.
 */
function inpaintRect(ctx: CanvasRenderingContext2D, rx: number, ry: number, rw: number, rh: number) {
  rx = Math.max(0, Math.round(rx));
  ry = Math.max(0, Math.round(ry));
  rw = Math.round(rw);
  rh = Math.round(rh);
  if (rw < 2 || rh < 2) return;
  const img = ctx.getImageData(rx, ry, rw, rh);
  const d = img.data;

  // dominant (panel) colour of the rect
  const bins = new Map<number, number>();
  for (let p = 0; p < rw * rh; p++) {
    const i = p * 4;
    const k = ((d[i]! >> 4) << 8) | ((d[i + 1]! >> 4) << 4) | (d[i + 2]! >> 4);
    bins.set(k, (bins.get(k) ?? 0) + 1);
  }
  let best = 0, bestK = 0;
  bins.forEach((v, k) => { if (v > best) { best = v; bestK = k; } });
  let br = 0, bg2 = 0, bb = 0, n = 0;
  for (let p = 0; p < rw * rh; p++) {
    const i = p * 4;
    const k = ((d[i]! >> 4) << 8) | ((d[i + 1]! >> 4) << 4) | (d[i + 2]! >> 4);
    if (k === bestK) { br += d[i]!; bg2 += d[i + 1]!; bb += d[i + 2]!; n++; }
  }
  if (!n) return;
  br /= n; bg2 /= n; bb /= n;

  const TOL = 40;
  const ink = new Uint8Array(rw * rh);
  for (let p = 0; p < rw * rh; p++) {
    const i = p * 4;
    const dist = Math.max(Math.abs(d[i]! - br), Math.abs(d[i + 1]! - bg2), Math.abs(d[i + 2]! - bb));
    if (dist > TOL) ink[p] = 1;
  }
  // grow by 2px so antialiased glyph fringes disappear too
  let grown = Uint8Array.from(ink);
  for (let pass = 0; pass < 2; pass++) {
    const next = Uint8Array.from(grown);
    for (let y = 0; y < rh; y++) {
      for (let x = 0; x < rw; x++) {
        if (!grown[y * rw + x]) continue;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && ny >= 0 && nx < rw && ny < rh) next[ny * rw + nx] = 1;
          }
        }
      }
    }
    grown = next;
  }

  // per-row panel colour measured from that row's clean pixels
  const rowR = new Float32Array(rh);
  const rowG = new Float32Array(rh);
  const rowB = new Float32Array(rh);
  const rowOk = new Uint8Array(rh);
  let noise = 0, noiseN = 0;
  for (let y = 0; y < rh; y++) {
    let r = 0, g = 0, b = 0, c = 0;
    for (let x = 0; x < rw; x++) {
      const p = y * rw + x;
      if (grown[p]) continue;
      const i = p * 4;
      r += d[i]!; g += d[i + 1]!; b += d[i + 2]!; c++;
    }
    if (c > rw * 0.12) {
      rowR[y] = r / c; rowG[y] = g / c; rowB[y] = b / c; rowOk[y] = 1;
      for (let x = 0; x < rw; x += 3) {
        const p = y * rw + x;
        if (grown[p]) continue;
        noise += Math.abs(d[p * 4]! - rowR[y]!);
        noiseN++;
      }
    }
  }
  // fill gaps in fully covered rows from the nearest measured row
  for (let y = 0; y < rh; y++) {
    if (rowOk[y]) continue;
    let a = y - 1, b2 = y + 1;
    while (a >= 0 && !rowOk[a]) a--;
    while (b2 < rh && !rowOk[b2]) b2++;
    const src = a >= 0 && (b2 >= rh || y - a <= b2 - y) ? a : b2 < rh ? b2 : -1;
    if (src < 0) { rowR[y] = br; rowG[y] = bg2; rowB[y] = bb; }
    else { rowR[y] = rowR[src]!; rowG[y] = rowG[src]!; rowB[y] = rowB[src]!; }
    rowOk[y] = 1;
  }
  const amp = Math.min(6, noiseN ? noise / noiseN : 0);

  const out = new Uint8ClampedArray(d);
  for (let y = 0; y < rh; y++) {
    for (let x = 0; x < rw; x++) {
      const p = y * rw + x;
      if (!grown[p]) continue;
      // deterministic grain so exports match the preview exactly
      const h = Math.sin((x + 1) * 12.9898 + (y + 1) * 78.233) * 43758.5453;
      const jitter = ((h - Math.floor(h)) - 0.5) * 2 * amp;
      const o = p * 4;
      out[o] = rowR[y]! + jitter;
      out[o + 1] = rowG[y]! + jitter;
      out[o + 2] = rowB[y]! + jitter;
      out[o + 3] = 255;
    }
  }
  ctx.putImageData(new ImageData(out, rw, rh), rx, ry);
}


const cleanCache = new Map<string, HTMLCanvasElement>();

/** Artwork with the QR placeholder erased in place (identity area is rebuilt per theme). */
function cleanArtwork(bg: HTMLImageElement, theme: Theme): HTMLCanvasElement | null {
  const key = theme.id;
  const cached = cleanCache.get(key);
  if (cached) return cached;
  try {
    const W = bg.naturalWidth;
    const H = bg.naturalHeight;
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const cx = c.getContext("2d", { willReadFrequently: true })!;
    cx.drawImage(bg, 0, 0, W, H);
    const r = theme.qr.cover;
    inpaintRect(cx, r.x * W, r.y * H, r.w * W, r.h * H);
    cleanCache.set(key, c);
    return c;
  } catch {
    return null;
  }
}


/** Full personalised ID card at the artwork's native aspect ratio. */
export function renderCard(
  canvas: HTMLCanvasElement,
  theme: Theme,
  bg: HTMLImageElement,
  photo: HTMLImageElement | null,
  transform: PhotoTransform,
  data: BuilderData,
  qr: HTMLImageElement | null,
  _logo: HTMLImageElement | null = null,
  face: FaceBox | null = null,
  scale = 1,
  teamQr: HTMLImageElement | null = null,
) {
  const W = bg.naturalWidth || 1003;
  const H = bg.naturalHeight || 1568;
  canvas.width = Math.round(W * scale);
  canvas.height = Math.round(H * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.imageSmoothingQuality = "high";
  ctx.clearRect(0, 0, W, H);

  // Artwork, photo and the rebuilt identity module are composited at the
  // artwork's native resolution: the identity renderers read and repaint
  // pixels, which ignores canvas transforms.
  const base = document.createElement("canvas");
  base.width = W;
  base.height = H;
  const bctx = base.getContext("2d", { willReadFrequently: true })!;
  bctx.imageSmoothingQuality = "high";
  const clean = cleanArtwork(bg, theme);
  bctx.drawImage(clean ?? bg, 0, 0, W, H);
  drawPhoto(bctx, theme.photo, photo, transform, W, H, 0, 0, bg, theme.id, face);
  drawIdentity(theme.id, bctx, W, H, {
    name: data.name,
    handle: data.handle,
    team: data.team,
    title: data.title,
  });
  ctx.drawImage(base, 0, 0, W, H);


  // QR — personal card, plus an optional team QR that opens the whole crew
  const q = theme.qr;
  ctx.save();

  const full = q.size * W;
  const pair = Boolean(teamQr);
  const size = pair ? full * 0.46 : full;
  const gap = pair ? full * 0.08 : 0;
  const labelH = pair ? size * 0.3 : 0;
  const top = q.cy * H - full / 2 + (full - size - labelH) / 2;
  const startX = q.cx * W - (pair ? size + gap / 2 : size / 2);

  const tile = (img: HTMLImageElement | null, x: number, label: string) => {
    const pad = size * 0.06;
    ctx.fillStyle = HH.cream;
    roundRect(ctx, x - pad, top - pad, size + pad * 2, size + labelH + pad * 2, size * 0.07);
    ctx.fill();
    if (img) {
      ctx.drawImage(img, x, top, size, size);
    } else {
      ctx.fillStyle = "#8a9a8f";
      ctx.font = `600 ${Math.round(size * 0.14)}px ${MONO}`;
      ctx.textAlign = "center";
      ctx.fillText("QR", x + size / 2, top + size / 2);
    }
    if (label) {
      ctx.fillStyle = HH.greenDeep;
      ctx.font = `700 ${Math.round(size * 0.16)}px ${MONO}`;
      ctx.textAlign = "center";
      ctx.fillText(label, x + size / 2, top + size + labelH * 0.78);
    }
  };

  if (pair) {
    tile(qr, startX, "ME");
    tile(teamQr, startX + size + gap, "TEAM");
  } else {
    tile(qr, startX, "");
  }
  ctx.restore();

  return canvas;
}


/** Square profile picture built from the artwork's photo area. */
export function renderPFP(
  canvas: HTMLCanvasElement,
  theme: Theme,
  bg: HTMLImageElement,
  photo: HTMLImageElement | null,
  transform: PhotoTransform,
  data: Pick<BuilderData, "name" | "handle">,
  _logo: HTMLImageElement | null = null,
  face: FaceBox | null = null,
  size = 1080,
) {
  const S = size;
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  const W = bg.naturalWidth || 1003;
  const H = bg.naturalHeight || 1568;

  // square crop of the artwork centred on the photo slot
  const cropW = W;
  const cropH = W;
  const photoCy = (theme.photo.y + theme.photo.h / 2) * H;
  let cropY = photoCy - cropH * 0.42;
  cropY = Math.max(0, Math.min(H - cropH, cropY));

  const scale = S / cropW;
  ctx.clearRect(0, 0, S, S);
  ctx.save();
  ctx.drawImage(bg, 0, cropY, cropW, cropH, 0, 0, S, S);

  // photo, mapped into the cropped space
  ctx.translate(0, -cropY * scale);
  ctx.scale(scale, scale);
  drawPhoto(ctx, theme.photo, photo, transform, W, H, 0, 0, bg, theme.id, face);
  ctx.restore();

  // bottom band with identity
  const k = S / 1080;
  const bandTop = S - 300 * k;
  const grad = ctx.createLinearGradient(0, bandTop, 0, S);
  grad.addColorStop(0, "rgba(7,28,18,0)");
  grad.addColorStop(1, HH.greenDeep);
  ctx.fillStyle = grad;
  ctx.fillRect(0, bandTop, S, 300 * k);

  ctx.textAlign = "center";
  ctx.fillStyle = HH.yellow;
  const name = (data.name || "Builder").toUpperCase();
  const nameFitted = fitText(ctx, name, DISPLAY, "900", 92 * k, S - 140 * k);
  ctx.fillText(nameFitted, S / 2, S - 116 * k);

  const handle = data.handle ? `@${data.handle.replace(/^@/, "")}`.toUpperCase() : "#FRAMEINGOA";
  ctx.fillStyle = HH.pink;
  const hFitted = fitText(ctx, handle, MONO, "700", 38 * k, S - 200 * k);
  ctx.fillText(hFitted, S / 2, S - 62 * k);

  ctx.textAlign = "left";
  ctx.font = `700 ${24 * k}px ${MONO}`;
  ctx.fillStyle = HH.cream;
  ctx.fillText("HH GOA 2026", 44 * k, S - 24 * k);

  return canvas;
}

export function downloadCanvas(canvas: HTMLCanvasElement, filename: string) {
  const url = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
}
