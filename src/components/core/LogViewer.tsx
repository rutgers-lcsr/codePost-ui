import { Modal } from 'antd';
import { useState } from 'react';
import Editor from '@monaco-editor/react';

interface ILogViewerProps {
  text: string;
}

const LogViewer = (props: ILogViewerProps) => {
  const [hovered, setHovered] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const openModal = () => {
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const onMouseEnter = () => {
    setHovered(true);
  };

  const onMouseLeave = () => {
    setHovered(false);
  };

  return (
    <div className="log-viewer--preview" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <Editor
        height="200px"
        language="log"
        value={props.text}
        options={{
          readOnly: true,
          minimap: { enabled: false },
          lineNumbers: 'off',
          scrollBeyondLastLine: false,
        }}
      />
      {/* <CodeMirror
        className="log-viewer--code-mirror"
        value={props.text}
        options={{
          lineNumbers: true,
          readOnly: 'nocursor',
        }}
        onBeforeChange={() => {}}
        onChange={() => {}}
      /> */}
      <div className="log-viewer__mask" onClick={openModal} />
      {hovered ? (
        <div className="log-viewer__view-more" onClick={openModal}>
          View More +
        </div>
      ) : null}
      <Modal open={modalVisible} onCancel={closeModal} footer={null} bodyStyle={{ padding: '0px' }} width="80%">
        <div className="log-viewer--inspect">
          <Editor
            height="100%"
            language="log"
            value={props.text}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              lineNumbers: 'off',
              scrollBeyondLastLine: false,
            }}
          />
        </div>
      </Modal>
    </div>
  );
};

export default LogViewer;
