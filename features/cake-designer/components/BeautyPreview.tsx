"use client";

import { Sparkle, X } from "@phosphor-icons/react";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { getAsset } from "../assets/asset-library";
import { getDesignTiers, type AssetDesignItem, type TextDesignItem } from "../domain/cake-design.types";
import { getRenderableItems } from "../geometry/symmetry-engine";
import { selectDesign, useCakeDesignerStore } from "../store/cake-designer.store";
import { disposePreviewResources, PreviewResourceCache } from "./preview-resource-cache";
import styles from "./designer.module.css";

function textTexture(item: TextDesignItem): THREE.CanvasTexture {
  const canvas = document.createElement("canvas"); canvas.width = 1024; canvas.height = 512;
  const context = canvas.getContext("2d")!;
  const treatment = item.treatment ?? "piped-cream";
  const lines = item.text.split("\n").slice(0, 3);
  const size = Math.max(68, Math.min(132, 720 / Math.max(5, ...lines.map((line) => line.length)) * 2.15));
  context.textAlign = "center"; context.textBaseline = "middle"; context.lineJoin = "round";
  context.font = `${item.fontWeight ?? 700} ${size}px "Arial Rounded MT Bold", Arial, sans-serif`;
  if (treatment === "fondant-plaque") {
    context.fillStyle = "rgba(255,247,231,.98)";
    context.beginPath(); context.roundRect(85, 72, 854, 368, 70); context.fill();
    context.strokeStyle = "rgba(117,84,67,.16)"; context.lineWidth = 10; context.stroke();
  }
  context.shadowColor = "rgba(69,43,34,.18)"; context.shadowBlur = treatment === "piped-cream" ? 5 : 2; context.shadowOffsetY = treatment === "piped-cream" ? 5 : 2;
  const step = size * 1.05; const startY = canvas.height / 2 - (lines.length - 1) * step / 2;
  lines.forEach((line, index) => {
    const y = startY + index * step;
    if (treatment !== "piped-cream" && item.strokeColor && (item.strokeWidth ?? 0) > 0) { context.strokeStyle = item.strokeColor; context.lineWidth = item.strokeWidth! * 4; context.strokeText(line, canvas.width / 2, y); }
    context.fillStyle = item.color; context.fillText(line, canvas.width / 2, y);
    if (treatment === "piped-cream") { context.globalAlpha = .18; context.fillStyle = "#ffffff"; context.fillText(line, canvas.width / 2 - 2, y - 3); context.globalAlpha = 1; }
  });
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture;
}

function assetTexture(item: AssetDesignItem): THREE.CanvasTexture {
  const canvas = document.createElement("canvas"); canvas.width = 384; canvas.height = 384;
  const c = canvas.getContext("2d")!; const id = item.assetId; const colors = item.colors ?? {};
  c.lineCap = "round"; c.lineJoin = "round";
  if (id === "birthday-text") {
    c.textAlign = "center"; c.textBaseline = "middle"; c.font = "800 72px Arial Rounded MT Bold, Arial"; c.fillStyle = "#fff4ee";
    c.fillText("HAPPY", 192, 155); c.fillText("BIRTHDAY", 192, 235);
  } else if (id.startsWith("leaf-sprig")) {
    c.strokeStyle = colors.stem ?? "#547954"; c.lineWidth = 12; c.beginPath(); c.moveTo(42, 304); c.quadraticCurveTo(184, 160, 342, 76); c.stroke(); c.fillStyle = colors.leaf ?? "#6d9169";
    for (let index = 0; index < 7; index += 1) { const x = 78 + index * 40; const y = 272 - index * 30; [-1, 1].forEach((side) => { c.save(); c.translate(x, y); c.rotate(-.6 + side * .72); c.beginPath(); c.ellipse(0, side * 18, 35, 14, 0, 0, Math.PI * 2); c.fill(); c.restore(); }); }
  } else if (id.startsWith("flower-petal")) {
    c.fillStyle = colors.petal ?? "#c46379"; [[126,210,-.5],[194,122,.15],[264,215,.55],[194,278,0]].forEach(([x,y,r]) => { c.save(); c.translate(x,y); c.rotate(r); c.beginPath(); c.ellipse(0,0,52,24,0,0,Math.PI*2); c.fill(); c.restore(); });
  } else if (id === "red-bow-front") {
    c.translate(192, 170); c.fillStyle = colors.ribbon ?? "#a72034"; c.beginPath(); c.ellipse(-88, 0, 82, 50, -.18, 0, Math.PI * 2); c.ellipse(88, 0, 82, 50, .18, 0, Math.PI * 2); c.fill(); c.beginPath(); c.moveTo(-22, 30); c.lineTo(-70, 150); c.lineTo(0, 114); c.lineTo(22, 30); c.fill(); c.beginPath(); c.moveTo(22,30); c.lineTo(70,150); c.lineTo(0,114); c.lineTo(-22,30); c.fill(); c.fillStyle = colors.center ?? "#7e1323"; c.beginPath(); c.arc(0,0,32,0,Math.PI*2); c.fill();
  } else {
    const color = Object.values(colors)[0] ?? getAsset(id)?.previewColors[0] ?? "#d98691";
    c.fillStyle = color; c.beginPath(); c.arc(192, 192, 112, 0, Math.PI * 2); c.fill();
  }
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture;
}

