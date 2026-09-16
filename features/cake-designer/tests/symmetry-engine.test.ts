import { describe, expect, it } from "vitest";
import { createInitialDesign, DEFAULT_TRANSFORM, type DesignItem, type SymmetryRule } from "../domain/cake-design.types";
import { detachSymmetry, generateSymmetryInstances, getRenderableItems } from "../geometry/symmetry-engine";

function topItem(): DesignItem {
  return {
    id: "source",
    type: "asset",
    assetId: "rose",
    surfacePosition: { surface: "top", u: 0.75, v: 0.5 },
    transform: { ...DEFAULT_TRANSFORM },
  };
}

describe("symmetry engine", () => {
  it("creates four evenly spaced radial positions including the source", () => {
    const source = topItem();
    const rule: SymmetryRule = { id: "radial", sourceItemId: source.id, mode: "radial-top", count: 4, startAngle: 0 };
    const instances = generateSymmetryInstances(source, rule);
    expect(instances).toHaveLength(3);
    const positions = [source, ...instances.map(({ item }) => item)].map((item) => [item.surfacePosition.u, item.surfacePosition.v]);
    expect(positions[0]).toEqual([0.75, 0.5]);
    expect(positions[1][0]).toBeCloseTo(0.5);
    expect(positions[1][1]).toBeCloseTo(0.75);
    expect(positions[2][0]).toBeCloseTo(0.25);
    expect(positions[3][1]).toBeCloseTo(0.25);
  });

  it("repeats side items at quarter circumference intervals", () => {
    const source = { ...topItem(), surfacePosition: { surface: "side" as const, u: 0.1, v: 0.5 } };
    const rule: SymmetryRule = { id: "repeat", sourceItemId: source.id, mode: "repeat-around-side", count: 4 };
    const values = [source, ...generateSymmetryInstances(source, rule).map(({ item }) => item)]
      .map((item) => item.surfacePosition.u);
    [0.1, 0.35, 0.6, 0.85].forEach((expected, index) => {
      expect(values[index]).toBeCloseTo(expected, 8);
    });
  });

  it("detaches generated items into independent canonical items", () => {
    const source = topItem();
    const design = createInitialDesign();
    design.items = [source];
    design.symmetryRules = [{ id: "radial", sourceItemId: source.id, mode: "radial-top", count: 4 }];
    expect(getRenderableItems(design)).toHaveLength(4);
    const detached = detachSymmetry(design, "radial");
    expect(detached.items).toHaveLength(4);
    expect(detached.symmetryRules).toHaveLength(0);
    expect(new Set(detached.items.map((item) => item.id)).size).toBe(4);
    expect(detached.items.every((item) => !item.generatedBySymmetry)).toBe(true);
  });
});
