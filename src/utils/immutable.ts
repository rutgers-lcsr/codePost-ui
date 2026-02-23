// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
export function arrayInsert<T>(array: T[], item: T, index: number) {
  return [...array.slice(0, index), item, ...array.slice(index)];
}

export function arrayAdd<T>(array: T[], item: T) {
  return [...array, item];
}

export function arrayRemove<T>(array: T[], index: number) {
  if (index < 0) {
    return array;
  }
  return [...array.slice(0, index), ...array.slice(index + 1)];
}

export function arrayUpdate<T>(array: T[], item: T, index: number) {
  return array.map((oldItem: T, oldIndex: number) => {
    if (oldIndex !== index) {
      return oldItem;
    }

    return {
      ...oldItem,
      ...item,
    };
  });
}
