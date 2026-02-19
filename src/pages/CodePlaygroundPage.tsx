import { Typography } from 'antd';
import React from 'react';
import InteractiveCodeConsole from '../features/code-review/InteractiveCodeConsole';

const { Title } = Typography;

const CodePlaygroundPage: React.FC = () => {
  return (
    <div style={{ padding: '24px', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Title level={2}>Code Playground</Title>
      <div style={{ flex: 1, minHeight: 0 }}>
        <InteractiveCodeConsole />
      </div>
    </div>
  );
};

export default CodePlaygroundPage;
