import { getAsset } from "../assets/asset-library";
import {
  DEFAULT_TRANSFORM,
  type AssetDesignItem,
  type CakeAssetPlacement,
  type CakeDesign,
  type DesignItem,
  type TextDesignItem,
} from "../domain/cake-design.types";

export const STRAWBERRY_COCOA_PRESET_ID = "strawberry-cocoa-birthday";

function placement(assetId: string): CakeAssetPlacement {
  const asset = getAsset(assetId);
  if (!asset) throw new Error(`Không tìm thấy asset ${assetId}.`);
  return {
    renderMode: asset.renderMode,
    heightMm: asset.heightMm,
    shadowStrength: asset.shadowStrength,
    orientation: asset.orientation,
  };
}

function assetItem(
  id: string,
  assetId: string,
  surface: "top" | "side",
  u: number,
  v: number,
  layer: number,
  rotation = 0,
  scale = 1,
): AssetDesignItem {
  return {
    id,
    tierId: "tier-1",
    type: "asset",
    assetId,
    surfacePosition: { surface, u, v },
    transform: { ...DEFAULT_TRANSFORM, layer, rotation, scaleX: scale, scaleY: scale },
    placement: placement(assetId),
    opacity: 1,
    colors: {},
  };
}

function radialPosition(angle: number, radius: number) {
  return {
    u: .5 + Math.cos(angle) * radius / 2,
    v: .5 + Math.sin(angle) * radius / 2,
  };
}

function leaves(): AssetDesignItem[] {
  const variants = ["leaf-sprig-01", "leaf-sprig-02", "leaf-sprig-03"];
  return [8, 51, 96, 143, 189, 232, 278, 326].map((degrees, index) => {
    const angle = degrees * Math.PI / 180;
    const point = radialPosition(angle, .84 + (index % 2 ? .015 : -.01));
    return assetItem(`leaf-${index + 1}`, variants[index % variants.length], "top", point.u, point.v, 40, degrees + 90, .8 + (index % 3) * .06);
  });
}

function petals(): AssetDesignItem[] {
  const angles = [18, 43, 72, 112, 137, 166, 204, 225, 257, 291, 318, 344];
  return angles.map((degrees, index) => {
    const angle = degrees * Math.PI / 180;
    const point = radialPosition(angle, index % 3 === 0 ? .9 : .82);
    return assetItem(`petal-${index + 1}`, index % 2 ? "flower-petal-02" : "flower-petal-01", "top", point.u, point.v, 50, degrees - 20, .66 + (index % 4) * .05);
  });
}

export function createStrawberryCocoaPreset(): CakeDesign {
  const creamSource = assetItem("cream-ring-source", "cream-swirl-top-01", "top", .935, .5, 20, 90, 1);
  const strawberrySource = assetItem("strawberry-ring-source", "strawberry-half-01", "top", .83, .5, 30, 90, 1);
  const greeting: TextDesignItem = {
    id: "birthday-greeting",
    tierId: "tier-1",
    type: "text",
    text: "HAPPY\nBIRTHDAY",
    color: "#fff4ee",
    fontSizeCm: 1.75,
    fontFamily: "sans",
    fontWeight: 800,
    treatment: "piped-cream",
    lineThickness: "medium",
    autoFit: true,
    strokeWidth: 0,
    shadowColor: "rgba(70, 25, 15, 0.18)",
    shadowOffsetX: 1,
    shadowOffsetY: 2,
    shadowBlur: 2,
    surfacePosition: { surface: "top", u: .5, v: .52 },
    transform: { ...DEFAULT_TRANSFORM, layer: 60, scaleX: .8, scaleY: .8 },
    placement: { renderMode: "surface-decal", heightMm: 1, shadowStrength: .16, orientation: "flat" },
    opacity: 1,
  };

  const items: DesignItem[] = [
    assetItem("cream-body", "cream-body-texture", "side", 0, .5, 0),
    assetItem("cocoa-center", "cocoa-texture", "top", .5, .5, 10),
    creamSource,
    strawberrySource,
    ...leaves(),
    ...petals(),
    greeting,
    assetItem("red-ribbon-band", "red-ribbon", "side", 0, .23, 70),
    assetItem("red-bow", "red-bow-front", "side", 0, .24, 80, 0, 1.05),
  ];

  return {
    version: 2,
    presetId: STRAWBERRY_COCOA_PRESET_ID,
    name: "Strawberry Cocoa Birthday Cake",
    cake: {
      shape: "round",
      dimensions: { widthCm: 20, radiusCm: 10, heightCm: 7.5 },
      baseColor: "#f7efe2",
    },
    tiers: [{
      id: "tier-1",
      name: "Tầng 1",
      shape: "round",
      dimensions: { widthCm: 20, radiusCm: 10, heightCm: 7.5 },
      baseColor: "#f7efe2",
      topColor: "#f7efe2",
    }],
    palette: {
      body: "#f7efe2",
      top: "#f7efe2",
      text: "#fff4ee",
      primaryDecoration: "#d82934",
      secondaryDecoration: "#23843b",
    },
    items,
    symmetryRules: [
      {
        id: "cream-ring",
        tierId: "tier-1",
        sourceItemId: creamSource.id,
        mode: "radial-top",
        count: 24,
        centerU: .5,
        centerV: .5,
        radius: .87,
        startAngle: 0,
        orientation: "tangent",
        variantIds: ["cream-swirl-top-01", "cream-swirl-top-02", "cream-swirl-top-01"],
        scaleVariation: .05,
        rotationVariation: 4,
        radiusVariation: .01,
        randomSeed: 2401,
      },
      {
        id: "strawberry-ring",
        tierId: "tier-1",
        sourceItemId: strawberrySource.id,
        mode: "radial-top",
        count: 15,
        centerU: .5,
        centerV: .5,
        radius: .66,
        startAngle: 0,
        orientation: "radial-inward",
        variantIds: ["strawberry-half-01", "strawberry-whole-01", "strawberry-half-02", "strawberry-whole-02", "strawberry-half-03"],
        scaleVariation: .1,
        rotationVariation: 12,
        radiusVariation: .025,
        randomSeed: 1507,
      },
    ],
  };
}
