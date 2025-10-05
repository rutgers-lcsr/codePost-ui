import { Button, Modal } from 'antd';

import Video from './Video';

import useWindowSize from '../core/useWindowSize';

interface IProps {
  onCancel: () => void;
  open: boolean;
}

const VideoModal = (props: IProps) => {
  const windowSize = useWindowSize();
  const modalWidth = Math.min(1600, windowSize.width);
  return (
    <Modal
      open={props.open}
      onCancel={props.onCancel}
      footer={[<Button onClick={props.onCancel}>Cancel</Button>]}
      okText={null}
      width={modalWidth}
    >
      <span>
        Check out the video below to learn the basis of codePost. You can skip around to sections that interest you on
        the right. <br />
        <br /> <Video containerWidth={modalWidth} location="" />
      </span>
    </Modal>
  );
};

export default VideoModal;
