// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { ConsoleThemeContext, consoleThemes } from '../../../../styles/abstracts/_console-theme-context';

const DOT_COUNT = 3;

const ThinkingMessage: React.FC = () => {
  const consoleTheme = React.useContext(ConsoleThemeContext);
  const isDark = consoleTheme.consoleTheme === consoleThemes.dark;
  const [activeDot, setActiveDot] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setActiveDot((prev) => (prev + 1) % DOT_COUNT);
    }, 400);
    return () => clearInterval(interval);
  }, []);

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
          padding: '10px 14px',
          borderRadius: '12px 12px 12px 4px',
          backgroundColor: isDark ? '#2a2a2a' : '#f0f0f0',
          display: 'flex',
          alignItems: 'center',
          gap: 5,
        }}
      >
        {Array.from({ length: DOT_COUNT }).map((_, i) => (
          <span
            key={i}
            style={{
              display: 'inline-block',
              width: 7,
              height: 7,
              borderRadius: '50%',
              backgroundColor: isDark ? '#888' : '#aaa',
              opacity: activeDot === i ? 1 : 0.3,
              transform: activeDot === i ? 'scale(1.3)' : 'scale(1)',
              transition: 'opacity 0.2s ease, transform 0.2s ease',
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default ThinkingMessage;
