// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
function compare<T>(ascending: boolean, a: T | null, b: T | null) {
  if (!b && !a) return 0;
  if (!b) return ascending ? -1 : 1;
  if (!a) return ascending ? 1 : -1;
  if (a < b) return ascending ? -1 : 1;
  if (a > b) return ascending ? 1 : -1;
  return 0;
}

export { compare };
