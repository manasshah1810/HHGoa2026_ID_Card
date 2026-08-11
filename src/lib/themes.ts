import t1 from "@/assets/Theme 1.png";
import t2 from "@/assets/Theme 2.png";
import t3 from "@/assets/Theme 3.png";
import t4 from "@/assets/Theme 4.png";
import t5 from "@/assets/Theme 5.png";
import t6 from "@/assets/Theme 6.png";
import t7 from "@/assets/Theme 7.png";

/** All geometry is normalized: x/w against artwork width, y/h against artwork height. */
export type Rect = { x: number; y: number; w: number; h: number };

export type PhotoSlot = Rect & { shape: "circle" | "rounded" | "rect"; radius?: number };

export type TextSlot = {
  /** anchor x (center for align=center, left edge for align=left) */
  x: number;
  /** text baseline */
  baseline: number;
  /** font size as fraction of artwork height */
  size: number;
  maxW: number;
  align: "center" | "left";
  color: string;
  font: "display" | "mono";
  upper?: boolean;
  /** area of the artwork to repaint before drawing */
  cover: Rect & { color: string };
};

export type QRSlot = {
  cx: number;
  cy: number;
  /** QR side as fraction of artwork width */
  size: number;
  cover: Rect & { color: string };
};

export type Theme = {
  id: string;
  name: string;
  tagline: string;
  src: string;
  photo: PhotoSlot;
  slots: { name: TextSlot; handle: TextSlot; team: TextSlot; title: TextSlot };
  qr: QRSlot;
  /** accent used for the PFP ring / secondary UI */
  accent: string;
};

const YELLOW = "#F5B71B";
const PINK = "#FF2E88";
const CREAM = "#F7F3E7";

