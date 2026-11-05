// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Typography } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { colors } from '../../../theme/colors';

const { Text } = Typography;

export type FieldStatus = { state: 'saving' | 'saved' | 'error'; detail?: string };

/** One polite live region per page of self-saving controls. The text is cleared before each
 *  message, so an identical message (toggle on, then off) is announced again. */
export const useSaveAnnouncer = () => {
  const [text, setText] = React.useState('');
  const timer = React.useRef(0);
  const announce = React.useCallback((msg: string) => {
    window.clearTimeout(timer.current);
    setText('');
    timer.current = window.setTimeout(() => setText(msg), 40);
  }, []);
  React.useEffect(() => () => window.clearTimeout(timer.current), []);
  const region = (
    <div role="status" aria-live="polite" className="sr-only">
      {text}
    </div>
  );
  return { announce, region };
};

/** The word beside a self-saving control: Saving…, Saved, or why it was not saved. */
const FieldStatusText: React.FC<{ status?: FieldStatus; style?: React.CSSProperties }> = ({ status, style }) => {
  if (!status) return null;
  if (status.state === 'saving') {
    return (
      <Text type="secondary" style={{ fontSize: 12, whiteSpace: 'nowrap', ...style }}>
        Saving…
      </Text>
    );
  }
  if (status.state === 'saved') {
    return (
      <Text style={{ fontSize: 12, whiteSpace: 'nowrap', color: colors.brandPrimary, ...style }}>
        <CheckCircleOutlined aria-hidden /> Saved
      </Text>
    );
  }
  // red-6 (#cf1322): 5.9:1 on white; the brand action red is 3.5:1 at this size.
  return <Text style={{ fontSize: 12, color: '#cf1322', ...style }}>{status.detail}</Text>;
};

export default FieldStatusText;
