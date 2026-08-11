/**
 * Theme-specific identity compositions.
 *
 * Each ID card in the collection has its own renderer: the printed identity
 * block (name / handle / team / role and its decorative frames) is removed
 * from the artwork entirely and rebuilt in the theme's own visual language, so
 * nothing is ever layered on top of an existing box.
 */

export type IdentityData = { name: string; handle: string; team: string; title: string };

type Ctx = CanvasRenderingContext2D;

const DISPLAY = '"Bodoni Moda", "Playfair Display", Georgia, serif';
const MONO = '"JetBrains Mono", "Space Mono", ui-monospace, monospace';

const YELLOW = "#F5B71B";
const PINK = "#E8256F";
const CREAM = "#F2EADB";

/* ------------------------------------------------------------------ utils */

function dominantColor(ctx: Ctx, x: number, y: number, w: number, h: number) {
  const rx = Math.max(0, Math.round(x));
  const ry = Math.max(0, Math.round(y));
  const rw = Math.max(1, Math.round(w));
  const rh = Math.max(1, Math.round(h));
  try {
    const d = ctx.getImageData(rx, ry, rw, rh).data;
    const bins = new Map<number, number>();
    for (let p = 0; p < rw * rh; p++) {
      const i = p * 4;
      const k = ((d[i]! >> 4) << 8) | ((d[i + 1]! >> 4) << 4) | (d[i + 2]! >> 4);
      bins.set(k, (bins.get(k) ?? 0) + 1);
    }
    let best = 0;
    let bestK = 0;
    bins.forEach((v, k) => {
      if (v > best) {
        best = v;
        bestK = k;
      }
    });
    let r = 0;
    let g = 0;
    let b = 0;
    let n = 0;
    for (let p = 0; p < rw * rh; p++) {
      const i = p * 4;
      const k = ((d[i]! >> 4) << 8) | ((d[i + 1]! >> 4) << 4) | (d[i + 2]! >> 4);
      if (k === bestK) {
        r += d[i]!;
        g += d[i + 1]!;
        b += d[i + 2]!;
        n++;
      }
    }
    if (!n) return null;
    return { r: r / n, g: g / n, b: b / n };
  } catch {
    return null;
  }
}

/** Repaints a region with the surrounding panel colour + matching grain. */
function wipe(ctx: Ctx, x: number, y: number, w: number, h: number, sample: { r: number; g: number; b: number }) {
  const rx = Math.max(0, Math.round(x));
  const ry = Math.max(0, Math.round(y));
  const rw = Math.max(1, Math.round(w));
  const rh = Math.max(1, Math.round(h));
  const img = ctx.createImageData(rw, rh);
  const amp = 4;
  for (let yy = 0; yy < rh; yy++) {
    for (let xx = 0; xx < rw; xx++) {
      const p = (yy * rw + xx) * 4;
      const s = Math.sin((xx + 1) * 12.9898 + (yy + 1) * 78.233) * 43758.5453;
      const j = (s - Math.floor(s) - 0.5) * 2 * amp;
      img.data[p] = sample.r + j;
      img.data[p + 1] = sample.g + j;
      img.data[p + 2] = sample.b + j;
      img.data[p + 3] = 255;
    }
  }
  ctx.putImageData(img, rx, ry);
}

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function fitFont(ctx: Ctx, text: string, family: string, weight: string, size: number, maxW: number) {
  let s = size;
  ctx.font = `${weight} ${s}px ${family}`;
  while (s > size * 0.4 && ctx.measureText(text).width > maxW) {
    s -= size * 0.02;
    ctx.font = `${weight} ${s}px ${family}`;
  }
  if (ctx.measureText(text).width <= maxW) return text;
  let out = text;
  while (out.length > 1 && ctx.measureText(out + "…").width > maxW) out = out.slice(0, -1);
  return out.trimEnd() + "…";
}

