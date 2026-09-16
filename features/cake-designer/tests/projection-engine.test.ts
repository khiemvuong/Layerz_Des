import { describe, expect, it } from "vitest";
import { createInitialDesign, DEFAULT_TRANSFORM, type DesignItem, type ViewportConfig } from "../domain/cake-design.types";
import {
  canvasPointFromSurfacePoint,
  isItemVisibleInView,
  projectItemToView,
  surfacePointFromCanvasPoint,
  wrap01,
} from "../geometry/projection-engine";
import { getRenderableItems } from "../geometry/symmetry-engine";

const cake = createInitialDesign().cake;
const viewport: ViewportConfig = { width: 900, height: 640, zoom: 1, sideSpan: 0.5 };

function item(surface: "side" | "top", u = 0.5, v = 0.5): DesignItem {
  return {
    id: "test-item",
    type: "asset",
    assetId: "rose",
    surfacePosition: { surface, u, v },
    transform: { ...DEFAULT_TRANSFORM },
  };
}

describe("projection engine", () => {
  it("wraps positive circumference coordinates", () => {
    expect(wrap01(1.02)).toBeCloseTo(0.02, 8);
  });

  it("wraps negative circumference coordinates", () => {
    expect(wrap01(-0.05)).toBeCloseTo(0.95, 8);
  });

  it("round-trips side surface coordinates", () => {
    const original = { surface: "side" as const, u: 0.18, v: 0.72 };
    const canvas = canvasPointFromSurfacePoint(original, viewport, cake, "right");
    const restored = surfacePointFromCanvasPoint(canvas, viewport, cake, "right");
    expect(restored.u).toBeCloseTo(original.u, 8);
    expect(restored.v).toBeCloseTo(original.v, 8);
  });

  it("round-trips top surface coordinates", () => {
    const original = { surface: "top" as const, u: 0.27, v: 0.68 };
    const canvas = canvasPointFromSurfacePoint(original, viewport, cake, "top");
    const restored = surfacePointFromCanvasPoint(canvas, viewport, cake, "top");
    expect(restored.u).toBeCloseTo(original.u, 8);
    expect(restored.v).toBeCloseTo(original.v, 8);
  });

  it("does not show side items in the top view", () => {
    expect(isItemVisibleInView(item("side"), cake, "top")).toBe(false);
  });

  it("does not show top items in side views", () => {
    expect(isItemVisibleInView(item("top"), cake, "front")).toBe(false);
  });

  it("shows an item near a view seam in both adjacent views", () => {
    const seamItem = item("side", 0.125, 0.5);
    expect(projectItemToView(seamItem, cake, "front", viewport)).not.toBeNull();
    expect(projectItemToView(seamItem, cake, "right", viewport)).not.toBeNull();
  });

  it("does not duplicate canonical state to render a seam", () => {
    const design = createInitialDesign();
    design.items = [item("side", 0.99, 0.5)];
    projectItemToView(design.items[0], cake, "front", viewport);
    expect(design.items).toHaveLength(1);
    expect(getRenderableItems(design)).toHaveLength(1);
  });

  it("keeps physical projection independent from canvas zoom", () => {
    const point = { surface: "top" as const, u: 0.42, v: 0.39 };
    const atOne = canvasPointFromSurfacePoint(point, { ...viewport, zoom: 1 }, cake, "top");
    const atTwo = canvasPointFromSurfacePoint(point, { ...viewport, zoom: 2 }, cake, "top");
    expect(atTwo).toEqual(atOne);
  });
});
