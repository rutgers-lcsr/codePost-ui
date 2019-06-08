// https://github.com/ant-design/ant-design/blob/master/components/input/TextArea.tsx
export const onNextFrame = (cb: any) => {
  if (window.requestAnimationFrame) {
    return window.requestAnimationFrame(cb);
  }
  return window.setTimeout(cb, 1);
};

export const clearNextFrameAction = (nextFrameId: number) => {
  if (window.cancelAnimationFrame) {
    window.cancelAnimationFrame(nextFrameId);
  } else {
    window.clearTimeout(nextFrameId);
  }
};
