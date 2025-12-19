import * as React from 'react';

import { notification } from 'antd';

const useBrowserNotification = () => {
  const openNotificationWithIcon = (type: string) => {
    // @ts-expect-error: legacy-ts-ignore
    notification[type]({
      message: 'Browser Warning',
      description: 'codePost has been primarily tested using Google Chrome. Please use Chrome, or tread carefully!',
    });
  };

  React.useEffect(() => {
    const isChrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;

    if (!isChrome) {
      openNotificationWithIcon('warning');
    }

    return;
  }, []);

  return;
};

export default useBrowserNotification;
