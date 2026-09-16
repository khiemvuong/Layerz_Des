"use client";

import { create } from "zustand";
import { applyCakeDesignCommand, type CakeDesignCommand } from "../domain/cake-design.commands";
import {
  createInitialDesign,
  DEFAULT_TRANSFORM,
  type AssetColorMap,
  type CakeDesign,
  type CakeView,
  type DesignItem,
  type SurfacePosition,
} from "../domain/cake-design.types";
import { clamp01, wrap01 } from "../geometry/projection-engine";
import { randomId } from "../utils/id";
import { commitHistory, createHistory, redoHistory, undoHistory, type DesignHistory } from "./history";

interface DesignerState {
  history: DesignHistory;
  view: CakeView;
  selectedItemId: string | null;
  clipboard: DesignItem | null;
  zoom: number;
  propertiesOpen: boolean;
  statusMessage: string | null;
  dispatch: (command: CakeDesignCommand, selectedItemId?: string | null) => void;
  setView: (view: CakeView) => void;
  selectItem: (itemId: string | null) => void;
  setZoom: (zoom: number) => void;
  setPropertiesOpen: (open: boolean) => void;
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
  addSymmetry: (mode: "mirror-horizontal" | "mirror-vertical" | "repeat-around-side" | "radial-top", count?: number) => void;
  detachSelectedSymmetry: () => void;
  undo: () => void;
  redo: () => void;
  replaceDesign: (design: CakeDesign) => void;
}