type TextOpts = {
  text: string;
  cx?: number;
  x?: number;
  baseline: number;
  size: number;
  color: string;
  family?: "display" | "mono";
  weight?: string;
  maxW: number;
  letterSpacing?: number;
};

function text(ctx: Ctx, o: TextOpts) {
  const value = o.text.trim();
  if (!value) return;
  const family = o.family === "mono" ? MONO : DISPLAY;
  const weight = o.weight ?? (o.family === "mono" ? "700" : "900");
  ctx.save();
  if (o.letterSpacing) (ctx as unknown as { letterSpacing: string }).letterSpacing = `${o.letterSpacing}px`;
  const fitted = fitFont(ctx, value, family, weight, o.size, o.maxW);
  ctx.fillStyle = o.color;
  ctx.textBaseline = "alphabetic";
  if (o.cx != null) {
    ctx.textAlign = "center";
    ctx.fillText(fitted, o.cx, o.baseline);
  } else {
    ctx.textAlign = "left";
    ctx.fillText(fitted, o.x!, o.baseline);
  }
  ctx.restore();
}

function dottedRule(ctx: Ctx, x0: number, x1: number, y: number, color: string, r: number, gap: number) {
  ctx.save();
  ctx.fillStyle = color;
  for (let x = x0; x <= x1; x += gap) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function asterisk(ctx: Ctx, cx: number, cy: number, r: number, color: string, lw: number) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.lineCap = "round";
  for (let i = 0; i < 3; i++) {
    const a = (Math.PI / 3) * i;
    ctx.beginPath();
    ctx.moveTo(cx - Math.cos(a) * r, cy - Math.sin(a) * r);
    ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    ctx.stroke();
  }
  ctx.restore();
}

/** Rounded frame with the collection's notched corner treatment. */
function ornateFrame(ctx: Ctx, x: number, y: number, w: number, h: number, color: string, lw: number) {
  const r = Math.min(h * 0.34, w * 0.05);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.lineJoin = "round";
  roundRect(ctx, x, y, w, h, r);
  ctx.stroke();
  // corner ticks — the collection's ornament language, drawn inside the frame
  const t = Math.min(w, h) * 0.06;
  ctx.lineWidth = lw * 0.8;
  const ticks: Array<[number, number, number, number]> = [
    [x + r * 0.6, y + h * 0.5 - t, x + r * 0.6, y + h * 0.5 + t],
    [x + w - r * 0.6, y + h * 0.5 - t, x + w - r * 0.6, y + h * 0.5 + t],
  ];
  for (const [x0, y0, x1, y1] of ticks) {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  }
  ctx.restore();
}

/* --------------------------------------------------------------- geometry */

type Frame = { x: number; y: number; w: number; h: number };
type Line = { baseline: number; size: number };

type PanelSpec = {
  wipe: Frame;
  sample: Frame;
  name: { cx: number; baseline: number; size: number; maxW: number; color: string };
  handle: { cx: number; baseline: number; size: number; maxW: number; color: string };
  rule: { y: number; x0: number; x1: number; color: string };
  team: { frame: Frame; cx: number; label: Line; value: Line; stroke: string };
  title: { frame: Frame; cx: number; label: Line; value: Line; stroke: string };
};

/**
 * Shared drawing routine for the "green panel" family. Each theme below owns
 * its own geometry, colours and proportions — nothing is auto-placed.
 */
