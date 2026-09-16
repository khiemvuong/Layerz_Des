"use client";

import { CubeFocus } from "@phosphor-icons/react";
import { getDesignTiers, type CakeView } from "../domain/cake-design.types";
import { useCakeDesignerStore } from "../store/cake-designer.store";
import styles from "./designer.module.css";

const VIEWS: Array<{ id: CakeView; label: string; short: string }> = [
  { id: "front", label: "Mặt trước", short: "Trước" }, { id: "right", label: "Bên phải", short: "Phải" },
  { id: "back", label: "Mặt sau", short: "Sau" }, { id: "left", label: "Bên trái", short: "Trái" }, { id: "top", label: "Từ trên", short: "Trên" },
];

export function CakeViewSwitcher() {
  const view = useCakeDesignerStore((state) => state.view);
  const previewOpen = useCakeDesignerStore((state) => state.previewOpen);
  const setView = useCakeDesignerStore((state) => state.setView);
  const setPreviewOpen = useCakeDesignerStore((state) => state.setPreviewOpen);
  const design = useCakeDesignerStore((state) => state.history.present);
  const activeTierId = useCakeDesignerStore((state) => state.activeTierId);
  const setActiveTier = useCakeDesignerStore((state) => state.setActiveTier);
  const tiers = getDesignTiers(design);
  return <div className={styles.viewDock}>
    {tiers.length > 1 && <div className={styles.bottomTierSelector} aria-label="Chọn tầng bánh"><span>Đang sửa</span>{tiers.map((tier) => <button key={tier.id} type="button" data-active={tier.id === activeTierId} onClick={() => setActiveTier(tier.id)}>{tier.name}</button>)}</div>}
    <nav className={styles.viewSwitcher} aria-label="Góc nhìn bánh">
      {VIEWS.map((item) => <button key={item.id} type="button" data-active={!previewOpen && view === item.id} onClick={() => setView(item.id)} aria-label={item.label}><span className={styles.viewThumb} data-view={item.id}><i /></span><span className={styles.viewFullLabel}>{item.label}</span><span className={styles.viewShortLabel}>{item.short}</span></button>)}
      <button type="button" className={styles.beautyViewButton} data-active={previewOpen} onClick={() => setPreviewOpen(true)} aria-label="Xem bánh hoàn thiện"><span className={styles.viewThumb}><CubeFocus size={25} weight="duotone" /></span><span className={styles.viewFullLabel}>Xem bánh</span><span className={styles.viewShortLabel}>3D</span></button>
    </nav>
  </div>;
}
