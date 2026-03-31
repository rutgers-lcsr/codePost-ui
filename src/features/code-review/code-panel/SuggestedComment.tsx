// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import React, { useContext, useMemo, useRef, useState } from 'react';
import { CheckOutlined, CloseOutlined, LoadingOutlined } from '@ant-design/icons';
import { message, Tag } from 'antd';
import BlockMarkdown from '../../../components/core/BlockMarkdown';
import CPButton from '../../../components/core/CPButton';
import CPTooltip from '../../../components/core/CPTooltip';
import { ConsoleThemeContext } from '../../../styles/abstracts/_console-theme-context';
import type { RubricCategoryType, SuggestedCommentType } from '../../../types/models';
import type { RubricComment } from '../../../api-client';
import { File, type FileType } from '../../../utils/file';
import {
  scrollHighlightIntoView,
  SUGGESTION_ID_OFFSET,
  useCommentHighlightStore,
  useHoveredCommentId,
} from './CommentHighlightContext';

interface SuggestedCommentProps {
  suggestion: SuggestedCommentType;
  file: FileType;
  onAccept: (suggestion: SuggestedCommentType) => Promise<void>;
  onReject: (suggestion: SuggestedCommentType) => Promise<void>;
  rubricCategories?: RubricCategoryType[];
  allRubricComments?: RubricComment[];
}

