import type { CakeDesign, DesignItem } from "./cake-design.types";

function isItem(value: unknown): value is DesignItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<DesignItem>;
  return typeof item.id === "string"
    && (item.type === "asset" || item.type === "text" || item.type === "stroke")
    && !!item.surfacePosition
    && !!item.transform;
}

export function validateCakeDesign(value: unknown): asserts value is CakeDesign {
  if (!value || typeof value !== "object") throw new Error("Thiết kế không hợp lệ.");
  const design = value as Partial<CakeDesign>;
  if (design.version !== 1) throw new Error(`Phiên bản thiết kế ${String(design.version)} chưa được hỗ trợ.`);
  if (!design.cake || !Array.isArray(design.items) || !design.items.every(isItem)) {
    throw new Error("Dữ liệu thiết kế bị thiếu hoặc sai định dạng.");
  }
  if (!Array.isArray(design.symmetryRules)) throw new Error("Dữ liệu đối xứng không hợp lệ.");
}
