import type { CakeAsset } from "./asset.types";

const svgData = (content: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(content)}`;

const rose = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <g data-color-part="petal" fill="#e85d78">
    <ellipse cx="60" cy="30" rx="23" ry="31"/><ellipse cx="87" cy="52" rx="23" ry="31" transform="rotate(55 87 52)"/>
    <ellipse cx="77" cy="83" rx="23" ry="31" transform="rotate(125 77 83)"/><ellipse cx="43" cy="83" rx="23" ry="31" transform="rotate(55 43 83)"/>
    <ellipse cx="33" cy="52" rx="23" ry="31" transform="rotate(125 33 52)"/>
  </g><circle data-color-part="center" fill="#ffd36a" cx="60" cy="59" r="20"/>
</svg>`;
const leaf = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <path data-color-part="leaf" fill="#4f8a67" d="M103 17C55 18 18 45 20 91c34 10 74-13 83-74Z"/>
  <path data-color-part="vein" fill="none" stroke="#dcebd5" stroke-width="7" stroke-linecap="round" d="M27 88C46 65 66 47 94 27M55 61l-2-25M65 52l24 1"/>
</svg>`;
const cherry = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <path data-color-part="stem" fill="none" stroke="#3b7658" stroke-width="8" stroke-linecap="round" d="M59 59C58 31 71 18 94 13M57 58C46 37 35 30 24 29"/>
  <circle data-color-part="fruit" fill="#d84755" cx="37" cy="78" r="25"/><circle data-color-part="fruit" fill="#d84755" cx="82" cy="75" r="25"/>
  <circle fill="#ffffff" opacity=".5" cx="29" cy="69" r="6"/><circle fill="#ffffff" opacity=".5" cx="74" cy="66" r="6"/>
</svg>`;
const star = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><path data-color-part="star" fill="#f1ba4d" d="m60 7 15 34 37 4-28 25 8 37-32-19-32 19 8-37L8 45l37-4Z"/></svg>`;
const pearl = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><circle data-color-part="pearl" fill="#fff7e5" stroke="#dbc9bd" stroke-width="5" cx="60" cy="60" r="48"/><circle fill="#ffffff" opacity=".8" cx="42" cy="38" r="13"/></svg>`;
const ribbon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 100"><path data-color-part="ribbon" fill="#ee7ca2" d="M61 43C41 16 5 16 10 52c4 29 38 16 52 4l18 16 18-16c14 12 48 25 52-4 5-36-31-36-51-9-8-8-30-8-38 0Z"/><circle data-color-part="center" fill="#cf557e" cx="80" cy="51" r="19"/></svg>`;

function asset(id: string, name: string, category: CakeAsset["category"], svg: string, parts: string[], colors: string[]): CakeAsset {
  return {
    id,
    name,
    category,
    sourceUrl: svgData(svg),
    fileType: "svg",
    allowedSurfaces: ["side", "top"],
    anchor: { x: 0.5, y: 0.5 },
    defaultSizeCm: { width: id === "ribbon" ? 5.8 : 3.8, height: id === "ribbon" ? 3.6 : 3.8 },
    minScale: 0.35,
    maxScale: 3,
    mirrorable: true,
    recolorableParts: parts,
    previewColors: colors,
  };
}

export const BUILTIN_ASSETS: CakeAsset[] = [
  asset("rose", "Hoa cánh tròn", "Hoa kem", rose, ["petal", "center"], ["#e85d78", "#ffd36a"]),
  asset("leaf", "Lá mềm", "Hoa kem", leaf, ["leaf", "vein"], ["#4f8a67", "#dcebd5"]),
  asset("cherry", "Đôi cherry", "Trái cây", cherry, ["fruit", "stem"], ["#d84755", "#3b7658"]),
  asset("star", "Ngôi sao", "Trang trí", star, ["star"], ["#f1ba4d"]),
  asset("pearl", "Ngọc đường", "Trang trí", pearl, ["pearl"], ["#fff7e5"]),
  asset("ribbon", "Nơ kem", "Trang trí", ribbon, ["ribbon", "center"], ["#ee7ca2", "#cf557e"]),
];

export function getAsset(assetId: string): CakeAsset | undefined {
  return BUILTIN_ASSETS.find((asset) => asset.id === assetId);
}

export function decodeSvgDataUrl(url: string): string {
  const comma = url.indexOf(",");
  return decodeURIComponent(url.slice(comma + 1));
}
