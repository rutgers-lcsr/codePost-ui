/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/**********************************************************************************************************************/

enum STATUS {
  NONE,
  UNSAVED,
  SAVED,
}

const shallowListEquals = (list1: any[], list2: any[]) => {
  if (list1.length !== list2.length) {
    return false;
  }

  for (let i = 0; i < list1.length; i = i + 1) {
    if (list1[i] !== list2[i]) {
      return false;
    }
  }

  return true;
};

const statusChange = (oldProps: any[], newProps: any[], currStatus: STATUS) => {
  switch (currStatus) {
    case STATUS.UNSAVED:
      if (shallowListEquals(oldProps, newProps)) {
        return STATUS.NONE;
      } else {
        return currStatus;
      }
    case STATUS.NONE:
      if (!shallowListEquals(oldProps, newProps)) {
        return STATUS.UNSAVED;
      } else {
        return currStatus;
      }
    default:
      return currStatus;
  }
};

export { STATUS, statusChange };
