// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Collapse } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { ConsoleThemeContext, consoleThemes } from '../../../../styles/abstracts/_console-theme-context';

interface SummaryBannerProps {
  summary: string;
}

const SummaryBanner: React.FC<SummaryBannerProps> = ({ summary }) => {
  const consoleTheme = React.useContext(ConsoleThemeContext);
  const isDark = consoleTheme.consoleTheme === consoleThemes.dark;

  return (
    <div style={{ padding: '4px 12px 0' }}>
      <Collapse
        size="small"
        ghost
        items={[
          {
            key: 'summary',
            label: (
              <span style={{ fontSize: 12, color: isDark ? '#888' : '#999' }}>
                <InfoCircleOutlined style={{ marginRight: 4 }} />
                Older messages summarized
              </span>
            ),
            children: (
              <div
                style={{
                  fontSize: 12,
                  color: isDark ? '#aaa' : '#666',
                  lineHeight: 1.5,
                  padding: '4px 0',
                }}
              >
                {summary}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
};

export default SummaryBanner;
