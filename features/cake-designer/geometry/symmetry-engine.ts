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
    const dx = source.surfacePosition.u - 0.5;
    const dy = source.surfacePosition.v - 0.5;
    const radius = Math.hypot(dx, dy);
    const baseAngle = Math.atan2(dy, dx);
    position.u = clamp01(0.5 + Math.cos(baseAngle + angle) * radius);
    position.v = clamp01(0.5 + Math.sin(baseAngle + angle) * radius);
    transform.rotation = source.transform.rotation + (angle * 180) / Math.PI;
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
