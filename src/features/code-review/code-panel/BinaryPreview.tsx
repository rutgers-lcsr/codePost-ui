// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { useCallback, useContext, useMemo, useState } from 'react';
import { Button, Space, Typography } from 'antd';
import { DownloadOutlined, EyeOutlined } from '@ant-design/icons';

import type { ICodeContentCoreProps } from './CodeContent';
import { getFileContent } from '../../../utils/file';
import { HexViewer } from './HexViewer';
import { ConsoleThemeContext, consoleThemes } from '../../../styles/abstracts/_console-theme-context';

const { Text, Title } = Typography;

/** Decode base64 data string into a Uint8Array. Handles optional data-URI prefix. */
function decodeBase64(data: string): Uint8Array {
  // Strip data URI prefix if present (e.g. "data:application/octet-stream;base64,...")
  const base64 = data.includes(',') ? data.slice(data.indexOf(',') + 1) : data;
  const raw = atob(base64);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    bytes[i] = raw.charCodeAt(i);
  }
  return bytes;
}

/** Format byte count into a human-readable string. */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), units.length - 1);
  const value = bytes / Math.pow(k, i);
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/** Map common file extensions to MIME types for the download blob. */
function mimeForExtension(ext: string): string {
  const map: Record<string, string> = {
    jar: 'application/java-archive',
    class: 'application/java-vm',
    exe: 'application/x-msdownload',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    db: 'application/x-sqlite3',
    swf: 'application/x-shockwave-flash',
    ttf: 'font/ttf',
    eot: 'application/vnd.ms-fontobject',
  };
  return map[ext.toLowerCase()] || 'application/octet-stream';
}

type ViewMode = 'info' | 'hex';

export const BinaryPreview = (props: ICodeContentCoreProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>('info');
  const { consoleTheme } = useContext(ConsoleThemeContext);

  const content = getFileContent(props.file);
  const ext = (props.file.extension || '').replace(/^\./, '').toLowerCase();

  const bytes = useMemo(() => {
    if (!content) return new Uint8Array(0);
    try {
      return decodeBase64(content);
    } catch {
      // Content may not be valid base64 — return empty
      return new Uint8Array(0);
    }
  }, [content]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([bytes.buffer as ArrayBuffer], { type: mimeForExtension(ext) });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = props.file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [bytes, ext, props.file.name]);

  const isDark = consoleTheme === consoleThemes.dark;
  const bgColor = consoleTheme.codeBg;
  const borderColor = consoleTheme.codeBorder;
  const textColor = consoleTheme.text;
  const labelColor = consoleTheme.commentAuthor;

  if (viewMode === 'hex') {
    return (
      <div style={{ padding: '16px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ color: labelColor, fontSize: 12 }}>{props.file.name} — Hex View</Text>
          <Space>
            <Button size="small" icon={<DownloadOutlined />} onClick={handleDownload}>
              Download
            </Button>
            <Button size="small" onClick={() => setViewMode('info')}>
              Back
            </Button>
          </Space>
        </div>
        <HexViewer bytes={bytes} isDark={isDark} consoleTheme={consoleTheme} />
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px',
        minHeight: 300,
      }}
    >
      <div
        style={{
          background: bgColor,
          border: `1px solid ${borderColor}`,
          borderRadius: 8,
          padding: '40px 48px',
          textAlign: 'center',
          maxWidth: 420,
          width: '100%',
        }}
      >
        <Title level={5} style={{ color: textColor, marginBottom: 8 }}>
          {props.file.name}
        </Title>
        <div style={{ marginBottom: 24 }}>
          <Text style={{ color: labelColor, fontSize: 13 }}>
            {ext.toUpperCase()} file{bytes.length > 0 ? ` · ${formatBytes(bytes.length)}` : ''}
          </Text>
        </div>
        <Space direction="vertical" size={8}>
          <Button type="primary" icon={<DownloadOutlined />} onClick={handleDownload} disabled={bytes.length === 0}>
            Download File
          </Button>
          <Button icon={<EyeOutlined />} onClick={() => setViewMode('hex')} disabled={bytes.length === 0}>
            View as Hex
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default BinaryPreview;
