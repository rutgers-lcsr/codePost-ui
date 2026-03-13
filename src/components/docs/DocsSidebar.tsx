// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import React, { useState, useMemo } from 'react';
import { Layout, Menu, Input } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import { docRoutes, DocCategory } from './DocsConfig';
import {
  AppstoreOutlined,
  TeamOutlined,
  RocketOutlined,
  SearchOutlined,
  ToolOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { colors } from '../../theme/colors';
import CPLogo from '../core/CPLogo';
import { getAllDocs } from './DocsLoader';
import Fuse from 'fuse.js';

const { Sider } = Layout;

const DocsSidebar: React.FC = () => {
  const location = useLocation();
  const [searchText, setSearchText] = useState('');

  // Determine selected key based on URL
  const getSelectedKey = () => {
    const path = location.pathname.split('/docs/')[1] || '';
    const match = docRoutes.find((r) => r.path === path);
    return match ? match.key : 'overview';
  };

  // Get all docs for searching
  const allDocs = getAllDocs();

  // Filter docs based on search
  const searchResults = useMemo(() => {
    if (!searchText.trim()) return [];

    const fuse = new Fuse(allDocs, {
      keys: [
        { name: 'title', weight: 0.7 },
        { name: 'plainText', weight: 0.3 },
      ],
      includeMatches: true,
      threshold: 0.3,
      ignoreLocation: true,
      minMatchCharLength: 3, // Don't match single/double letters
    });

    const results = fuse.search(searchText);

    return results.map(({ item: doc, matches }) => {
      // Find match in content
      const contentMatch = matches?.find((m) => m.key === 'plainText');

      let snippet: React.ReactNode;
      if (contentMatch && contentMatch.indices.length > 0) {
        // Find the longest match to avoid highlighting just a single fuzzy letter
        const bestMatch = contentMatch.indices.reduce((prev, current) => {
          const prevLen = prev[1] - prev[0];
          const currLen = current[1] - current[0];
          return currLen > prevLen ? current : prev;
        });

        const [startIdx, endIdx] = bestMatch;

        // Extract snippet window
        const windowStart = Math.max(0, startIdx - 40);
        const windowEnd = Math.min(doc.plainText.length, endIdx + 60);
        const textSlice = doc.plainText.slice(windowStart, windowEnd);

        // Calculate relative match position
        const relativeStart = startIdx - windowStart;
        const relativeEnd = endIdx - windowStart + 1; // +1 because slice is exclusive

        const before = textSlice.slice(0, relativeStart);
        const matchText = textSlice.slice(relativeStart, relativeEnd);
        const after = textSlice.slice(relativeEnd);

        snippet = (
          <span>
            {windowStart > 0 && '...'}
            {before}
            <span
              style={{
                fontWeight: 800,
                backgroundColor: colors.actionYellowFade,
                padding: '0 2px',
                borderRadius: '2px',
              }}
            >
              {matchText}
            </span>
            {after}
            {windowEnd < doc.plainText.length && '...'}
          </span>
        );
      } else {
        // Fallback if match was only in title or no indices
        snippet = doc.plainText.slice(0, 100) + '...';
      }

      return {
        ...doc,
        snippet,
      };
    });
  }, [searchText]);

  // Group routes by category for normal view
  const categories: Record<DocCategory, typeof docRoutes> = {
    'Getting Started': [],
    'Instructor Workflows': [],
    'Role Guides': [],
    Reference: [],
    Changelog: [],
  };

  docRoutes.forEach((route) => {
    if (categories[route.category]) {
      categories[route.category].push(route);
    }
  });

  const getCategoryIcon = (category: DocCategory) => {
    switch (category) {
      case 'Getting Started':
        return <RocketOutlined />;
      case 'Instructor Workflows':
        return <ToolOutlined />;
      case 'Role Guides':
        return <TeamOutlined />;
      case 'Changelog':
        return <HistoryOutlined />;
      default:
        return <AppstoreOutlined />;
    }
  };

  // Normal items
  const menuItems = Object.entries(categories)
    .filter(([_, routes]) => routes.length > 0)
    .map(([category, routes]) => ({
      key: category,
      type: 'group' as const,
      label: (
        <span
          style={{
            color: colors.neutralMainText,
            fontWeight: 600,
            fontSize: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {category}
        </span>
      ),
      children: routes.map((route) => ({
        key: route.key,
        icon: getCategoryIcon(route.category as DocCategory),
        label: <Link to={`/docs/${route.path}`}>{route.title}</Link>,
      })),
    }));

  return (
    <Sider
      width={300}
      theme="light"
      style={{
        borderRight: `1px solid ${colors.neutralBorder}`,
        height: '100vh',
        position: 'sticky',
        top: 0,
        left: 0,
        background: colors.brandLight, // Subtle brand tint
      }}
    >
      <nav aria-label="Documentation Navigation" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <Link to="/">
            <CPLogo cpType="dark" />
          </Link>
          <div
            style={{
              marginTop: '4px',
              padding: '2px 8px',
              background: colors.green9, // Darker green for contrast with white text
              color: colors.neutralDarkTitle,
              borderRadius: '12px',
              fontSize: '10px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
            }}
          >
            Docs
          </div>
        </div>

        <div style={{ padding: '0 24px 16px 24px' }}>
          <Input
            placeholder="Search docs..."
            aria-label="Search documentation"
            prefix={<SearchOutlined style={{ color: colors.neutralSecondaryText }} />}
            bordered={false}
            value={searchText}
            style={{
              background: 'white',
              borderRadius: '8px',
              padding: '8px 12px',
              border: `1px solid ${colors.neutralBorder}`,
            }}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
        </div>

        {searchText ? (
          <div
            role="region"
            aria-label="Search results"
            style={{ overflowY: 'auto', height: 'calc(100vh - 160px)', padding: '0 12px' }}
          >
            {searchResults.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: colors.neutralSecondaryText }}>
                No results found
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {searchResults.map((result) => (
                  <Link
                    key={result.key}
                    to={`/docs/${result.path}?highlight=${encodeURIComponent(searchText)}`}
                    style={{
                      display: 'block',
                      padding: '12px',
                      background: 'white',
                      borderRadius: '6px',
                      border: `1px solid ${colors.neutralBorder}`,
                      color: colors.neutralMainText,
                    }}
                  >
                    <div style={{ fontWeight: 600, color: colors.brandPrimary, marginBottom: '4px' }}>
                      {result.title}
                    </div>
                    <div style={{ fontSize: '12px', color: colors.neutralSecondaryText, marginBottom: '4px' }}>
                      {result.category}
                    </div>
                    <div style={{ fontSize: '12px', color: colors.neutralMainText, lineHeight: '1.4' }}>
                      {result.snippet}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : (
          <Menu
            mode="inline"
            selectedKeys={[getSelectedKey()]}
            style={{ background: 'transparent', borderRight: 0 }}
            items={menuItems}
          />
        )}

        <div
          style={{
            padding: '20px',
            borderTop: `1px solid ${colors.neutralBorder}`,
            marginTop: 'auto',
            position: 'absolute',
            bottom: 0,
            width: '100%',
          }}
        >
          <Link
            to="/"
            style={{ color: colors.neutralSecondaryText, display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            &larr; Back to App
          </Link>
        </div>
      </nav>
    </Sider>
  );
};

export default DocsSidebar;
