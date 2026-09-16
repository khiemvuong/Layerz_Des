"use client";

import { Minus, Plus } from "@phosphor-icons/react";
import {
  Canvas,
  Ellipse,
  FabricObject,
  FabricImage,
  FabricText,
  Rect,
  Shadow,
  loadSVGFromString,
  util,
} from "fabric";
import { useEffect, useRef, useState } from "react";
import { decodeSvgDataUrl, getAsset } from "../assets/asset-library";
import { recolorSvg } from "../assets/svg-sanitizer";
import type { CakeView, DesignItem, ViewportConfig } from "../domain/cake-design.types";
import { getRenderableItems } from "../geometry/symmetry-engine";
import {
  canvasPointFromSurfacePoint,
  projectedCakeBounds,
  surfacePointFromCanvasPoint,
} from "../geometry/projection-engine";
import {
  selectDesign,
  useCakeDesignerStore,
} from "../store/cake-designer.store";
import styles from "./designer.module.css";

type DesignerFabricObject = FabricObject & {
  designerItemId?: string;
  sourceItemId?: string;
  generated?: boolean;
  baseScaleX?: number;
  baseScaleY?: number;
};

async function createItemObject(item: DesignItem, pixelsPerCm: number): Promise<DesignerFabricObject | null> {
  if (item.type === "text") {
    return new FabricText(item.text || "Lời chúc", {
      fontFamily: item.fontFamily === "serif" ? "Georgia" : "Arial",
      fontSize: Math.max(15, item.fontSizeCm * pixelsPerCm),
      fill: item.color,
      fontWeight: 600,
      textAlign: "center",
    }) as DesignerFabricObject;
  }
  if (item.type === "stroke") return null;
  const asset = getAsset(item.assetId);
  const source = asset?.sourceUrl ?? item.embeddedSource;
  const fileType = asset?.fileType ?? item.embeddedFileType;
  const size = asset?.defaultSizeCm ?? item.embeddedSizeCm ?? { width: 4.5, height: 4.5 };
  if (!source || !fileType) return null;
  if (fileType !== "svg") {
    const image = await FabricImage.fromURL(source, { crossOrigin: "anonymous" });
    image.scaleToWidth(size.width * pixelsPerCm);
    return image as DesignerFabricObject;
  }
  const rawSvg = source.startsWith("data:") ? decodeSvgDataUrl(source) : source;
  const safeSvg = recolorSvg(rawSvg, item.colors ?? {});
  const parsed = await loadSVGFromString(safeSvg);
  const objects = parsed.objects.filter((object): object is FabricObject => object !== null);
  if (!objects.length) return null;
  const grouped = util.groupSVGElements(objects, parsed.options) as DesignerFabricObject;
  const targetWidth = size.width * pixelsPerCm;
  grouped.scaleToWidth(targetWidth);
  return grouped;
}

function addCakeSurface(canvas: Canvas, viewport: ViewportConfig, view: CakeView, color: string, shape: "round" | "rectangle") {
  const area = projectedCakeBounds(viewport);
  const isTop = view === "top";
  const common = {
    left: area.left,
    top: area.top,
    originX: "left" as const,
    originY: "top" as const,
    width: area.width,
    height: area.height,
    fill: color,
    stroke: "#d58ea0",
    strokeWidth: 1.5,
    selectable: false,
    evented: false,
    shadow: new Shadow({ color: "rgba(82, 48, 63, .16)", blur: 26, offsetY: 13 }),
  };
  const cake = isTop && shape === "round"
    ? new Ellipse({ ...common, rx: area.width / 2, ry: area.height / 2 })
    : new Rect({ ...common, rx: shape === "round" && !isTop ? 34 : 10, ry: shape === "round" && !isTop ? 34 : 10 });
  canvas.add(cake);

  const safeInset = 20;
  const safe = isTop && shape === "round"
    ? new Ellipse({
        left: area.left + safeInset,
        top: area.top + safeInset,
        originX: "left",
        originY: "top",
        rx: (area.width - safeInset * 2) / 2,
        ry: (area.height - safeInset * 2) / 2,
        fill: "transparent",
        stroke: "rgba(104, 66, 82, .34)",
        strokeDashArray: [6, 7],
        selectable: false,
        evented: false,
      })
    : new Rect({
        left: area.left + safeInset,
        top: area.top + safeInset,
        originX: "left",
        originY: "top",
        width: area.width - safeInset * 2,
        height: area.height - safeInset * 2,
        rx: shape === "round" ? 25 : 6,
        ry: shape === "round" ? 25 : 6,
        fill: "transparent",
        stroke: "rgba(104, 66, 82, .34)",
        strokeDashArray: [6, 7],
        selectable: false,
        evented: false,
      });
  canvas.add(safe);
  canvas.add(new Rect({
    left: area.left + area.width / 2,
    top: area.top,
    originX: "left",
    originY: "top",
    width: 1,
    height: area.height,
    fill: "rgba(104, 66, 82, .16)",
    selectable: false,
    evented: false,
  }));
}

