import { beforeEach, describe, expect, it } from "vitest";
import { createInitialDesign, DEFAULT_TRANSFORM, type DesignItem } from "../domain/cake-design.types";
import { applyCakeDesignCommand } from "../domain/cake-design.commands";
import { deserializeDesign, serializeDesign } from "../persistence/design-serializer";
import { commitHistory, createHistory, redoHistory, undoHistory } from "../store/history";
import { useCakeDesignerStore } from "../store/cake-designer.store";

function item(): DesignItem {
  return {
    id: "original",
    type: "asset",
    assetId: "rose",
    surfacePosition: { surface: "side", u: 0.2, v: 0.4 },
    transform: { ...DEFAULT_TRANSFORM },
  };
}

describe("history and persistence", () => {
  beforeEach(() => {
    useCakeDesignerStore.getState().replaceDesign({ ...createInitialDesign(), items: [item()] });
    useCakeDesignerStore.getState().selectItem("original");
  });

  it("copy and paste creates a new domain id", () => {
    useCakeDesignerStore.getState().copySelected();
    useCakeDesignerStore.getState().paste();
    const items = useCakeDesignerStore.getState().history.present.items;
    expect(items).toHaveLength(2);
    expect(items[1].id).not.toBe(items[0].id);
  });

  it("undo and redo move return the item to each committed position", () => {
    const start = { ...createInitialDesign(), items: [item()] };
    const moved = applyCakeDesignCommand(start, {
      type: "UPDATE_ITEM",
      itemId: "original",
      patch: { surfacePosition: { surface: "side", u: 0.48, v: 0.7 } },
    });
    const history = commitHistory(createHistory(start), moved);
    const undone = undoHistory(history);
    expect(undone.present.items[0].surfacePosition.u).toBe(0.2);
    const redone = redoHistory(undone);
    expect(redone.present.items[0].surfacePosition.u).toBe(0.48);
  });

  it("serializes and restores the canonical design", () => {
    const design = { ...createInitialDesign(), items: [item()] };
    expect(deserializeDesign(serializeDesign(design))).toEqual(design);
  });
});
