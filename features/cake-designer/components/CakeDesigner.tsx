"use client";

import {
  ArrowClockwise,
  ArrowCounterClockwise,
  DownloadSimple,
  FloppyDisk,
  FolderOpen,
  House,
  SlidersHorizontal,
  UploadSimple,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { deserializeDesign, loadDesignLocal, saveDesignLocal, serializeDesign } from "../persistence/design-serializer";
import {
  selectCanRedo,
  selectCanUndo,
  selectDesign,
  useCakeDesignerStore,
} from "../store/cake-designer.store";
import { AssetLibrary } from "./AssetLibrary";
import { CakeCanvas } from "./CakeCanvas";
import { CakeViewSwitcher } from "./CakeViewSwitcher";
import { PropertiesPanel } from "./PropertiesPanel";
import styles from "./designer.module.css";

export function CakeDesigner() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const design = useCakeDesignerStore(selectDesign);
  const undo = useCakeDesignerStore((state) => state.undo);
  const redo = useCakeDesignerStore((state) => state.redo);
  const canUndo = useCakeDesignerStore(selectCanUndo);
  const canRedo = useCakeDesignerStore(selectCanRedo);
  const replaceDesign = useCakeDesignerStore((state) => state.replaceDesign);
  const copy = useCakeDesignerStore((state) => state.copySelected);
  const paste = useCakeDesignerStore((state) => state.paste);
  const duplicate = useCakeDesignerStore((state) => state.duplicateSelected);
  const remove = useCakeDesignerStore((state) => state.removeSelected);
  const selectItem = useCakeDesignerStore((state) => state.selectItem);
  const selectedItemId = useCakeDesignerStore((state) => state.selectedItemId);
  const setZoom = useCakeDesignerStore((state) => state.setZoom);
  const status = useCakeDesignerStore((state) => state.statusMessage);
  const setStatus = useCakeDesignerStore((state) => state.setStatus);
  const setPropertiesOpen = useCakeDesignerStore((state) => state.setPropertiesOpen);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select")) return;
      const command = event.ctrlKey || event.metaKey;
      if (command && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      } else if (command && event.key.toLowerCase() === "y") {
        event.preventDefault(); redo();
      } else if (command && event.key.toLowerCase() === "c") {
        event.preventDefault(); copy();
      } else if (command && event.key.toLowerCase() === "v") {
        event.preventDefault(); paste();
      } else if (command && event.key.toLowerCase() === "d") {
        event.preventDefault(); duplicate();
      } else if ((event.key === "Delete" || event.key === "Backspace") && selectedItemId) {
        event.preventDefault(); remove();
      } else if (event.key === "Escape") selectItem(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [copy, duplicate, paste, redo, remove, selectItem, selectedItemId, undo]);

  useEffect(() => {
    if (!status) return;
    const timeout = window.setTimeout(() => setStatus(null), 2400);
    return () => window.clearTimeout(timeout);
  }, [setStatus, status]);

  const saveLocal = () => {
    saveDesignLocal(design);
    setStatus("Đã lưu bản nháp trên thiết bị.");
  };
  const loadLocal = () => {
    try {
      replaceDesign(loadDesignLocal());
      setStatus("Đã mở bản nháp gần nhất.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Không thể mở bản nháp.");
    }
  };
  const exportJson = () => {
    const blob = new Blob([serializeDesign(design)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "layerz-cake-design.json";
    link.click();
    URL.revokeObjectURL(url);
    setStatus("Đã xuất tệp thiết kế JSON.");
  };

  return (
    <main className={styles.designerShell}>
      <header className={styles.topbar}>
        <div className={styles.brandArea}>
          <Link href="/" className={styles.homeButton} aria-label="Về trang chủ"><House size={19} weight="fill" /></Link>
          <div><strong>LayerZ Cake Studio</strong><span>Thiết kế 5 góc nhìn</span></div>
        </div>
        <div className={styles.historyActions}>
          <button type="button" onClick={undo} disabled={!canUndo} aria-label="Hoàn tác"><ArrowCounterClockwise size={19} /></button>
          <button type="button" onClick={redo} disabled={!canRedo} aria-label="Làm lại"><ArrowClockwise size={19} /></button>
          <button type="button" onClick={() => setZoom(1)} className={styles.resetView}>Vừa khung</button>
        </div>
        <div className={styles.fileActions}>
          <button type="button" onClick={loadLocal}><FolderOpen size={18} /><span>Mở nháp</span></button>
          <button type="button" onClick={saveLocal}><FloppyDisk size={18} /><span>Lưu nháp</span></button>
          <button type="button" onClick={exportJson} className={styles.primaryAction} aria-label="Xuất JSON"><DownloadSimple size={18} /><span>Xuất JSON</span></button>
          <button type="button" className={styles.mobilePropertiesButton} onClick={() => setPropertiesOpen(true)} aria-label="Mở thuộc tính"><SlidersHorizontal size={19} /></button>
        </div>
      </header>

      <input ref={fileInputRef} className={styles.srOnly} type="file" accept="application/json,.json" onChange={async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        try {
          replaceDesign(deserializeDesign(await file.text()));
          setStatus("Đã nhập thiết kế từ JSON.");
        } catch (error) {
          setStatus(error instanceof Error ? error.message : "Tệp thiết kế không hợp lệ.");
        } finally {
          event.target.value = "";
        }
      }} />

      <div className={styles.importStrip}>
        <span>Thiết kế được lưu bằng dữ liệu bề mặt, không phụ thuộc canvas.</span>
        <button type="button" onClick={() => fileInputRef.current?.click()}><UploadSimple size={16} /> Nhập JSON</button>
      </div>

      <div className={styles.workspace}>
        <AssetLibrary />
        <section className={styles.canvasColumn} aria-label="Không gian thiết kế">
          <CakeCanvas />
          <CakeViewSwitcher />
        </section>
        <PropertiesPanel />
      </div>

      {status && <div className={styles.toast} role="status">{status}</div>}
    </main>
  );
}
