// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import React, { useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { visit } from 'unist-util-visit';
import { getDocByPath, getDocRoutes } from './DocsLoader';
import { Image, Typography, Alert, Breadcrumb, Divider } from 'antd';
import { useParams, Link, useLocation } from 'react-router-dom';
import { colors } from '../../theme/colors';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  HomeOutlined,
  LeftOutlined,
  RightOutlined,
  InfoCircleOutlined,
  BulbOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import DocsTOC, { TOCItem } from './DocsTOC';
import useWindowSize from '../core/useWindowSize';
import LanguageScriptSelector from './LanguageScriptSelector';
const { Title, Text } = Typography;
const SCRIPT_FORMAT_SELECTOR_TOKEN = '[[SCRIPT_FORMAT_SELECTOR]]';

const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-'); // Replace multiple - with single -
};

// Helper to extract full text content from React children
const getTextContent = (child: any): string => {
  if (!child) return '';
  if (typeof child === 'string') return child;
  if (typeof child === 'number') return String(child);
  if (Array.isArray(child)) return child.map(getTextContent).join('');
  if (child.props?.children) return getTextContent(child.props.children);
  return '';
};

const HeadingWithAnchor: React.FC<{
  level: 1 | 2 | 3;
  id: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ level, id, children, style }) => {
  const [hovered, setHovered] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const copyLink = (e: React.MouseEvent) => {
    e.preventDefault();
    const url = `${window.location.origin}${window.location.pathname}#${id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Title
      level={level}
      id={id}
      style={{ ...style, position: 'relative' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
      <a
        href={`#${id}`}
        onClick={copyLink}
        aria-label="Copy link to heading"
        style={{
          marginLeft: '8px',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.15s',
          color: copied ? colors.actionGreen : colors.neutralDisable,
          fontSize: level === 1 ? '18px' : level === 2 ? '16px' : '14px',
          verticalAlign: 'middle',
          textDecoration: 'none',
          cursor: 'pointer',
        }}
        title={copied ? 'Copied!' : 'Copy link'}
      >
        <LinkOutlined />
      </a>
    </Title>
  );
};

// Plugin to remove HTML comments from markdown
const remarkRemoveComments = () => {
  return (tree: any) => {
    visit(tree, 'html', (node: any, index: any, parent: any) => {
      if (node.value.trim().startsWith('<!--')) {
        parent.children.splice(index, 1);
        return index;
      }
    });
  };
};

