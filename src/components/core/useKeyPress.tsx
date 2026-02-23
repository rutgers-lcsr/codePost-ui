// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
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
    // @ts-expect-error: legacy-ts-ignore
    window.addEventListener('keydown', downHandler);
    // @ts-expect-error: legacy-ts-ignore
    window.addEventListener('keyup', upHandler);

    return () => {
      // @ts-expect-error: legacy-ts-ignore
      window.removeEventListener('keydown', downHandler);
      // @ts-expect-error: legacy-ts-ignore
      window.removeEventListener('keyup', upHandler);
    };
    // Should implement useCallback()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return keyPressed;
};

export default useKeyPress;
