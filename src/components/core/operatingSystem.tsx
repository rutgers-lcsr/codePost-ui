// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
export enum OS {
  MAC,
  LINUX,
  WINDOWS,
}

export const getOperatingSystem = () => {
  const userAgent = navigator.userAgent.toLowerCase();

  if (userAgent.includes('linux')) {
    return OS.LINUX;
  } else if (userAgent.includes('win')) {
    return OS.WINDOWS;
  } else {
    return OS.MAC;
  }
};

export const osControlKey = () => {
  if (getOperatingSystem() === OS.WINDOWS) {
    return 'Ctrl';
  } else if (getOperatingSystem() === OS.LINUX) {
    return 'Ctrl';
  } else {
    return '⌘';
  }
};

export const getOsTriggerKeyFromEvent = (e: KeyboardEvent | React.KeyboardEvent) => {
  const currentOs = getOperatingSystem();

  if (currentOs === OS.MAC) {
    return e.metaKey;
  } else if (currentOs === OS.WINDOWS || currentOs === OS.LINUX) {
    return e.ctrlKey;
  }
  // Careful with this because it might make it so all events checks are false
  return false;
};
