// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Input, Modal, Typography } from 'antd';
import type { InputRef } from 'antd';
import { AppstoreOutlined, BookOutlined, SearchOutlined, UserOutlined } from '@ant-design/icons';
import type { Course, Organization } from '../../api-client';
import { UserIO } from '../../services/user';
import { startImpersonation } from '../core/impersonation';

const { Text } = Typography;

export interface JumpTab {
  label: string;
  go: () => void;
  /** Other words that should find this page: its old name, a synonym. */
  keywords?: string[];
}

interface JumpPaletteProps {
  open: boolean;
  onClose: () => void;
  tabs: JumpTab[];
  courses: Course[];
  /** Names the organisation beside a course: two "cs101 s2020" rows need telling apart. */
  organizations?: Organization[];
  onCourse: (course: Course) => void;
  onUser: (email: string) => void;
}

interface JumpResult {
  key: string;
  group: 'Pages' | 'Courses' | 'Users';
  icon: React.ReactNode;
  title: string;
  hint?: string;
  run: () => void;
  /** A second verb on the row (Ctrl+Enter, or its own button): for users, Log in as. */
  secondary?: { label: string; run: () => void };
}

/** The most common support action, one keystroke from a user result. Same dialog as the Courses menu. */
const confirmLoginAs = (email: string) =>
  Modal.confirm({
    title: `Log in as ${email}?`,
    content: 'You will see codePost as this user. A bar at the bottom of every page brings you back here.',
    okText: 'Log in as user',
    onOk: () => startImpersonation(email),
  });

const USER_SEARCH_DEBOUNCE_MS = 250;

/**
 * One keyboard path across the staff console: pages by name, courses by name or period,
 * users by email (the server searches those). Ctrl+K opens it from anywhere in the console.
 */
