// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './Markdown.css';

interface IProps {
  children?: string | null;
  /** Constrain block spacing for tight inline contexts (table cells, captions). */
  compact?: boolean;
}

// Render fenced code blocks (```lang) with syntax highlighting; keep inline `code` plain.
// The default rehype-sanitize schema preserves `language-*` classes on <code>.
const components: Components = {
  pre: ({ children }) => <>{children}</>,
  code({ className, children, ...props }) {
    const text = String(children ?? '');
    const match = /language-(\w+)/.exec(className || '');
    const isBlock = !!match || text.includes('\n');
    if (!isBlock) {
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }
    return (
      <SyntaxHighlighter
        language={match?.[1] ?? 'text'}
        style={oneLight}
        PreTag="div"
        customStyle={{ borderRadius: 6, fontSize: 13, margin: '0 0 0.6em', padding: '10px 12px' }}
      >
        {text.replace(/\n$/, '')}
      </SyntaxHighlighter>
    );
  },
};

/** Renders instructor-authored Markdown (GFM: tables, task lists, strikethrough) with
 *  syntax-highlighted fenced code blocks. Raw HTML is not parsed (no rehype-raw) and
 *  output is sanitized, so descriptions are safe to render. */
const Markdown: React.FC<IProps> = ({ children, compact }) => {
  if (!children || !children.trim()) return null;
  return (
    <div className={compact ? 'cp-markdown cp-markdown--compact' : 'cp-markdown'} style={{ overflowWrap: 'anywhere' }}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
};

export default Markdown;
