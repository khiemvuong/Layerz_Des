import type {
  CakeConfig,
  CakeView,
  DesignItem,
  ProjectedItem,
  SurfacePosition,
  ViewportConfig,
} from "../domain/cake-design.types";

export const SIDE_VIEW_CENTERS: Record<Exclude<CakeView, "top">, number> = {
  front: 0,
  right: 0.25,
  back: 0.5,
  left: 0.75,
};

export const wrap01 = (value: number): number => ((value % 1) + 1) % 1;
export const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

export function circularDelta(value: number, center: number): number {
  const delta = wrap01(value) - wrap01(center);
  if (delta > 0.5) return delta - 1;
  if (delta < -0.5) return delta + 1;
  return delta;
}

function bounds(viewport: ViewportConfig) {
  const size = Math.min(viewport.width, viewport.height);
  if (viewport.width <= 0 || viewport.height <= 0) {
    return { left: 0, top: 0, width: 1, height: 1 };
  }
  return {
    left: (viewport.width - size * 0.82) / 2,
    top: (viewport.height - size * 0.68) / 2,
    width: size * 0.82,
    height: size * 0.68,
  };
}

export function normalizeSurfacePosition(position: SurfacePosition): SurfacePosition {
  return {
    surface: position.surface,
    u: position.surface === "side" ? wrap01(position.u) : clamp01(position.u),
    v: clamp01(position.v),
  };
}

export function isItemVisibleInView(
  item: DesignItem,
  _cake: CakeConfig,
  view: CakeView,
): boolean {
  if (view === "top") return item.surfacePosition.surface === "top";
  if (item.surfacePosition.surface !== "side") return false;
  if (item.placement?.renderMode === "side-band") return true;
  return Math.abs(circularDelta(item.surfacePosition.u, SIDE_VIEW_CENTERS[view])) <= 0.27;
}

export function canvasPointFromSurfacePoint(
  position: SurfacePosition,
  viewport: ViewportConfig,
  _cake: CakeConfig,
  view: CakeView,
): { x: number; y: number } {
  const area = bounds(viewport);
  const normalized = normalizeSurfacePosition(position);
  if (view === "top") {
    return {
      x: area.left + normalized.u * area.width,
      y: area.top + normalized.v * area.height,
    };
  }
  const span = viewport.sideSpan ?? 0.5;
  const delta = circularDelta(normalized.u, SIDE_VIEW_CENTERS[view]);
  return {
    x: area.left + (delta / span + 0.5) * area.width,
    y: area.top + (1 - normalized.v) * area.height,
  };
}

export function surfacePointFromCanvasPoint(
  canvasPoint: { x: number; y: number },
  viewport: ViewportConfig,
  _cake: CakeConfig,
  view: CakeView,
): SurfacePosition {
  const area = bounds(viewport);
  const u = (canvasPoint.x - area.left) / area.width;
  const v = 1 - (canvasPoint.y - area.top) / area.height;
  if (view === "top") {
    return { surface: "top", u: clamp01(u), v: clamp01(1 - v) };
  }
  const span = viewport.sideSpan ?? 0.5;
  return {
    surface: "side",
    u: wrap01(SIDE_VIEW_CENTERS[view] + (u - 0.5) * span),
    v: clamp01(v),
  };
}

export function projectItemToView(
  item: DesignItem,
  cake: CakeConfig,
  view: CakeView,
  viewport: ViewportConfig = { width: 1000, height: 700 },
): ProjectedItem | null {
  if (!isItemVisibleInView(item, cake, view)) return null;
  const projectedPosition = item.placement?.renderMode === "side-band" && view !== "top"
    ? { ...item.surfacePosition, u: SIDE_VIEW_CENTERS[view] }
    : item.surfacePosition;
  const point = canvasPointFromSurfacePoint(projectedPosition, viewport, cake, view);
  const seamOffset = item.surfacePosition.surface === "side"
    ? (item.surfacePosition.u > 0.75 && view === "front" ? -1 : item.surfacePosition.u < 0.25 && view === "left" ? 1 : 0)
    : 0;
  const depth = item.surfacePosition.surface === "side"
    ? Math.cos(circularDelta(item.surfacePosition.u, view === "top" ? 0 : SIDE_VIEW_CENTERS[view]) * Math.PI * 2)
    : item.surfacePosition.v;
  return { item, x: point.x, y: point.y, visible: true, seamOffset, depth };
}

export function projectedCakeBounds(viewport: ViewportConfig) {
  return bounds(viewport);
}
