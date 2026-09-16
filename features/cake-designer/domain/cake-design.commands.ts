import type { CakeConfig, CakeDesign, CakePalette, CakeTier, DesignItem, SymmetryRule } from "./cake-design.types";
import { detachSymmetry } from "../geometry/symmetry-engine";

export type CakeDesignCommand =
  | { type: "ADD_ITEM"; item: DesignItem }
  | { type: "REMOVE_ITEM"; itemId: string }
  | { type: "UPDATE_ITEM"; itemId: string; patch: Partial<DesignItem> }
  | { type: "DUPLICATE_ITEM"; item: DesignItem }
  | { type: "ADD_SYMMETRY_RULE"; rule: SymmetryRule }
  | { type: "UPDATE_SYMMETRY_RULE"; ruleId: string; patch: Partial<SymmetryRule> }
  | { type: "REMOVE_SYMMETRY_RULE"; ruleId: string }
  | { type: "DETACH_SYMMETRY"; ruleId: string }
  | { type: "CHANGE_CAKE"; patch: Partial<CakeConfig> }
  | { type: "UPDATE_TIER"; tierId: string; patch: Partial<CakeTier> }
  | { type: "ADD_TIER"; tier: CakeTier }
  | { type: "REMOVE_TIER"; tierId: string }
  | { type: "CHANGE_PALETTE"; palette: CakePalette }
  | { type: "REPLACE_DESIGN"; design: CakeDesign };

export function applyCakeDesignCommand(design: CakeDesign, command: CakeDesignCommand): CakeDesign {
  switch (command.type) {
    case "ADD_ITEM":
    case "DUPLICATE_ITEM":
      return { ...design, items: [...design.items, command.item] };
    case "REMOVE_ITEM":
      return {
        ...design,
        items: design.items.filter((item) => item.id !== command.itemId),
        symmetryRules: design.symmetryRules.filter((rule) => rule.sourceItemId !== command.itemId),
      };
    case "UPDATE_ITEM":
      return {
        ...design,
        items: design.items.map((item) => item.id === command.itemId ? { ...item, ...command.patch } as DesignItem : item),
      };
    case "ADD_SYMMETRY_RULE":
      return { ...design, symmetryRules: [...design.symmetryRules, command.rule] };
    case "UPDATE_SYMMETRY_RULE":
      return {
        ...design,
        symmetryRules: design.symmetryRules.map((rule) => rule.id === command.ruleId ? { ...rule, ...command.patch } : rule),
      };
    case "REMOVE_SYMMETRY_RULE":
      return { ...design, symmetryRules: design.symmetryRules.filter((rule) => rule.id !== command.ruleId) };
    case "DETACH_SYMMETRY":
      return detachSymmetry(design, command.ruleId);
    case "CHANGE_CAKE":
      return { ...design, cake: { ...design.cake, ...command.patch } };
    case "UPDATE_TIER": {
      const tiers = (design.tiers ?? []).map((tier) => tier.id === command.tierId ? {
        ...tier,
        ...command.patch,
        dimensions: command.patch.dimensions ? { ...command.patch.dimensions } : tier.dimensions,
      } : tier);
      const first = tiers[0];
      return { ...design, tiers, cake: first ? { shape: first.shape, dimensions: { ...first.dimensions }, baseColor: first.baseColor } : design.cake };
    }
    case "ADD_TIER":
      return { ...design, tiers: [...(design.tiers ?? []), command.tier].slice(0, 3) };
    case "REMOVE_TIER": {
      const tiers = (design.tiers ?? []).filter((tier) => tier.id !== command.tierId);
      if (!tiers.length) return design;
      const removedIds = new Set(design.items.filter((item) => item.tierId === command.tierId).map((item) => item.id));
      const first = tiers[0];
      return {
        ...design,
        cake: { shape: first.shape, dimensions: { ...first.dimensions }, baseColor: first.baseColor },
        tiers,
        items: design.items.filter((item) => item.tierId !== command.tierId),
        symmetryRules: design.symmetryRules.filter((rule) => rule.tierId !== command.tierId && !removedIds.has(rule.sourceItemId)),
      };
    }
    case "CHANGE_PALETTE":
      return {
        ...design,
        palette: command.palette,
        cake: { ...design.cake, baseColor: command.palette.body },
        tiers: (design.tiers ?? []).map((tier) => ({ ...tier, baseColor: command.palette.body, topColor: command.palette.top })),
        items: design.items.map((item) => {
          if (item.type === "text") return { ...item, color: command.palette.text };
          if (item.type !== "asset") return item;
          const primary = item.assetId.includes("heart") || item.assetId.includes("bear") || item.assetId.includes("cherry");
          const part = item.assetId.includes("cherry") ? "fruit" : item.assetId.includes("leaf") ? "leaf" : item.assetId.includes("daisy") ? "petal" : "cream";
          return { ...item, colors: { ...item.colors, [part]: primary ? command.palette.primaryDecoration : command.palette.secondaryDecoration } };
        }),
      };
    case "REPLACE_DESIGN":
      return structuredClone(command.design);
  }
}
