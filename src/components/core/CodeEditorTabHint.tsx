// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Typography } from 'antd';

const { Text } = Typography;

const isMac = typeof navigator !== 'undefined' && /Mac|iP(hone|ad|od)/.test(navigator.platform);

/**
 * Keyboard-trap advisory for Monaco editors (WCAG 2.1.2): Tab inserts a tab character
 * inside the editor, so keyboard users must be told about Monaco's tab-focus-mode toggle
 * to move focus out. Rendered as visible helper text below every quiz code editor.
 */
const CodeEditorTabHint: React.FC<{ id?: string }> = ({ id }) => (
  <Text id={id} type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
    In the code editor, Tab inserts a tab character. Press {isMac ? 'Ctrl+Shift+M' : 'Ctrl+M'} to make Tab
    move focus instead.
  </Text>
);

export default CodeEditorTabHint;
