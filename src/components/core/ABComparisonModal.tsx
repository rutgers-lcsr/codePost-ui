// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import React, { useContext, useState } from 'react';
import { message, Modal } from 'antd';
import ReactMarkdown from 'react-markdown';
import { ConsoleThemeContext } from '../../styles/abstracts/_console-theme-context';
import { PromptLabService, type PromptType } from '../../services/promptLab';

// ─── Props ────────────────────────────────────────────────────────────────────

interface ABComparisonModalProps {
  open: boolean;
  onClose: () => void;
  /** Called after the user picks a winner (or skips). Passes the chosen variant ID or null. */
  onComplete?: (chosenVariantId: number | null) => void;
  promptType: PromptType;
  experimentId: number;
  variantAId: number;
  variantBId: number;
  resultA: string;
  resultB: string;
  isCustomContext?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

const ABComparisonModal: React.FC<ABComparisonModalProps> = ({
  open,
  onClose,
  onComplete,
  promptType,
  experimentId,
  variantAId,
  variantBId,
  resultA,
  resultB,
  isCustomContext = false,
}) => {
  const { consoleTheme } = useContext(ConsoleThemeContext);
  const [choice, setChoice] = useState<'a' | 'b' | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hoveredSide, setHoveredSide] = useState<'a' | 'b' | null>(null);

  const isDark = consoleTheme.mainBg === '#0d1117';

