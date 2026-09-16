let sequence = 0;

export function randomId(prefix: string): string {
  sequence += 1;
  const randomPart = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${randomPart}-${sequence}`;
}
