import type { SurfaceType } from "../domain/cake-design.types";

export interface CakeAsset {
  id: string;
  name: string;
  category: "Hoa kem" | "Trái cây" | "Trang trí";
  sourceUrl: string;
  fileType: "svg" | "png" | "webp";
  allowedSurfaces: SurfaceType[];
  anchor: { x: number; y: number };
  defaultSizeCm: { width: number; height: number };
  minScale: number;
  maxScale: number;
  mirrorable: boolean;
  recolorableParts: string[];
  previewColors: string[];
}
