function compare<T>(ascending: boolean, a: T | null, b: T | null) {
  if (!b && !a) return 0;
  if (!b) return ascending ? -1 : 1;
  if (!a) return ascending ? 1 : -1;
  if (a < b) return ascending ? -1 : 1;
  if (a > b) return ascending ? 1 : -1;
  return 0;
}

export { compare };
