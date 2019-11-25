import * as React from 'react';

import { getOperatingSystem, OS } from '../core/operatingSystem';

/************************** SHORTCUTS **************************************/

export const PLUS_KEY = '=';
export const MINUS_KEY = '-';

/*******************************************************************************/

export const RIGHT_ARROW = 'ArrowRight';
export const LEFT_ARROW = 'ArrowLeft';

/*******************************************************************************/

export const O_KEY = 'o';

/*******************************************************************************/

export const L_KEY = 'l';

/*******************************************************************************/

export const E_KEY = 'e';

/*******************************************************************************/

export const F_KEY = 'f';

/*******************************************************************************/

export const S_KEY = 's';

/*******************************************************************************/

export const P_KEY = 'p';

/*******************************************************************************/

const useHotkeys = (hotkey: string, callback: any, shift?: boolean, override?: boolean) => {
  const os = getOperatingSystem();

  React.useEffect(() => {
    const handleKeydown = (e: any) => {
      const triggerKey = os === OS.WINDOWS ? e.ctrlKey : e.metaKey;

      let trigger = e.key === hotkey && triggerKey;
      if (shift !== undefined && shift) {
        trigger = e.key === hotkey && triggerKey && e.shiftKey;
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
