// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import React, { useContext, useState, useRef, useEffect } from 'react';
import { message } from 'antd';
import { ConsoleThemeContext } from '../../styles/abstracts/_console-theme-context';
import { PromptLabService, type PromptType } from '../../services/promptLab';

// ─── Props ────────────────────────────────────────────────────────────────────

interface AIFeedbackWidgetProps {
  /** Which prompt type generated this output */
  promptType: PromptType;
  /** Variant that was used for this output (null when unknown) */
  variantId?: number;
  /** The AI output text (stored with feedback for analysis) */
  aiOutput?: string;
  /** Optional experiment ID if this was part of an A/B test */
  experimentId?: number;
  /** Whether the user has a custom system prompt on the assignment */
  isCustomContext?: boolean;
  /** Optional usage record id */
  usageRecordId?: number;
  /** Compact mode — icon-only, no labels */
  compact?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

const AIFeedbackWidget: React.FC<AIFeedbackWidgetProps> = ({
  promptType,
  variantId,
  aiOutput,
  experimentId,
  isCustomContext = false,
  usageRecordId,
  compact = false,
}) => {
  const { consoleTheme } = useContext(ConsoleThemeContext);
  const [rating, setRating] = useState<1 | -1 | null>(null);
  const [showTextInput, setShowTextInput] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (showTextInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showTextInput]);

  const submitFeedback = async (selectedRating: 1 | -1, text?: string) => {
    setSubmitting(true);
    try {
      await PromptLabService.submitFeedback({
        promptType,
        variantUsed: variantId ?? null,
        rating: selectedRating,
        feedbackText: text || undefined,
        aiOutputA: aiOutput,
        experiment: experimentId ?? null,
        isCustomContext,
        usageRecord: usageRecordId ?? null,
      });
      setSubmitted(true);
    } catch {
      message.error('Could not save feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRate = (value: 1 | -1) => {
    if (submitted || submitting) return;
    setRating(value);
    // On thumbs-down, show the text feedback prompt
    if (value === -1) {
      setShowTextInput(true);
    } else {
      submitFeedback(value);
    }
  };

  const handleSubmitText = () => {
    if (rating) {
      submitFeedback(rating, feedbackText);
      setShowTextInput(false);
    }
  };

  const handleSkipText = () => {
    if (rating) {
      submitFeedback(rating);
      setShowTextInput(false);
    }
  };

  if (submitted) {
    return (
      <div
        role="status"
        aria-live="polite"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 11,
          color: consoleTheme.commentAuthor,
          opacity: 0.8,
          transition: 'opacity 0.3s ease',
        }}
      >
        <CheckIcon size={12} color={consoleTheme.commentAuthor} />
        <span>{compact ? '' : 'Thanks'}</span>
      </div>
    );
  }

  return (
    <div
      style={{ display: 'inline-flex', flexDirection: 'column', gap: 4 }}
      role="group"
      aria-label="Rate this AI output"
    >
      {/* Thumb buttons */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
        {!compact && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.03em',
              color: consoleTheme.commentAuthor,
              marginRight: 4,
              textTransform: 'uppercase',
              opacity: 0.7,
            }}
          >
            Helpful?
          </span>
        )}

        <ThumbButton
          direction="up"
          active={rating === 1}
          disabled={submitting}
          onClick={() => handleRate(1)}
          consoleTheme={consoleTheme}
        />
        <ThumbButton
          direction="down"
          active={rating === -1}
          disabled={submitting}
          onClick={() => handleRate(-1)}
          consoleTheme={consoleTheme}
        />
      </div>

      {/* Optional text input for negative feedback */}
      {showTextInput && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            animation: 'feedbackSlideIn 0.2s ease-out',
          }}
        >
          <style>{`
            @keyframes feedbackSlideIn {
              from { opacity: 0; transform: translateY(-4px); }
              to   { opacity: 1; transform: translateY(0); }
            }
          `}</style>
          <textarea
            ref={inputRef}
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="What could be better?"
            rows={2}
            aria-label="Optional feedback details"
            style={{
              width: '100%',
              minWidth: 180,
              maxWidth: 320,
              padding: '6px 8px',
              fontSize: 12,
              lineHeight: 1.4,
              color: consoleTheme.text,
              background: consoleTheme.commentTextArea,
              border: `1px solid ${consoleTheme.commentTitleBorder}`,
              borderRadius: 4,
              resize: 'vertical',
              outline: 'none',
              fontFamily: 'inherit',
              transition: 'border-color 0.15s',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#4e78ff';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = consoleTheme.commentTitleBorder;
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleSubmitText();
              }
            }}
          />
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
            <button
              onClick={handleSkipText}
              disabled={submitting}
              aria-label="Skip feedback text"
              style={{
                ...miniButtonStyle(consoleTheme, false),
              }}
            >
              Skip
            </button>
            <button
              onClick={handleSubmitText}
              disabled={submitting}
              aria-label="Submit feedback"
              style={{
                ...miniButtonStyle(consoleTheme, true),
              }}
            >
              {submitting ? '…' : 'Send'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

interface ThumbButtonProps {
  direction: 'up' | 'down';
  active: boolean;
  disabled: boolean;
  onClick: () => void;
  consoleTheme: Record<string, unknown>;
}

const ThumbButton: React.FC<ThumbButtonProps> = ({ direction, active, disabled, onClick, consoleTheme }) => {
  const [hovered, setHovered] = useState(false);
  const isUp = direction === 'up';

  const activeColor = isUp ? '#4ade80' : '#f87171';
  const baseColor = String(consoleTheme.commentAuthor ?? '#8b949e');

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={disabled}
      aria-label={isUp ? 'Thumbs up — helpful' : 'Thumbs down — not helpful'}
      aria-pressed={active}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 24,
        height: 24,
        padding: 0,
        border: 'none',
        borderRadius: 4,
        cursor: disabled ? 'default' : 'pointer',
        background: active ? `${activeColor}22` : hovered ? `${baseColor}18` : 'transparent',
        transition: 'background 0.15s, transform 0.1s',
        transform: active ? 'scale(1.1)' : hovered ? 'scale(1.05)' : 'scale(1)',
        opacity: disabled && !active ? 0.4 : 1,
      }}
    >
      {isUp ? (
        <ThumbUpIcon size={14} color={active ? activeColor : hovered ? activeColor : baseColor} />
      ) : (
        <ThumbDownIcon size={14} color={active ? activeColor : hovered ? activeColor : baseColor} />
      )}
    </button>
  );
};

// ─── Icons (inline SVG for zero-dependency rendering) ─────────────────────────

const ThumbUpIcon: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M7 10v12" />
    <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" />
  </svg>
);

const ThumbDownIcon: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M17 14V2" />
    <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z" />
  </svg>
);

const CheckIcon: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

function miniButtonStyle(consoleTheme: Record<string, unknown>, primary: boolean): React.CSSProperties {
  return {
    padding: '3px 10px',
    fontSize: 11,
    fontWeight: 500,
    lineHeight: '16px',
    border: primary ? 'none' : `1px solid ${consoleTheme.commentTitleBorder}`,
    borderRadius: 4,
    cursor: 'pointer',
    background: primary ? '#4e78ff' : 'transparent',
    color: primary ? '#fff' : String(consoleTheme.commentAuthor ?? '#8b949e'),
    transition: 'background 0.15s, opacity 0.15s',
  };
}

export default AIFeedbackWidget;
