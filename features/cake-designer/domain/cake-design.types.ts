export type CakeShape = "round" | "rectangle";
export type CakeView = "front" | "right" | "back" | "left" | "top";
export type SideView = Exclude<CakeView, "top">;
export type SurfaceType = "side" | "top";

export interface CakeDimensions {
  widthCm: number;
  depthCm?: number;
  radiusCm?: number;
  heightCm: number;
}

export interface CakeConfig {
  shape: CakeShape;
  dimensions: CakeDimensions;
  baseColor: string;
}

export interface SurfacePosition {
  surface: SurfaceType;
  u: number;
  v: number;
}

export interface ItemTransform {
  rotation: number;
  scaleX: number;
  scaleY: number;
  flipX: boolean;
  flipY: boolean;
  layer: number;
  normalOffsetMm?: number;
}

export interface AssetColorMap {
  [partName: string]: string;
}

interface BaseDesignItem {
  id: string;
  surfacePosition: SurfacePosition;
  transform: ItemTransform;
  opacity?: number;
  sourceItemId?: string;
  generatedBySymmetry?: boolean;
}

export interface AssetDesignItem extends BaseDesignItem {
  type: "asset";
  assetId: string;
  colors?: AssetColorMap;
  embeddedSource?: string;
  embeddedFileType?: "svg" | "png" | "webp";
  embeddedSizeCm?: { width: number; height: number };
}

export interface TextDesignItem extends BaseDesignItem {
  type: "text";
  text: string;
  color: string;
  fontSizeCm: number;
  fontFamily: "sans" | "serif";
}

export interface StrokeDesignItem extends BaseDesignItem {
  type: "stroke";
  points: Array<{ u: number; v: number; pressure?: number }>;
  color: string;
  widthCm: number;
}

export type DesignItem = AssetDesignItem | TextDesignItem | StrokeDesignItem;

export interface SymmetryRule {
  id: string;
  sourceItemId: string;
  mode:
    | "mirror-horizontal"
    | "mirror-vertical"
    | "repeat-around-side"
    | "radial-top";
  count?: number;
  axisU?: number;
  axisV?: number;
  startAngle?: number;
}

export interface CakeDesign {
  version: number;
  cake: CakeConfig;
  items: DesignItem[];
  symmetryRules: SymmetryRule[];
}

export interface ViewportConfig {
  width: number;
  height: number;
  zoom?: number;
  panX?: number;
  panY?: number;
  sideSpan?: number;
}

export interface ProjectedItem {
  item: DesignItem;
  x: number;
  y: number;
  visible: boolean;
  seamOffset: -1 | 0 | 1;
}

export const DEFAULT_TRANSFORM: ItemTransform = {
  rotation: 0,
  scaleX: 1,
  scaleY: 1,
  flipX: false,
  flipY: false,
  layer: 0,
};

export const createInitialDesign = (): CakeDesign => ({
  version: 1,
  cake: {
    shape: "round",
    dimensions: { widthCm: 20, radiusCm: 10, heightCm: 10 },
    baseColor: "#f4a7b9",
  },
  items: [],
  symmetryRules: [],
});
