import { getAsset } from "../assets/asset-library";
import {
  DEFAULT_TRANSFORM,
  type AssetDesignItem,
  type CakeAssetPlacement,
  type CakeDesign,
  type CakePalette,
  type DesignItem,
  type TextDesignItem,
} from "../domain/cake-design.types";

export type BentoPresetId = "bento-green-heart" | "bento-green-bow" | "bento-pink-botanical" | "bento-colorful-flowers" | "bento-red-cherry" | "bento-pink-bear";

export interface BentoPresetMeta {
  id: BentoPresetId;
  name: string;
  caption: string;
  palette: CakePalette;
  motif: "heart" | "bow" | "flower" | "cherry" | "bear";
}

export const BENTO_PRESETS: BentoPresetMeta[] = [
  { id: "bento-green-heart", name: "Bento xanh trái tim", caption: "Kem xanh dịu, tim nổi và chấm kem", motif: "heart", palette: { body: "#fff9ef", top: "#dce8d2", text: "#5f7358", primaryDecoration: "#78926f", secondaryDecoration: "#fffdf7" } },
  { id: "bento-green-bow", name: "Bento xanh nơ", caption: "Olive nhạt, nơ kem và hoa nhỏ", motif: "bow", palette: { body: "#f7f1e5", top: "#aeb89a", text: "#fffaf0", primaryDecoration: "#fff7e8", secondaryDecoration: "#e8c98a" } },
  { id: "bento-pink-botanical", name: "Bento hồng hoa lá", caption: "Hồng phấn với cành lá cong", motif: "flower", palette: { body: "#fff4ed", top: "#efc7cf", text: "#934f5d", primaryDecoration: "#6f8b66", secondaryDecoration: "#fff6ea" } },
  { id: "bento-colorful-flowers", name: "Bento hoa nhiều màu", caption: "Hoa kem thủ công, bố cục tự nhiên", motif: "flower", palette: { body: "#fff8eb", top: "#f3e4c9", text: "#765b50", primaryDecoration: "#d37a83", secondaryDecoration: "#6f9473" } },
  { id: "bento-red-cherry", name: "Bento cherry đỏ", caption: "Cherry đôi, tim đỏ và chữ trắng", motif: "cherry", palette: { body: "#fff1e8", top: "#e4a5ad", text: "#fffaf2", primaryDecoration: "#b93a49", secondaryDecoration: "#496e4c" } },
  { id: "bento-pink-bear", name: "Bento gấu hồng", caption: "Gấu kem nổi, tim và chấm nhỏ", motif: "bear", palette: { body: "#fff5ed", top: "#f1cbd1", text: "#9b5361", primaryDecoration: "#dfa0a9", secondaryDecoration: "#fff7ec" } },
];

function placement(assetId: string): CakeAssetPlacement {
  const asset = getAsset(assetId);
  if (!asset) throw new Error(`Không tìm thấy asset ${assetId}.`);
  return { renderMode: asset.renderMode, heightMm: asset.heightMm, shadowStrength: asset.shadowStrength, orientation: asset.orientation };
}

function asset(id: string, assetId: string, u: number, v: number, layer: number, color: string, scale = 1, rotation = 0): AssetDesignItem {
  const part = getAsset(assetId)?.recolorableParts[0];
  return {
    id,
    tierId: "tier-1",
    type: "asset",
    assetId,
    surfacePosition: { surface: "top", u, v },
    transform: { ...DEFAULT_TRANSFORM, layer, scaleX: scale, scaleY: scale, rotation },
    placement: placement(assetId),
    colors: part ? { [part]: color } : {},
    opacity: 1,
  };
}

function greeting(text: string, palette: CakePalette): TextDesignItem {
  return {
    id: "bento-greeting",
    tierId: "tier-1",
    type: "text",
    text,
    color: palette.text,
    fontSizeCm: 1.35,
    fontFamily: "sans",
    fontWeight: 700,
    treatment: "piped-cream",
    lineThickness: "medium",
    autoFit: true,
    strokeWidth: 0,
    shadowColor: "rgba(82,60,48,.16)",
    shadowOffsetX: 1,
    shadowOffsetY: 2,
    shadowBlur: 2,
    surfacePosition: { surface: "top", u: .5, v: .51 },
    transform: { ...DEFAULT_TRANSFORM, layer: 50 },
    placement: { renderMode: "raised-sprite", heightMm: 2.5, shadowStrength: .08, orientation: "flat" },
    opacity: 1,
  };
}