function drawPanelIdentity(ctx: Ctx, W: number, H: number, d: IdentityData, s: PanelSpec) {
  const base = dominantColor(ctx, s.sample.x * W, s.sample.y * H, s.sample.w * W, s.sample.h * H) ?? {
    r: 8,
    g: 40,
    b: 24,
  };
  wipe(ctx, s.wipe.x * W, s.wipe.y * H, s.wipe.w * W, s.wipe.h * H, base);

  text(ctx, {
    text: (d.name || "Your Name").toUpperCase(),
    cx: s.name.cx * W,
    baseline: s.name.baseline * H,
    size: s.name.size * H,
    color: s.name.color,
    maxW: s.name.maxW * W,
  });

  const handle = d.handle ? `@${d.handle.replace(/^@/, "")}`.toUpperCase() : "";
  text(ctx, {
    text: handle,
    cx: s.handle.cx * W,
    baseline: s.handle.baseline * H,
    size: s.handle.size * H,
    color: s.handle.color,
    family: "mono",
    maxW: s.handle.maxW * W,
  });

  dottedRule(
    ctx,
    s.rule.x0 * W,
    s.rule.x1 * W,
    s.rule.y * H,
    s.rule.color,
    Math.max(1.4, W * 0.0026),
    Math.max(6, W * 0.0132),
  );

  const block = (
    spec: PanelSpec["team"],
    label: string,
    value: string,
    labelColor: string,
    valueColor: string,
  ) => {
    const f = { x: spec.frame.x * W, y: spec.frame.y * H, w: spec.frame.w * W, h: spec.frame.h * H };
    const lw = Math.max(2, W * 0.0032);
    ornateFrame(ctx, f.x, f.y, f.w, f.h, spec.stroke, lw);
    const orn = Math.min(f.h * 0.22, W * 0.016);
    asterisk(ctx, f.x + f.w * 0.055, f.y + f.h * 0.52, orn, spec.stroke, lw * 0.9);
    asterisk(ctx, f.x + f.w - f.w * 0.055, f.y + f.h * 0.52, orn, spec.stroke, lw * 0.9);
    const inner = f.w - f.w * 0.22;
    text(ctx, {
      text: label,
      cx: spec.cx * W,
      baseline: spec.label.baseline * H,
      size: spec.label.size * H,
      color: labelColor,
      family: "mono",
      maxW: inner,
      letterSpacing: W * 0.0018,
    });
    text(ctx, {
      text: value.toUpperCase(),
      cx: spec.cx * W,
      baseline: spec.value.baseline * H,
      size: spec.value.size * H,
      color: valueColor,
      family: "mono",
      maxW: inner,
    });
  };

  block(s.team, "TEAM NAME", d.team || "SOLO BUILDER", YELLOW, CREAM);
  block(s.title, "BUILDER TITLE:", d.title || "CERTIFIED BUILDER", YELLOW, CREAM);
}

/* -------------------------------------------------------- theme renderers */

/** Theme 1 — Sunset Shack */
function classic(ctx: Ctx, W: number, H: number, d: IdentityData) {
  drawPanelIdentity(ctx, W, H, d, {
    wipe: { x: 0.03, y: 0.6843, w: 0.6042, h: 0.2774 },
    sample: { x: 0.035, y: 0.848, w: 0.035, h: 0.045 },
    name: { cx: 0.344, baseline: 0.757, size: 0.066, maxW: 0.55, color: YELLOW },
    handle: { cx: 0.344, baseline: 0.8112, size: 0.0242, maxW: 0.5, color: PINK },
    rule: { y: 0.8304, x0: 0.0778, x1: 0.6102, color: YELLOW },
    team: {
      frame: { x: 0.0778, y: 0.8444, w: 0.5324, h: 0.0548 },
      cx: 0.344,
      label: { baseline: 0.8635, size: 0.0158 },
      value: { baseline: 0.8865, size: 0.0248 },
      stroke: PINK,
    },
    title: {
      frame: { x: 0.0678, y: 0.9082, w: 0.5504, h: 0.0516 },
      cx: 0.343,
      label: { baseline: 0.9266, size: 0.0158 },
      value: { baseline: 0.9496, size: 0.0248 },
      stroke: YELLOW,
    },
  });
}