const DocsContent: React.FC = () => {
  const { '*': splat } = useParams();
  const { width } = useWindowSize(); // Use window size hook

  const { search, hash } = useLocation();
  const highlightTerm = new URLSearchParams(search).get('highlight');

  // Scroll to anchor hash, highlight match, or top — retrying until the element exists
  useEffect(() => {
    const anchorId = hash ? hash.slice(1) : null;

    if (highlightTerm) {
      // Search highlight takes priority over anchor
      let attempts = 0;
      const tryScroll = () => {
        const element = document.querySelector('.doc-match-highlight');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (attempts++ < 20) {
          setTimeout(tryScroll, 50);
        }
      };
      setTimeout(tryScroll, 50);
    } else if (anchorId) {
      // Retry until the heading element is in the DOM (content may still be rendering)
      let attempts = 0;
      const tryScroll = () => {
        const element = document.getElementById(anchorId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (attempts++ < 20) {
          setTimeout(tryScroll, 50);
        }
      };
      setTimeout(tryScroll, 50);
    } else {
      window.scrollTo(0, 0);
    }
  }, [splat, highlightTerm, hash]);

  const renderWithHighlight = (nodes: React.ReactNode) => {
    if (!highlightTerm || !nodes) return nodes;

    const term = highlightTerm.toLowerCase();

    const highlightRecursive = (n: React.ReactNode): React.ReactNode => {
      return React.Children.map(n, (child) => {
        if (typeof child === 'string') {
          if (child.toLowerCase().includes(term)) {
            const parts = child.split(new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
            return (
              <>
                {parts.map((part, i) =>
                  part.toLowerCase() === term ? (
                    <mark
                      key={i}
                      className="doc-match-highlight"
                      style={{
                        backgroundColor: colors.actionYellowFade,
                        padding: '0 2px',
                        borderRadius: '2px',
                        color: 'inherit',
                      }}
                    >
                      {part}
                    </mark>
                  ) : (
                    part
                  ),
                )}
              </>
            );
          }
          return child;
        }
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            children: highlightRecursive((child.props as any).children),
          });
        }
        return child;
      });
    };

    return highlightRecursive(nodes);
  };

  const currentPath = splat || '';
  const docRoutes = getDocRoutes();
  const currentRoute = docRoutes.find((r) => r.path === currentPath);

  let content = '';
  let error: string | null = null;

  if (!currentRoute) {
    error = 'Document not found';
  } else {
    const doc = getDocByPath(currentPath);

    if (doc) {
      // Strip leading h1 from markdown — the page already renders an h1 from the route title
      content = doc.content.replace(/^#\s+.+\n*/, '');
    } else {
      error = `File not found: ${currentRoute.fileName}`;
    }
  }

  // Parse headers for TOC
  const tocItems = useMemo(() => {
    const items: TOCItem[] = [];
    const lines = content.split('\n');
    let inCodeBlock = false;

    lines.forEach((line) => {
      if (line.trim().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        return;
      }
      if (inCodeBlock) return;

      const h2Match = line.match(/^##\s+(.+)$/);
      if (h2Match) {
        items.push({ id: slugify(h2Match[1]), text: h2Match[1].replace(/[`_*]/g, ''), level: 2 });
        return;
      }
      const h3Match = line.match(/^###\s+(.+)$/);
      if (h3Match) {
        items.push({ id: slugify(h3Match[1]), text: h3Match[1].replace(/[`_*]/g, ''), level: 3 });
      }
    });
    return items;
  }, [content]);

  // Determine Next/Prev routes
  const { prevRoute, nextRoute } = useMemo(() => {
    if (!currentRoute) return { prevRoute: null, nextRoute: null };
    const currentIndex = docRoutes.findIndex((r) => r.key === currentRoute.key);
    return {
      prevRoute: currentIndex > 0 ? docRoutes[currentIndex - 1] : null,
      nextRoute: currentIndex < docRoutes.length - 1 ? docRoutes[currentIndex + 1] : null,
    };
  }, [currentRoute, docRoutes]);

  if (error) {
    return (
      <div style={{ padding: '50px', maxWidth: '800px' }}>
        <Title level={1}>Documentation Error</Title>
        <Alert message="Error" description={error} type="error" showIcon />
      </div>
    );
  }

  const Components: Components = {
    h1: ({ node: _node, children }: any) => {
      const text = getTextContent(children);
      const id = slugify(text);
      return (
        <HeadingWithAnchor
          level={1}
          id={id}
          style={{ marginTop: 0, marginBottom: '24px', color: colors.neutralTitle, fontWeight: 700 }}
        >
          {children}
        </HeadingWithAnchor>
      );
    },
    h2: ({ node: _node, children }: any) => {
      const text = getTextContent(children);
      const id = slugify(text);
      return (
        <HeadingWithAnchor
          level={2}
          id={id}
          style={{
            marginTop: '48px',
            marginBottom: '24px',
            color: colors.neutralTitle,
            fontWeight: 600,
            borderBottom: `1px solid ${colors.neutralBorder}`,
            paddingBottom: '10px',
          }}
        >
          {children}
        </HeadingWithAnchor>
      );
    },
    h3: ({ node: _node, children }: any) => {
      const text = getTextContent(children);
      const id = slugify(text);
      return (
        <HeadingWithAnchor
          level={3}
          id={id}
          style={{ marginTop: '32px', marginBottom: '16px', color: colors.neutralTitle, fontWeight: 600 }}
        >
          {children}
        </HeadingWithAnchor>
      );
    },
    p: ({ node: _node, children, ...props }: any) =>
      (() => {
        const paragraphText = React.Children.toArray(children)
          .map((child) => (typeof child === 'string' ? child : ''))
          .join('')
          .trim();

        if (paragraphText === SCRIPT_FORMAT_SELECTOR_TOKEN) {
          return <LanguageScriptSelector />;
        }

        return (
          <div
            style={{ marginBottom: '20px', fontSize: '16px', color: colors.neutralMainText, lineHeight: '28px' }}
            {...props}
          >
            {renderWithHighlight(children)}
          </div>
        );
      })(),
    a: ({ node: _node, children, href, ...props }: any) => {
      const isInternal = href && href.startsWith('/docs');
      if (isInternal) {
        return (
          <Link to={href} className="text-link">
            {children}
          </Link>
        );
      }
      return (
        <a href={href} className="text-link" target="_blank" rel="noopener noreferrer" {...props}>
          {children}
        </a>
      );
    },
    li: ({ node: _node, children, checked, ...props }: any) => {
      // If it's a task list item (checkbox), ensure the input has an aria-label
      if (checked !== null && checked !== undefined) {
        return (
          <li
            style={{
              marginBottom: '12px',
              fontSize: '16px',
              color: colors.neutralMainText,
              lineHeight: '28px',
              listStyleType: 'none',
            }}
            {...props}
          >
            <input type="checkbox" checked={checked} readOnly style={{ marginRight: '8px' }} aria-label="Task item" />
            {renderWithHighlight(
              React.Children.map(children, (child) => {
                // Remove the extra input react-markdown adds if we're rendering our own
                if (React.isValidElement(child) && child.type === 'input') return null;
                return child;
              }),
            )}
          </li>
        );
      }
      return (
        <li
          style={{ marginBottom: '12px', fontSize: '16px', color: colors.neutralMainText, lineHeight: '28px' }}
          {...props}
        >
          {renderWithHighlight(children)}
        </li>
      );
    },
    blockquote: ({ node: _node, children, ...props }: any) => {
      // Check for GitHub-style alerts: [!NOTE], [!TIP], [!WARNING], [!IMPORTANT], [!CAUTION]

      const fullText = getTextContent(children);

      // Detect alert type from content
      let alertType: 'note' | 'tip' | 'warning' | 'important' | 'caution' | null = null;
      let marker = '';

      if (fullText.includes('[!NOTE]')) {
        alertType = 'note';
        marker = '[!NOTE]';
      } else if (fullText.includes('[!TIP]')) {
        alertType = 'tip';
        marker = '[!TIP]';
      } else if (fullText.includes('[!WARNING]')) {
        alertType = 'warning';
        marker = '[!WARNING]';
      } else if (fullText.includes('[!IMPORTANT]')) {
        alertType = 'important';
        marker = '[!IMPORTANT]';
      } else if (fullText.includes('[!CAUTION]')) {
        alertType = 'caution';
        marker = '[!CAUTION]';
      }

      if (alertType) {
        const alertStyles: Record<string, { bg: string; border: string; icon: React.ReactNode; title: string }> = {
          note: {
            bg: `${colors.actionBlue}1A`,
            border: colors.actionBlue,
            icon: <InfoCircleOutlined />,
            title: 'Note',
          },
          tip: { bg: `${colors.actionGreen}1A`, border: colors.actionGreen, icon: <BulbOutlined />, title: 'Tip' },
          warning: {
            bg: `${colors.actionYellow}1A`,
            border: colors.actionYellow,
            icon: <WarningOutlined />,
            title: 'Warning',
          },
          important: {
            bg: `${colors.brandAccent}1A`,
            border: colors.brandAccent,
            icon: <ExclamationCircleOutlined />,
            title: 'Important',
          },
          caution: {
            bg: `${colors.actionRed}1A`,
            border: colors.actionRed,
            icon: <CloseCircleOutlined />,
            title: 'Caution',
          },
        };
        const style = alertStyles[alertType];

        // Recursive function to strip the marker from the React tree
        const cleanChildren = (nodes: React.ReactNode): React.ReactNode => {
          return React.Children.map(nodes, (child) => {
            if (typeof child === 'string') {
              // Only replace if it actually contains the marker to avoid unnecessary regex
              if (child.includes(marker)) {
                return child.replace(new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*', 'i'), '');
              }
              return child;
            }
            if (React.isValidElement(child)) {
              const childEl = child as React.ReactElement<any>;
              // If it's the paragraph containing the marker, filter it deeper
              if (childEl.type === 'p' && getTextContent(childEl).includes(marker)) {
                return React.cloneElement(childEl, {
                  ...childEl.props,
                  children: cleanChildren(childEl.props.children),
                });
              }
              // Otherwise return as is, or recurse if needed (usually marker is top level)
              // For safety, let's just recurse if it matches marker
              if (getTextContent(childEl).includes(marker)) {
                return React.cloneElement(childEl, {
                  ...childEl.props,
                  children: cleanChildren(childEl.props.children),
                });
              }
            }
            return child;
          });
        };

        return (
          <div
            style={{
              background: style.bg,
              borderLeft: `4px solid ${style.border}`,
              padding: '16px',
              margin: '24px 0',
              borderRadius: '4px',
            }}
          >
            <div
              style={{
                fontWeight: 600,
                marginBottom: '8px',
                color: colors.neutralTitle,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span style={{ color: style.border, display: 'flex' }}>{style.icon}</span> {style.title}
            </div>
            <div style={{ color: colors.neutralMainText, lineHeight: '1.6' }}>
              {renderWithHighlight(cleanChildren(children))}
            </div>
          </div>
        );
      }

      // Default blockquote styling
      return (
        <blockquote
          style={{
            borderLeft: `4px solid ${colors.brandPrimary}`,
            paddingLeft: '16px',
            marginLeft: 0,
            color: colors.neutralSecondaryText,
            fontStyle: 'italic',
            background: colors.brandLight,
            padding: '16px',
          }}
          {...props}
        >
          {renderWithHighlight(children)}
        </blockquote>
      );
    },
    code({ node: _node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      const uniqueId = Math.random().toString(36).substr(2, 9);
      return !inline && match ? (
        <div
          role="region"
          aria-label={`${match[1]} code example ${uniqueId}`}
          tabIndex={0}
          style={{
            borderRadius: '8px',
            overflow: 'hidden',
            margin: '24px 0',
            border: `1px solid ${colors.neutralBorder}`,
          }}
        >
          <div
            style={{
              background: colors.neutralBackground,
              padding: '8px 16px',
              fontSize: '12px',
              color: colors.neutralSecondaryText,
              borderBottom: `1px solid ${colors.neutralBorder}`,
            }}
          >
            {match[1].toUpperCase()}
          </div>
          <SyntaxHighlighter
            style={vscDarkPlus}
            language={match[1]}
            PreTag={(preProps: any) => <div tabIndex={0} {...preProps} />}
            customStyle={{
              margin: 0,
              padding: '16px',
              fontFamily: '"Roboto Mono", "Fira Code", Menlo, Monaco, Consolas, monospace',
              fontSize: '14px',
              lineHeight: '1.6',
            }}
            codeTagProps={{
              style: {
                fontFamily: '"Roboto Mono", "Fira Code", Menlo, Monaco, Consolas, monospace',
                fontSize: '14px',
                lineHeight: '1.6',
              },
            }}
            {...props}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        </div>
      ) : (
        <code
          className={className}
          style={{
            background: colors.neutralBackground,
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '85%',
            fontFamily: '"Roboto Mono", "Fira Code", Menlo, Monaco, Consolas, monospace',
            color: colors.green9,
          }}
          {...props}
        >
          {children}
        </code>
      );
    },
    table: ({ node: _node, children, ...props }: any) => {
      // Create a unique id for the table based on its content (headers) or simple random string
      const tableId = `table-${Math.random().toString(36).substr(2, 9)}`;
      return (
        <div
          role="region"
          aria-labelledby={tableId}
          tabIndex={0}
          style={{
            overflowX: 'auto',
            marginBottom: '24px',
            borderRadius: '8px',
            border: `1px solid ${colors.neutralBorder}`,
          }}
        >
          <table
            id={tableId}
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '14px',
            }}
            {...props}
          >
            {children}
          </table>
        </div>
      );
    },
    thead: ({ node: _node, children, ...props }: any) => (
      <thead style={{ backgroundColor: colors.neutralBackground }} {...props}>
        {children}
      </thead>
    ),
    tbody: ({ node: _node, children, ...props }: any) => <tbody {...props}>{children}</tbody>,
    tr: ({ node: _node, children, ...props }: any) => (
      <tr style={{ borderBottom: `1px solid ${colors.neutralBorder}` }} {...props}>
        {children}
      </tr>
    ),
    th: ({ node: _node, children, ...props }: any) => {
      // Check if children is empty to provide discernible text for screen readers
      const isEmpty =
        !children ||
        (Array.isArray(children) && children.length === 0) ||
        (typeof children === 'string' && children.trim() === '');
      return (
        <th
          style={{
            padding: '12px 16px',
            fontWeight: 600,
            textAlign: 'left',
            color: colors.neutralTitle,
          }}
          {...props}
        >
          {isEmpty ? (
            <span
              style={{
                position: 'absolute',
                width: '1px',
                height: '1px',
                padding: '0',
                margin: '-1px',
                overflow: 'hidden',
                clip: 'rect(0, 0, 0, 0)',
                whiteSpace: 'nowrap',
                border: '0',
              }}
            >
              Empty header
            </span>
          ) : (
            renderWithHighlight(children)
          )}
        </th>
      );
    },
    td: ({ node: _node, children, ...props }: any) => (
      <td
        style={{
          padding: '12px 16px',
          color: colors.neutralMainText,
        }}
        {...props}
      >
        {renderWithHighlight(children)}
      </td>
    ),
    img: ({ node: _node, ...props }: any) => (
      <div style={{ display: 'flex', justifyContent: 'center', margin: '32px 0' }}>
        <Image
          alt={props.alt || ''}
          style={{
            maxWidth: '100%',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(22, 11, 11, 0.1)',
            border: `1px solid ${colors.neutralBorder}`,
          }}
          {...props}
        />
      </div>
    ),
  };

  return (
    <div style={{ display: 'flex', width: '100%' }}>
      <div style={{ flex: 1, padding: '60px 40px', maxWidth: '850px', minWidth: 0 }}>
        {/* Breadcrumb Header */}
        <div style={{ marginBottom: '40px' }}>
          <Breadcrumb
            items={[
              {
                title: (
                  <Link to="/docs">
                    <HomeOutlined />
                  </Link>
                ),
              },
              { title: currentRoute?.category },
              { title: currentRoute?.title },
            ]}
          />
          {currentRoute && (
            <>
              <Title level={1} style={{ marginTop: '16px', marginBottom: '8px', color: colors.brandBlack }}>
                {currentRoute.title}
              </Title>
              <Text style={{ color: colors.neutralSecondaryText, fontSize: '18px' }}>
                {currentRoute.category} Guide
              </Text>
              <Divider style={{ margin: '24px 0' }} />
            </>
          )}
        </div>

        {/* Main Content */}
        <Typography>
          <ReactMarkdown remarkPlugins={[remarkGfm, remarkRemoveComments]} components={Components}>
            {content}
          </ReactMarkdown>
        </Typography>

        {/* Pagination */}
        <div
          style={{
            marginTop: '80px',
            paddingTop: '40px',
            borderTop: `1px solid ${colors.neutralBorder}`,
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '20px',
          }}
        >
          {prevRoute ? (
            <Link
              to={`/docs/${prevRoute.path}`}
              style={{
                cursor: 'pointer',
                border: `1px solid ${colors.neutralBorder}`,
                padding: '16px',
                borderRadius: '8px',
                flex: 1,
                maxWidth: '300px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                transition: 'all 0.2s',
                background: 'white',
                textDecoration: 'none',
              }}
            >
              <Text
                type="secondary"
                style={{
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  marginBottom: '4px',
                  color: 'rgba(0, 0, 0, 0.65)',
                }}
              >
                <LeftOutlined /> Previous
              </Text>
              <Text strong style={{ fontSize: '16px', color: colors.brandPrimary }}>
                {prevRoute.title}
              </Text>
            </Link>
          ) : (
            <div style={{ flex: 1 }} />
          )}

          {nextRoute ? (
            <Link
              to={`/docs/${nextRoute.path}`}
              style={{
                cursor: 'pointer',
                border: `1px solid ${colors.neutralBorder}`,
                padding: '16px',
                borderRadius: '8px',
                flex: 1,
                maxWidth: '300px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                textAlign: 'right',
                transition: 'all 0.2s',
                background: 'white',
                textDecoration: 'none',
              }}
            >
              <Text
                type="secondary"
                style={{
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  marginBottom: '4px',
                  color: 'rgba(0, 0, 0, 0.65)',
                }}
              >
                Next <RightOutlined />
              </Text>
              <Text strong style={{ fontSize: '16px', color: colors.brandPrimary }}>
                {nextRoute.title}
              </Text>
            </Link>
          ) : (
            <div style={{ flex: 1 }} />
          )}
        </div>

        <div style={{ marginTop: '40px', textAlign: 'center', color: colors.neutralSecondaryText }}>
          <Text type="secondary" style={{ color: 'rgba(0, 0, 0, 0.65)' }}>
            codePost Documentation &copy; {new Date().getFullYear()}
          </Text>
        </div>
      </div>

      {/* Right TOC Side - Only show on large screens */}
      {width > 1200 && (
        <div style={{ width: '250px', padding: '60px 20px 0 0', flexShrink: 0 }}>
          <DocsTOC key={currentPath} items={tocItems} />
        </div>
      )}
    </div>
  );
};

export default DocsContent;