  const handlePick = async (side: 'a' | 'b' | 'skip') => {
    setSubmitting(true);
    try {
      const chosenId = side === 'a' ? variantAId : side === 'b' ? variantBId : null;
      const rating: 1 | -1 = side === 'skip' ? -1 : 1;

      await PromptLabService.submitFeedback({
        promptType,
        variantUsed: side === 'a' ? variantAId : variantBId,
        chosenVariant: chosenId,
        experiment: experimentId,
        rating,
        feedbackText: feedbackText || undefined,
        aiOutputA: resultA,
        aiOutputB: resultB,
        isCustomContext,
      });

      setChoice(side === 'skip' ? null : side);
      message.success(side === 'skip' ? 'Feedback skipped' : 'Thanks for your feedback!');
      onComplete?.(chosenId);
      onClose();
    } catch {
      message.error('Could not submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Derived colors ──────────────────────────────────────────────────────────

  const panelBg = isDark ? '#161b22' : '#fafafa';
  const panelBorder = isDark ? '#30363d' : '#e8e8e8';
  const accentA = '#6366f1'; // Indigo
  const accentB = '#f59e0b'; // Amber
  const textColor = String(consoleTheme.text);
  const mutedColor = String(consoleTheme.commentAuthor);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={900}
      centered
      destroyOnClose
      styles={{
        body: {
          padding: 0,
          background: String(consoleTheme.mainBg),
          borderRadius: 12,
        },
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '20px 28px 16px',
          borderBottom: `1px solid ${panelBorder}`,
          display: 'flex',
          alignItems: 'baseline',
          gap: 12,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 16,
            fontWeight: 700,
            color: textColor,
            letterSpacing: '-0.01em',
          }}
        >
          Compare AI Outputs
        </h2>
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: mutedColor,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          {PROMPT_TYPE_LABELS[promptType] ?? promptType}
        </span>
      </div>

      {/* Comparison panels */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 0,
        }}
      >
        {/* Side A */}
        <ComparisonPanel
          label="A"
          accent={accentA}
          content={resultA}
          isSelected={choice === 'a'}
          isHovered={hoveredSide === 'a'}
          onHover={(h) => setHoveredSide(h ? 'a' : null)}
          onClick={() => !submitting && handlePick('a')}
          consoleTheme={consoleTheme}
          panelBg={panelBg}
          panelBorder={panelBorder}
          side="left"
        />

        {/* Divider */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            bottom: 0,
            width: 1,
            background: panelBorder,
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />

        {/* Side B */}
        <ComparisonPanel
          label="B"
          accent={accentB}
          content={resultB}
          isSelected={choice === 'b'}
          isHovered={hoveredSide === 'b'}
          onHover={(h) => setHoveredSide(h ? 'b' : null)}
          onClick={() => !submitting && handlePick('b')}
          consoleTheme={consoleTheme}
          panelBg={panelBg}
          panelBorder={panelBorder}
          side="right"
        />
      </div>

      {/* Footer — optional text + skip button */}
      <div
        style={{
          padding: '12px 28px 20px',
          borderTop: `1px solid ${panelBorder}`,
          display: 'flex',
          alignItems: 'flex-end',
          gap: 12,
        }}
      >
        <div style={{ flex: 1 }}>
          <label
            htmlFor="ab-feedback-text"
            style={{
              display: 'block',
              fontSize: 10,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: mutedColor,
              marginBottom: 4,
            }}
          >
            Optional notes
          </label>
          <textarea
            id="ab-feedback-text"
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="Any thoughts on the difference?"
            rows={2}
            style={{
              width: '100%',
              padding: '8px 10px',
              fontSize: 12,
              lineHeight: 1.45,
              color: textColor,
              background: panelBg,
              border: `1px solid ${panelBorder}`,
              borderRadius: 6,
              resize: 'vertical',
              outline: 'none',
              fontFamily: 'inherit',
              transition: 'border-color 0.15s',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#4e78ff';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = panelBorder;
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, paddingBottom: 2 }}>
          <button
            onClick={() => handlePick('skip')}
            disabled={submitting}
            style={{
              padding: '7px 16px',
              fontSize: 12,
              fontWeight: 500,
              border: `1px solid ${panelBorder}`,
              borderRadius: 6,
              background: 'transparent',
              color: mutedColor,
              cursor: submitting ? 'default' : 'pointer',
              transition: 'background 0.15s',
            }}
          >
            Both bad
          </button>
        </div>
      </div>

      {/* Instruction text */}
      <div
        style={{
          textAlign: 'center',
          paddingBottom: 16,
          fontSize: 11,
          color: mutedColor,
          opacity: 0.65,
          letterSpacing: '0.01em',
        }}
        aria-live="polite"
      >
        Click the output you prefer, or "Both bad" to skip
      </div>
    </Modal>
  );
};

// ─── Panel sub-component ──────────────────────────────────────────────────────

interface ComparisonPanelProps {
  label: string;
  accent: string;
  content: string;
  isSelected: boolean;
  isHovered: boolean;
  onHover: (hovered: boolean) => void;
  onClick: () => void;
  consoleTheme: Record<string, unknown>;
  panelBg: string;
  panelBorder: string;
  side: 'left' | 'right';
}

const ComparisonPanel: React.FC<ComparisonPanelProps> = ({
  label,
  accent,
  content,
  isSelected,
  isHovered,
  onHover,
  onClick,
  consoleTheme,
  panelBg: _panelBg,
  panelBorder,
  side,
}) => {
  const textColor = String(consoleTheme.text);
  const codeBg = String(consoleTheme.commentCode ?? 'rgba(27,31,35,.05)');

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Choose output ${label}`}
      aria-pressed={isSelected}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      style={{
        position: 'relative',
        padding: '16px 24px 20px',
        cursor: 'pointer',
        background: isSelected ? `${accent}0D` : isHovered ? `${accent}08` : 'transparent',
        borderLeft: side === 'right' ? `1px solid ${panelBorder}` : 'none',
        transition: 'background 0.2s ease',
        minHeight: 180,
        outline: 'none',
      }}
    >
      {/* Badge */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 12,
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 22,
            height: 22,
            borderRadius: 6,
            background: accent,
            color: '#fff',
            fontSize: 11,
            fontWeight: 700,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          }}
        >
          {label}
        </span>
        {isSelected && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: accent,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              animation: 'fadeInLabel 0.25s ease',
            }}
          >
            Selected
          </span>
        )}
        <style>{`
          @keyframes fadeInLabel {
            from { opacity: 0; transform: translateX(-4px); }
            to   { opacity: 1; transform: translateX(0); }
          }
        `}</style>
      </div>

      {/* Markdown content */}
      <div
        className="ab-content"
        style={{
          color: textColor,
          fontSize: 13,
          lineHeight: 1.6,
          overflowWrap: 'break-word',
          wordBreak: 'break-word',
          maxHeight: 360,
          overflowY: 'auto',
        }}
      >
        <style>{`
          .ab-content h1, .ab-content h2, .ab-content h3, .ab-content h4 {
            font-size: 13px; font-weight: 600; margin: 10px 0 4px;
          }
          .ab-content h1:first-child, .ab-content h2:first-child { margin-top: 0; }
          .ab-content p { margin: 4px 0; }
          .ab-content ul, .ab-content ol { margin: 4px 0; padding-left: 18px; }
          .ab-content li { margin: 2px 0; }
          .ab-content code {
            font-size: 12px; padding: 1px 4px; border-radius: 3px;
            background: ${codeBg};
          }
          .ab-content pre { margin: 6px 0; }
          .ab-content pre code { padding: 8px; display: block; }
        `}</style>
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>

      {/* Hover ring */}
      {(isHovered || isSelected) && (
        <div
          style={{
            position: 'absolute',
            inset: 4,
            border: `2px solid ${accent}`,
            borderRadius: 8,
            opacity: isSelected ? 0.6 : 0.3,
            pointerEvents: 'none',
            transition: 'opacity 0.2s',
          }}
        />
      )}
    </div>
  );
};

// ─── Constants ────────────────────────────────────────────────────────────────

const PROMPT_TYPE_LABELS: Record<string, string> = {
  comment_generation: 'Comment Generation',
  test_generation: 'Test Generation',
  suggested_comments: 'Suggested Comments',
  submission_summary: 'Submission Summary',
  assignment_description: 'Assignment Description',
};

export default ABComparisonModal;
