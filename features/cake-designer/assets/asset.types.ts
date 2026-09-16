import type { AssetOrientation, RenderMode, SurfaceType } from "../domain/cake-design.types";

export interface CakeAsset {
  id: string;
  name: string;
  category: "Kem" | "Trái cây" | "Lá & hoa" | "Trang trí" | "Bề mặt";
  sourceUrl: string;
  fileType: "svg" | "png" | "webp";
  allowedSurfaces: SurfaceType[];
  anchor: { x: number; y: number };
  defaultSizeCm: { width: number; height: number };
  renderMode: RenderMode;
  heightMm: number;
  shadowStrength: number;
  orientation: AssetOrientation;
  minScale: number;
  maxScale: number;
  mirrorable: boolean;
  recolorableParts: string[];
  previewColors: string[];
  variants?: string[];
}