const SuggestedComment: React.FC<SuggestedCommentProps> = ({
  suggestion,
  file,
  onAccept,
  onReject,
  rubricCategories,
  allRubricComments,
}) => {
  const { consoleTheme } = useContext(ConsoleThemeContext);
  const { setHoveredCommentId } = useCommentHighlightStore();
  const hoveredCommentId = useHoveredCommentId();
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const highlightId = suggestion.id + SUGGESTION_ID_OFFSET;
  const isContextHovered = hoveredCommentId === highlightId;
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // When hovered from the code panel side, scroll this card into view
  React.useEffect(() => {
    if (isContextHovered && cardRef.current) {
      const el = cardRef.current;
      const scrollParent = el.closest('.code-panel--comments') ?? el.closest('.grade-panel--comments');
      if (scrollParent) {
        const eRect = el.getBoundingClientRect();
        const pRect = scrollParent.getBoundingClientRect();
        const isVisible = eRect.top >= pRect.top + 10 && eRect.bottom <= pRect.bottom - 10;
        if (!isVisible) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  }, [isContextHovered]);

  const handleMouseEnter = () => {
    // Instant: update context so CSS hover class is applied immediately
    setHoveredCommentId(highlightId);

    // Debounced scroll so quick sweeps don't cause jitter (matches Comment behavior)
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = setTimeout(() => {
      const highlightEl = document.querySelector<HTMLElement>(`.highlight-${highlightId}`);
      const codeScrollArea = document.getElementById('code-scroll-area');
      const alreadyVisible =
        highlightEl &&
        codeScrollArea &&
        (() => {
          const hRect = highlightEl.getBoundingClientRect();
          const cRect = codeScrollArea.getBoundingClientRect();
          return hRect.top >= cRect.top + 10 && hRect.bottom <= cRect.bottom - 10;
        })();

      if (!alreadyVisible) {
        scrollHighlightIntoView(highlightId, { lineNumber: suggestion.startLine ?? 0 });
      }
    }, 150);
  };

  const handleMouseLeave = () => {
    if (scrollTimerRef.current) {
      clearTimeout(scrollTimerRef.current);
      scrollTimerRef.current = null;
    }
    setHoveredCommentId(null);
  };

  const handleClick = () => {
    scrollHighlightIntoView(highlightId, { lineNumber: suggestion.startLine ?? 0 });
  };

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      await onAccept(suggestion);
    } catch {
      message.error('Failed to accept suggestion');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    try {
      await onReject(suggestion);
    } catch {
      message.error('Failed to dismiss suggestion');
    } finally {
      setIsRejecting(false);
    }
  };

  const codeType = File.codeType(file);
  let lineLabel: string;
  if (['markdown', 'jupyter'].includes(codeType)) {
    lineLabel = `Cell ${(suggestion.startLine ?? 0) + 1}`;
  } else if (codeType === 'pdf') {
    lineLabel = `Page ${suggestion.startLine ?? 0}`;
  } else {
    lineLabel =
      suggestion.startLine === suggestion.endLine
        ? `Line ${(suggestion.startLine ?? 0) + 1}`
        : `Lines ${(suggestion.startLine ?? 0) + 1}–${(suggestion.endLine ?? 0) + 1}`;
  }

  const busy = isAccepting || isRejecting;

  // Resolve rubric info if the suggestion references a rubricComment
  const rubricInfo = useMemo(() => {
    if (!suggestion.rubricComment || !allRubricComments || !rubricCategories) return null;
    const rc = allRubricComments.find((r) => r.id === suggestion.rubricComment);
    if (!rc) return null;
    const category = rubricCategories.find((cat) => cat.id === rc.category);
    return { rubricComment: rc, categoryName: category?.name ?? 'Rubric' };
  }, [suggestion.rubricComment, allRubricComments, rubricCategories]);

  return (
    <div
      ref={cardRef}
      id={`suggestion-${suggestion.id}`}
      role="article"
      aria-label={`AI suggestion for ${lineLabel}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      style={{
        position: 'relative',
        background: consoleTheme.commentBody,
        borderRadius: 6,
        border: `1px solid ${isContextHovered ? 'rgba(24, 144, 255, 0.5)' : consoleTheme.commentTitleBorder}`,
        boxShadow: isContextHovered
          ? '0 0 0 2px rgba(24, 144, 255, 0.25), 0 4px 12px rgba(24, 144, 255, 0.15)'
          : consoleTheme.commentShadow,
        transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 12px',
          background: consoleTheme.commentTitle,
          borderBottom: `1px solid ${consoleTheme.commentTitleBorder}`,
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.04em',
            color: consoleTheme.commentAuthor,
            textTransform: 'uppercase',
          }}
        >
          Suggestion
        </span>
        <span
          style={{
            fontSize: 11,
            color: consoleTheme.commentAuthor,
            fontFamily: 'monospace',
          }}
        >
          {lineLabel}
        </span>
        {rubricInfo && (
          <CPTooltip title={`${rubricInfo.categoryName} | ${rubricInfo.rubricComment.text ?? ''}`}>
            <Tag
              color={
                rubricInfo.rubricComment.pointDelta > 0
                  ? 'volcano'
                  : rubricInfo.rubricComment.pointDelta < 0
                    ? 'green'
                    : 'default'
              }
              style={{ fontSize: 10, lineHeight: '16px', margin: 0 }}
            >
              {rubricInfo.categoryName}
            </Tag>
          </CPTooltip>
        )}
        {(() => {
          // When a rubric comment is attached, show its points (that's what will be applied on accept)
          // pointDelta is stored inverted: -10 internally means a 10-point deduction displayed as +10
          const rawPoints = rubricInfo ? rubricInfo.rubricComment.pointDelta : suggestion.pointDelta;
          const displayPoints = rawPoints != null ? -rawPoints : null;
          return displayPoints != null && displayPoints !== 0 ? (
            <span
              style={{
                marginLeft: 'auto',
                fontSize: 11,
                fontWeight: 600,
                fontFamily: 'monospace',
                color: displayPoints < 0 ? '#f87171' : '#4ade80',
              }}
            >
              {displayPoints > 0 ? '+' : ''}
              {displayPoints}
            </span>
          ) : null;
        })()}
      </div>

      {/* Body */}
      <div
        style={{
          padding: '8px 12px 6px',
          fontSize: 13,
          color: consoleTheme.text,
          lineHeight: 1.55,
          overflowWrap: 'break-word',
          wordWrap: 'break-word',
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap',
          maxWidth: '100%',
        }}
      >
        <BlockMarkdown source={suggestion.text ?? ''} />
      </div>

      {/* Actions */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          justifyContent: 'flex-end',
          padding: '4px 10px 8px',
        }}
      >
        <CPTooltip title="Dismiss this suggestion">
          <CPButton
            size="small"
            cpType="secondary"
            icon={isRejecting ? <LoadingOutlined /> : <CloseOutlined />}
            onClick={handleReject}
            disabled={busy}
          >
            Dismiss
          </CPButton>
        </CPTooltip>
        <CPTooltip title="Accept and create a real comment">
          <CPButton
            size="small"
            cpType="primary"
            icon={isAccepting ? <LoadingOutlined /> : <CheckOutlined />}
            onClick={handleAccept}
            disabled={busy}
          >
            Accept
          </CPButton>
        </CPTooltip>
      </div>
    </div>
  );
};

export default SuggestedComment;
