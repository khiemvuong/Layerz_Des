"use client";

import { ArrowDown, ArrowUp, Copy, FlipHorizontal, FlipVertical, Trash, X } from "@phosphor-icons/react";
import { getAsset } from "../assets/asset-library";
import { getDesignTiers, type DesignItem, type TextTreatment } from "../domain/cake-design.types";
import { BENTO_PRESETS } from "../presets/bento-presets";
import { selectSelectedItem, updateSelectedColors, useCakeDesignerStore } from "../store/cake-designer.store";
import styles from "./designer.module.css";

const SWATCHES = ["#fffaf0", "#5f7358", "#9b5361", "#b93a49", "#d37a83", "#6f9473", "#765b50", "#3f5160"];
const TEXT_TREATMENTS: Array<{ id: TextTreatment; label: string; note: string }> = [
  { id: "piped-cream", label: "Viết kem", note: "Một màu, nét tròn nổi nhẹ" },
  { id: "fondant-plaque", label: "Miếng fondant", note: "Chữ nằm trên miếng trang trí" },
  { id: "standing-topper", label: "Topper cắm", note: "Bảng chữ dựng đứng" },
];

export function PropertiesPanel() {
  const item = useCakeDesignerStore(selectSelectedItem);
  const design = useCakeDesignerStore((state) => state.history.present);
  const activeTierId = useCakeDesignerStore((state) => state.activeTierId);
  const setActiveTier = useCakeDesignerStore((state) => state.setActiveTier);
  const setTierCount = useCakeDesignerStore((state) => state.setTierCount);
  const updateActiveTier = useCakeDesignerStore((state) => state.updateActiveTier);
  const applyPalette = useCakeDesignerStore((state) => state.applyPalette);
  const open = useCakeDesignerStore((state) => state.propertiesOpen);
  const setOpen = useCakeDesignerStore((state) => state.setPropertiesOpen);
  const updateItem = useCakeDesignerStore((state) => state.updateItem);
  const duplicate = useCakeDesignerStore((state) => state.duplicateSelected);
  const remove = useCakeDesignerStore((state) => state.removeSelected);
  const moveLayer = useCakeDesignerStore((state) => state.moveLayer);
  const addSymmetry = useCakeDesignerStore((state) => state.addSymmetry);
  const updateSymmetryRule = useCakeDesignerStore((state) => state.updateSymmetryRule);
  const detach = useCakeDesignerStore((state) => state.detachSelectedSymmetry);
  const tiers = getDesignTiers(design);
  const activeTier = tiers.find((tier) => tier.id === activeTierId) ?? tiers[0];
  const activeRule = item ? design.symmetryRules.find((rule) => rule.sourceItemId === item.id) : undefined;
  const asset = item?.type === "asset" ? getAsset(item.assetId) : undefined;

  const updateTransform = (patch: Partial<DesignItem["transform"]>) => {
    if (item) updateItem(item.id, { transform: { ...item.transform, ...patch } } as Partial<DesignItem>);
  };
  const setItemColor = (color: string) => {
    if (!item) return;
    if (item.type === "asset") {
      const part = getAsset(item.assetId)?.recolorableParts[0];
      if (part) updateSelectedColors({ ...item.colors, [part]: color });
    } else updateItem(item.id, { color } as Partial<DesignItem>);
  };

  return (
    <aside className={`${styles.propertiesPanel} ${open ? styles.propertiesOpen : ""}`} aria-label="Thuộc tính thiết kế">
      <div className={styles.panelHeading}>
        <div><span>Điều chỉnh</span><h2>{item ? asset?.name ?? (item.type === "text" ? "Lời chúc" : "Chi tiết") : activeTier.name}</h2></div>
        <button type="button" className={`${styles.iconButton} ${styles.mobileClose}`} onClick={() => setOpen(false)} aria-label="Đóng thuộc tính"><X size={18} /></button>
      </div>

      {!item ? <div className={styles.cakeSettings}>
        <div className={styles.presetSummary}><span>Mẫu đang mở</span><strong>{design.name ?? "Thiết kế tùy chỉnh"}</strong><p>Chọn tầng để chỉnh kích thước và màu riêng.</p></div>
        <section className={styles.propertySection}>
          <h3>Số tầng</h3>
          <div className={styles.threeColumnActions}>{([1, 2, 3] as const).map((count) => <button key={count} type="button" data-active={tiers.length === count} onClick={() => setTierCount(count)}>{count} tầng</button>)}</div>
          <div className={styles.tierTabs}>{tiers.map((tier) => <button key={tier.id} type="button" data-active={tier.id === activeTier.id} onClick={() => setActiveTier(tier.id)}>{tier.name}</button>)}</div>
        </section>
        <section className={styles.propertySection}>
          <h3>Bảng màu</h3>
          <div className={styles.paletteGrid}>{BENTO_PRESETS.map((preset) => <button key={preset.id} type="button" onClick={() => applyPalette(preset.palette)} aria-label={`Dùng bảng màu ${preset.name}`}><i style={{ background: preset.palette.top }} /><i style={{ background: preset.palette.primaryDecoration }} /><i style={{ background: preset.palette.text }} /></button>)}</div>
        </section>
        <section className={styles.propertySection}>
          <h3>Kiểu dáng tầng này</h3>
          <div className={styles.twoColumnActions}>
            <button type="button" data-active={activeTier.shape === "round"} onClick={() => updateActiveTier({ shape: "round" })}>Bánh tròn</button>
            <button type="button" data-active={activeTier.shape === "rectangle"} onClick={() => updateActiveTier({ shape: "rectangle" })}>Chữ nhật</button>
          </div>
          <div className={styles.dimensionGrid}>
            <label><span>Rộng (cm)</span><input type="number" min="8" max="60" value={activeTier.dimensions.widthCm} onChange={(event) => { const widthCm = Math.max(8, Number(event.target.value) || 8); updateActiveTier({ dimensions: { ...activeTier.dimensions, widthCm, radiusCm: widthCm / 2 } }); }} /></label>
            <label><span>Cao (cm)</span><input type="number" min="4" max="30" step=".5" value={activeTier.dimensions.heightCm} onChange={(event) => updateActiveTier({ dimensions: { ...activeTier.dimensions, heightCm: Math.max(4, Number(event.target.value) || 4) } })} /></label>
          </div>
        </section>
      </div> : <div className={styles.propertiesContent}>
        {item.type === "text" && <>
          <label className={styles.fieldBlock}><span>Nội dung</span><textarea rows={3} maxLength={80} value={item.text} onChange={(event) => updateItem(item.id, { text: event.target.value } as Partial<DesignItem>)} /><small>{item.text.length > 32 ? "Lời chúc dài: nên xuống dòng để thợ bánh dễ viết." : "Hỗ trợ đầy đủ tiếng Việt có dấu."}</small></label>
          <section className={styles.propertySection}><h3>Kiểu làm chữ thật</h3><div className={styles.textTreatmentGrid}>{TEXT_TREATMENTS.map((treatment) => <button key={treatment.id} type="button" data-active={(item.treatment ?? "piped-cream") === treatment.id} onClick={() => updateItem(item.id, { treatment: treatment.id, strokeWidth: treatment.id === "piped-cream" ? 0 : item.strokeWidth } as Partial<DesignItem>)}><strong>{treatment.label}</strong><span>{treatment.note}</span></button>)}</div></section>
          <section className={styles.propertySection}><h3>Độ dày nét kem</h3><div className={styles.threeColumnActions}>{(["thin", "medium", "thick"] as const).map((weight) => <button key={weight} type="button" data-active={(item.lineThickness ?? "medium") === weight} onClick={() => updateItem(item.id, { lineThickness: weight } as Partial<DesignItem>)}>{weight === "thin" ? "Mảnh" : weight === "medium" ? "Vừa" : "Dày"}</button>)}</div></section>
        </>}
        <section className={styles.propertySection}><h3>Màu sắc</h3><div className={styles.swatches}>{SWATCHES.map((color) => <button key={color} type="button" style={{ background: color }} onClick={() => setItemColor(color)} aria-label={`Chọn màu ${color}`} />)}<label className={styles.colorPicker}><input type="color" onChange={(event) => setItemColor(event.target.value)} />+</label></div></section>
        <section className={styles.propertySection}>
          <div className={styles.rangeHeader}><h3>Kích thước</h3><output>{Math.round(item.transform.scaleX * 100)}%</output></div>
          <input className={styles.range} type="range" min="30" max="250" value={Math.round(item.transform.scaleX * 100)} onChange={(event) => { const scale = Number(event.target.value) / 100; updateTransform({ scaleX: scale, scaleY: scale }); }} />
          <div className={styles.rangeHeader}><h3>Góc xoay</h3><output>{Math.round(item.transform.rotation)}°</output></div>
          <input className={styles.range} type="range" min="-180" max="180" value={item.transform.rotation} onChange={(event) => updateTransform({ rotation: Number(event.target.value) })} />
        </section>
        <details className={styles.advancedPanel}><summary>Nâng cao: lặp và sắp xếp</summary>
          {activeRule ? <section className={styles.propertySection}><label className={styles.fieldBlock}><span>Số lượng</span><input type="number" min="2" max="40" value={activeRule.count ?? 4} onChange={(event) => updateSymmetryRule(activeRule.id, { count: Math.max(2, Number(event.target.value) || 2) })} /></label><button type="button" className={styles.detachButton} onClick={detach}>Tách để chỉnh riêng</button></section> : <section className={styles.propertySection}><div className={styles.symmetryGrid}>{item.surfacePosition.surface === "top" ? [4, 8, 12, 16].map((count) => <button key={count} type="button" onClick={() => addSymmetry("radial-top", count)}>Viền {count}</button>) : [2, 4, 6, 8].map((count) => <button key={count} type="button" onClick={() => addSymmetry("repeat-around-side", count)}>Lặp {count}</button>)}</div></section>}
          <section className={styles.propertySection}><div className={styles.twoColumnActions}><button type="button" onClick={() => updateTransform({ flipX: !item.transform.flipX })} data-active={item.transform.flipX}><FlipHorizontal size={18} /> Lật ngang</button><button type="button" onClick={() => updateTransform({ flipY: !item.transform.flipY })} data-active={item.transform.flipY}><FlipVertical size={18} /> Lật dọc</button><button type="button" onClick={() => moveLayer(1)}><ArrowUp size={18} /> Đưa lên</button><button type="button" onClick={() => moveLayer(-1)}><ArrowDown size={18} /> Đưa xuống</button></div></section>
        </details>
        <div className={styles.destructiveActions}><button type="button" onClick={duplicate}><Copy size={18} /> Nhân bản</button><button type="button" onClick={remove}><Trash size={18} /> Xóa</button></div>
      </div>}
    </aside>
  );
}
