"use client";

import { create } from "zustand";
import { getAsset } from "../assets/asset-library";
import { applyCakeDesignCommand, type CakeDesignCommand } from "../domain/cake-design.commands";
import {
  DEFAULT_TRANSFORM,
  type AssetColorMap,
  type CakeDesign,
  type CakePalette,
  type CakeTier,
  type CakeView,
  type DesignItem,
  type SurfacePosition,
  type SymmetryRule,
} from "../domain/cake-design.types";
import { clamp01, wrap01 } from "../geometry/projection-engine";
import { createBentoPreset, type BentoPresetId } from "../presets/bento-presets";
import { createStrawberryCocoaPreset } from "../presets/strawberry-cocoa";
import { randomId } from "../utils/id";
import { commitHistory, createHistory, redoHistory, undoHistory, type DesignHistory } from "./history";

interface DesignerState {
  history: DesignHistory;
  view: CakeView;
  activeTierId: string;
  selectedItemId: string | null;
  clipboard: DesignItem | null;
  zoom: number;
  panX: number;
  panY: number;
  propertiesOpen: boolean;
  previewOpen: boolean;
  statusMessage: string | null;
  dispatch: (command: CakeDesignCommand, selectedItemId?: string | null) => void;
  setView: (view: CakeView) => void;
  setActiveTier: (tierId: string) => void;
  setTierCount: (count: 1 | 2 | 3) => void;
  updateActiveTier: (patch: Partial<CakeTier>) => void;
  applyPalette: (palette: CakePalette) => void;
  loadBentoPreset: (presetId: BentoPresetId) => void;
  selectItem: (itemId: string | null) => void;
  setZoom: (zoom: number) => void;
  setViewTransform: (zoom: number, panX: number, panY: number) => void;
  setPropertiesOpen: (open: boolean) => void;
  setPreviewOpen: (open: boolean) => void;
  setStatus: (message: string | null) => void;
  addAsset: (assetId: string) => void;
  addUploadedAsset: (name: string, source: string, fileType: "svg" | "png" | "webp") => void;
  addText: () => void;
  updateItem: (itemId: string, patch: Partial<DesignItem>) => void;
  removeSelected: () => void;
  copySelected: () => void;
  paste: () => void;
  duplicateSelected: () => void;
  moveLayer: (direction: 1 | -1) => void;
  addSymmetry: (mode: SymmetryRule["mode"], count?: number) => void;
  updateSymmetryRule: (ruleId: string, patch: Partial<SymmetryRule>) => void;
  detachSelectedSymmetry: () => void;
  undo: () => void;
  redo: () => void;
  replaceDesign: (design: CakeDesign) => void;
  loadReferencePreset: () => void;
}

function offsetPosition(position: SurfacePosition): SurfacePosition {
  return { ...position, u: position.surface === "side" ? wrap01(position.u + .035) : clamp01(position.u + .035), v: clamp01(position.v + .035) };
}

function cloneItem(item: DesignItem): DesignItem {
  const copy = structuredClone(item);
  copy.id = randomId("item");
  copy.surfacePosition = offsetPosition(copy.surfacePosition);
  copy.generatedBySymmetry = undefined;
  copy.sourceItemId = undefined;
  copy.transform.layer += 1;
  return copy;
}

const SIDE_CENTERS = { front: 0, right: .25, back: .5, left: .75 } as const;

