export type CakeShape = "round" | "rectangle";
export type CakeView = "front" | "right" | "back" | "left" | "top";
export type SideView = Exclude<CakeView, "top">;
export type SurfaceType = "side" | "top";
export type RenderMode = "surface-decal" | "raised-sprite" | "side-band" | "side-sprite";
export type AssetOrientation = "flat" | "radial" | "radial-inward" | "tangent" | "billboard";
export type TextTreatment = "piped-cream" | "fondant-plaque" | "standing-topper";

export interface CakeAssetPlacement {
  renderMode: RenderMode;
  heightMm: number;
  shadowStrength: number;
  orientation: AssetOrientation;
  variantId?: string;
}

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

export interface CakeTier extends CakeConfig {
  id: string;
  name: string;
  topColor: string;
}

export interface CakePalette {
  body: string;
  top: string;
  text: string;
  primaryDecoration: string;
  secondaryDecoration: string;
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
  tierId?: string;
  surfacePosition: SurfacePosition;
  transform: ItemTransform;
  opacity?: number;
  sourceItemId?: string;
  generatedBySymmetry?: boolean;
  placement?: CakeAssetPlacement;
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
  fontWeight?: number;
  strokeColor?: string;
  strokeWidth?: number;
  shadowColor?: string;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  shadowBlur?: number;
  treatment?: TextTreatment;
  lineThickness?: "thin" | "medium" | "thick";
  autoFit?: boolean;
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
  tierId?: string;
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
  centerU?: number;
  centerV?: number;
  radius?: number;
  orientation?: "radial" | "radial-inward" | "tangent";
  variantIds?: string[];
  scaleVariation?: number;
  rotationVariation?: number;
  radiusVariation?: number;
  randomSeed?: number;
}

export interface CakeDesign {
  version: number;
  presetId?: string;
  name?: string;
  cake: CakeConfig;
  tiers?: CakeTier[];
  palette?: CakePalette;
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
  depth?: number;
}

export const DEFAULT_TRANSFORM: ItemTransform = {
  rotation: 0,
  scaleX: 1,
  scaleY: 1,
  flipX: false,
  flipY: false,
  layer: 0,
};

export const DEFAULT_PALETTE: CakePalette = {
  body: "#fff8ed",
  top: "#dbe8d2",
  text: "#5f7159",
  primaryDecoration: "#79936f",
  secondaryDecoration: "#fffdf7",
};

export function cakeFromTier(tier: CakeTier): CakeConfig {
  return { shape: tier.shape, dimensions: { ...tier.dimensions }, baseColor: tier.baseColor };
}

export function getDesignTiers(design: CakeDesign): CakeTier[] {
  return design.tiers?.length ? design.tiers : [{
    id: "tier-1",
    name: "Tầng 1",
    ...design.cake,
    topColor: design.palette?.top ?? design.cake.baseColor,
  }];
}

export function isTopPositionOccluded(design: CakeDesign, tierId: string, position: SurfacePosition): boolean {
  if (position.surface !== "top") return false;
  const tiers = getDesignTiers(design);
  const index = tiers.findIndex((tier) => tier.id === tierId);
  const tier = tiers[index];
  const covering = tiers[index + 1];
  if (!tier || !covering) return false;
  const distanceFromCenter = Math.hypot(position.u - .5, position.v - .5) * 2;
  return distanceFromCenter < covering.dimensions.widthCm / tier.dimensions.widthCm;
}

export const createInitialDesign = (): CakeDesign => ({
  version: 2,
  cake: {
    shape: "round",
    dimensions: { widthCm: 20, radiusCm: 10, heightCm: 10 },
    baseColor: "#fff8ed",
  },
  tiers: [{
    id: "tier-1",
    name: "Tầng 1",
    shape: "round",
    dimensions: { widthCm: 20, radiusCm: 10, heightCm: 10 },
    baseColor: "#fff8ed",
    topColor: "#dbe8d2",
  }],
  palette: DEFAULT_PALETTE,
  items: [],
  symmetryRules: [],
});
