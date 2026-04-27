// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';

const BYTES_PER_ROW = 16;
const VISIBLE_ROWS = 32;
const ROW_HEIGHT = 20;

interface HexViewerProps {
  bytes: Uint8Array;
  isDark: boolean;
  consoleTheme: Record<string, unknown>;
}

/** Render a single row of hex dump: offset | hex bytes | ASCII. */
function formatRow(bytes: Uint8Array, offset: number): { offsetStr: string; hexParts: string[]; ascii: string } {
  const end = Math.min(offset + BYTES_PER_ROW, bytes.length);
  const offsetStr = offset.toString(16).padStart(8, '0');

  const hexParts: string[] = [];
  let ascii = '';

  for (let i = offset; i < offset + BYTES_PER_ROW; i++) {
    if (i < end) {
      hexParts.push(bytes[i].toString(16).padStart(2, '0'));
      const ch = bytes[i];
      ascii += ch >= 0x20 && ch <= 0x7e ? String.fromCharCode(ch) : '.';
    } else {
      hexParts.push('  ');
      ascii += ' ';
    }
  }

  return { offsetStr, hexParts, ascii };
}

export const HexViewer: React.FC<HexViewerProps> = ({ bytes, isDark }) => {
  const totalRows = Math.ceil(bytes.length / BYTES_PER_ROW);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const bgColor = isDark ? '#1a1a2e' : '#f8f9fa';
  const borderColor = isDark ? '#333' : '#e0e0e0';
  const offsetColor = '#6a9fb5';
  const hexColor = isDark ? '#d4d4d4' : '#333';
  const asciiColor = isDark ? '#a3be8c' : '#198665';
  const headerBg = isDark ? '#16162a' : '#f0f0f0';
  const altRowBg = isDark ? '#1e1e36' : '#f4f4f4';

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Reset scroll when bytes change
  useEffect(() => {
    setScrollTop(0);
    if (containerRef.current) containerRef.current.scrollTop = 0;
  }, [bytes]);

  const { startRow, visibleRows } = useMemo(() => {
    const start = Math.floor(scrollTop / ROW_HEIGHT);
    // Render a buffer of extra rows above/below for smooth scrolling
    const bufferedStart = Math.max(0, start - 5);
    const bufferedEnd = Math.min(totalRows, start + VISIBLE_ROWS + 10);
    const rows: { offset: number; offsetStr: string; hexParts: string[]; ascii: string }[] = [];
    for (let i = bufferedStart; i < bufferedEnd; i++) {
      const offset = i * BYTES_PER_ROW;
      rows.push({ offset, ...formatRow(bytes, offset) });
    }
    return { startRow: bufferedStart, visibleRows: rows };
  }, [scrollTop, totalRows, bytes]);

  const monoStyle: React.CSSProperties = {
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
    fontSize: 12,
    lineHeight: `${ROW_HEIGHT}px`,
    whiteSpace: 'pre',
  };

  return (
    <div
      style={{
        border: `1px solid ${borderColor}`,
        borderRadius: 4,
        overflow: 'hidden',
        background: bgColor,
      }}
    >
      {/* Header */}
      <div
        style={{
          ...monoStyle,
          background: headerBg,
          padding: '4px 12px',
          borderBottom: `1px solid ${borderColor}`,
          color: isDark ? '#888' : '#999',
          fontSize: 11,
          userSelect: 'none',
        }}
      >
        {'Offset   '}
        {Array.from({ length: BYTES_PER_ROW }, (_, i) => i.toString(16).padStart(2, '0').toUpperCase()).join(' ')}
        {'  ASCII'}
      </div>

      {/* Virtualized rows */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{
          height: Math.min(totalRows, VISIBLE_ROWS) * ROW_HEIGHT,
          overflow: 'auto',
          position: 'relative',
        }}
      >
        {/* Spacer for virtual scroll */}
        <div style={{ height: totalRows * ROW_HEIGHT, position: 'relative' }}>
          {visibleRows.map((row, idx) => (
            <div
              key={row.offset}
              style={{
                ...monoStyle,
                position: 'absolute',
                top: (startRow + idx) * ROW_HEIGHT,
                left: 0,
                right: 0,
                padding: '0 12px',
                background: (startRow + idx) % 2 === 1 ? altRowBg : 'transparent',
              }}
            >
              <span style={{ color: offsetColor }}>{row.offsetStr}</span>
              {'  '}
              <span style={{ color: hexColor }}>
                {row.hexParts.slice(0, 8).join(' ')} {row.hexParts.slice(8).join(' ')}
              </span>
              {'  '}
              <span style={{ color: asciiColor }}>{row.ascii}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          ...monoStyle,
          background: headerBg,
          padding: '4px 12px',
          borderTop: `1px solid ${borderColor}`,
          color: isDark ? '#666' : '#aaa',
          fontSize: 11,
          userSelect: 'none',
        }}
      >
        {bytes.length.toLocaleString()} bytes · {totalRows.toLocaleString()} rows
      </div>
    </div>
  );
};
