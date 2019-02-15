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

export { getSortIndex };