export const useCakeDesignerStore = create<DesignerState>((set, get) => ({
  history: createHistory(createBentoPreset()),
  view: "top",
  activeTierId: "tier-1",
  selectedItemId: null,
  clipboard: null,
  zoom: 1,
  panX: 0,
  panY: 0,
  propertiesOpen: false,
  previewOpen: true,
  statusMessage: null,
  dispatch: (command, selectedItemId) => set((state) => ({
    history: commitHistory(state.history, applyCakeDesignCommand(state.history.present, command)),
    selectedItemId: selectedItemId === undefined ? state.selectedItemId : selectedItemId,
  })),
  setView: (view) => set({ view, selectedItemId: null, previewOpen: false }),
  setActiveTier: (activeTierId) => set({ activeTierId, selectedItemId: null }),
  setTierCount: (count) => {
    const state = get();
    const existing = state.history.present.tiers ?? [];
    let next = state.history.present;
    if (count > existing.length) {
      for (let index = existing.length; index < count; index += 1) {
        const below = (next.tiers ?? [])[index - 1] ?? (next.tiers ?? [])[0];
        const widthCm = Math.max(8, (below?.dimensions.widthCm ?? 14) - 3.5);
        next = applyCakeDesignCommand(next, { type: "ADD_TIER", tier: {
          id: `tier-${index + 1}`,
          name: `Tầng ${index + 1}`,
          shape: below?.shape ?? "round",
          dimensions: { widthCm, radiusCm: widthCm / 2, heightCm: Math.max(4.5, (below?.dimensions.heightCm ?? 6) - .5) },
          baseColor: below?.baseColor ?? next.cake.baseColor,
          topColor: below?.topColor ?? next.palette?.top ?? next.cake.baseColor,
        } });
      }
    } else if (count < existing.length) {
      for (const tier of existing.slice(count).reverse()) next = applyCakeDesignCommand(next, { type: "REMOVE_TIER", tierId: tier.id });
    }
    set({ history: commitHistory(state.history, next), activeTierId: `tier-${count}`, selectedItemId: null, statusMessage: `Đã đổi thành ${count} tầng.` });
  },
  updateActiveTier: (patch) => {
    const state = get();
    state.dispatch({ type: "UPDATE_TIER", tierId: state.activeTierId, patch });
  },
  applyPalette: (palette) => get().dispatch({ type: "CHANGE_PALETTE", palette }),
  loadBentoPreset: (presetId) => set({ history: createHistory(createBentoPreset(presetId)), activeTierId: "tier-1", selectedItemId: null, view: "top", zoom: 1, panX: 0, panY: 0, previewOpen: true, statusMessage: "Đã mở mẫu bento. Bạn có thể đổi lời chúc và màu ngay." }),
  selectItem: (selectedItemId) => set({ selectedItemId }),
  setZoom: (zoom) => set({ zoom: Math.min(2.2, Math.max(.65, zoom)) }),
  setViewTransform: (zoom, panX, panY) => set({ zoom: Math.min(2.2, Math.max(.65, zoom)), panX, panY }),
  setPropertiesOpen: (propertiesOpen) => set({ propertiesOpen }),
  setPreviewOpen: (previewOpen) => set({ previewOpen, selectedItemId: previewOpen ? null : get().selectedItemId }),
  setStatus: (statusMessage) => set({ statusMessage }),
  addAsset: (assetId) => {
    const { view, history, dispatch, activeTierId } = get();
    const asset = getAsset(assetId);
    const requestedSurface = view === "top" ? "top" : "side";
    if (asset && !asset.allowedSurfaces.includes(requestedSurface)) {
      set({ statusMessage: `${asset.name} chỉ dùng được ở ${asset.allowedSurfaces.includes("top") ? "mặt trên" : "mặt ngang"}.` });
      return;
    }
    const item: DesignItem = {
      id: randomId("item"), tierId: activeTierId, type: "asset", assetId,
      surfacePosition: { surface: requestedSurface, u: requestedSurface === "top" ? .5 : SIDE_CENTERS[view as Exclude<CakeView, "top">], v: .5 },
      transform: { ...DEFAULT_TRANSFORM, layer: history.present.items.length },
      placement: asset ? { renderMode: asset.renderMode, heightMm: asset.heightMm, shadowStrength: asset.shadowStrength, orientation: asset.orientation } : undefined,
      colors: {}, opacity: 1,
    };
    dispatch({ type: "ADD_ITEM", item }, item.id);
  },
  addUploadedAsset: (name, source, fileType) => {
    const { view, history, dispatch, activeTierId } = get();
    const surface = view === "top" ? "top" : "side";
    const item: DesignItem = {
      id: randomId("upload"), tierId: activeTierId, type: "asset", assetId: `uploaded:${name}`, embeddedSource: source, embeddedFileType: fileType,
      embeddedSizeCm: { width: 4.5, height: 4.5 },
      surfacePosition: { surface, u: surface === "top" ? .5 : SIDE_CENTERS[view as Exclude<CakeView, "top">], v: .5 },
      transform: { ...DEFAULT_TRANSFORM, layer: history.present.items.length },
      placement: { renderMode: surface === "top" ? "raised-sprite" : "side-sprite", heightMm: 5, shadowStrength: .18, orientation: surface === "top" ? "flat" : "billboard" },
      colors: {}, opacity: 1,
    };
    dispatch({ type: "ADD_ITEM", item }, item.id);
  },
  addText: () => {
    const { view, history, dispatch, activeTierId } = get();
    const surface = view === "top" ? "top" : "side";
    const item: DesignItem = {
      id: randomId("text"), tierId: activeTierId, type: "text", text: "Chúc mừng!", color: history.present.palette?.text ?? "#fff4ee",
      fontSizeCm: 1.5, fontFamily: "sans", fontWeight: 700, treatment: "piped-cream", lineThickness: "medium", autoFit: true,
      strokeWidth: 0, shadowColor: "rgba(70,25,15,.16)", shadowOffsetX: 1, shadowOffsetY: 2, shadowBlur: 2,
      surfacePosition: { surface, u: surface === "top" ? .5 : SIDE_CENTERS[view as Exclude<CakeView, "top">], v: .52 },
      transform: { ...DEFAULT_TRANSFORM, layer: history.present.items.length },
      placement: { renderMode: "raised-sprite", heightMm: 2.5, shadowStrength: .08, orientation: "flat" }, opacity: 1,
    };
    dispatch({ type: "ADD_ITEM", item }, item.id);
  },
  updateItem: (itemId, patch) => get().dispatch({ type: "UPDATE_ITEM", itemId, patch }),
  removeSelected: () => { const id = get().selectedItemId; if (id) get().dispatch({ type: "REMOVE_ITEM", itemId: id }, null); },
  copySelected: () => { const state = get(); const item = state.history.present.items.find((entry) => entry.id === state.selectedItemId); if (item && !item.generatedBySymmetry) set({ clipboard: structuredClone(item), statusMessage: "Đã sao chép chi tiết." }); },
  paste: () => { const item = get().clipboard; if (!item) return; const copy = cloneItem({ ...item, tierId: get().activeTierId } as DesignItem); get().dispatch({ type: "DUPLICATE_ITEM", item: copy }, copy.id); },
  duplicateSelected: () => { const state = get(); const item = state.history.present.items.find((entry) => entry.id === state.selectedItemId); if (!item) return; const copy = cloneItem(item); state.dispatch({ type: "DUPLICATE_ITEM", item: copy }, copy.id); },
  moveLayer: (direction) => { const state = get(); const item = state.history.present.items.find((entry) => entry.id === state.selectedItemId); if (item) state.updateItem(item.id, { transform: { ...item.transform, layer: Math.max(0, item.transform.layer + direction) } }); },
  addSymmetry: (mode, count) => {
    const state = get();
    const source = state.history.present.items.find((item) => item.id === state.selectedItemId);
    if (!source || ((mode === "radial-top") !== (source.surfacePosition.surface === "top"))) return;
    const dx = source.surfacePosition.u - .5; const dy = source.surfacePosition.v - .5;
    state.dispatch({ type: "ADD_SYMMETRY_RULE", rule: { id: randomId("symmetry"), tierId: source.tierId, sourceItemId: source.id, mode, count, axisU: .5, axisV: .5, centerU: .5, centerV: .5, radius: Math.hypot(dx, dy) * 2, startAngle: Math.atan2(dy, dx), orientation: "radial", randomSeed: 1207 } });
  },
  updateSymmetryRule: (ruleId, patch) => get().dispatch({ type: "UPDATE_SYMMETRY_RULE", ruleId, patch }),
  detachSelectedSymmetry: () => { const state = get(); const rule = state.history.present.symmetryRules.find((entry) => entry.sourceItemId === state.selectedItemId); if (rule) state.dispatch({ type: "DETACH_SYMMETRY", ruleId: rule.id }); },
  undo: () => set((state) => ({ history: undoHistory(state.history), selectedItemId: null })),
  redo: () => set((state) => ({ history: redoHistory(state.history), selectedItemId: null })),
  replaceDesign: (design) => set({ history: createHistory(design), activeTierId: design.tiers?.[0]?.id ?? "tier-1", selectedItemId: null, view: "top", zoom: 1, panX: 0, panY: 0, previewOpen: true }),
  loadReferencePreset: () => set({ history: createHistory(createStrawberryCocoaPreset()), activeTierId: "tier-1", selectedItemId: null, view: "top", zoom: 1, panX: 0, panY: 0, previewOpen: true, statusMessage: "Đã mở mẫu Dâu cacao." }),
}));

export const selectDesign = (state: DesignerState) => state.history.present;
export const selectCanUndo = (state: DesignerState) => state.history.past.length > 0;
export const selectCanRedo = (state: DesignerState) => state.history.future.length > 0;
export const selectSelectedItem = (state: DesignerState): DesignItem | undefined => state.history.present.items.find((item) => item.id === state.selectedItemId);

export function updateSelectedColors(colors: AssetColorMap) {
  const state = useCakeDesignerStore.getState();
  const item = selectSelectedItem(state);
  if (item?.type === "asset") state.updateItem(item.id, { colors } as Partial<DesignItem>);
}
