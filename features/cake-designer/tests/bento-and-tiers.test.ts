import { beforeEach, describe, expect, it } from "vitest";
import { applyCakeDesignCommand } from "../domain/cake-design.commands";
import { getDesignTiers, isTopPositionOccluded } from "../domain/cake-design.types";
import { deserializeDesign, serializeDesign } from "../persistence/design-serializer";
import { BENTO_PRESETS, createBentoPreset } from "../presets/bento-presets";
import { useCakeDesignerStore } from "../store/cake-designer.store";

describe("bento templates", () => {
  it("ships the six requested editable templates", () => {
    expect(BENTO_PRESETS.map((preset) => preset.name)).toEqual([
      "Bento xanh trái tim", "Bento xanh nơ", "Bento hồng hoa lá", "Bento hoa nhiều màu", "Bento cherry đỏ", "Bento gấu hồng",
    ]);
    for (const preset of BENTO_PRESETS) {
      const design = createBentoPreset(preset.id);
      expect(design.items.length).toBeGreaterThan(3);
      expect(design.palette).toEqual(preset.palette);
    }
  });

  it("uses one-color piped cream as the default text treatment", () => {
    const greeting = createBentoPreset("bento-green-heart").items.find((item) => item.type === "text");
    expect(greeting).toMatchObject({ treatment: "piped-cream", strokeWidth: 0, autoFit: true });
    expect(greeting?.type === "text" ? greeting.text : "").toContain("Thương bạn");
  });

  it("keeps Vietnamese accents and long multiline greetings through save and load", () => {
    const design = createBentoPreset();
    const text = design.items.find((item) => item.type === "text")!;
    const longText = "Chúc mừng sinh nhật\nngười bạn tuyệt vời";
    const updated = applyCakeDesignCommand(design, { type: "UPDATE_ITEM", itemId: text.id, patch: { text: longText } });
    const restored = deserializeDesign(serializeDesign(updated));
    expect(restored.items.find((item) => item.id === text.id)).toMatchObject({ text: longText, tierId: "tier-1" });
  });
});

describe("multi-tier cake model", () => {
  beforeEach(() => useCakeDesignerStore.getState().replaceDesign(createBentoPreset()));

  it("adds up to three concentric tiers and associates new items with the active tier", () => {
    useCakeDesignerStore.getState().setTierCount(3);
    useCakeDesignerStore.getState().setActiveTier("tier-2");
    useCakeDesignerStore.getState().setView("top");
    useCakeDesignerStore.getState().addText();
    const state = useCakeDesignerStore.getState();
    expect(getDesignTiers(state.history.present)).toHaveLength(3);
    expect(state.history.present.items.find((item) => item.id === state.selectedItemId)?.tierId).toBe("tier-2");
  });

  it("marks the center of a lower tier as occluded by the tier above", () => {
    useCakeDesignerStore.getState().setTierCount(2);
    const design = useCakeDesignerStore.getState().history.present;
    expect(isTopPositionOccluded(design, "tier-1", { surface: "top", u: .5, v: .5 })).toBe(true);
    expect(isTopPositionOccluded(design, "tier-1", { surface: "top", u: .98, v: .5 })).toBe(false);
  });

  it("undo restores a removed tier and its decorations", () => {
    useCakeDesignerStore.getState().setTierCount(2);
    useCakeDesignerStore.getState().setActiveTier("tier-2");
    useCakeDesignerStore.getState().setView("top");
    useCakeDesignerStore.getState().addAsset("piped-heart");
    const itemId = useCakeDesignerStore.getState().selectedItemId;
    useCakeDesignerStore.getState().setTierCount(1);
    expect(useCakeDesignerStore.getState().history.present.items.some((item) => item.id === itemId)).toBe(false);
    useCakeDesignerStore.getState().undo();
    expect(getDesignTiers(useCakeDesignerStore.getState().history.present)).toHaveLength(2);
    expect(useCakeDesignerStore.getState().history.present.items.some((item) => item.id === itemId)).toBe(true);
  });

  it("migrates version 1 designs without keeping the old red text outline", () => {
    const legacy = createBentoPreset();
    const payload = { schemaVersion: 1, savedAt: new Date(0).toISOString(), design: { ...legacy, version: 1, tiers: undefined, palette: undefined } };
    const restored = deserializeDesign(JSON.stringify(payload));
    const text = restored.items.find((item) => item.type === "text");
    expect(restored.version).toBe(2);
    expect(getDesignTiers(restored)).toHaveLength(1);
    expect(text).toMatchObject({ treatment: "piped-cream", strokeWidth: 0 });
  });
});
