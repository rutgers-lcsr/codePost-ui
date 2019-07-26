import * as React from 'react';

/************************** SHORTCUTS **************************************/

export const PLUS_KEY = 187;
export const MINUS_KEY = 189;

/*******************************************************************************/

export const RIGHT_ARROW = 39;
export const LEFT_ARROW = 37;

/*******************************************************************************/

export const O_KEY = 79;

/*******************************************************************************/

export enum OS {
  MAC,
  WINDOWS,
}

export const getOperatingSystem = () => {
  return navigator.platform.indexOf('Win') > -1 ? OS.WINDOWS : OS.MAC;
};

const useHotkeys = (hotkey: number, callback: any) => {
  const os = getOperatingSystem();

  React.useEffect(() => {
    const handleKeydown = (e: any) => {
      const triggerKey = os === OS.WINDOWS ? e.ctrlKey : e.metaKey;

      if (e.which === hotkey && triggerKey) {
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