/** Theme 4 — Hack. Eat. Repeat. */
function hackEatRepeat(ctx: Ctx, W: number, H: number, d: IdentityData) {
  drawPanelIdentity(ctx, W, H, d, {
    wipe: { x: 0.03, y: 0.6862, w: 0.6042, h: 0.2762 },
    sample: { x: 0.035, y: 0.848, w: 0.035, h: 0.045 },
    name: { cx: 0.342, baseline: 0.7576, size: 0.066, maxW: 0.55, color: YELLOW },
    handle: { cx: 0.342, baseline: 0.8118, size: 0.0242, maxW: 0.5, color: PINK },
    rule: { y: 0.831, x0: 0.0778, x1: 0.6102, color: YELLOW },
    team: {
      frame: { x: 0.0778, y: 0.845, w: 0.5324, h: 0.0548 },
      cx: 0.342,
      label: { baseline: 0.8641, size: 0.0158 },
      value: { baseline: 0.8871, size: 0.0248 },
      stroke: PINK,
    },
    title: {
      frame: { x: 0.0678, y: 0.9088, w: 0.5504, h: 0.0516 },
      cx: 0.341,
      label: { baseline: 0.9272, size: 0.0158 },
      value: { baseline: 0.9502, size: 0.0248 },
      stroke: YELLOW,
    },
  });
}

/** Theme 5 — Hacker House Hangout */
function hangout(ctx: Ctx, W: number, H: number, d: IdentityData) {
  drawPanelIdentity(ctx, W, H, d, {
    wipe: { x: 0.03, y: 0.7071, w: 0.6076, h: 0.2545 },
    sample: { x: 0.035, y: 0.85, w: 0.033, h: 0.04 },
    name: { cx: 0.3357, baseline: 0.76, size: 0.065, maxW: 0.52, color: YELLOW },
    handle: { cx: 0.3357, baseline: 0.8114, size: 0.0242, maxW: 0.48, color: PINK },
    rule: { y: 0.8305, x0: 0.0747, x1: 0.5976, color: YELLOW },
    team: {
      frame: { x: 0.0747, y: 0.8468, w: 0.508, h: 0.0542 },
      cx: 0.3287,
      label: { baseline: 0.8637, size: 0.0155 },
      value: { baseline: 0.8867, size: 0.0245 },
      stroke: PINK,
    },
    title: {
      frame: { x: 0.0677, y: 0.9087, w: 0.5299, h: 0.0517 },
      cx: 0.3327,
      label: { baseline: 0.9271, size: 0.0155 },
      value: { baseline: 0.95, size: 0.0245 },
      stroke: YELLOW,
    },
  });
}

/** Theme 6 — Code & Chill */
function codeChill(ctx: Ctx, W: number, H: number, d: IdentityData) {
  drawPanelIdentity(ctx, W, H, d, {
    wipe: { x: 0.03, y: 0.7275, w: 0.6076, h: 0.2336 },
    sample: { x: 0.035, y: 0.86, w: 0.033, h: 0.035 },
    name: { cx: 0.3386, baseline: 0.7795, size: 0.062, maxW: 0.55, color: YELLOW },
    handle: { cx: 0.3386, baseline: 0.8305, size: 0.0235, maxW: 0.5, color: "#FF6FA8" },
    rule: { y: 0.8446, x0: 0.0717, x1: 0.5926, color: YELLOW },
    team: {
      frame: { x: 0.0876, y: 0.8574, w: 0.5, h: 0.0453 },
      cx: 0.3376,
      label: { baseline: 0.8763, size: 0.0142 },
      value: { baseline: 0.8926, size: 0.0232 },
      stroke: PINK,
    },
    title: {
      frame: { x: 0.0677, y: 0.9123, w: 0.5398, h: 0.0479 },
      cx: 0.3376,
      label: { baseline: 0.9314, size: 0.0142 },
      value: { baseline: 0.9482, size: 0.0232 },
      stroke: YELLOW,
    },
  });
}

