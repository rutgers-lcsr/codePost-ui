import * as React from 'react';

import { notification } from 'antd';

const useBrowserNotification = () => {
  const openNotificationWithIcon = (type: string) => {
    notification[type]({
      message: 'Browser Warning',
      description: 'codePost has been primarily tested using Google Chrome. Please use Chrome, or tread carefully!',
    });
  };

  React.useEffect(() => {
    // @ts-ignore
    if (!window.chrome) {
      openNotificationWithIcon('warning');
    }

    return;
  }, []);

  return;
};

export default useBrowserNotification;
