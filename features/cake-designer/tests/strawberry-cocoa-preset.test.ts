import { beforeEach, describe, expect, it, vi } from "vitest";
import { disposePreviewResources, PreviewResourceCache } from "../components/preview-resource-cache";
import type { CakeView } from "../domain/cake-design.types";
import { isItemVisibleInView } from "../geometry/projection-engine";
import { detachSymmetry, generateSymmetryInstances, getRenderableItems } from "../geometry/symmetry-engine";
import { deserializeDesign, serializeDesign } from "../persistence/design-serializer";
import { createStrawberryCocoaPreset, STRAWBERRY_COCOA_PRESET_ID } from "../presets/strawberry-cocoa";
import { useCakeDesignerStore } from "../store/cake-designer.store";

describe("Strawberry Cocoa Birthday Cake preset", () => {
  beforeEach(() => useCakeDesignerStore.getState().replaceDesign(createStrawberryCocoaPreset()));

  it("creates the expected round 20 cm by 7.5 cm cake", () => {
    const design = createStrawberryCocoaPreset();
    expect(design.presetId).toBe(STRAWBERRY_COCOA_PRESET_ID);
    expect(design.cake.shape).toBe("round");
    expect(design.cake.dimensions).toMatchObject({ widthCm: 20, heightCm: 7.5 });
  });

  it("contains a cocoa surface decal and two radial rings", () => {
    const design = createStrawberryCocoaPreset();
    const cocoa = design.items.find((item) => item.type === "asset" && item.assetId === "cocoa-texture");
    expect(cocoa?.placement?.renderMode).toBe("surface-decal");
    expect(design.symmetryRules.find((rule) => rule.id === "cream-ring")?.count).toBe(24);
    expect(design.symmetryRules.find((rule) => rule.id === "strawberry-ring")?.count).toBe(15);
  });

  it("renders exactly 24 cream and 15 strawberry instances", () => {
    const rendered = getRenderableItems(createStrawberryCocoaPreset());
    expect(rendered.filter((item) => item.id === "cream-ring-source" || item.sourceItemId === "cream-ring-source")).toHaveLength(24);
    expect(rendered.filter((item) => item.id === "strawberry-ring-source" || item.sourceItemId === "strawberry-ring-source")).toHaveLength(15);
  });

  it("generates deterministic seeded variation and variants", () => {
    const design = createStrawberryCocoaPreset();
    const rule = design.symmetryRules.find((candidate) => candidate.id === "strawberry-ring")!;
    const source = design.items.find((candidate) => candidate.id === rule.sourceItemId)!;
    expect(generateSymmetryInstances(source, rule)).toEqual(generateSymmetryInstances(source, rule));
    expect(new Set(generateSymmetryInstances(source, rule).map(({ item }) => item.type === "asset" ? item.assetId : "" )).size).toBeGreaterThan(1);
  });

  it("detaches a generated ring into independent canonical items", () => {
    const design = createStrawberryCocoaPreset();
    const detached = detachSymmetry(design, "cream-ring");
    expect(detached.symmetryRules.some((rule) => rule.id === "cream-ring")).toBe(false);
    expect(detached.items.filter((item) => item.id === "cream-ring-source" || item.sourceItemId === "cream-ring-source")).toHaveLength(1);
    expect(detached.items.filter((item) => item.type === "asset" && item.assetId.startsWith("cream-swirl-top"))).toHaveLength(24);
    expect(detached.items.every((item) => !item.generatedBySymmetry)).toBe(true);
  });

  it("shows the bow only from the front while the ribbon wraps all side views", () => {
    const design = createStrawberryCocoaPreset();
    const bow = design.items.find((item) => item.id === "red-bow")!;
    const ribbon = design.items.find((item) => item.id === "red-ribbon-band")!;
    expect(isItemVisibleInView(bow, design.cake, "front")).toBe(true);
    expect(isItemVisibleInView(bow, design.cake, "back")).toBe(false);
    const sideViews: CakeView[] = ["front", "right", "back", "left"];
    expect(sideViews.every((view) => isItemVisibleInView(ribbon, design.cake, view))).toBe(true);
  });

  it("stores one top source per ring instead of five view-specific copies", () => {
    const design = createStrawberryCocoaPreset();
    expect(design.items.filter((item) => item.id === "cream-ring-source")).toHaveLength(1);
    expect(design.items.filter((item) => item.id === "strawberry-ring-source")).toHaveLength(1);
  });

  it("switching editor view does not mutate CakeDesign", () => {
    const before = structuredClone(useCakeDesignerStore.getState().history.present);
    useCakeDesignerStore.getState().setView("top");
    useCakeDesignerStore.getState().setView("back");
    expect(useCakeDesignerStore.getState().history.present).toEqual(before);
  });

  it("adds Happy Birthday to the side that is currently open", () => {
    useCakeDesignerStore.getState().setView("right");
    useCakeDesignerStore.getState().addAsset("birthday-text");
    const state = useCakeDesignerStore.getState();
    const added = state.history.present.items.find((item) => item.id === state.selectedItemId);
    expect(added?.type).toBe("asset");
    expect(added?.surfacePosition).toMatchObject({ surface: "side", u: .25, v: .5 });
  });

  it("does not silently move an incompatible asset to another surface", () => {
    useCakeDesignerStore.getState().setView("front");
    const before = useCakeDesignerStore.getState().history.present.items.length;
    useCakeDesignerStore.getState().addAsset("cocoa-texture");
    const state = useCakeDesignerStore.getState();
    expect(state.history.present.items).toHaveLength(before);
    expect(state.statusMessage).toContain("mặt trên");
  });

  it("serializes and reloads the complete seeded preset", () => {
    const preset = createStrawberryCocoaPreset();
    expect(deserializeDesign(serializeDesign(preset))).toEqual(preset);
  });
});

describe("Beauty Preview resource lifecycle", () => {
  it("reuses a texture key instead of creating textures continuously", () => {
    const cache = new PreviewResourceCache<{ dispose: () => void }>();
    const factory = vi.fn(() => ({ dispose: vi.fn() }));
    const first = cache.getOrCreate("strawberry-half-01", factory);
    const second = cache.getOrCreate("strawberry-half-01", factory);
    expect(second).toBe(first);
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it("disposes cached textures and loose geometry/material resources on teardown", () => {
    const disposeTexture = vi.fn();
    const disposeGeometry = vi.fn();
    const cache = new PreviewResourceCache<{ dispose: () => void }>();
    cache.getOrCreate("cocoa", () => ({ dispose: disposeTexture }));
    const loose = [{ dispose: disposeGeometry }];
    cache.disposeAll();
    disposePreviewResources(loose);
    expect(disposeTexture).toHaveBeenCalledOnce();
    expect(disposeGeometry).toHaveBeenCalledOnce();
    expect(cache.size).toBe(0);
    expect(loose).toHaveLength(0);
  });
});