/** Theme 7 — We Shipped! */
function weShipped(ctx: Ctx, W: number, H: number, d: IdentityData) {
  drawPanelIdentity(ctx, W, H, d, {
    wipe: { x: 0.03, y: 0.738, w: 0.6042, h: 0.2301 },
    sample: { x: 0.035, y: 0.87, w: 0.032, h: 0.035 },
    name: { cx: 0.329, baseline: 0.7952, size: 0.062, maxW: 0.51, color: YELLOW },
    handle: { cx: 0.329, baseline: 0.8367, size: 0.0228, maxW: 0.47, color: PINK },
    rule: { y: 0.8546, x0: 0.0718, x1: 0.5833, color: YELLOW },
    team: {
      frame: { x: 0.0847, y: 0.8654, w: 0.4915, h: 0.0491 },
      cx: 0.3305,
      label: { baseline: 0.8836, size: 0.0142 },
      value: { baseline: 0.9014, size: 0.0232 },
      stroke: PINK,
    },
    title: {
      frame: { x: 0.0678, y: 0.9196, w: 0.5304, h: 0.0465 },
      cx: 0.333,
      label: { baseline: 0.9372, size: 0.0142 },
      value: { baseline: 0.9538, size: 0.0232 },
      stroke: YELLOW,
    },
  });
}

/** Theme 2 — Beach Builders: framed name plate, pill handle, dotted team frame, solid role bar. */
function beachBuilders(ctx: Ctx, W: number, H: number, d: IdentityData) {
  const base = dominantColor(ctx, 0.075 * W, 0.775 * H, 0.03 * W, 0.02 * H) ?? { r: 6, g: 48, b: 26 };
  wipe(ctx, 0.055 * W, 0.689 * H, 0.6167 * W, 0.1032 * H, base);
  wipe(ctx, 0.1347 * W, 0.7975 * H, 0.5028 * W, 0.1501 * H, base);

  const lw = Math.max(2, W * 0.003);

  // name plate
  const nf = { x: 0.0588 * W, y: 0.6924 * H, w: 0.6053 * W, h: 0.0952 * H };
  ctx.save();
  ctx.strokeStyle = "#F0C020";
  ctx.lineWidth = lw;
  roundRect(ctx, nf.x, nf.y, nf.w, nf.h, nf.h * 0.32);
  ctx.stroke();
  ctx.restore();
  text(ctx, {
    text: (d.name || "Your Name").toUpperCase(),
    cx: 0.3615 * W,
    baseline: 0.7574 * H,
    size: 0.0605 * H,
    color: CREAM,
    maxW: nf.w * 0.86,
  });

  // handle pill
  const hf = { x: 0.1404 * W, y: 0.8043 * H, w: 0.4858 * W, h: 0.0248 * H };
  ctx.save();
  ctx.strokeStyle = "#F0C020";
  ctx.lineWidth = lw * 0.8;
  roundRect(ctx, hf.x, hf.y, hf.w, hf.h, hf.h / 2);
  ctx.stroke();
  ctx.restore();
  const handle = d.handle ? `@${d.handle.replace(/^@/, "")}`.toUpperCase() : "";
  text(ctx, {
    text: handle,
    cx: 0.3833 * W,
    baseline: 0.8244 * H,
    size: 0.0218 * H,
    color: "#FEE101",
    family: "mono",
    maxW: hf.w * 0.86,
  });

  // team frame (dotted) with a label breaking the top rule
  const tf = { x: 0.1518 * W, y: 0.8425 * H, w: 0.4744 * W, h: 0.0536 * H };
  ctx.save();
  ctx.strokeStyle = "#F0C020";
  ctx.lineWidth = lw * 0.8;
  ctx.setLineDash([W * 0.007, W * 0.006]);
  roundRect(ctx, tf.x, tf.y, tf.w, tf.h, tf.h * 0.22);
  ctx.stroke();
  ctx.restore();
  ctx.save();
  const labelSize = 0.0158 * H;
  ctx.font = `700 ${labelSize}px ${MONO}`;
  const label = "TEAM NAME";
  const lwid = ctx.measureText(label).width;
  const lx = tf.x + tf.w * 0.11;
  wipe(ctx, lx - W * 0.01, tf.y - labelSize * 0.55, lwid + W * 0.02, labelSize * 1.1, base);
  ctx.fillStyle = PINK;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.fillText(label, lx, tf.y + labelSize * 0.35);
  ctx.restore();
  text(ctx, {
    text: (d.team || "Solo Builder").toUpperCase(),
    cx: 0.389 * W,
    baseline: 0.8881 * H,
    size: 0.0248 * H,
    color: CREAM,
    family: "mono",
    maxW: tf.w * 0.84,
  });

  // role bar
  const rf = { x: 0.1537 * W, y: 0.9115 * H, w: 0.4677 * W, h: 0.0315 * H };
  ctx.save();
  ctx.fillStyle = "#E8256F";
  roundRect(ctx, rf.x, rf.y, rf.w, rf.h, rf.h * 0.18);
  ctx.fill();
  ctx.restore();
  text(ctx, {
    text: (d.title || "Certified Builder").toUpperCase(),
    cx: 0.3871 * W,
    baseline: 0.935 * H,
    size: 0.0238 * H,
    color: "#0B2A1B",
    family: "mono",
    maxW: rf.w * 0.88,
  });
}