export const THEMES: Theme[] = [
  {
    id: "classic",
    name: "Sunset Shack",
    tagline: "Hacking in Goa.",
    src: t1,
    accent: YELLOW,
    photo: { x: 0.252, y: 0.224, w: 0.495, h: 0.347, shape: "circle" },
    slots: {
      name: {
        x: 0.343, baseline: 0.769, size: 0.062, maxW: 0.55, align: "center",
        color: YELLOW, font: "display", upper: true,
        cover: { x: 0.06, y: 0.698, w: 0.56, h: 0.108, color: "#042c14" },
      },
      handle: {
        x: 0.344, baseline: 0.817, size: 0.026, maxW: 0.42, align: "center",
        color: PINK, font: "mono", upper: true,
        cover: { x: 0.15, y: 0.79, w: 0.4, h: 0.04, color: "#042c14" },
      },
      team: {
        x: 0.337, baseline: 0.888, size: 0.026, maxW: 0.4, align: "center",
        color: CREAM, font: "mono", upper: true,
        cover: { x: 0.12, y: 0.85, w: 0.44, h: 0.052, color: "#042c14" },
      },
      title: {
        x: 0.337, baseline: 0.9477, size: 0.026, maxW: 0.44, align: "center",
        color: CREAM, font: "mono", upper: true,
        cover: { x: 0.1, y: 0.91, w: 0.48, h: 0.054, color: "#042c14" },
      },
    },
    qr: { cx: 0.7985, cy: 0.774, size: 0.265, cover: { x: 0.645, y: 0.685, w: 0.31, h: 0.175, color: "#042c14" } },
  },
  {
    id: "beach-builders",
    name: "Beach Builders",
    tagline: "Build together.",
    src: t2,
    accent: "#FEE101",
    photo: { x: 0.12, y: 0.202, w: 0.358, h: 0.39, shape: "rounded", radius: 0.16 },
    slots: {
      name: {
        x: 0.38, baseline: 0.7675, size: 0.058, maxW: 0.5, align: "center",
        color: CREAM, font: "display", upper: true,
        cover: { x: 0.11, y: 0.698, w: 0.55, h: 0.114, color: "#04341c" },
      },
      handle: {
        x: 0.375, baseline: 0.8245, size: 0.024, maxW: 0.4, align: "center",
        color: "#FEE101", font: "mono", upper: true,
        cover: { x: 0.16, y: 0.804, w: 0.44, h: 0.034, color: "#04341c" },
      },
      team: {
        x: 0.385, baseline: 0.891, size: 0.026, maxW: 0.4, align: "center",
        color: CREAM, font: "mono", upper: true,
        cover: { x: 0.17, y: 0.838, w: 0.44, h: 0.068, color: "#04341c" },
      },
      title: {
        x: 0.385, baseline: 0.935, size: 0.024, maxW: 0.4, align: "center",
        color: "#0B2A1B", font: "mono", upper: true,
        cover: { x: 0.17, y: 0.9, w: 0.44, h: 0.05, color: "#e41c6c" },
      },
    },
    qr: { cx: 0.815, cy: 0.8345, size: 0.275, cover: { x: 0.665, y: 0.712, w: 0.305, h: 0.245, color: "#f4e4cc" } },
  },
  {
    id: "goa-ride",
    name: "On The Road",
    tagline: "Ship & ride.",
    src: t3,
    accent: "#0B3B26",
    photo: { x: 0.4905, y: 0.2151, w: 0.443, h: 0.439, shape: "rounded", radius: 0.06 },
    slots: {
      name: {
        x: 0.147, baseline: 0.773, size: 0.031, maxW: 0.42, align: "left",
        color: "#0B3B26", font: "mono", upper: true,
        cover: { x: 0.145, y: 0.742, w: 0.45, h: 0.04, color: "#f4e4d4" },
      },
      handle: {
        x: 0.147, baseline: 0.8178, size: 0.02, maxW: 0.42, align: "left",
        color: "#0B3B26", font: "mono", upper: true,
        cover: { x: 0.145, y: 0.798, w: 0.45, h: 0.028, color: "#f4e4d4" },
      },
      team: {
        x: 0.147, baseline: 0.86, size: 0.02, maxW: 0.42, align: "left",
        color: "#0B3B26", font: "mono", upper: true,
        cover: { x: 0.145, y: 0.84, w: 0.45, h: 0.028, color: "#f4e4d4" },
      },
      title: {
        x: 0.147, baseline: 0.9015, size: 0.02, maxW: 0.42, align: "left",
        color: "#0B3B26", font: "mono", upper: true,
        cover: { x: 0.145, y: 0.882, w: 0.45, h: 0.03, color: "#f4e4d4" },
      },
    },
    qr: { cx: 0.838, cy: 0.821, size: 0.22, cover: { x: 0.718, y: 0.722, w: 0.242, h: 0.198, color: "#f4e4d4" } },
  },
  {
    id: "hack-eat-repeat",
    name: "Hack. Eat. Repeat.",
    tagline: "3AM commits.",
    src: t4,
    accent: YELLOW,
    photo: { x: 0.268, y: 0.242, w: 0.454, h: 0.317, shape: "circle" },
    slots: {
      name: {
        x: 0.34, baseline: 0.767, size: 0.062, maxW: 0.55, align: "center",
        color: YELLOW, font: "display", upper: true,
        cover: { x: 0.05, y: 0.696, w: 0.58, h: 0.11, color: "#04240c" },
      },
      handle: {
        x: 0.343, baseline: 0.817, size: 0.026, maxW: 0.42, align: "center",
        color: PINK, font: "mono", upper: true,
        cover: { x: 0.15, y: 0.79, w: 0.4, h: 0.04, color: "#04240c" },
      },
      team: {
        x: 0.335, baseline: 0.888, size: 0.026, maxW: 0.4, align: "center",
        color: CREAM, font: "mono", upper: true,
        cover: { x: 0.12, y: 0.85, w: 0.44, h: 0.054, color: "#04240c" },
      },
      title: {
        x: 0.335, baseline: 0.9496, size: 0.026, maxW: 0.44, align: "center",
        color: CREAM, font: "mono", upper: true,
        cover: { x: 0.1, y: 0.912, w: 0.48, h: 0.054, color: "#04240c" },
      },
    },
    qr: { cx: 0.794, cy: 0.775, size: 0.27, cover: { x: 0.635, y: 0.682, w: 0.318, h: 0.186, color: "#04240c" } },
  },
  {
    id: "hangout",
    name: "Hacker House Hangout",
    tagline: "House memories.",
    src: t5,
    accent: YELLOW,
    photo: { x: 0.277, y: 0.238, w: 0.442, h: 0.314, shape: "circle" },
    slots: {
      name: {
        x: 0.333, baseline: 0.761, size: 0.06, maxW: 0.53, align: "center",
        color: YELLOW, font: "display", upper: true,
        cover: { x: 0.05, y: 0.69, w: 0.57, h: 0.117, color: "#042c14" },
      },
      handle: {
        x: 0.332, baseline: 0.818, size: 0.026, maxW: 0.4, align: "center",
        color: PINK, font: "mono", upper: true,
        cover: { x: 0.15, y: 0.792, w: 0.4, h: 0.038, color: "#042c14" },
      },
      team: {
        x: 0.33, baseline: 0.887, size: 0.026, maxW: 0.4, align: "center",
        color: CREAM, font: "mono", upper: true,
        cover: { x: 0.12, y: 0.849, w: 0.44, h: 0.054, color: "#042c14" },
      },
      title: {
        x: 0.33, baseline: 0.948, size: 0.026, maxW: 0.44, align: "center",
        color: CREAM, font: "mono", upper: true,
        cover: { x: 0.1, y: 0.91, w: 0.48, h: 0.054, color: "#042c14" },
      },
    },
    qr: { cx: 0.8065, cy: 0.826, size: 0.248, cover: { x: 0.657, y: 0.748, w: 0.298, h: 0.155, color: "#042c14" } },
  },
  {
    id: "code-chill",
    name: "Code & Chill",
    tagline: "Code, but make it Goa.",
    src: t6,
    accent: YELLOW,
    photo: { x: 0.3137, y: 0.2508, w: 0.3745, h: 0.356, shape: "rounded", radius: 0.03 },
    slots: {
      name: {
        x: 0.34, baseline: 0.784, size: 0.058, maxW: 0.55, align: "center",
        color: YELLOW, font: "display", upper: true,
        cover: { x: 0.05, y: 0.712, w: 0.59, h: 0.108, color: "#042414" },
      },
      handle: {
        x: 0.34, baseline: 0.831, size: 0.026, maxW: 0.42, align: "center",
        color: "#FF6FA8", font: "mono",
        cover: { x: 0.15, y: 0.806, w: 0.4, h: 0.04, color: "#042414" },
      },
      team: {
        x: 0.335, baseline: 0.893, size: 0.026, maxW: 0.4, align: "center",
        color: CREAM, font: "mono", upper: true,
        cover: { x: 0.12, y: 0.855, w: 0.44, h: 0.054, color: "#042414" },
      },
      title: {
        x: 0.335, baseline: 0.949, size: 0.026, maxW: 0.44, align: "center",
        color: CREAM, font: "mono", upper: true,
        cover: { x: 0.1, y: 0.912, w: 0.48, h: 0.054, color: "#042414" },
      },
    },
    qr: { cx: 0.784, cy: 0.803, size: 0.24, cover: { x: 0.638, y: 0.722, w: 0.292, h: 0.162, color: "#042414" } },
  },
  {
    id: "we-shipped",
    name: "We Shipped!",
    tagline: "DEPLOYED ✓",
    src: t7,
    accent: YELLOW,
    photo: { x: 0.306, y: 0.269, w: 0.371, h: 0.283, shape: "rounded", radius: 0.03 },
    slots: {
      name: {
        x: 0.327, baseline: 0.795, size: 0.058, maxW: 0.5, align: "center",
        color: YELLOW, font: "display", upper: true,
        cover: { x: 0.07, y: 0.722, w: 0.54, h: 0.108, color: "#041c0c" },
      },
      handle: {
        x: 0.335, baseline: 0.841, size: 0.024, maxW: 0.36, align: "center",
        color: PINK, font: "mono", upper: true,
        cover: { x: 0.17, y: 0.818, w: 0.36, h: 0.038, color: "#041c0c" },
      },
      team: {
        x: 0.335, baseline: 0.901, size: 0.024, maxW: 0.36, align: "center",
        color: CREAM, font: "mono", upper: true,
        cover: { x: 0.14, y: 0.864, w: 0.4, h: 0.052, color: "#041c0c" },
      },
      title: {
        x: 0.33, baseline: 0.954, size: 0.024, maxW: 0.42, align: "center",
        color: CREAM, font: "mono", upper: true,
        cover: { x: 0.1, y: 0.916, w: 0.48, h: 0.054, color: "#041c0c" },
      },
    },
    qr: { cx: 0.791, cy: 0.8105, size: 0.228, cover: { x: 0.645, y: 0.735, w: 0.292, h: 0.151, color: "#041c0c" } },
  },
];

export const getTheme = (id: string): Theme => THEMES.find((t) => t.id === id) ?? THEMES[0]!;
