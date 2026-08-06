// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Button, Mentions, Modal, Select, Tooltip, Typography, type GetRef } from 'antd';
import { FullscreenExitOutlined, FullscreenOutlined } from '@ant-design/icons';
import { PromptVariable } from '../../api-client';
import './TemplateTextArea.css';

const { Text } = Typography;

type MentionsRef = GetRef<typeof Mentions>;

// Mirrors the backend's TOKEN_RE (core/prompts/variables.py) so the highlighting agrees
// with what the server will substitute: {name} or {name:argument}.
const TOKEN_RE = /\{([a-z][a-z0-9_]*)(?::([^{}\n]+))?\}/g;

// The computed styles copied from the live textarea onto the highlight overlay so both
// lay out text identically — the same property list rc-textarea's own height measurement
// uses, plus the wrapping rules a textarea gets from the UA stylesheet.
const OVERLAY_SIZING_STYLE = [
  'letter-spacing',
  'line-height',
  'padding-top',
  'padding-bottom',
  'padding-left',
  'padding-right',
  'font-family',
  'font-weight',
  'font-size',
  'font-variant',
  'text-transform',
  'text-indent',
  'word-break',
  'white-space',
  'overflow-wrap',
];

const KIND_LABELS: Record<string, string> = { static: 'Variables', file: 'Files' };

interface IProps {
  value?: string;
  onChange?: (value: string) => void;
  /** The insertable {variables}, e.g. from `quizzes/{id}/promptVariables/`. */
  variables: PromptVariable[];
  placeholder?: string;
  /** Minimum visible rows — the editor auto-grows from here up to `maxRows`. */
  rows?: number;
  /** Rows at which the editor stops growing and scrolls. Defaults to `rows + 6`. */
  maxRows?: number;
  disabled?: boolean;
  /** Show the expand-to-fullscreen button (default true). */
  expandable?: boolean;
  /** Title of the expanded editor modal. */
  label?: string;
  /** Show the character count (default true). */
  showCount?: boolean;
  /** Injected by antd Form.Item so its label focuses the editor. */
  id?: string;
  testId?: string;
}

/**
 * A prompt-template editor with `{variable}` autocomplete: typing `{` opens a picker fed
 * by a prompt-variables endpoint, and selecting inserts the full token (e.g.
 * `{assignment_file:starter.py}`). Renders in monospace with recognized variables tinted
 * (unknown ones flagged), auto-grows with its content, and can expand into a fullscreen
 * modal for longer prompts. Reusable for any template-aware editor — pass whatever
 * variable list the surrounding context supports.
 */
