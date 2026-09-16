"use client";

import {
  ArrowDown,
  ArrowUp,
  Copy,
  FlipHorizontal,
  FlipVertical,
  Trash,
  X,
} from "@phosphor-icons/react";
import { getAsset } from "../assets/asset-library";
import type { DesignItem } from "../domain/cake-design.types";
import {
  selectSelectedItem,
  updateSelectedColors,
  useCakeDesignerStore,
} from "../store/cake-designer.store";
import styles from "./designer.module.css";

const SWATCHES = ["#e85d78", "#f4a7b9", "#f1ba4d", "#4f8a67", "#7b6ec8", "#61a8c7", "#fff7e5", "#593947"];

export function PropertiesPanel() {
  const item = useCakeDesignerStore(selectSelectedItem);
  const design = useCakeDesignerStore((state) => state.history.present);
  const dispatch = useCakeDesignerStore((state) => state.dispatch);
  const open = useCakeDesignerStore((state) => state.propertiesOpen);
  const setOpen = useCakeDesignerStore((state) => state.setPropertiesOpen);
  const updateItem = useCakeDesignerStore((state) => state.updateItem);
  const duplicate = useCakeDesignerStore((state) => state.duplicateSelected);
  const remove = useCakeDesignerStore((state) => state.removeSelected);
  const moveLayer = useCakeDesignerStore((state) => state.moveLayer);
  const addSymmetry = useCakeDesignerStore((state) => state.addSymmetry);
  const detach = useCakeDesignerStore((state) => state.detachSelectedSymmetry);
  const activeRule = item ? design.symmetryRules.find((rule) => rule.sourceItemId === item.id) : undefined;

  const updateTransform = (patch: Partial<DesignItem["transform"]>) => {
    if (item) updateItem(item.id, { transform: { ...item.transform, ...patch } } as Partial<DesignItem>);
  };

  return (
    <aside className={`${styles.propertiesPanel} ${open ? styles.propertiesOpen : ""}`} aria-label="Thuộc tính chi tiết">
      <div className={styles.panelHeading}>
        <div><span>Điều chỉnh</span><h2>{item ? "Chi tiết đang chọn" : "Thuộc tính"}</h2></div>
        <button type="button" className={`${styles.iconButton} ${styles.mobileClose}`} onClick={() => setOpen(false)} aria-label="Đóng thuộc tính"><X size={18} /></button>
      </div>

      {!item ? (
        <div className={styles.cakeSettings}>
          <div className={styles.noSelection}>
            <div className={styles.noSelectionIcon}><FlipHorizontal size={25} /></div>
            <strong>Cấu hình bánh</strong>
            <p>Chọn một chi tiết trên bánh để mở các điều khiển riêng.</p>
          </div>
          <section className={styles.propertySection}>
            <h3>Kiểu dáng</h3>
            <div className={styles.twoColumnActions}>
              <button type="button" data-active={design.cake.shape === "round"} onClick={() => dispatch({ type: "CHANGE_CAKE", patch: { shape: "round" } })}>Bánh tròn</button>
              <button type="button" data-active={design.cake.shape === "rectangle"} onClick={() => dispatch({ type: "CHANGE_CAKE", patch: { shape: "rectangle" } })}>Chữ nhật</button>
            </div>
          </section>
          <section className={styles.propertySection}>
            <h3>Màu phủ bánh</h3>
            <div className={styles.swatches}>
              {["#f4a7b9", "#f3d8c7", "#fff2d9", "#c8dfc4", "#bed7e6", "#d4c6e8"].map((color) => (
                <button key={color} type="button" style={{ background: color }} onClick={() => dispatch({ type: "CHANGE_CAKE", patch: { baseColor: color } })} aria-label={`Màu bánh ${color}`} />
              ))}
            </div>
          </section>
          <section className={styles.propertySection}>
            <h3>Kích thước thật</h3>
            <div className={styles.dimensionGrid}>
              <label><span>Rộng (cm)</span><input type="number" min="10" max="60" value={design.cake.dimensions.widthCm} onChange={(event) => dispatch({ type: "CHANGE_CAKE", patch: { dimensions: { ...design.cake.dimensions, widthCm: Math.max(10, Number(event.target.value) || 10), radiusCm: Math.max(5, (Number(event.target.value) || 10) / 2) } } })} /></label>
              <label><span>Cao (cm)</span><input type="number" min="5" max="40" value={design.cake.dimensions.heightCm} onChange={(event) => dispatch({ type: "CHANGE_CAKE", patch: { dimensions: { ...design.cake.dimensions, heightCm: Math.max(5, Number(event.target.value) || 5) } } })} /></label>
            </div>
          </section>
        </div>
      ) : (
        <div className={styles.propertiesContent}>
          {item.type === "text" && (
            <label className={styles.fieldBlock}>
              <span>Nội dung</span>
              <input value={item.text} onChange={(event) => updateItem(item.id, { text: event.target.value } as Partial<DesignItem>)} />
            </label>
          )}

          <section className={styles.propertySection}>
            <h3>Màu sắc</h3>
            <div className={styles.swatches}>
              {SWATCHES.map((color) => (
                <button
                  key={color}
                  type="button"
                  style={{ background: color }}
                  onClick={() => {
                    if (item.type === "asset") {
                      const asset = getAsset(item.assetId);
                      const part = asset?.recolorableParts[0];
                      if (part) updateSelectedColors({ ...item.colors, [part]: color });
                    } else if (item.type === "text" || item.type === "stroke") {
                      updateItem(item.id, { color } as Partial<DesignItem>);
                    }
                  }}
                  aria-label={`Chọn màu ${color}`}
                />
              ))}
              <label className={styles.colorPicker} title="Chọn màu tùy chỉnh">
                <input type="color" onChange={(event) => {
                  if (item.type === "asset") {
                    const part = getAsset(item.assetId)?.recolorableParts[0];
                    if (part) updateSelectedColors({ ...item.colors, [part]: event.target.value });
                  } else updateItem(item.id, { color: event.target.value } as Partial<DesignItem>);
                }} />
                +
              </label>
            </div>
          </section>

          <section className={styles.propertySection}>
            <div className={styles.rangeHeader}><h3>Kích thước</h3><output>{Math.round(item.transform.scaleX * 100)}%</output></div>
            <input className={styles.range} type="range" min="35" max="250" value={Math.round(item.transform.scaleX * 100)} onChange={(event) => {
              const scale = Number(event.target.value) / 100;
              updateTransform({ scaleX: scale, scaleY: scale });
            }} />
            <div className={styles.rangeHeader}><h3>Góc xoay</h3><output>{Math.round(item.transform.rotation)}°</output></div>
            <input className={styles.range} type="range" min="-180" max="180" value={item.transform.rotation} onChange={(event) => updateTransform({ rotation: Number(event.target.value) })} />
          </section>

          <section className={styles.propertySection}>
            <h3>Lật và lớp</h3>
            <div className={styles.twoColumnActions}>
              <button type="button" onClick={() => updateTransform({ flipX: !item.transform.flipX })} data-active={item.transform.flipX}><FlipHorizontal size={18} /> Lật ngang</button>
              <button type="button" onClick={() => updateTransform({ flipY: !item.transform.flipY })} data-active={item.transform.flipY}><FlipVertical size={18} /> Lật dọc</button>
              <button type="button" onClick={() => moveLayer(1)}><ArrowUp size={18} /> Đưa lên</button>
              <button type="button" onClick={() => moveLayer(-1)}><ArrowDown size={18} /> Đưa xuống</button>
            </div>
          </section>

          <section className={styles.propertySection}>
            <h3>Đối xứng</h3>
            {item.surfacePosition.surface === "top" ? (
              <div className={styles.symmetryGrid}>
                {[2, 4, 6, 8].map((count) => <button key={count} type="button" onClick={() => addSymmetry("radial-top", count)}>Xoay {count}</button>)}
                <button type="button" onClick={() => addSymmetry("mirror-horizontal")}>Gương ngang</button>
                <button type="button" onClick={() => addSymmetry("mirror-vertical")}>Gương dọc</button>
              </div>
            ) : (
              <div className={styles.symmetryGrid}>
                {[2, 4, 6, 8].map((count) => <button key={count} type="button" onClick={() => addSymmetry("repeat-around-side", count)}>Lặp {count}</button>)}
              </div>
            )}
            {activeRule && <button type="button" className={styles.detachButton} onClick={detach}>Tách các bản sao</button>}
          </section>

          <div className={styles.destructiveActions}>
            <button type="button" onClick={duplicate}><Copy size={18} /> Nhân bản</button>
            <button type="button" onClick={remove}><Trash size={18} /> Xóa</button>
          </div>
        </div>
      )}
    </aside>
  );
}
