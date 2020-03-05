import * as React from 'react';

import { Modal } from 'antd';

const InlineTestsModal = (props: any) => {
  const handleOk = () => {
    console.log('ok');
  };

  const handleCancel = () => {
    console.log('cancel');
  };
  return (
    <Modal
      visible={true}
      onOk={handleOk}
      onCancel={handleCancel}
      bodyStyle={{ padding: '0px' }}
      closable={false}
      width={'90%'}
    >
      <p>Some contents...</p>
      <p>Some contents...</p>
      <p>Some contents...</p>
      <p>Some contents...</p>
      <p>Some contents...</p>
      <p>Some contents...</p>
      <p>Some contents...</p>
      <p>Some contents...</p>
      <p>Some contents...</p>
    </Modal>
  );
};

export default InlineTestsModal;
