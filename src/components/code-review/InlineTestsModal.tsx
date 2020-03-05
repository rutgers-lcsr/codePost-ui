import * as React from 'react';

import { Button, Modal } from 'antd';

import PseudoIDE from '../core/PseudoIDE';

const InlineTestsModal = (props: any) => {
  const handleOk = () => {
    console.log('ok');
  };

  return (
    <Modal
      visible={true}
      bodyStyle={{ padding: '0px' }}
      closable={false}
      width={'90%'}
      style={{ top: '20px' }}
      footer={[
        <Button key="close" onClick={handleOk}>
          Close
        </Button>,
      ]}
    >
      <PseudoIDE />
    </Modal>
  );
};

export default InlineTestsModal;
