import type { CakeConfig, CakeDesign, DesignItem, SymmetryRule } from "./cake-design.types";
import { detachSymmetry } from "../geometry/symmetry-engine";

export type CakeDesignCommand =
  | { type: "ADD_ITEM"; item: DesignItem }
  | { type: "REMOVE_ITEM"; itemId: string }
  | { type: "UPDATE_ITEM"; itemId: string; patch: Partial<DesignItem> }
  | { type: "DUPLICATE_ITEM"; item: DesignItem }
  | { type: "ADD_SYMMETRY_RULE"; rule: SymmetryRule }
  | { type: "REMOVE_SYMMETRY_RULE"; ruleId: string }
  | { type: "DETACH_SYMMETRY"; ruleId: string }
  | { type: "CHANGE_CAKE"; patch: Partial<CakeConfig> }
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
    case "REMOVE_SYMMETRY_RULE":
      return { ...design, symmetryRules: design.symmetryRules.filter((rule) => rule.id !== command.ruleId) };
    case "DETACH_SYMMETRY":
      return detachSymmetry(design, command.ruleId);
    case "CHANGE_CAKE":
      return { ...design, cake: { ...design.cake, ...command.patch } };
    case "REPLACE_DESIGN":
      return structuredClone(command.design);
  }
}
