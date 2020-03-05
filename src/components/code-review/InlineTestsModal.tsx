import * as React from 'react';

import { Modal } from 'antd';

import PseudoIDE from '../core/PseudoIDE';

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
      <PseudoIDE />
    </Modal>
  );
};

export default InlineTestsModal;