type Remember = { geometry: <T extends THREE.BufferGeometry>(value: T) => T; material: <T extends THREE.Material>(value: T) => T };

function addRaisedAsset(scene: THREE.Scene, item: AssetDesignItem, x: number, y: number, z: number, scale: number, remember: Remember): boolean {
  const id = item.assetId; const primary = Object.values(item.colors ?? {})[0] ?? getAsset(id)?.previewColors[0] ?? "#ffffff";
  const material = remember.material(new THREE.MeshStandardMaterial({ color: primary, roughness: .72, metalness: 0 }));
  const group = new THREE.Group(); group.position.set(x, y, z); group.rotation.y = -item.transform.rotation * Math.PI / 180;
  const addSphere = (px: number, py: number, pz: number, sx: number, sy = sx, sz = sx, mat = material) => { const mesh = new THREE.Mesh(remember.geometry(new THREE.SphereGeometry(1, 22, 14)), mat); mesh.position.set(px,py,pz); mesh.scale.set(sx,sy,sz); mesh.castShadow = true; group.add(mesh); };
  if (id === "cream-dot") addSphere(0, .08, 0, scale * .22, scale * .14, scale * .22);
  else if (id === "piped-heart") {
    addSphere(-scale*.13, .1, 0, scale*.2, scale*.2, scale*.13); addSphere(scale*.13, .1, 0, scale*.2, scale*.2, scale*.13);
    const cone = new THREE.Mesh(remember.geometry(new THREE.ConeGeometry(scale*.32, scale*.48, 28)), material); cone.rotation.z = Math.PI; cone.position.y = -.08; cone.castShadow = true; group.add(cone);
  } else if (id.startsWith("cream-swirl")) {
    [0,.13,.25].forEach((height,index) => addSphere(0, height*scale, 0, scale*(.34-index*.07), scale*.16, scale*(.34-index*.07)));
  } else if (id.startsWith("strawberry") || id === "cherry-pair") {
    const berryMat = material; const green = remember.material(new THREE.MeshStandardMaterial({ color: item.colors?.leaf ?? item.colors?.stem ?? "#47774b", roughness: .8 }));
    const count = id === "cherry-pair" ? 2 : 1;
    for (let index=0; index<count; index += 1) { const ox = (index-(count-1)/2)*scale*.38; addSphere(ox, .18*scale, 0, scale*.24, scale*.3, scale*.24, berryMat); addSphere(ox, .44*scale, 0, scale*.15, scale*.05, scale*.15, green); }
  } else if (id === "piped-bow") {
    addSphere(-scale*.22,.1,0,scale*.28,scale*.17,scale*.12); addSphere(scale*.22,.1,0,scale*.28,scale*.17,scale*.12); addSphere(0,.1,.02,scale*.13,scale*.13,scale*.13);
  } else if (id === "piped-bear") {
    addSphere(0,.12,0,scale*.35,scale*.3,scale*.14); addSphere(-scale*.25,.33,0,scale*.14); addSphere(scale*.25,.33,0,scale*.14);
  } else if (id === "bento-daisy") {
    for (let index=0; index<8; index += 1) { const a=index*Math.PI/4; addSphere(Math.cos(a)*scale*.2,.07,Math.sin(a)*scale*.2,scale*.18,scale*.07,scale*.1); }
    const centerMat = remember.material(new THREE.MeshStandardMaterial({ color: item.colors?.center ?? "#e8ad5b", roughness: .75 })); addSphere(0,.1,0,scale*.12,scale*.08,scale*.12,centerMat);
  } else return false;
  group.scale.set(item.transform.scaleX, item.transform.scaleY, item.transform.scaleX); scene.add(group); return true;
}