const JumpPalette: React.FC<JumpPaletteProps> = ({
  open,
  onClose,
  tabs,
  courses,
  organizations = [],
  onCourse,
  onUser,
}) => {
  const [query, setQuery] = useState('');
  const [userHits, setUserHits] = useState<string[]>([]);
  const [active, setActive] = useState(0);
  const inputRef = useRef<InputRef>(null);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setUserHits([]);
    setActive(0);
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, [open]);

  // Users live on the server: one small page of matches per pause in typing.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setUserHits([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      UserIO.listPage({ page: 1, pageSize: 6, search: q })
        .then((page) => {
          if (!cancelled) setUserHits((page.results ?? []).map((u) => u.email ?? '').filter(Boolean));
        })
        .catch(() => {
          if (!cancelled) setUserHits([]);
        });
    }, USER_SEARCH_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const results = useMemo<JumpResult[]>(() => {
    const q = query.trim().toLowerCase();
    const tabHits = tabs
      .filter((t) => !q || t.label.toLowerCase().includes(q) || (t.keywords ?? []).some((k) => k.includes(q)))
      .slice(0, q ? 5 : 6)
      .map((t) => ({
        key: `tab:${t.label}`,
        group: 'Pages' as const,
        icon: <AppstoreOutlined />,
        title: t.label,
        run: t.go,
      }));
    const courseHits = q
      ? courses
          .filter((c) => `${c.name} ${c.period}`.toLowerCase().includes(q))
          .slice(0, 6)
          .map((c) => ({
            key: `course:${c.id}`,
            group: 'Courses' as const,
            icon: <BookOutlined />,
            title: c.name,
            hint: [c.period, organizations.find((o) => o.id === c.organization)?.name].filter(Boolean).join(' · '),
            run: () => onCourse(c),
          }))
      : [];
    const users = userHits.map((email) => ({
      key: `user:${email}`,
      group: 'Users' as const,
      icon: <UserOutlined />,
      title: email,
      run: () => onUser(email),
      secondary: { label: 'Log in as', run: () => confirmLoginAs(email) },
    }));
    return [...tabHits, ...courseHits, ...users];
  }, [query, tabs, courses, organizations, userHits, onCourse, onUser]);

  // Esc or a pick hands focus back to wherever it was (the Jump button, or the page for Ctrl+K), not to <body>.
  // Layout effect: it must run before the dialog moves focus into itself.
  const openerRef = React.useRef<HTMLElement | null>(null);
  React.useLayoutEffect(() => {
    if (open) {
      openerRef.current = document.activeElement as HTMLElement | null;
      return;
    }
    const opener = openerRef.current;
    openerRef.current = null;
    if (opener && opener.isConnected && opener !== document.body) window.setTimeout(() => opener.focus(), 0);
  }, [open]);
  // Keep the highlight inside the list as results come and go.
  const activeIndex = results.length ? Math.min(active, results.length - 1) : 0;

  const choose = (result: JumpResult) => {
    onClose();
    result.run();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[activeIndex]) {
      e.preventDefault();
      const result = results[activeIndex];
      if ((e.ctrlKey || e.metaKey) && result.secondary) {
        onClose();
        result.secondary.run();
      } else {
        choose(result);
      }
    }
  };

  const activeId = results[activeIndex] ? `jump-${results[activeIndex].key}` : undefined;

  return (
    <Modal open={open} onCancel={onClose} footer={null} closable={false} width={520} styles={{ body: { padding: 8 } }}>
      <Input
        ref={inputRef}
        size="large"
        variant="borderless"
        prefix={<SearchOutlined />}
        placeholder="Jump to a page, course or user…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
        }}
        onKeyDown={onKeyDown}
        role="combobox"
        aria-label="Jump to a page, course or user"
        aria-expanded={true}
        aria-autocomplete="list"
        aria-controls="jump-results"
        aria-describedby="jump-hint"
        aria-activedescendant={activeId}
      />
      <div
        id="jump-results"
        role="listbox"
        aria-label="Matches"
        style={{ maxHeight: 360, overflowY: 'auto', borderTop: '1px solid rgba(0, 0, 0, 0.06)', marginTop: 4 }}
      >
        {results.length === 0 ? (
          <Text type="secondary" style={{ display: 'block', padding: '12px 10px' }}>
            {query.trim().length < 2 ? 'Type to search courses and users.' : 'No matches.'}
          </Text>
        ) : (
          results.map((result, i) => (
            <React.Fragment key={result.key}>
              {(i === 0 || results[i - 1].group !== result.group) && (
                <Text
                  type="secondary"
                  style={{ display: 'block', padding: '8px 10px 2px', fontSize: 11, letterSpacing: '0.04em' }}
                >
                  {result.group}
                </Text>
              )}
              <div
                id={`jump-${result.key}`}
                role="option"
                aria-selected={i === activeIndex}
                tabIndex={-1}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(result)}
                onKeyDown={(e) => e.key === 'Enter' && choose(result)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 10px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  background: i === activeIndex ? 'rgba(25, 134, 101, 0.1)' : undefined,
                }}
              >
                <span style={{ color: 'rgba(0, 0, 0, 0.55)' }}>{result.icon}</span>
                <span
                  style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                >
                  {result.title}
                </span>
                {result.hint && (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {result.hint}
                  </Text>
                )}
                {result.secondary && (
                  <Button
                    type="link"
                    size="small"
                    style={{ padding: '0 4px', height: 'auto' }}
                    aria-label={`${result.secondary.label} ${result.title}`}
                    title={`${result.secondary.label} (Ctrl+Enter)`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose();
                      result.secondary?.run();
                    }}
                  >
                    {result.secondary.label}
                  </Button>
                )}
              </div>
            </React.Fragment>
          ))
        )}
      </div>
      <Text id="jump-hint" type="secondary" style={{ display: 'block', padding: '6px 10px 2px', fontSize: 12 }}>
        ↑ ↓ to move · Enter opens (a person: finds them in Users) · Ctrl+Enter logs in as them · Esc to close
      </Text>
    </Modal>
  );
};

export default JumpPalette;
