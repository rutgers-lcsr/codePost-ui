// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Modal, Button, ConfigProvider, theme } from 'antd';
import HelpMenu from './HelpMenu';
import { useCodeConsoleStore } from '../../../stores/useCodeConsoleStore';
import { ConsoleThemeContext, consoleThemes } from '../../../styles/abstracts/_console-theme-context';

const HelpModal = () => {
  const showHelpModal = useCodeConsoleStore((s) => s.showHelpModal);
  const setShowHelpModal = useCodeConsoleStore((s) => s.setShowHelpModal);
  const isStudent = useCodeConsoleStore((s) => s.isStudent);
  const { consoleTheme } = React.useContext(ConsoleThemeContext);
  const isLight = consoleTheme === consoleThemes.light;

  const handleClose = () => {
    setShowHelpModal(false);
  };

  const bgColor = isLight ? '#ffffff' : '#1f1f1f';
  const textColor = isLight ? 'rgba(0, 0, 0, 0.85)' : '#ffffff';

  return (
    <ConfigProvider
      theme={{
        algorithm: isLight ? theme.defaultAlgorithm : theme.darkAlgorithm,
      }}
    >
      <Modal
        open={showHelpModal}
        onCancel={handleClose}
        footer={[
          <Button key="close" onClick={handleClose}>
            Close
          </Button>,
        ]}
        width={600}
        styles={{
          header: { backgroundColor: bgColor, color: textColor },
          body: { height: '60vh', padding: 0, overflow: 'hidden', backgroundColor: bgColor, color: textColor },
          mask: { backgroundColor: 'rgba(0, 0, 0, 0.45)' },
        }}
        title={<span style={{ color: textColor }}>{showHelpModal && isStudent ? 'Student Help' : 'Grader Help'}</span>}
      >
        <HelpMenu isStudent={isStudent} />
      </Modal>
    </ConfigProvider>
  );
};

export default HelpModal;
