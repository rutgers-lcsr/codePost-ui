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
      (window as any).Intercom('hide');
    } else {
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
          <div
            style={{
              background: 'red',
              padding: '22px',
              fontSize: '24px',
              fontWeight: 500,
              color: 'white',
              textAlign: 'center',
            }}
          >
            codePost is making some updates to the site and is temporarily unavailable. Please check back in 20 minutes.
          </div>
          <Alert
            message="Something went wrong connecting to codePost"
            description={
              <div>
                Please try refreshing or <a onClick={openIntercom}>send us a message</a> with the chat bubble in the
                bottom-right.
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
