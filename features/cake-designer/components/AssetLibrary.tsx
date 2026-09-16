"use client";

import { MagnifyingGlass, Plus, TextT, UploadSimple } from "@phosphor-icons/react";
import { useMemo, useRef, useState } from "react";
import { BUILTIN_ASSETS } from "../assets/asset-library";
import { sanitizeSvg } from "../assets/svg-sanitizer";
import { BENTO_PRESETS } from "../presets/bento-presets";
import { useCakeDesignerStore } from "../store/cake-designer.store";
import styles from "./designer.module.css";

const CATEGORIES = ["Tất cả", "Kem", "Trái cây", "Lá & hoa", "Trang trí", "Bề mặt"];

export function AssetLibrary() {
  const [mode, setMode] = useState<"templates" | "decorations">("templates");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Tất cả");
  const uploadRef = useRef<HTMLInputElement>(null);
  const addAsset = useCakeDesignerStore((state) => state.addAsset);
  const addUploadedAsset = useCakeDesignerStore((state) => state.addUploadedAsset);
  const setStatus = useCakeDesignerStore((state) => state.setStatus);
  const addText = useCakeDesignerStore((state) => state.addText);
  const loadBentoPreset = useCakeDesignerStore((state) => state.loadBentoPreset);
  const currentPresetId = useCakeDesignerStore((state) => state.history.present.presetId);
  const items = useMemo(() => BUILTIN_ASSETS.filter((asset) =>
    (category === "Tất cả" || asset.category === category)
    && asset.name.toLocaleLowerCase("vi").includes(query.toLocaleLowerCase("vi"))), [category, query]);

  return <aside className={styles.assetPanel} aria-label="Thư viện thiết kế">
    <div className={styles.panelHeading}>
      <div><span>Thư viện</span><h2>{mode === "templates" ? "Mẫu bento" : "Chi tiết trang trí"}</h2></div>
      <button type="button" className={styles.iconButton} onClick={addText} aria-label="Thêm chữ"><TextT size={19} weight="bold" /></button>
    </div>
    <div className={styles.libraryModes}>
      <button type="button" data-active={mode === "templates"} onClick={() => setMode("templates")}>Mẫu bánh</button>
      <button type="button" data-active={mode === "decorations"} onClick={() => setMode("decorations")}>Trang trí</button>
    </div>

    {mode === "templates" ? <>
      <p className={styles.templateIntro}>Chọn một khung đẹp sẵn, rồi đổi lời chúc và màu theo ý bạn.</p>
      <div className={styles.templateGrid}>
        {BENTO_PRESETS.map((preset) => <button key={preset.id} type="button" data-active={currentPresetId === preset.id} className={styles.templateCard} onClick={() => loadBentoPreset(preset.id)}>
          <span className={styles.templateCake} style={{ background: preset.palette.top, borderColor: preset.palette.body }} data-motif={preset.motif}><i style={{ color: preset.palette.primaryDecoration }}>♥</i><b style={{ color: preset.palette.text }}>happy day</b></span>
          <strong>{preset.name}</strong><small>{preset.caption}</small>
        </button>)}
      </div>
      <button type="button" className={styles.advancedStart} onClick={() => setMode("decorations")}>Tự thêm chi tiết</button>
    </> : <>
      <label className={styles.searchField}><MagnifyingGlass size={17} /><span className={styles.srOnly}>Tìm chi tiết</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm kem, dâu, lá, nơ..." /></label>
      <div className={styles.categoryTabs} aria-label="Danh mục chi tiết">{CATEGORIES.map((name) => <button key={name} type="button" data-active={category === name} onClick={() => setCategory(name)}>{name}</button>)}</div>
      <div className={styles.assetGrid}>{items.map((asset) => <button key={asset.id} type="button" className={styles.assetCard} onClick={() => addAsset(asset.id)} aria-label={asset.name}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset.sourceUrl} alt="" /><span>{asset.name}</span><span className={styles.assetAdd}><Plus size={14} weight="bold" /></span>
      </button>)}</div>
      {items.length === 0 && <p className={styles.emptyState}>Không tìm thấy chi tiết phù hợp.</p>}
      <input ref={uploadRef} className={styles.srOnly} type="file" accept="image/svg+xml,image/png,image/webp,.svg,.png,.webp" onChange={async (event) => {
        const file = event.target.files?.[0]; if (!file) return;
        try {
          const extension = file.name.split(".").pop()?.toLowerCase();
          if (extension !== "svg" && extension !== "png" && extension !== "webp") throw new Error("Chỉ hỗ trợ SVG, PNG hoặc WebP.");
          const source = extension === "svg" ? sanitizeSvg(await file.text()) : await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error("Không thể đọc tệp ảnh.")); reader.readAsDataURL(file); });
          addUploadedAsset(file.name, source, extension); setStatus("Đã thêm ảnh vào thiết kế.");
        } catch (error) { setStatus(error instanceof Error ? error.message : "Không thể thêm ảnh."); } finally { event.target.value = ""; }
      }} />
      <button type="button" className={styles.uploadAction} onClick={() => uploadRef.current?.click()}><UploadSimple size={18} /> Tải SVG, PNG, WebP</button>
      <button type="button" className={styles.textAction} onClick={addText}><TextT size={19} weight="bold" /><span><strong>Thêm lời chúc</strong><small>Mặc định là chữ viết bằng kem một màu</small></span></button>
    </>}
  </aside>;
}
