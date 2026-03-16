// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* antd imports */
import { Alert, Layout } from 'antd';

/**********************************************************************************************************************/

const RemoteAuthFailed = () => {
  const [intercomOpen, setIntercomOpen] = React.useState(false);

  const openIntercom = () => {
    if (intercomOpen) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).Intercom('hide');
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).Intercom('show');
    }
    setIntercomOpen(!intercomOpen);
  };

  return (
    <Layout id="PreAuth" style={{ backgroundColor: '#fff', minHeight: '100vh' }}>
      <Layout.Content>
        <div
          style={{
            background: '#fff',
            padding: '25px 50px',
            maxWidth: 1200,
            margin: '0 auto',
          }}
        >
          <Alert
            message="Still trying to connect to codePost..."
            description={
              <div>
                If you've been waiting more than 15 seconds, please try refreshing or{' '}
                <a onClick={openIntercom}>send us a message</a> with the chat bubble in the bottom-right.
                <br />
                <br />
                If you haven't been enrolled in a section yet, then you'll need to wait for that before you can submit.
                <br />
                Here is the{' '}
                <a href="https://docs.google.com/forms/d/e/1FAIpQLScCWxU7zOxkqABUi8pcbsB9e-BBldZ24tAzKKI-xl12oH-6eQ/viewform">
                  Section Assignment Form
                </a>{' '}
                to get that started.
                <br />
              </div>
            }
            type="error"
          />
        </div>
      </Layout.Content>
    </Layout>
  );
};

export default RemoteAuthFailed;
