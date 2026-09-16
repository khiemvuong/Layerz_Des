import { DEFAULT_PALETTE, type CakeDesign } from "../domain/cake-design.types";
import { validateCakeDesign } from "../domain/cake-design.validation";

export interface StoredCakeDesign {
  schemaVersion: number;
  savedAt: string;
  design: CakeDesign;
}

export function serializeDesign(design: CakeDesign): string {
  const payload: StoredCakeDesign = {
    schemaVersion: 2,
    savedAt: new Date().toISOString(),
    design,
  };
  return JSON.stringify(payload, null, 2);
}

export function migrateStoredDesign(payload: StoredCakeDesign): StoredCakeDesign {
  if (payload.schemaVersion === 2) return payload;
  if (payload.schemaVersion !== 1) throw new Error(`Schema ${payload.schemaVersion} chưa được hỗ trợ.`);
  const tierId = "tier-1";
  const design: CakeDesign = {
    ...payload.design,
    version: 2,
    tiers: [{ id: tierId, name: "Tầng 1", ...payload.design.cake, topColor: payload.design.cake.baseColor }],
    palette: { ...DEFAULT_PALETTE, body: payload.design.cake.baseColor, top: payload.design.cake.baseColor },
    items: payload.design.items.map((item) => ({
      ...item,
      tierId,
      ...(item.type === "text" ? {
        treatment: "piped-cream" as const,
        lineThickness: "medium" as const,
        strokeColor: undefined,
        strokeWidth: 0,
      } : {}),
    })),
    symmetryRules: payload.design.symmetryRules.map((rule) => ({ ...rule, tierId })),
  };
  return { ...payload, schemaVersion: 2, design };
}

export function deserializeDesign(json: string): CakeDesign {
  const parsed = JSON.parse(json) as StoredCakeDesign | CakeDesign;
  const payload = "schemaVersion" in parsed
    ? migrateStoredDesign(parsed)
    : migrateStoredDesign({ schemaVersion: parsed.version === 2 ? 2 : 1, savedAt: new Date().toISOString(), design: parsed });
  validateCakeDesign(payload.design);
  return structuredClone(payload.design);
}

export const LOCAL_DESIGN_KEY = "layerz:cake-designer:draft:v2";

export function saveDesignLocal(design: CakeDesign): void {
  localStorage.setItem(LOCAL_DESIGN_KEY, serializeDesign(design));
}

export function loadDesignLocal(): CakeDesign {
  const json = localStorage.getItem(LOCAL_DESIGN_KEY) ?? localStorage.getItem("layerz:cake-designer:draft:v1");
  if (!json) throw new Error("Chưa có bản nháp nào trên thiết bị này.");
  return deserializeDesign(json);
}
