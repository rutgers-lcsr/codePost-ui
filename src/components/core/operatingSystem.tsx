export enum OS {
  MAC,
  WINDOWS,
}

export const getOperatingSystem = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  return userAgent.indexOf('win') > -1 ? OS.WINDOWS : OS.MAC;
};

export const osControlKey = () => {
  if (getOperatingSystem() === OS.WINDOWS) {
    return 'Ctrl';
  } else {
    return '⌘';
  }
};
