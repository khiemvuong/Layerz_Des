import type { CakeDesign } from "../domain/cake-design.types";
import { validateCakeDesign } from "../domain/cake-design.validation";

export interface StoredCakeDesign {
  schemaVersion: number;
  savedAt: string;
  design: CakeDesign;
}

export function serializeDesign(design: CakeDesign): string {
  const payload: StoredCakeDesign = {
    schemaVersion: 1,
    savedAt: new Date().toISOString(),
    design,
  };
  return JSON.stringify(payload, null, 2);
}

export function migrateStoredDesign(payload: StoredCakeDesign): StoredCakeDesign {
  if (payload.schemaVersion !== 1) throw new Error(`Schema ${payload.schemaVersion} chưa được hỗ trợ.`);
  return payload;
}

export function deserializeDesign(json: string): CakeDesign {
  const parsed = JSON.parse(json) as StoredCakeDesign | CakeDesign;
  const payload = "schemaVersion" in parsed
    ? migrateStoredDesign(parsed)
    : { schemaVersion: 1, savedAt: new Date().toISOString(), design: parsed };
  validateCakeDesign(payload.design);
  return structuredClone(payload.design);
}

export const LOCAL_DESIGN_KEY = "layerz:cake-designer:draft:v1";

export function saveDesignLocal(design: CakeDesign): void {
  localStorage.setItem(LOCAL_DESIGN_KEY, serializeDesign(design));
}

export function loadDesignLocal(): CakeDesign {
  const json = localStorage.getItem(LOCAL_DESIGN_KEY);
  if (!json) throw new Error("Chưa có bản nháp nào trên thiết bị này.");
  return deserializeDesign(json);
}
