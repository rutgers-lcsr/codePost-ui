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
