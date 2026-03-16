// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { Typography } from 'antd';
import React from 'react';
import InteractiveCodeConsole from '../features/code-review/InteractiveCodeConsole';

const { Title } = Typography;

const CodePlaygroundPage: React.FC = () => {
  return (
    <main style={{ padding: '24px', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Title level={1}>Code Playground</Title>
      <div style={{ flex: 1, minHeight: 0 }}>
        <InteractiveCodeConsole />
      </div>
    </main>
  );
};

export default CodePlaygroundPage;
