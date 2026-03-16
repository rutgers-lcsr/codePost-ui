// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';

// Source: https://usehooks.com/useOnClickOutside/
const useOnClickOutside = (
  ref: React.RefObject<HTMLElement | null>,
  handler: (event: MouseEvent | TouchEvent) => void,
) => {
  React.useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      // Do nothing
      if (!ref.current || ref.current.contains(event.target as Node | null)) {
        return;
      }

      handler(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
};

export default useOnClickOutside;
