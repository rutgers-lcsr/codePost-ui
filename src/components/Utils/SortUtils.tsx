function getSortIndex(sortIndex: Array<boolean | undefined>, columnIndex: number) {
  if (columnIndex > sortIndex.length - 1) {
    // invalid column Index
    return sortIndex;
  }

  // set the sortedIndex to proper values
  const newSortedIndex = sortIndex.map((elem: boolean | undefined, i: number) => {
    if (i === columnIndex) {
      if (typeof elem !== 'undefined') {
        return !elem;
      } else return true;
    } else {
      return undefined;
    }
  });

  return newSortedIndex;
}

function compare<T>(ascending: boolean, a: T | null, b: T | null) {
  if (!b && !a) return 0;
  if (!b) return ascending ? -1 : 1;
  if (!a) return ascending ? 1 : -1;
  if (a < b) return ascending ? -1 : 1;
  if (a > b) return ascending ? 1 : -1;
  return 0;
}

export { getSortIndex, compare };