/** Theme 3 — On The Road: cream data sheet with icon column and hairline rules. */
function goaRide(ctx: Ctx, W: number, H: number, d: IdentityData) {
  const base = dominantColor(ctx, 0.15 * W, 0.9 * H, 0.24 * W, 0.012 * H) ?? { r: 240, g: 233, b: 217 };
  wipe(ctx, 0.1328 * W, 0.7473 * H, 0.5028 * W, 0.168 * H, base);

  const x = 0.1423 * W;
  const green = "#0B3B26";
  const rule = (y: number) =>
    dottedRule(ctx, 0.1044 * W, 0.6262 * W, y * H, "#CFC4AE", Math.max(1, W * 0.0016), Math.max(5, W * 0.0075));

  text(ctx, {
    text: (d.name || "Your Name").toUpperCase(),
    x,
    baseline: 0.7728 * H,
    size: 0.0308 * H,
    color: green,
    family: "mono",
    maxW: 0.44 * W,
  });
  rule(0.7842);
  const handle = d.handle ? `@${d.handle.replace(/^@/, "")}`.toUpperCase() : "";
  text(ctx, {
    text: handle,
    x,
    baseline: 0.8164 * H,
    size: 0.0208 * H,
    color: green,
    family: "mono",
    maxW: 0.44 * W,
  });
  rule(0.8277);
  text(ctx, {
    text: (d.team || "Solo Builder").toUpperCase(),
    x,
    baseline: 0.8579 * H,
    size: 0.0208 * H,
    color: green,
    family: "mono",
    maxW: 0.44 * W,
  });
  rule(0.8693);
  text(ctx, {
    text: (d.title || "Certified Builder").toUpperCase(),
    x,
    baseline: 0.8995 * H,
    size: 0.0208 * H,
    color: green,
    family: "mono",
    maxW: 0.44 * W,
  });
}

export const IDENTITY_RENDERERS: Record<string, (ctx: Ctx, W: number, H: number, d: IdentityData) => void> = {
  classic,
  "beach-builders": beachBuilders,
  "goa-ride": goaRide,
  "hack-eat-repeat": hackEatRepeat,
  hangout,
  "code-chill": codeChill,
  "we-shipped": weShipped,
};

export function drawIdentity(id: string, ctx: Ctx, W: number, H: number, d: IdentityData) {
  (IDENTITY_RENDERERS[id] ?? classic)(ctx, W, H, d);
}
