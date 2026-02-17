import * as React from 'react';

import { getOsTriggerKeyFromEvent } from '../../components/core/operatingSystem';

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
export const V_KEY = 'v';

/*******************************************************************************/
export const K_KEY = 'k';

/*******************************************************************************/

export const U_KEY = 'u';

/*******************************************************************************/

export const M_KEY = 'm';

/*******************************************************************************/

const useHotkeys = (hotkey: string, callback: () => void, shift?: boolean, override?: boolean) => {
  React.useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      const triggerKey = getOsTriggerKeyFromEvent(e);

      let trigger = e.key.toLowerCase() === hotkey.toLowerCase() && triggerKey;
      if (shift !== undefined && shift) {
        trigger = e.key.toLowerCase() === hotkey.toLowerCase() && triggerKey && e.shiftKey;
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
