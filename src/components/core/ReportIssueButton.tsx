// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { useState, useEffect, useCallback } from 'react';
import { BugOutlined, CameraOutlined, CheckCircleOutlined, SendOutlined } from '@ant-design/icons';
import { Button, Checkbox, Input, Modal, Select, Space, Typography } from 'antd';
import { Logger, getDiagnosticConsent, setDiagnosticConsent } from '../../utils/logger';
import { getAuthToken } from '../../utils/auth';
import { gatherBrowserContext, getLastScreenshot, recentConsoleLogs } from '../../utils/diagnostics';

const { Text, Paragraph } = Typography;

type ReportCategory = 'Bug Report' | 'Display Issue' | 'Performance' | 'Data Issue' | 'Other';

const CATEGORY_OPTIONS: { value: ReportCategory; label: string }[] = [
  { value: 'Bug Report', label: 'Bug / Something Broken' },
  { value: 'Display Issue', label: 'Display / Layout Issue' },
  { value: 'Performance', label: 'Slow / Unresponsive' },
  { value: 'Data Issue', label: 'Wrong / Missing Data' },
  { value: 'Other', label: 'Other' },
];

type SubmitState = 'idle' | 'capturing' | 'consent' | 'sent';

const ReportIssueButton = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ReportCategory>('Bug Report');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [includeScreenshot, setIncludeScreenshot] = useState(true);
  const [screenshotPreviewOpen, setScreenshotPreviewOpen] = useState(false);
  const [capturedScreenshot, setCapturedScreenshot] = useState<string | null>(null);

  // Alt+Shift+R global shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        e.stopPropagation();
        setModalOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpen = useCallback(() => {
    setModalOpen(true);
    setSubmitState('idle');
    setDescription('');
    setCategory('Bug Report');
    setIncludeScreenshot(true);
    setCapturedScreenshot(getLastScreenshot());
  }, []);

  const handleClose = useCallback(() => {
    setModalOpen(false);
    setSubmitState('idle');
    setDescription('');
    setCategory('Bug Report');
    setCapturedScreenshot(null);
  }, []);

  const sendReport = useCallback(
    (screenshot: string | null) => {
      const payload = {
        error: `[user-report] ${description || '(no description provided)'}`,
        errorDetail: JSON.stringify(
          {
            type: 'user-report',
            category,
            description,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            ...gatherBrowserContext(),
            recentConsoleLogs: [...recentConsoleLogs],
          },
          null,
          2,
        ),
        url: window.location.href,
        screenshot: includeScreenshot ? (screenshot ?? undefined) : undefined,
        category,
      };
      Logger.errorFull(payload);
      setSubmitState('sent');
    },
    [description, includeScreenshot, category],
  );

  const handleSubmit = useCallback(async () => {
    setSubmitState('capturing');
    // Use the screenshot cached before the modal was opened (so the modal itself isn't in the image)
    const screenshot = includeScreenshot ? capturedScreenshot : null;

    const consent = getDiagnosticConsent();
    if (consent === 'accepted') {
      sendReport(screenshot);
    } else {
      setSubmitState('consent');
    }
  }, [sendReport, includeScreenshot, capturedScreenshot]);

  const handleConsentAccept = useCallback(() => {
    setDiagnosticConsent('accepted');
    sendReport(capturedScreenshot);
  }, [sendReport, capturedScreenshot]);

  const handleConsentDecline = useCallback(() => {
    setDiagnosticConsent('declined');
    handleClose();
  }, [handleClose]);

  const [hovered, setHovered] = useState(false);

  const renderModalContent = () => {
    if (submitState === 'sent') {
      return (
        <Space orientation="vertical" size="small">
          <Space>
            <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 18 }} />
            <Text strong>Report sent. Thank you!</Text>
          </Space>
          <Text type="secondary">We'll look into it as soon as possible.</Text>
        </Space>
      );
    }

    if (submitState === 'consent') {
      return (
        <Space orientation="vertical" size="small" style={{ width: '100%' }}>
          <Space>
            <BugOutlined style={{ color: '#1677ff' }} />
            <Text strong>Share diagnostics?</Text>
          </Space>
          <Paragraph style={{ marginBottom: 0 }}>
            Your report will include browser info and recent error logs.
            {includeScreenshot
              ? ' A screenshot of what was on screen will also be included.'
              : ' No screenshot will be included.'}{' '}
            No personal data beyond what is visible on screen is shared.
          </Paragraph>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Your preference will be saved for future reports.
          </Text>
          <Space style={{ marginTop: 4 }}>
            <Button type="primary" icon={<SendOutlined />} onClick={handleConsentAccept}>
              Share & Send
            </Button>
            {includeScreenshot && capturedScreenshot && (
              <Button icon={<CameraOutlined />} onClick={() => setScreenshotPreviewOpen(true)}>
                Preview Screenshot
              </Button>
            )}
            <Button onClick={handleConsentDecline}>No Thanks</Button>
          </Space>
        </Space>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Paragraph style={{ marginBottom: 0 }}>
          Something not working right? Describe the issue below and we'll look into it.
        </Paragraph>
        <div>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
            Category
          </Text>
          <Select value={category} onChange={setCategory} options={CATEGORY_OPTIONS} style={{ width: '100%' }} />
        </div>
        <Input.TextArea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. The rubric panel isn't loading after I switch files."
          rows={5}
          autoFocus
          maxLength={2000}
          showCount
        />
        <Checkbox checked={includeScreenshot} onChange={(e) => setIncludeScreenshot(e.target.checked)}>
          Include a screenshot of the current page
        </Checkbox>
        {includeScreenshot && capturedScreenshot && (
          <Button
            type="link"
            size="small"
            icon={<CameraOutlined />}
            style={{ alignSelf: 'flex-start', padding: 0 }}
            onClick={() => setScreenshotPreviewOpen(true)}
          >
            Preview screenshot
          </Button>
        )}
      </div>
    );
  };

  const isLoading = submitState === 'capturing';
  const showFooter = submitState === 'idle' || submitState === 'capturing';

  // Only show for logged-in users
  if (!getAuthToken()) {
    return null;
  }

  return (
    <>
      <button
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0,
          height: 32,
          width: 32,
          overflow: 'hidden',
          borderRadius: 16,
          padding: 0,
          background: 'rgba(0, 0, 0, 0.25)',
          color: '#fff',
          cursor: 'pointer',
          border: 'none',
          opacity: hovered ? 1 : 0.4,
          boxShadow: hovered ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
          transition: 'opacity 200ms ease, background 200ms ease, box-shadow 200ms ease',
          ...(hovered ? { background: 'rgba(0, 0, 0, 0.55)' } : {}),
        }}
        onClick={handleOpen}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label="Report an issue (Alt+Shift+R)"
        title="Report an issue (Alt+Shift+R)"
      >
        <BugOutlined style={{ fontSize: 14, flexShrink: 0 }} />
      </button>

      <Modal
        open={modalOpen}
        title={
          <Space>
            <BugOutlined />
            <span>Report an Issue</span>
          </Space>
        }
        onCancel={handleClose}
        width={560}
        footer={
          showFooter
            ? [
                <Button key="cancel" onClick={handleClose}>
                  Cancel
                </Button>,
                <Button key="submit" type="primary" loading={isLoading} icon={<SendOutlined />} onClick={handleSubmit}>
                  {isLoading ? 'Capturing…' : 'Send Report'}
                </Button>,
              ]
            : submitState === 'sent'
              ? [
                  <Button key="close" type="primary" onClick={handleClose}>
                    Close
                  </Button>,
                ]
              : null
        }
      >
        {renderModalContent()}
      </Modal>

      <Modal
        open={screenshotPreviewOpen}
        title="Screenshot Preview"
        onOk={() => setScreenshotPreviewOpen(false)}
        onCancel={() => setScreenshotPreviewOpen(false)}
        okText="OK"
        cancelText={undefined}
        footer={[
          <Button key="ok" type="primary" onClick={() => setScreenshotPreviewOpen(false)}>
            OK
          </Button>,
        ]}
        width={720}
      >
        <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
          <Text type="secondary">This is what will be included with your report.</Text>
          {capturedScreenshot && (
            <img
              src={capturedScreenshot}
              alt="Screenshot preview"
              style={{ width: '100%', borderRadius: 8, border: '1px solid #d9d9d9' }}
            />
          )}
        </Space>
      </Modal>
    </>
  );
};

export default ReportIssueButton;
