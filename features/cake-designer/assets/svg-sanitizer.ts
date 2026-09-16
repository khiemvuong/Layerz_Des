const DANGEROUS_TAGS = /<(script|foreignObject|iframe|object|embed|audio|video|link|style)\b[\s\S]*?<\/\1\s*>|<(script|foreignObject|iframe|object|embed|audio|video|link|style)\b[^>]*\/?>/gi;
const EVENT_ATTRIBUTES = /\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
const EXTERNAL_REFERENCES = /\s+(?:href|xlink:href|src)\s*=\s*(?:"(?!#)[^"]*"|'(?!#)[^']*'|(?!(?:#|data:image\/))[^\s>]+)/gi;

export function sanitizeSvg(svg: string): string {
  const trimmed = svg.trim();
  if (!/^<svg[\s>]/i.test(trimmed)) throw new Error("Tệp không phải SVG hợp lệ.");
  return trimmed
    .replace(DANGEROUS_TAGS, "")
    .replace(EVENT_ATTRIBUTES, "")
    .replace(EXTERNAL_REFERENCES, "");
}

export function recolorSvg(svg: string, colors: Record<string, string>): string {
  return sanitizeSvg(svg).replace(
    /(<[^>]+data-color-part=["']([^"']+)["'][^>]*)(>)/gi,
    (match, opening: string, partName: string, closing: string) => {
      const color = colors[partName];
      if (!color) return match;
      const updated = /\sfill=["'][^"']*["']/i.test(opening)
        ? opening.replace(/\sfill=["'][^"']*["']/i, ` fill="${color}"`)
        : `${opening} fill="${color}"`;
      return `${updated}${closing}`;
    },
  );
}
