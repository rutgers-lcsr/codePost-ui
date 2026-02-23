// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
export interface SortableAssignment {
  id: number;
  sortKey?: number | null;
}

export const sortAssignments = <T extends SortableAssignment>(objs: T[]): T[] => {
  const compareObjs = (a: T, b: T) => {
    const sA = a.sortKey ?? 0;
    const sB = b.sortKey ?? 0;
    if (sA === sB) {
      return a.id - b.id;
    }
    return sA - sB;
  };

  return [...objs].sort(compareObjs);
};