function ring(assetId: string, count: number, color: string, prefix: string, radius = .76, scale = 1): AssetDesignItem[] {
  return Array.from({ length: count }, (_, index) => {
    const angle = -Math.PI / 2 + index * Math.PI * 2 / count;
    return asset(`${prefix}-${index + 1}`, assetId, .5 + Math.cos(angle) * radius / 2, .5 + Math.sin(angle) * radius / 2, 20 + index, color, scale * (.94 + (index % 3) * .04), angle * 180 / Math.PI + 90);
  });
}

function decorations(meta: BentoPresetMeta): DesignItem[] {
  const { palette, motif } = meta;
  if (motif === "heart") return [
    ...ring("piped-heart", 10, palette.primaryDecoration, "heart", .79, .88),
    ...ring("cream-dot", 16, palette.secondaryDecoration, "dot", .91, .7),
  ];
  if (motif === "bow") return [
    ...ring("piped-bow", 8, palette.primaryDecoration, "bow", .82, .82),
    ...ring("bento-daisy", 8, palette.secondaryDecoration, "flower", .62, .62),
  ];
  if (meta.id === "bento-pink-botanical") return [
    ...ring("leaf-sprig-01", 7, palette.primaryDecoration, "leaf", .78, .62),
    ...ring("bento-daisy", 9, palette.secondaryDecoration, "flower", .88, .62),
  ];
  if (meta.id === "bento-colorful-flowers") return [
    asset("flower-a", "bento-daisy", .23, .28, 20, "#f8f1df", 1.25, -18),
    asset("flower-b", "bento-daisy", .76, .25, 21, "#d98691", 1.05, 24),
    asset("flower-c", "bento-daisy", .78, .72, 22, "#e7b663", 1.18, -8),
    asset("flower-d", "bento-daisy", .25, .76, 23, "#9eb38c", .9, 18),
    ...ring("piped-heart", 6, palette.primaryDecoration, "heart", .67, .58),
  ];
  if (motif === "cherry") return [
    asset("cherry-a", "cherry-pair", .28, .27, 22, palette.primaryDecoration, 1.05, -18),
    asset("cherry-b", "cherry-pair", .74, .7, 23, palette.primaryDecoration, .95, 20),
    ...ring("piped-heart", 9, palette.primaryDecoration, "heart", .82, .68),
  ];
  return [
    asset("bear-a", "piped-bear", .25, .3, 24, palette.primaryDecoration, 1.05, -12),
    asset("bear-b", "piped-bear", .76, .7, 25, palette.primaryDecoration, 1, 12),
    ...ring("piped-heart", 7, palette.text, "heart", .73, .62),
    ...ring("cream-dot", 12, palette.secondaryDecoration, "dot", .9, .55),
  ];
}

export function createBentoPreset(id: BentoPresetId = "bento-green-heart"): CakeDesign {
  const meta = BENTO_PRESETS.find((preset) => preset.id === id) ?? BENTO_PRESETS[0];
  const cake = { shape: "round" as const, dimensions: { widthCm: 12, radiusCm: 6, heightCm: 5.5 }, baseColor: meta.palette.body };
  return {
    version: 2,
    presetId: meta.id,
    name: meta.name,
    cake,
    tiers: [{ id: "tier-1", name: "Tầng 1", ...cake, topColor: meta.palette.top }],
    palette: { ...meta.palette },
    items: [...decorations(meta), greeting(meta.id === "bento-green-heart" ? "Thương bạn\nnhiều lắm" : meta.id === "bento-red-cherry" ? "Happy\nbirthday" : "Một ngày\nthật vui", meta.palette)],
    symmetryRules: [],
  };
}
