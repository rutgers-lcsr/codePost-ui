import * as React from 'react';

const useKeyPress = (targetKey: any) => {
  const [keyPressed, setKeyPressed] = React.useState(false);

  const downHandler = (e: React.KeyboardEvent) => {
    if (e.key === targetKey) {
      setKeyPressed(true);
    }
  };

  const upHandler = (e: React.KeyboardEvent) => {
    if (e.key === targetKey) {
      setKeyPressed(false);
    }
  };

  React.useEffect(() => {
    // @ts-ignore
    window.addEventListener('keydown', downHandler);
    // @ts-ignore
    window.addEventListener('keyup', upHandler);

    return () => {
      // @ts-ignore
      window.removeEventListener('keydown', downHandler);
      // @ts-ignore
      window.removeEventListener('keyup', upHandler);
    };
    // Should implement useCallback()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return keyPressed;
};

export default useKeyPress;
