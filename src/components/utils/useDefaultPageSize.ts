// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';

import { DEFAULT_PAGE_SIZE_CHANGE_EVENT, DEFAULT_PAGE_SIZE_STORAGE_KEY, LOCAL_SETTINGS } from './LocalSettings';

const useDefaultPageSize = () => {
  const [pageSize, setPageSizeState] = React.useState<number>(() => LOCAL_SETTINGS.defaultPageSize.getter());

  const setPageSize = React.useCallback((value: number) => {
    LOCAL_SETTINGS.defaultPageSize.setter(value);
    setPageSizeState(LOCAL_SETTINGS.defaultPageSize.getter());
  }, []);

  React.useEffect(() => {
    const syncFromStorage = () => {
      setPageSizeState(LOCAL_SETTINGS.defaultPageSize.getter());
    };

    const handleDefaultPageSizeEvent = (event: Event) => {
      const customEvent = event as CustomEvent<number>;
      if (typeof customEvent.detail === 'number') {
        setPageSizeState(customEvent.detail);
        return;
      }
      syncFromStorage();
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === DEFAULT_PAGE_SIZE_STORAGE_KEY) {
        syncFromStorage();
      }
    };

    window.addEventListener(DEFAULT_PAGE_SIZE_CHANGE_EVENT, handleDefaultPageSizeEvent as EventListener);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(DEFAULT_PAGE_SIZE_CHANGE_EVENT, handleDefaultPageSizeEvent as EventListener);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  return [pageSize, setPageSize] as const;
};

export default useDefaultPageSize;
