export function isUnique<T>(arr: readonly T[]): boolean {
  const seen = new Set<T>();
  for (const v of arr) {
    if (seen.has(v)) return false; // duplicate found → stop early
    seen.add(v);
  }
  return true;
}