const TemplateTextArea: React.FC<IProps> = ({
  value,
  onChange,
  variables,
  placeholder,
  rows = 6,
  maxRows,
  disabled,
  expandable = true,
  label,
  showCount = true,
  id,
  testId,
}) => {
  const text = value ?? '';
  const [expanded, setExpanded] = React.useState(false);
  const mentionsRef = React.useRef<MentionsRef>(null);
  const overlayRef = React.useRef<HTMLDivElement>(null);
  // Caret offset to restore after the editor remounts (inline <-> modal swap).
  const pendingCaret = React.useRef<number | null>(null);

  const getTextarea = () =>
    (mentionsRef.current?.nativeElement?.querySelector('textarea') as HTMLTextAreaElement | null) ?? null;

  const options = React.useMemo(
    () =>
      variables.map((v) => ({
        // Mentions completes to prefix + value, so the value is the token minus its
        // leading '{' (keeping the trailing '}' closes the variable on insert).
        value: v.token.slice(1),
        key: v.token,
        label: (
          <span>
            <Text code>{v.token}</Text>{' '}
            <Text type="secondary" style={{ fontSize: 12 }}>
              {v.label}
            </Text>
          </span>
        ),
      })),
    [variables],
  );

  const knownNames = React.useMemo(() => new Set(variables.map((v) => v.name)), [variables]);

  // The overlay's text, split into plain runs and {variable} tokens. Known/unknown is
  // judged by variable NAME (not full token) because some variables accept arguments the
  // authoring context can't enumerate (e.g. {submission_file:...}) — the server validates
  // arguments precisely at save time. Never flag while the list is still loading.
  const segments = React.useMemo(() => {
    const out: { text: string; variable: boolean; unknown: boolean }[] = [];
    let last = 0;
    for (const m of text.matchAll(TOKEN_RE)) {
      const index = m.index ?? 0;
      if (index > last) out.push({ text: text.slice(last, index), variable: false, unknown: false });
      out.push({ text: m[0], variable: true, unknown: knownNames.size > 0 && !knownNames.has(m[1]) });
      last = index + m[0].length;
    }
    if (last < text.length) out.push({ text: text.slice(last), variable: false, unknown: false });
    return out;
  }, [text, knownNames]);

  // Options for the "Insert variable" dropdown, grouped by kind. One type covers both
  // group and leaf entries so antd's filterOption/optionRender see the leaf fields.
  type InsertOption = { label: string; title?: string; value?: string; options?: InsertOption[] };
  const insertOptions = React.useMemo<InsertOption[]>(() => {
    const byKind = new Map<string, PromptVariable[]>();
    for (const v of variables) {
      const group = byKind.get(v.kind) ?? [];
      group.push(v);
      byKind.set(v.kind, group);
    }
    return [...byKind.entries()].map(([kind, vars]) => ({
      label: KIND_LABELS[kind] ?? kind,
      title: kind,
      options: vars.map((v) => ({ value: v.token, label: v.label })),
    }));
  }, [variables]);

  const insertVariable = (token: string) => {
    const ta = getTextarea();
    const start = ta?.selectionStart ?? text.length;
    const end = ta?.selectionEnd ?? start;
    onChange?.(text.slice(0, start) + token + text.slice(end));
    const caret = start + token.length;
    requestAnimationFrame(() => {
      const el = getTextarea();
      if (el) {
        el.focus();
        el.setSelectionRange(caret, caret);
      }
    });
  };

  const toggleExpanded = (next: boolean) => {
    pendingCaret.current = getTextarea()?.selectionStart ?? null;
    setExpanded(next);
  };

  // Per editor instance (the inline <-> modal swap remounts it): align the overlay with
  // the textarea by copying its computed sizing styles (plus the root's border as a
  // transparent one, since antd puts the border on the root and the padding on the
  // textarea), keep their scroll positions in sync, and restore the carried-over caret.
  // The antd Modal mounts its children a frame late (rc-motion), so retry via rAF until
  // the editor's DOM actually exists.
  React.useLayoutEffect(() => {
    let raf = 0;
    let removeListener = () => {};
    const setup = () => {
      const ta = getTextarea();
      if (!ta) {
        raf = requestAnimationFrame(setup);
        return;
      }
      const overlay = overlayRef.current;
      if (overlay) {
        const taStyle = window.getComputedStyle(ta);
        for (const prop of OVERLAY_SIZING_STYLE) {
          overlay.style.setProperty(prop, taStyle.getPropertyValue(prop));
        }
        const root = mentionsRef.current?.nativeElement;
        if (root) {
          const rootStyle = window.getComputedStyle(root);
          overlay.style.borderStyle = 'solid';
          overlay.style.borderColor = 'transparent';
          for (const side of ['top', 'right', 'bottom', 'left']) {
            overlay.style.setProperty(`border-${side}-width`, rootStyle.getPropertyValue(`border-${side}-width`));
          }
        }
      }
      const syncScroll = () => {
        if (overlayRef.current) overlayRef.current.scrollTop = ta.scrollTop;
      };
      ta.addEventListener('scroll', syncScroll);
      removeListener = () => ta.removeEventListener('scroll', syncScroll);
      if (pendingCaret.current != null) {
        const caret = Math.min(pendingCaret.current, ta.value.length);
        pendingCaret.current = null;
        // After the antd Modal's own focus management has run.
        requestAnimationFrame(() => {
          ta.focus();
          ta.setSelectionRange(caret, caret);
        });
      }
    };
    setup();
    return () => {
      cancelAnimationFrame(raf);
      removeListener();
    };
  }, [expanded, disabled]);

  const renderEditor = (inModal: boolean) => {
    const minRows = inModal ? 20 : rows;
    const growTo = inModal ? 34 : (maxRows ?? rows + 6);
    return (
      <div data-testid={inModal ? undefined : testId}>
        <div className="cp-tta-header">
          {variables.length > 0 && !disabled && (
            <Select
              size="small"
              showSearch
              value={null}
              placeholder="Insert variable"
              aria-label="Insert variable"
              className="cp-tta-insert"
              popupMatchSelectWidth={360}
              options={insertOptions}
              filterOption={(input, option) =>
                `${option?.value ?? ''} ${option?.label ?? ''}`.toLowerCase().includes(input.toLowerCase())
              }
              optionRender={(option) => (
                <div>
                  <Text code>{option.value}</Text>{' '}
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {option.label}
                  </Text>
                </div>
              )}
              onSelect={(token) => insertVariable(String(token))}
            />
          )}
          <span className="cp-tta-header-right">
            {showCount && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {text.length.toLocaleString()} characters
              </Text>
            )}
            {expandable && (
              <Tooltip title={inModal ? 'Exit Full Screen' : 'Full Screen'}>
                <Button
                  size="small"
                  type="text"
                  aria-label={inModal ? 'Exit full screen' : 'Full screen'}
                  icon={inModal ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                  onClick={() => toggleExpanded(!inModal)}
                />
              </Tooltip>
            )}
          </span>
        </div>
        <div className={`cp-tta-surface${disabled ? '' : ' cp-tta-highlight'}`}>
          {!disabled && (
            <div ref={overlayRef} className="cp-tta-overlay" aria-hidden="true">
              {segments.map((s, i) =>
                s.variable ? (
                  <mark key={i} className={`cp-tta-var${s.unknown ? ' cp-tta-var-unknown' : ''}`}>
                    {s.text}
                  </mark>
                ) : (
                  <React.Fragment key={i}>{s.text}</React.Fragment>
                ),
              )}
              {/* A trailing newline in pre-wrap doesn't render a line box on its own —
                  this zero-width space keeps the overlay's height in step. */}
              {'\u200B'}
            </div>
          )}
          <Mentions
            ref={mentionsRef}
            id={id}
            value={value}
            onChange={onChange}
            prefix="{"
            split=""
            options={options}
            placeholder={placeholder}
            autoSize={{ minRows, maxRows: Math.max(growTo, minRows) }}
            disabled={disabled}
            filterOption={(input, option) =>
              String(option?.value ?? '').toLowerCase().includes(input.toLowerCase())
            }
          />
        </div>
      </div>
    );
  };

  return (
    <>
      {expanded ? (
        <div className="cp-tta-collapsed" data-testid={testId}>
          <Text type="secondary">Editing in expanded view…</Text>
        </div>
      ) : (
        renderEditor(false)
      )}
      <Modal
        title={label ?? 'Edit prompt'}
        open={expanded}
        width="min(1200px, 92vw)"
        destroyOnHidden
        onCancel={() => toggleExpanded(false)}
        footer={
          <Button type="primary" onClick={() => toggleExpanded(false)}>
            Done
          </Button>
        }
      >
        {expanded && renderEditor(true)}
      </Modal>
    </>
  );
};

export default TemplateTextArea;
