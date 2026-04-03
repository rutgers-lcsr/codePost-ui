// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import React, { useContext, useState } from 'react';
import { FileTextOutlined, LoadingOutlined, ReloadOutlined } from '@ant-design/icons';
import { message, Typography } from 'antd';
import ReactMarkdown from 'react-markdown';
import CPButton from '../../../components/core/CPButton';
import AIFeedbackWidget from '../../../components/core/AIFeedbackWidget';
import { ConsoleThemeContext } from '../../../styles/abstracts/_console-theme-context';
import type { SubmissionSummaryType } from '../../../types/models';

const { Text } = Typography;

interface SubmissionSummaryPanelProps {
  title?: string;
  summary: SubmissionSummaryType | null;
  onGenerateSummary?: () => Promise<void>;
  isGenerating?: boolean;
  isAdmin?: boolean;
  /** Prompt variant ID that generated this summary (for feedback tracking) */
  promptVariantId?: number;
  /** Active experiment ID if this was generated during an A/B test */
  experimentId?: number;
  /** Whether the assignment uses a custom AI system prompt */
  isCustomContext?: boolean;
}

const SubmissionSummaryPanel: React.FC<SubmissionSummaryPanelProps> = ({
  summary,
  onGenerateSummary,
  isGenerating,
  isAdmin,
  promptVariantId,
  experimentId,
  isCustomContext,
}) => {
  const { consoleTheme } = useContext(ConsoleThemeContext);
  const [localLoading, setLocalLoading] = useState(false);
  const loading = isGenerating || localLoading;

  const handleGenerate = async () => {
    if (!onGenerateSummary) return;
    setLocalLoading(true);
    try {
      await onGenerateSummary();
      message.success('Summary generated');
    } catch (err: unknown) {
      const apiMessage =
        err && typeof err === 'object' && 'body' in err
          ? ((err as { body?: { error?: string } }).body?.error ?? null)
          : null;
      message.error(apiMessage || 'Failed to generate summary. Check AI configuration.');
    } finally {
      setLocalLoading(false);
    }
  };

  if (!summary) {
    return (
      <div
        style={{
          padding: '32px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <FileTextOutlined style={{ fontSize: 28, color: consoleTheme.commentAuthor }} />
        <div style={{ textAlign: 'center' }}>
          <Text
            style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 500,
              color: consoleTheme.text,
              marginBottom: 4,
            }}
          >
            No summary yet
          </Text>
          <Text style={{ fontSize: 12, color: consoleTheme.commentAuthor }}>
            Generate an overview of this submission
          </Text>
        </div>
        {onGenerateSummary && (
          <CPButton
            cpType="secondary"
            onClick={handleGenerate}
            disabled={loading}
            loading={loading}
            icon={loading ? <LoadingOutlined /> : <FileTextOutlined />}
            aria-label="Generate summary"
          >
            {loading ? 'Generating…' : 'Generate Summary'}
          </CPButton>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: '12px 16px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 12,
          paddingBottom: 8,
          borderBottom: `1px solid ${consoleTheme.commentTitleBorder}`,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.04em',
            color: consoleTheme.commentAuthor,
            textTransform: 'uppercase',
          }}
        >
          Summary
        </span>
        {summary.modified && (
          <Text style={{ fontSize: 11, color: consoleTheme.commentAuthor }}>
            {new Date(summary.modified).toLocaleDateString()}
          </Text>
        )}
        {onGenerateSummary && (
          <CPButton
            size="small"
            cpType="secondary"
            icon={loading ? <LoadingOutlined /> : <ReloadOutlined />}
            loading={loading}
            onClick={handleGenerate}
            disabled={loading}
            style={{ marginLeft: 'auto' }}
          >
            Regenerate
          </CPButton>
        )}
      </div>

      {/* Summary content */}
      <div
        className="cp-summary-content"
        style={{
          color: consoleTheme.text,
          fontSize: 13,
          lineHeight: 1.55,
          overflowWrap: 'break-word',
          wordBreak: 'break-word',
          maxWidth: '100%',
        }}
      >
        <style>{`
          .cp-summary-content h1,
          .cp-summary-content h2,
          .cp-summary-content h3,
          .cp-summary-content h4 {
            font-size: 13px;
            font-weight: 600;
            margin: 12px 0 4px;
          }
          .cp-summary-content h1:first-child,
          .cp-summary-content h2:first-child,
          .cp-summary-content h3:first-child,
          .cp-summary-content h4:first-child { margin-top: 0; }
          .cp-summary-content p { margin: 4px 0; }
          .cp-summary-content ul,
          .cp-summary-content ol { margin: 4px 0; padding-left: 20px; }
          .cp-summary-content li { margin: 2px 0; }
          .cp-summary-content code {
            font-size: 12px;
            padding: 1px 4px;
            border-radius: 3px;
            background: ${consoleTheme.commentCode};
          }
          .cp-summary-content pre { margin: 6px 0; }
          .cp-summary-content pre code { padding: 8px; display: block; }
        `}</style>
        <ReactMarkdown>{summary.text ?? ''}</ReactMarkdown>
      </div>

      {/* Generation metadata — visible to admins */}
      {isAdmin && summary.generationMetadata && (
        <Text
          style={{
            display: 'block',
            fontSize: 11,
            color: consoleTheme.commentAuthor,
            marginTop: 12,
            paddingTop: 8,
            borderTop: `1px solid ${consoleTheme.commentTitleBorder}`,
            opacity: 0.7,
          }}
        >
          Generated by {summary.generationMetadata.model ?? 'AI'}
        </Text>
      )}

      {/* Feedback widget — always shown for summaries (explicit feedback is the only signal) */}
      <div
        style={{
          marginTop: 10,
          paddingTop: 8,
          borderTop: isAdmin && summary.generationMetadata ? 'none' : `1px solid ${consoleTheme.commentTitleBorder}`,
        }}
      >
        <AIFeedbackWidget
          promptType="submission_summary"
          variantId={promptVariantId}
          aiOutput={summary.text ?? ''}
          experimentId={experimentId}
          isCustomContext={isCustomContext}
        />
      </div>
    </div>
  );
};

export const SubmissionSummaryTooltip: React.FC<{ hasSummary: boolean }> = ({ hasSummary }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <span>Summary</span>
    {hasSummary && <span style={{ fontSize: 9, fontWeight: 600, opacity: 0.7 }}>●</span>}
  </div>
);

export default SubmissionSummaryPanel;
