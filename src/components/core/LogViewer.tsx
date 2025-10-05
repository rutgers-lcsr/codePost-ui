import * as React from 'react';

import { Controlled as CodeMirror } from 'react-codemirror2';

import { Modal } from 'antd';

interface ILogViewerProps {
  text: string;
}

const LogViewer = (props: ILogViewerProps) => {
  const [hovered, setHovered] = React.useState(false);
  const [modalVisible, setModalVisible] = React.useState(false);

  const openModal = () => {
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const onMouseEnter = (e: React.MouseEvent) => {
    setHovered(true);
  };

  const onMouseLeave = (e: React.MouseEvent) => {
    setHovered(false);
  };

  return (
    <div className="log-viewer--preview" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <CodeMirror
        className="log-viewer--code-mirror"
        value={props.text}
        options={{
          lineNumbers: true,
          readOnly: 'nocursor',
        }}
        onBeforeChange={(editor: any, data: any, value: any) => {
          return;
        }}
        onChange={(editor, data, value) => {}}
      />
      <div className="log-viewer__mask" onClick={openModal} />
      {hovered ? (
        <div className="log-viewer__view-more" onClick={openModal}>
          View More +
        </div>
      ) : null}
      <Modal open={modalVisible} onCancel={closeModal} footer={null} bodyStyle={{ padding: '0px' }} width="80%">
        <div className="log-viewer--inspect">
          <CodeMirror
            className="log-viewer--code-mirror"
            value={props.text}
            options={{
              lineNumbers: true,
              readOnly: 'nocursor',
            }}
            onBeforeChange={(editor: any, data: any, value: any) => {
              return;
            }}
            onChange={(editor, data, value) => {}}
          />
        </div>
      </Modal>
    </div>
  );
};

export default LogViewer;