function makeClip(viewport: ViewportConfig, view: CakeView, shape: "round" | "rectangle"): FabricObject {
  const area = projectedCakeBounds(viewport);
  const options = {
    left: area.left,
    top: area.top,
    originX: "left" as const,
    originY: "top" as const,
    width: area.width,
    height: area.height,
    absolutePositioned: true,
  };
  return view === "top" && shape === "round"
    ? new Ellipse({ ...options, rx: area.width / 2, ry: area.height / 2 })
    : new Rect({ ...options, rx: shape === "round" ? 34 : 10, ry: shape === "round" ? 34 : 10 });
}

export function CakeCanvas() {
  const htmlCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const viewportRef = useRef<ViewportConfig>({ width: 800, height: 580, sideSpan: 0.5 });
  const renderIdRef = useRef(0);
  const synchronizingRef = useRef(false);
  const [canvasReady, setCanvasReady] = useState(0);
  const design = useCakeDesignerStore(selectDesign);
  const view = useCakeDesignerStore((state) => state.view);
  const selectedItemId = useCakeDesignerStore((state) => state.selectedItemId);
  const selectItem = useCakeDesignerStore((state) => state.selectItem);
  const updateItem = useCakeDesignerStore((state) => state.updateItem);
  const zoom = useCakeDesignerStore((state) => state.zoom);
  const setZoom = useCakeDesignerStore((state) => state.setZoom);

  useEffect(() => {
    let canvas: Canvas | null = null;
    let observer: ResizeObserver | null = null;
    const initialization = window.setTimeout(() => {
      const element = htmlCanvasRef.current;
      const container = containerRef.current;
      if (!element || !container) return;
      canvas = new Canvas(element, {
        preserveObjectStacking: true,
        selection: false,
        allowTouchScrolling: false,
        controlsAboveOverlay: true,
      });
      fabricRef.current = canvas;
      FabricObject.ownDefaults = {
        ...FabricObject.ownDefaults,
        transparentCorners: false,
        cornerColor: "#7b3f54",
        cornerStrokeColor: "#fffaf8",
        borderColor: "#7b3f54",
        cornerSize: 13,
        touchCornerSize: 42,
        padding: 4,
      };

      const resize = () => {
        if (!canvas) return;
        const rect = container.getBoundingClientRect();
        const width = Math.max(320, Math.floor(rect.width));
        const height = Math.max(390, Math.floor(rect.height));
        viewportRef.current = { width, height, sideSpan: 0.5 };
        canvas.setDimensions({ width, height });
        renderIdRef.current += 1;
        setCanvasReady((value) => value + 1);
      };
      observer = new ResizeObserver(resize);
      observer.observe(container);
      resize();

      canvas.on("selection:created", ({ selected }) => {
        const target = selected?.[0] as DesignerFabricObject | undefined;
        selectItem(target?.sourceItemId ?? target?.designerItemId ?? null);
      });
      canvas.on("selection:updated", ({ selected }) => {
        const target = selected?.[0] as DesignerFabricObject | undefined;
        selectItem(target?.sourceItemId ?? target?.designerItemId ?? null);
      });
      canvas.on("selection:cleared", () => {
        if (!synchronizingRef.current) selectItem(null);
      });
      canvas.on("mouse:down", ({ target }) => {
        const object = target as DesignerFabricObject | undefined;
        if (object?.generated && object.sourceItemId) selectItem(object.sourceItemId);
      });
      canvas.on("object:modified", ({ target }) => {
        const object = target as DesignerFabricObject | undefined;
        if (!object?.designerItemId || object.generated) return;
        const state = useCakeDesignerStore.getState();
        const canonical = state.history.present.items.find((item) => item.id === object.designerItemId);
        if (!canonical) return;
        const point = object.getCenterPoint();
        const surfacePosition = surfacePointFromCanvasPoint(point, viewportRef.current, state.history.present.cake, state.view);
        const baseScaleX = object.baseScaleX ?? 1;
        const baseScaleY = object.baseScaleY ?? 1;
        updateItem(canonical.id, {
          surfacePosition,
          transform: {
            ...canonical.transform,
            rotation: object.angle ?? 0,
            scaleX: Math.max(0.2, (object.scaleX ?? 1) / baseScaleX),
            scaleY: Math.max(0.2, (object.scaleY ?? 1) / baseScaleY),
            flipX: object.flipX ?? false,
            flipY: object.flipY ?? false,
          },
        } as Partial<DesignItem>);
      });
      canvas.on("mouse:wheel", ({ e }) => {
        e.preventDefault();
        e.stopPropagation();
        const next = useCakeDesignerStore.getState().zoom * (e.deltaY > 0 ? 0.92 : 1.08);
        useCakeDesignerStore.getState().setZoom(next);
      });
    }, 0);

    return () => {
      window.clearTimeout(initialization);
      observer?.disconnect();
      renderIdRef.current += 1;
      fabricRef.current = null;
      if (canvas) void canvas.dispose().catch(() => undefined);
    };
  }, [selectItem, updateItem]);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const renderId = ++renderIdRef.current;
    const viewport = viewportRef.current;
    const render = async () => {
      synchronizingRef.current = true;
      canvas.discardActiveObject();
      canvas.clear();
      addCakeSurface(canvas, viewport, view, design.cake.baseColor, design.cake.shape);
      const pixelsPerCm = Math.min(viewport.width, viewport.height) / Math.max(20, design.cake.dimensions.widthCm) * 0.78;
      const items = getRenderableItems(design).sort((a, b) => a.transform.layer - b.transform.layer);
      for (const item of items) {
        if ((view === "top") !== (item.surfacePosition.surface === "top")) continue;
        if (view !== "top") {
          const centers: Record<Exclude<CakeView, "top">, number> = { front: 0, right: 0.25, back: 0.5, left: 0.75 };
          const delta = ((item.surfacePosition.u - centers[view] + 1.5) % 1) - 0.5;
          if (Math.abs(delta) > 0.27) continue;
        }
        const object = await createItemObject(item, pixelsPerCm);
        if (!object || renderId !== renderIdRef.current) {
          synchronizingRef.current = false;
          return;
        }
        const point = canvasPointFromSurfacePoint(item.surfacePosition, viewport, design.cake, view);
        object.set({
          left: point.x,
          top: point.y,
          originX: "center",
          originY: "center",
          angle: item.transform.rotation,
          scaleX: (object.scaleX ?? 1) * item.transform.scaleX,
          scaleY: (object.scaleY ?? 1) * item.transform.scaleY,
          flipX: item.transform.flipX,
          flipY: item.transform.flipY,
          opacity: item.generatedBySymmetry ? 0.74 : item.opacity ?? 1,
          selectable: !item.generatedBySymmetry,
          evented: true,
          lockUniScaling: false,
          clipPath: makeClip(viewport, view, design.cake.shape),
        });
        object.baseScaleX = (object.scaleX ?? 1) / item.transform.scaleX;
        object.baseScaleY = (object.scaleY ?? 1) / item.transform.scaleY;
        object.designerItemId = item.generatedBySymmetry ? undefined : item.id;
        object.sourceItemId = item.sourceItemId;
        object.generated = item.generatedBySymmetry;
        canvas.add(object);
        if (item.id === selectedItemId) canvas.setActiveObject(object);
      }
      canvas.setViewportTransform([
        zoom,
        0,
        0,
        zoom,
        (1 - zoom) * viewport.width / 2,
        (1 - zoom) * viewport.height / 2,
      ]);
      canvas.requestRenderAll();
      synchronizingRef.current = false;
    };
    void render();
  }, [canvasReady, design, view, selectedItemId, zoom]);

  return (
    <div ref={containerRef} className={styles.canvasStage}>
      <canvas ref={htmlCanvasRef} aria-label="Vùng thiết kế bánh" />
      <div className={styles.viewBadge}>{view === "top" ? "Mặt trên" : ({ front: "Mặt trước", right: "Bên phải", back: "Mặt sau", left: "Bên trái" })[view]}</div>
      <div className={styles.zoomControls}>
        <button type="button" onClick={() => setZoom(zoom - 0.1)} aria-label="Thu nhỏ"><Minus size={17} /></button>
        <output>{Math.round(zoom * 100)}%</output>
        <button type="button" onClick={() => setZoom(zoom + 0.1)} aria-label="Phóng to"><Plus size={17} /></button>
      </div>
      <p className={styles.canvasHint}>Kéo để di chuyển. Dùng các nút điều khiển để xoay và đổi kích thước.</p>
    </div>
  );
}
