import { randomId } from "../utils/id";
import type { CakeDesign, DesignItem, SymmetryRule } from "../domain/cake-design.types";
import { clamp01, wrap01 } from "./projection-engine";

export interface GeneratedInstance {
  item: DesignItem;
  ruleId: string;
  instanceIndex: number;
}

function cloneForRule(source: DesignItem, rule: SymmetryRule, index: number): DesignItem {
  const clone = structuredClone(source);
  clone.id = `sym:${rule.id}:${index}`;
  clone.sourceItemId = source.id;
  clone.generatedBySymmetry = true;
  const position = { ...clone.surfacePosition };
  const transform = { ...clone.transform };

  if (rule.mode === "repeat-around-side") {
    position.u = wrap01(source.surfacePosition.u + index / Math.max(2, rule.count ?? 4));
  } else if (rule.mode === "radial-top") {
    const count = Math.max(2, rule.count ?? 4);
    const start = rule.startAngle ?? 0;
    const angle = start + (Math.PI * 2 * index) / count;
    const centerU = rule.centerU ?? .5;
    const centerV = rule.centerV ?? .5;
    const sourceDx = source.surfacePosition.u - centerU;
    const sourceDy = source.surfacePosition.v - centerV;
    const normalizedRadius = rule.radius ?? Math.hypot(sourceDx, sourceDy) * 2;
    const radiusNoise = signedSeededValue(rule.randomSeed ?? 1, index, 1) * (rule.radiusVariation ?? 0);
    const radius = Math.max(0, normalizedRadius + radiusNoise) / 2;
    position.u = clamp01(centerU + Math.cos(angle) * radius);
    position.v = clamp01(centerV + Math.sin(angle) * radius);
    const angleDegrees = angle * 180 / Math.PI;
    const orientationOffset = rule.orientation === "radial" ? -90 : 90;
    transform.rotation = angleDegrees + orientationOffset
      + signedSeededValue(rule.randomSeed ?? 1, index, 2) * (rule.rotationVariation ?? 0);
    const scale = 1 + signedSeededValue(rule.randomSeed ?? 1, index, 3) * (rule.scaleVariation ?? 0);
    transform.scaleX = Math.max(.1, source.transform.scaleX * scale);
    transform.scaleY = Math.max(.1, source.transform.scaleY * scale);
    if (clone.type === "asset" && rule.variantIds?.length) {
      const variantIndex = Math.floor(seededValue(rule.randomSeed ?? 1, index, 4) * rule.variantIds.length);
      clone.assetId = rule.variantIds[Math.min(rule.variantIds.length - 1, variantIndex)];
      if (clone.placement) clone.placement = { ...clone.placement, variantId: clone.assetId };
    }
  } else if (rule.mode === "mirror-horizontal") {
    position.u = clamp01(2 * (rule.axisU ?? 0.5) - source.surfacePosition.u);
    transform.flipX = !source.transform.flipX;
  } else if (rule.mode === "mirror-vertical") {
    position.v = clamp01(2 * (rule.axisV ?? 0.5) - source.surfacePosition.v);
    transform.flipY = !source.transform.flipY;
  }

  clone.surfacePosition = position;
  clone.transform = transform;
  return clone;
}

function seededValue(seed: number, index: number, channel: number): number {
  let value = (seed ^ Math.imul(index + 1, 0x9e3779b1) ^ Math.imul(channel + 1, 0x85ebca6b)) >>> 0;
  value = Math.imul(value ^ value >>> 16, 0x7feb352d);
  value = Math.imul(value ^ value >>> 15, 0x846ca68b);
  return ((value ^ value >>> 16) >>> 0) / 4294967296;
}

function signedSeededValue(seed: number, index: number, channel: number): number {
  return seededValue(seed, index, channel) * 2 - 1;
}

export function generateSymmetryInstances(
  source: DesignItem,
  rule: SymmetryRule,
): GeneratedInstance[] {
  const total = rule.mode === "radial-top" || rule.mode === "repeat-around-side"
    ? Math.max(2, rule.count ?? 4)
    : 2;
  return Array.from({ length: total - 1 }, (_, offset) => {
    const instanceIndex = offset + 1;
    return { item: cloneForRule(source, rule, instanceIndex), ruleId: rule.id, instanceIndex };
  });
}

export function getRenderableItems(design: CakeDesign): DesignItem[] {
  const generated = design.symmetryRules.flatMap((rule) => {
    const source = design.items.find((item) => item.id === rule.sourceItemId);
    return source ? generateSymmetryInstances(source, rule).map((entry) => entry.item) : [];
  });
  return [...design.items, ...generated];
}

export function detachSymmetry(design: CakeDesign, ruleId: string): CakeDesign {
  const rule = design.symmetryRules.find((candidate) => candidate.id === ruleId);
  if (!rule) return design;
  const source = design.items.find((item) => item.id === rule.sourceItemId);
  if (!source) return design;
  const detached = generateSymmetryInstances(source, rule).map(({ item }) => ({
    ...item,
    id: randomId("item"),
    sourceItemId: undefined,
    generatedBySymmetry: undefined,
  }));
  return {
    ...design,
    items: [...design.items, ...detached],
    symmetryRules: design.symmetryRules.filter((candidate) => candidate.id !== ruleId),
  };
}
