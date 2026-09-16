"use client";

import type { CakeView } from "../domain/cake-design.types";
import { useCakeDesignerStore } from "../store/cake-designer.store";
import styles from "./designer.module.css";

const VIEWS: Array<{ id: CakeView; label: string; short: string }> = [
  { id: "front", label: "Mặt trước", short: "Trước" },
  { id: "right", label: "Bên phải", short: "Phải" },
  { id: "back", label: "Mặt sau", short: "Sau" },
  { id: "left", label: "Bên trái", short: "Trái" },
  { id: "top", label: "Từ trên", short: "Trên" },
];

export function CakeViewSwitcher() {
  const view = useCakeDesignerStore((state) => state.view);
  const setView = useCakeDesignerStore((state) => state.setView);
  return (
    <nav className={styles.viewSwitcher} aria-label="Góc nhìn bánh">
      {VIEWS.map((item) => (
        <button key={item.id} type="button" data-active={view === item.id} onClick={() => setView(item.id)} aria-label={item.label}>
          <span className={styles.viewThumb} data-view={item.id}><i /></span>
          <span className={styles.viewFullLabel}>{item.label}</span>
          <span className={styles.viewShortLabel}>{item.short}</span>
        </button>
      ))}
    </nav>
  );
}
