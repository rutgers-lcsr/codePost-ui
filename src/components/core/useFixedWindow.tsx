import * as React from 'react';

const useFixedWindow = () => {
  React.useEffect(() => {
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = 'auto';
    };
  }, []); // only run on mount, unmount
};

export default useFixedWindow;
