import * as React from 'react';

import { Button, Modal } from 'antd';

import { AssignmentType } from '../../infrastructure/assignment';
import { FileType } from '../../infrastructure/file';
import PseudoIDE from '../core/PseudoIDE';

interface IInlineTestsModalProps {
  files: FileType[];
  assignment: AssignmentType;
}

const InlineTestsModal = (props: IInlineTestsModalProps) => {
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
      <PseudoIDE files={props.files} assignment={props.assignment} />
    </Modal>
  );
};

export default InlineTestsModal;
