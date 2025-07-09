export enum OS {
  MAC,
  WINDOWS,
}

export const getOperatingSystem = () => {
  return navigator.platform.indexOf('Win') > -1 ? OS.WINDOWS : OS.MAC;
};

export const osControlKey = () => {
  if (getOperatingSystem() === OS.WINDOWS) {
    return 'Ctrl';
  } else {
    return '⌘';
  }
};
