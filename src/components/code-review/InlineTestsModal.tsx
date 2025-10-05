import { Button, Modal } from 'antd';

import { AssignmentType } from '../../infrastructure/assignment';
import { FileType } from '../../infrastructure/file';
import { AnonymousSubmissionType, Submission } from '../../infrastructure/submission';
import PseudoIDE from '../core/PseudoIDE';

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
