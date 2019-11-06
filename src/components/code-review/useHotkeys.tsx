import * as React from 'react';

import { getOperatingSystem, OS } from '../core/operatingSystem';

/************************** SHORTCUTS **************************************/

export const PLUS_KEY = 187;
export const MINUS_KEY = 189;

/*******************************************************************************/

export const RIGHT_ARROW = 39;
export const LEFT_ARROW = 37;

/*******************************************************************************/

export const O_KEY = 79;

/*******************************************************************************/

export const L_KEY = 76;

/*******************************************************************************/

export const E_KEY = 69;

/*******************************************************************************/

export const F_KEY = 70;

/*******************************************************************************/

export const S_KEY = 83;

/*******************************************************************************/

export const P_KEY = 80;

/*******************************************************************************/

export const V_KEY = 86;

/*******************************************************************************/

const useHotkeys = (hotkey: number, callback: any, shift?: boolean, override?: boolean) => {
  const os = getOperatingSystem();

  React.useEffect(() => {
    const handleKeydown = (e: any) => {
      const triggerKey = os === OS.WINDOWS ? e.ctrlKey : e.metaKey;

      let trigger = e.which === hotkey && triggerKey;
      if (shift !== undefined && shift) {
        trigger = e.which === hotkey && triggerKey && e.shiftKey;
      }

      if (trigger && !override) {
        e.preventDefault();
        e.stopPropagation();
        callback();
      }
    };
    document.addEventListener('keydown', handleKeydown);
    return () => {
      document.removeEventListener('keydown', handleKeydown);
    };
  });

  return;
};

export default useHotkeys;
