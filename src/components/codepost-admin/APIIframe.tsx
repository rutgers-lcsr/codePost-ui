// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import React, { useRef, useState } from 'react';
import { Button, Space, Tooltip } from 'antd';
import { ExpandOutlined, LinkOutlined, ReloadOutlined, CompressOutlined } from '@ant-design/icons';
import AdminPageHeader from './AdminPageHeader';

const APIIframe: React.FC = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const apiUrl = `${process.env.REACT_APP_API_URL}/`;

  const handleReload = () => {
    if (iframeRef.current) {
      iframeRef.current.src = apiUrl;
    }
  };

  const toggleFullscreen = () => setIsFullscreen((f) => !f);

  return (
    <div style={{ padding: isFullscreen ? 0 : 24, height: isFullscreen ? '100vh' : 'auto' }}>
      {!isFullscreen && (
        <AdminPageHeader
          title="API Documentation"
          subtitle="Live API reference served by the backend."
          actions={
            <Space>
              <Tooltip title="Reload">
                <Button icon={<ReloadOutlined />} onClick={handleReload} />
              </Tooltip>
              <Tooltip title="Open in new tab">
                <Button
                  icon={<LinkOutlined />}
                  onClick={() => window.open(apiUrl, '_blank', 'noopener,noreferrer')}
                />
              </Tooltip>
              <Tooltip title="Fullscreen">
                <Button icon={<ExpandOutlined />} onClick={toggleFullscreen} />
              </Tooltip>
            </Space>
          }
        />
      )}
      {isFullscreen && (
        <div style={{ position: 'absolute', top: 8, right: 16, zIndex: 10 }}>
          <Tooltip title="Exit fullscreen">
            <Button icon={<CompressOutlined />} onClick={toggleFullscreen} size="small" />
          </Tooltip>
        </div>
      )}
      <iframe
        ref={iframeRef}
        src={apiUrl}
        title="API Documentation"
        style={{
          width: '100%',
          height: isFullscreen ? '100vh' : 'calc(100vh - 180px)',
          minHeight: 600,
          border: 'none',
          borderRadius: isFullscreen ? 0 : 4,
        }}
      />
    </div>
  );
};

export default APIIframe;
