/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* antd imports */
import { Alert, Layout } from 'antd';

import LandingNew from '../landing/newlanding/Landing.tsx';

/**********************************************************************************************************************/

const RemoteAuthRedirect = (props: any) => {
  const [intercomOpen, setIntercomOpen] = React.useState(false);

  const [showAlert, setShowAlert] = React.useState(false);

  React.useEffect(() => {
    setTimeout(() => setShowAlert(true), 500);
  }, []);

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
            display: showAlert ? 'block' : 'none',
          }}
        >
          <Alert
            style={{ backgroundColor: '#e6f7ff', border: '1px solid #91d5ff' }}
            message="Thanks for finding your way to codePost.io"
            description={
              <div>
                <br />
                It looks like you're a <b>Code In Place</b> student.
                <br />
                <br />
                You can upload your assignment from here:{' '}
                <a href="https://compedu.stanford.edu/codeinplace/v1/#/submissions">
                  https://compedu.stanford.edu/codeinplace/v1/#/submissions
                </a>
                <br /> or return to the course homepage here:{' '}
                <a href="https://compedu.stanford.edu/codeinplace/v1/#/course">
                  https://compedu.stanford.edu/codeinplace/v1/#/course
                </a>
                <br />
              </div>
            }
            showIcon={true}
            type="info"
          />
          <br />
          <br />
          <br />
          <br />
        </div>

        <LandingNew {...props} />
      </Layout.Content>
    </Layout>
  );
};

export default RemoteAuthRedirect;