function offsetPosition(position: SurfacePosition): SurfacePosition {
  return {
    ...position,
    u: position.surface === "side" ? wrap01(position.u + 0.035) : clamp01(position.u + 0.035),
    v: clamp01(position.v + 0.035),
  };
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

export const useCakeDesignerStore = create<DesignerState>((set, get) => ({
  history: createHistory(createInitialDesign()),
  view: "front",
  selectedItemId: null,
  clipboard: null,
  zoom: 1,
  propertiesOpen: false,
  statusMessage: null,
  dispatch: (command, selectedItemId) => set((state) => {
    const next = applyCakeDesignCommand(state.history.present, command);
    return {
      history: commitHistory(state.history, next),
      selectedItemId: selectedItemId === undefined ? state.selectedItemId : selectedItemId,
    };
  }),
  setView: (view) => set({ view, selectedItemId: null }),
  selectItem: (selectedItemId) => set({ selectedItemId }),
  setZoom: (zoom) => set({ zoom: Math.min(2.2, Math.max(0.65, zoom)) }),
  setPropertiesOpen: (propertiesOpen) => set({ propertiesOpen }),
  setStatus: (statusMessage) => set({ statusMessage }),
  addAsset: (assetId) => {
    const { view, history, dispatch } = get();
    const layer = history.present.items.length;
    const item: DesignItem = {
      id: randomId("item"),
      type: "asset",
      assetId,
      surfacePosition: { surface: view === "top" ? "top" : "side", u: view === "top" ? 0.5 : ({ front: 0, right: 0.25, back: 0.5, left: 0.75 })[view], v: 0.5 },
      transform: { ...DEFAULT_TRANSFORM, layer },
      colors: {},
      opacity: 1,
    };
    dispatch({ type: "ADD_ITEM", item }, item.id);
  },
  addUploadedAsset: (name, source, fileType) => {
    const { view, history, dispatch } = get();
    const item: DesignItem = {
      id: randomId("upload"),
      type: "asset",
      assetId: `uploaded:${name}`,
      embeddedSource: source,
      embeddedFileType: fileType,
      embeddedSizeCm: { width: 4.5, height: 4.5 },
      surfacePosition: { surface: view === "top" ? "top" : "side", u: view === "top" ? 0.5 : ({ front: 0, right: 0.25, back: 0.5, left: 0.75 })[view], v: 0.5 },
      transform: { ...DEFAULT_TRANSFORM, layer: history.present.items.length },
      colors: {},
      opacity: 1,
    };
    dispatch({ type: "ADD_ITEM", item }, item.id);
  },
  addText: () => {
    const { view, history, dispatch } = get();
    const item: DesignItem = {
      id: randomId("text"),
      type: "text",
      text: "Chúc mừng!",
      color: "#593947",
      fontSizeCm: 1.8,
      fontFamily: "serif",
      surfacePosition: { surface: view === "top" ? "top" : "side", u: view === "top" ? 0.5 : ({ front: 0, right: 0.25, back: 0.5, left: 0.75 })[view], v: 0.52 },
      transform: { ...DEFAULT_TRANSFORM, layer: history.present.items.length },
      opacity: 1,
    };
    dispatch({ type: "ADD_ITEM", item }, item.id);
  },
  updateItem: (itemId, patch) => get().dispatch({ type: "UPDATE_ITEM", itemId, patch }),
  removeSelected: () => {
    const id = get().selectedItemId;
    if (id) get().dispatch({ type: "REMOVE_ITEM", itemId: id }, null);
  },
  copySelected: () => {
    const { selectedItemId, history } = get();
    const item = history.present.items.find((candidate) => candidate.id === selectedItemId);
    if (item && !item.generatedBySymmetry) set({ clipboard: structuredClone(item), statusMessage: "Đã sao chép chi tiết." });
  },
  paste: () => {
    const item = get().clipboard;
    if (!item) return;
    const copy = cloneItem(item);
    get().dispatch({ type: "DUPLICATE_ITEM", item: copy }, copy.id);
  },
  duplicateSelected: () => {
    const { selectedItemId, history } = get();
    const source = history.present.items.find((item) => item.id === selectedItemId);
    if (!source) return;
    const copy = cloneItem(source);
    get().dispatch({ type: "DUPLICATE_ITEM", item: copy }, copy.id);
  },
  moveLayer: (direction) => {
    const { selectedItemId, history, updateItem } = get();
    const item = history.present.items.find((candidate) => candidate.id === selectedItemId);
    if (item) updateItem(item.id, { transform: { ...item.transform, layer: Math.max(0, item.transform.layer + direction) } });
  },
  addSymmetry: (mode, count) => {
    const { selectedItemId, history, dispatch } = get();
    const source = history.present.items.find((item) => item.id === selectedItemId);
    if (!source) return;
    if ((mode === "radial-top") !== (source.surfacePosition.surface === "top")) return;
    dispatch({
      type: "ADD_SYMMETRY_RULE",
      rule: { id: randomId("symmetry"), sourceItemId: source.id, mode, count, axisU: 0.5, axisV: 0.5, startAngle: 0 },
    });
  },
  detachSelectedSymmetry: () => {
    const { selectedItemId, history, dispatch } = get();
    const rule = history.present.symmetryRules.find((candidate) => candidate.sourceItemId === selectedItemId);
    if (rule) dispatch({ type: "DETACH_SYMMETRY", ruleId: rule.id });
  },
  undo: () => set((state) => ({ history: undoHistory(state.history), selectedItemId: null })),
  redo: () => set((state) => ({ history: redoHistory(state.history), selectedItemId: null })),
  replaceDesign: (design) => set({ history: createHistory(design), selectedItemId: null, view: "front", zoom: 1 }),
}));

export const selectDesign = (state: DesignerState) => state.history.present;
export const selectCanUndo = (state: DesignerState) => state.history.past.length > 0;
export const selectCanRedo = (state: DesignerState) => state.history.future.length > 0;
export const selectSelectedItem = (state: DesignerState): DesignItem | undefined =>
  state.history.present.items.find((item) => item.id === state.selectedItemId);

export function updateSelectedColors(colors: AssetColorMap) {
  const state = useCakeDesignerStore.getState();
  const item = selectSelectedItem(state);
  if (item?.type === "asset") state.updateItem(item.id, { colors } as Partial<DesignItem>);
}
