import * as React from 'react';

import { Button, Modal } from 'antd';

import { AssignmentType } from '../../infrastructure/assignment';
import { FileType } from '../../infrastructure/file';
import PseudoIDE from '../core/PseudoIDE';

interface IInlineTestsModalProps {
  files: FileType[];
  assignment: AssignmentType;
  visible: boolean;
  show: () => void;
  hide: () => void;
}

const InlineTestsModal = (props: IInlineTestsModalProps) => {
  const handleOk = () => {
    props.hide();
  };

  return (
    <Modal
      visible={props.visible}
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