export function BeautyPreview() {
  const mountRef = useRef<HTMLDivElement>(null);
  const design = useCakeDesignerStore(selectDesign);
  const setPreviewOpen = useCakeDesignerStore((state) => state.setPreviewOpen);

  useEffect(() => {
    const mount = mountRef.current; if (!mount) return;
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0xf3f0ea);
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" }); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7)); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; mount.appendChild(renderer.domElement);
    const tiers = getDesignTiers(design); const maxWidth = Math.max(...tiers.map((tier) => tier.dimensions.widthCm)); const worldPerCm = 6.3 / maxWidth;
    const totalHeight = tiers.reduce((sum, tier) => sum + tier.dimensions.heightCm * worldPerCm, 0);
    const camera = new THREE.PerspectiveCamera(31, 1, .1, 100); camera.position.set(0, Math.max(7.6, totalHeight + 4.8), 14.2); camera.lookAt(0, totalHeight*.28, 0);
    const textures = new PreviewResourceCache<THREE.Texture>(); const geometries: THREE.BufferGeometry[] = []; const materials: THREE.Material[] = [];
    const remember: Remember = { geometry: <T extends THREE.BufferGeometry>(v:T) => (geometries.push(v),v), material: <T extends THREE.Material>(v:T) => (materials.push(v),v) };
    scene.add(new THREE.HemisphereLight(0xfffcf4, 0x7a716d, 2.2)); const key = new THREE.DirectionalLight(0xfff2de, 4.2); key.position.set(-5,10,7); key.castShadow=true; scene.add(key); const fill = new THREE.DirectionalLight(0xdfe9ff, .85); fill.position.set(5,5,-4); scene.add(fill);
    const floorMat = remember.material(new THREE.MeshStandardMaterial({ color: 0xeee9e1, roughness: 1 })); const floor = new THREE.Mesh(remember.geometry(new THREE.CircleGeometry(8.6, 96)), floorMat); floor.rotation.x=-Math.PI/2; floor.position.y=-.17; floor.receiveShadow=true; scene.add(floor);
    const boardRadius = maxWidth * worldPerCm * .61; const board = new THREE.Mesh(remember.geometry(new THREE.CylinderGeometry(boardRadius,boardRadius*1.01,.12,96)), remember.material(new THREE.MeshStandardMaterial({ color:0xfffdfa,roughness:.88 }))); board.position.y=-.08; board.receiveShadow=true; scene.add(board);

    const tierLayouts: Array<{ id:string; radius:number; baseY:number; topY:number; widthCm:number }> = [];
    let cursorY = 0;
    tiers.forEach((tier) => {
      const radius=tier.dimensions.widthCm*worldPerCm/2; const height=tier.dimensions.heightCm*worldPerCm; const baseY=cursorY; const topY=baseY+height;
      const body = new THREE.Mesh(remember.geometry(new THREE.CylinderGeometry(radius,radius,height,96,4)), remember.material(new THREE.MeshStandardMaterial({ color:tier.baseColor,roughness:.94,metalness:0 }))); body.position.y=baseY+height/2; body.castShadow=true; body.receiveShadow=true; scene.add(body);
      const top = new THREE.Mesh(remember.geometry(new THREE.CircleGeometry(radius*.995,96)), remember.material(new THREE.MeshStandardMaterial({ color:tier.topColor,roughness:.98 }))); top.rotation.x=-Math.PI/2; top.position.y=topY+.006; top.receiveShadow=true; scene.add(top);
      tierLayouts.push({id:tier.id,radius,baseY,topY,widthCm:tier.dimensions.widthCm}); cursorY=topY;
    });

    const renderables = getRenderableItems(design).sort((a,b)=>a.transform.layer-b.transform.layer);
    renderables.forEach((item) => {
      const layoutIndex = tierLayouts.findIndex((layout)=>layout.id===(item.tierId??"tier-1")); const layout=tierLayouts[Math.max(0,layoutIndex)]; if(!layout) return;
      if (item.surfacePosition.surface === "top") {
        const x=(item.surfacePosition.u-.5)*layout.radius*2; const z=(item.surfacePosition.v-.5)*layout.radius*2;
        const covering=tierLayouts[layoutIndex+1]; if(covering && Math.hypot(x,z)<covering.radius*1.03) return;
        const y=layout.topY+.025+(item.placement?.heightMm??0)*worldPerCm/20;
        const asset=item.type==="asset"?getAsset(item.assetId):undefined; const unit=(asset?.defaultSizeCm.width??2)*worldPerCm;
        if(item.type==="asset" && addRaisedAsset(scene,item,x,y,z,Math.max(.18,unit),remember)) return;
        if(item.type==="stroke") return;
        const texture=textures.getOrCreate(item.type==="text"?`text:${item.id}:${item.text}:${item.color}:${item.treatment}`:`asset:${item.id}:${JSON.stringify(item.colors)}`,()=>item.type==="text"?textTexture(item):assetTexture(item));
        const width=(item.type==="text"?Math.min(layout.widthCm*.7,9):(asset?.defaultSizeCm.width??3))*worldPerCm; const height=(item.type==="text"?Math.min(4,layout.widthCm*.32):(asset?.defaultSizeCm.height??2))*worldPerCm;
        const mesh=new THREE.Mesh(remember.geometry(new THREE.PlaneGeometry(width,height)),remember.material(new THREE.MeshBasicMaterial({map:texture,transparent:true,alphaTest:.03,side:THREE.DoubleSide}))); mesh.rotation.set(-Math.PI/2,0,item.transform.rotation*Math.PI/180); mesh.position.set(x,y,z); mesh.scale.set(item.transform.scaleX,item.transform.scaleY,1); scene.add(mesh);
      } else {
        const angle=item.surfacePosition.u*Math.PI*2; if(Math.cos(angle)<-.18 && item.placement?.renderMode!=="side-band") return;
        if(item.placement?.renderMode==="side-band" && item.type==="asset") { const asset=getAsset(item.assetId); if(item.assetId==="cream-body-texture") return; const h=(asset?.defaultSizeCm.height??1)*worldPerCm; const band=new THREE.Mesh(remember.geometry(new THREE.CylinderGeometry(layout.radius+.025,layout.radius+.025,h,96,1,true)),remember.material(new THREE.MeshStandardMaterial({color:item.colors?.ribbon??asset?.previewColors[0]??"#a72034",roughness:.78,side:THREE.DoubleSide}))); band.position.y=layout.baseY+item.surfacePosition.v*(layout.topY-layout.baseY); scene.add(band); return; }
        if(item.type==="stroke") return; const asset=item.type==="asset"?getAsset(item.assetId):undefined; const texture=textures.getOrCreate(item.type==="text"?`side-text:${item.id}:${item.text}:${item.color}:${item.treatment}`:`side:${item.id}:${JSON.stringify(item.colors)}`,()=>item.type==="text"?textTexture(item):assetTexture(item));
        const width=(item.type==="text"?Math.min(layout.widthCm*.42,8):(asset?.defaultSizeCm.width??3))*worldPerCm; const height=(item.type==="text"?Math.min((layout.topY-layout.baseY)/worldPerCm*.45,3):(asset?.defaultSizeCm.height??2))*worldPerCm;
        const mesh=new THREE.Mesh(remember.geometry(new THREE.PlaneGeometry(width,height)),remember.material(new THREE.MeshBasicMaterial({map:texture,transparent:true,alphaTest:.03,side:THREE.DoubleSide}))); mesh.position.set(Math.sin(angle)*(layout.radius+.035),layout.baseY+item.surfacePosition.v*(layout.topY-layout.baseY),Math.cos(angle)*(layout.radius+.035)); mesh.rotation.y=angle; mesh.scale.set(item.transform.scaleX,item.transform.scaleY,1); scene.add(mesh);
      }
    });
    const resize=()=>{const rect=mount.getBoundingClientRect(); renderer.setSize(Math.max(320,Math.floor(rect.width)),Math.max(380,Math.floor(rect.height)),false); camera.aspect=Math.max(320,rect.width)/Math.max(380,rect.height); camera.updateProjectionMatrix(); renderer.render(scene,camera);}; const observer=new ResizeObserver(resize); observer.observe(mount); resize();
    return()=>{observer.disconnect();textures.disposeAll();disposePreviewResources(geometries);disposePreviewResources(materials);renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();scene.clear();};
  },[design]);

  return <section className={styles.beautyPreview} aria-label="Xem bánh hoàn thiện"><div className={styles.previewHeader}><div><span>Mô phỏng thành phẩm</span><h2>Xem bánh</h2></div><div className={styles.previewMeta}><Sparkle size={17}/><span>Ánh sáng studio</span></div><button type="button" className={styles.iconButton} onClick={()=>setPreviewOpen(false)} aria-label="Đóng xem bánh"><X size={19}/></button></div><div ref={mountRef} className={styles.previewStage}/><p className={styles.previewNote}>Chi tiết nổi, màu kem và độ che giữa các tầng được mô phỏng trực tiếp từ thiết kế.</p></section>;
}
