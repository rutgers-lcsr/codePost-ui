import React, { useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { visit } from 'unist-util-visit';
import { docRoutes } from './DocsConfig';
import { Typography, Alert, Breadcrumb, Divider } from 'antd';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { colors } from '../../theme/colors';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  HomeOutlined,
  LeftOutlined,
  RightOutlined,
  InfoCircleOutlined,
  BulbOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import DocsTOC, { TOCItem } from './DocsTOC';
import useWindowSize from '../core/useWindowSize';

const { Title, Text } = Typography;

const modules = import.meta.glob('../../docs/content/*.md', { query: '?raw', import: 'default', eager: true });

const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-'); // Replace multiple - with single -
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
  const navigate = useNavigate();
  const { width } = useWindowSize(); // Use window size hook

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [splat]);

  const currentPath = splat || '';
  const currentRoute = docRoutes.find((r) => r.path === currentPath);

  let content = '';
  let error: string | null = null;

  if (!currentRoute) {
    error = 'Document not found';
  } else {
    const pathKey = `../../docs/content/${currentRoute.fileName}`;
    const rawContent = modules[pathKey];

    if (typeof rawContent === 'string') {
      content = rawContent;
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
        items.push({ id: slugify(h2Match[1]), text: h2Match[1], level: 2 });
        return;
      }
      const h3Match = line.match(/^###\s+(.+)$/);
      if (h3Match) {
        items.push({ id: slugify(h3Match[1]), text: h3Match[1], level: 3 });
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
  }, [currentRoute]);

  if (error) {
    return (
      <div style={{ padding: '50px' }}>
        <Alert title="Error" description={error} type="error" showIcon />
      </div>
    );
  }

  const Components: Components = {
    h1: ({ node, children, ...props }: any) => {
      const text = String(children);
      // H1 doesn't usually need deep link in TOC, but good to have ID
      const id = slugify(text);
      return (
        <Title
          level={1}
          id={id}
          style={{ marginTop: 0, marginBottom: '24px', color: colors.neutralTitle, fontWeight: 700 }}
          {...props}
        >
          {children}
        </Title>
      );
    },
    h2: ({ node, children, ...props }: any) => {
      const text = String(children);
      const id = slugify(text);
      return (
        <Title
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
          {...props}
        >
          {children}
        </Title>
      );
    },
    h3: ({ node, children, ...props }: any) => {
      const text = String(children);
      const id = slugify(text);
      return (
        <Title
          level={3}
          id={id}
          style={{ marginTop: '32px', marginBottom: '16px', color: colors.neutralTitle, fontWeight: 600 }}
          {...props}
        >
          {children}
        </Title>
      );
    },
    p: ({ node, ...props }: any) => (
      <div
        style={{ marginBottom: '20px', fontSize: '16px', color: colors.neutralMainText, lineHeight: '28px' }}
        {...props}
      />
    ),
    li: ({ node, ...props }: any) => (
      <li
        style={{ marginBottom: '12px', fontSize: '16px', color: colors.neutralMainText, lineHeight: '28px' }}
        {...props}
      />
    ),
    blockquote: ({ node, children, ...props }: any) => {
      // Check for GitHub-style alerts: [!NOTE], [!TIP], [!WARNING], [!IMPORTANT], [!CAUTION]

      // Helper to extract full text content from children
      const getTextContent = (child: any): string => {
        if (!child) return '';
        if (typeof child === 'string') return child;
        if (typeof child === 'number') return String(child);
        if (Array.isArray(child)) return child.map(getTextContent).join('');
        if (child.props?.children) return getTextContent(child.props.children);
        return '';
      };

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
          note: { bg: '#e7f3ff', border: '#58a6ff', icon: <InfoCircleOutlined />, title: 'Note' },
          tip: { bg: '#eafaea', border: '#3fb950', icon: <BulbOutlined />, title: 'Tip' },
          warning: { bg: '#fff8e6', border: '#d29922', icon: <WarningOutlined />, title: 'Warning' },
          important: { bg: '#f3e8ff', border: '#a371f7', icon: <ExclamationCircleOutlined />, title: 'Important' },
          caution: { bg: '#ffebe9', border: '#f85149', icon: <CloseCircleOutlined />, title: 'Caution' },
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
                color: style.border,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {style.icon} {style.title}
            </div>
            <div style={{ color: colors.neutralMainText, lineHeight: '1.6' }}>{cleanChildren(children)}</div>
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
          {children}
        </blockquote>
      );
    },
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <div
          style={{
            borderRadius: '8px',
            overflow: 'hidden',
            margin: '24px 0',
            border: `1px solid ${colors.neutralBorder}`,
          }}
        >
          <div
            style={{
              background: '#f5f5f5',
              padding: '8px 16px',
              fontSize: '12px',
              color: colors.neutralSecondaryText,
              borderBottom: `1px solid ${colors.neutralBorder}`,
            }}
          >
            {match[1].toUpperCase()}
          </div>
          <SyntaxHighlighter
            style={materialLight}
            language={match[1]}
            PreTag="div"
            customStyle={{ margin: 0, padding: '16px' }}
            {...props}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        </div>
      ) : (
        <code
          className={className}
          style={{
            background: 'rgba(0,0,0,0.06)',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '85%',
            fontFamily: 'Menlo, monospace',
            color: colors.brandDark,
          }}
          {...props}
        >
          {children}
        </code>
      );
    },
    img: ({ node, ...props }: any) => (
      <div style={{ display: 'flex', justifyContent: 'center', margin: '32px 0' }}>
        <img
          style={{
            maxWidth: '100%',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
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
            <div
              onClick={() => navigate(`/docs/${prevRoute.path}`)}
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
              }}
            >
              <Text type="secondary" style={{ fontSize: '12px', textTransform: 'uppercase', marginBottom: '4px' }}>
                <LeftOutlined /> Previous
              </Text>
              <Text strong style={{ fontSize: '16px', color: colors.brandPrimary }}>
                {prevRoute.title}
              </Text>
            </div>
          ) : (
            <div style={{ flex: 1 }} />
          )}

          {nextRoute ? (
            <div
              onClick={() => navigate(`/docs/${nextRoute.path}`)}
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
              }}
            >
              <Text type="secondary" style={{ fontSize: '12px', textTransform: 'uppercase', marginBottom: '4px' }}>
                Next <RightOutlined />
              </Text>
              <Text strong style={{ fontSize: '16px', color: colors.brandPrimary }}>
                {nextRoute.title}
              </Text>
            </div>
          ) : (
            <div style={{ flex: 1 }} />
          )}
        </div>

        <div style={{ marginTop: '40px', textAlign: 'center', color: colors.neutralSecondaryText }}>
          <Text type="secondary">codePost Documentation &copy; {new Date().getFullYear()}</Text>
        </div>
      </div>

      {/* Right TOC Side - Only show on large screens */}
      {width > 1200 && (
        <div style={{ width: '250px', padding: '60px 20px 0 0', flexShrink: 0 }}>
          <DocsTOC items={tocItems} />
        </div>
      )}
    </div>
  );
};

export default DocsContent;
