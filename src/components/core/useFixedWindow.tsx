import * as React from 'react';

const useFixedWindow = () => {
  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []); // only run on mount, unmount
};

export default useFixedWindow;
