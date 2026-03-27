// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ConsoleThemeContext, consoleThemes } from '../../../../styles/abstracts/_console-theme-context';
import { markdownComponents } from './MessageList';

interface StreamingMessageProps {
  text: string;
}

const StreamingMessage: React.FC<StreamingMessageProps> = ({ text }) => {
  const consoleTheme = React.useContext(ConsoleThemeContext);
  const isDark = consoleTheme.consoleTheme === consoleThemes.dark;
  const mdComponents = React.useMemo(() => markdownComponents(isDark), [isDark]);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-start',
        padding: '4px 12px',
      }}
    >
      <div
        style={{
          maxWidth: '85%',
          padding: '8px 12px',
          borderRadius: '12px 12px 12px 4px',
          backgroundColor: isDark ? '#2a2a2a' : '#f0f0f0',
          color: isDark ? '#e0e0e0' : '#333',
          fontSize: 13,
          lineHeight: 1.5,
          wordBreak: 'break-word',
        }}
        className="chat-message-content"
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
          {text}
        </ReactMarkdown>
        <span
          style={{
            display: 'inline-block',
            width: 6,
            height: 14,
            marginLeft: 2,
            backgroundColor: isDark ? '#888' : '#999',
            animation: 'chatCursorBlink 1s steps(2) infinite',
            verticalAlign: 'text-bottom',
          }}
        />
      </div>
    </div>
  );
};

export default StreamingMessage;
