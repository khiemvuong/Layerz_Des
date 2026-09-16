import type { CakeDesign } from "../domain/cake-design.types";

export interface DesignHistory {
  past: CakeDesign[];
  present: CakeDesign;
  future: CakeDesign[];
}

export function createHistory(design: CakeDesign): DesignHistory {
  return { past: [], present: structuredClone(design), future: [] };
}

export function commitHistory(history: DesignHistory, next: CakeDesign): DesignHistory {
  return {
    past: [...history.past.slice(-49), structuredClone(history.present)],
    present: structuredClone(next),
    future: [],
  };
}

export function undoHistory(history: DesignHistory): DesignHistory {
  const previous = history.past.at(-1);
  if (!previous) return history;
  return {
    past: history.past.slice(0, -1),
    present: structuredClone(previous),
    future: [structuredClone(history.present), ...history.future],
  };
}

export function redoHistory(history: DesignHistory): DesignHistory {
  const next = history.future[0];
  if (!next) return history;
  return {
    past: [...history.past, structuredClone(history.present)],
    present: structuredClone(next),
    future: history.future.slice(1),
  };
}
