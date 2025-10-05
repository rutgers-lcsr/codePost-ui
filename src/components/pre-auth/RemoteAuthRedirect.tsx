/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* antd imports */
import { Layout, Modal } from 'antd';

import LandingNew from '../landing/newlanding/Landing.tsx';

/**********************************************************************************************************************/

const RemoteAuthRedirect = (props: any) => {
  const [showModal, setShowModal] = React.useState(true);

  const close = () => {
    setShowModal(false);
  };

  return (
    <Layout id="PreAuth" style={{ backgroundColor: '#fff', minHeight: '100vh' }}>
      <Layout.Content>
        <LandingNew {...props} />
        <Modal
          title={<span style={{ fontSize: '22px' }}>Welcome to codePost!</span>}
          open={showModal}
          onCancel={close}
          width={'44%'}
          footer={null}
          bodyStyle={{ fontSize: '16px', padding: '30px 24px' }}
        >
          <p>
            It looks like you're a <b>Code in Place</b> student.
          </p>
          <p>
            If you're trying to <b>submit an assignment</b>, go here:{' '}
            <a href="https://compedu.stanford.edu/codeinplace/v1/#/submissions">
              https://compedu.stanford.edu/codeinplace/v1/#/submissions
            </a>
          </p>

          <hr />
          <div style={{ height: '16px' }} />
          <p style={{ color: 'rgba(0,0,0,0.5)' }}>
            codePost is an independent service used for teaching computer science that is donating access to our product
            to Code in Place.{' '}
          </p>

          <p style={{ color: 'rgba(0,0,0,0.5)' }}>
            If you're interested in learning more, <a onClick={close}>check out our homepage!</a>
          </p>
        </Modal>
      </Layout.Content>
    </Layout>
  );
};

export default RemoteAuthRedirect;
