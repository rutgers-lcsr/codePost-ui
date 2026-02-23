// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { Button, Modal } from 'antd';

import { Submission } from '../../../services/submission';
import { AssignmentType, AnonymousSubmissionType } from '../../../types/models';
import { FileType } from '../../../utils/file';
import PseudoIDE from '../../../components/core/PseudoIDE';

interface IInlineTestsModalProps {
  files: FileType[];
  assignment: AssignmentType;
  submission: AnonymousSubmissionType;
  visible: boolean;
  show: () => void;
  hide: () => void;
}

const InlineTestsModal = (props: IInlineTestsModalProps) => {
  const handleOk = () => {
    props.hide();
  };

  // Only add latest files to the PseudoIDE
  const files = Submission.filesByVersion(props.files).new;

  return (
    <Modal
      open={props.visible}
      styles={{ body: { padding: '0px' } }}
      closable={false}
      width={'90%'}
      style={{ top: '20px' }}
      footer={[
        <Button key="close" onClick={handleOk}>
          Close
        </Button>,
      ]}
    >
      <PseudoIDE files={files} assignment={props.assignment} submission={props.submission} />
    </Modal>
  );
};

export default InlineTestsModal;
