// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { useEffect, useState } from 'react';
import { InfoCircleOutlined, ExclamationCircleOutlined, WarningOutlined, CloseOutlined } from '@ant-design/icons';
import { systemApi } from '../../api-client/clients';
import type { MaintenanceBannerResponse } from '../../api-client/models/index';

/** Stable key from all banner fields — resets dismissal whenever any field changes. */
function getDismissKey(b: MaintenanceBannerResponse): string {
  const raw = `${b.message}|${b.severity}|${b.color}|${b.startsAt ?? ''}|${b.endsAt ?? ''}`;
  // Simple djb2-style hash — no crypto needed, just a stable identifier
  let hash = 5381;
  for (let i = 0; i < raw.length; i++) hash = (hash * 33) ^ raw.charCodeAt(i);
  return `cp_banner_dismissed:${(hash >>> 0).toString(36)}`;
}

const SEVERITY_ICON: Record<string, React.ReactNode> = {
  info: <InfoCircleOutlined style={{ marginRight: 8 }} />,
  warning: <ExclamationCircleOutlined style={{ marginRight: 8 }} />,
  critical: <WarningOutlined style={{ marginRight: 8 }} />,
};

/**
 * Fetches /system/banner/ (no auth required) on mount and renders the banner
 * if active_now. Respects the schedule window and the user's dismiss choice.
 * Dismiss persists in localStorage, keyed by message + schedule window so
 * it automatically resets when new maintenance windows are announced.
 */
export default function MaintenanceBanner() {
  const [banner, setBanner] = useState<MaintenanceBannerResponse | null>(null);

  useEffect(() => {
    systemApi
      .bannerRetrieve()
      .then((data) => {
        if (!data.activeNow) return;
        // Only show if user hasn't already dismissed this exact banner
        if (localStorage.getItem(getDismissKey(data)) !== '1') {
          setBanner(data);
        }
      })
      .catch(() => {
        // Silently ignore — a missing banner is not an error
      });
  }, []);

  if (!banner) return null;

  const handleDismiss = () => {
    localStorage.setItem(getDismissKey(banner), '1');
    setBanner(null);
  };

  return (
    <div
      role="alert"
      style={{
        background: banner.color,
        padding: '10px 48px 10px 16px',
        fontSize: '15px',
        fontWeight: 500,
        color: 'white',
        textAlign: 'center',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
      }}
    >
      {SEVERITY_ICON[banner.severity] ?? SEVERITY_ICON.info}
      {banner.message}
      <button
        onClick={handleDismiss}
        aria-label="Dismiss banner"
        style={{
          position: 'absolute',
          right: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          padding: '4px',
          opacity: 0.8,
          fontSize: '14px',
          lineHeight: 1,
        }}
      >
        <CloseOutlined />
      </button>
    </div>
  );
}
