import React from 'react';
import { Layout, Menu, Input } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import { docRoutes, DocCategory } from './DocsConfig';
import { AppstoreOutlined, TeamOutlined, RocketOutlined, SearchOutlined } from '@ant-design/icons';
import { colors } from '../../theme/colors';
import CPLogo from '../core/CPLogo';
import { useState } from 'react';

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

  // Group routes by category
  const categories: Record<DocCategory, typeof docRoutes> = {
    'Getting Started': [],
    Guides: [],
    Reference: [],
  };

  docRoutes.forEach((route) => {
    if (categories[route.category]) {
      if (!searchText || route.title.toLowerCase().includes(searchText.toLowerCase())) {
        categories[route.category].push(route);
      }
    }
  });

  const getCategoryIcon = (category: DocCategory) => {
    switch (category) {
      case 'Getting Started':
        return <RocketOutlined />;
      case 'Guides':
        return <TeamOutlined />;
      default:
        return <AppstoreOutlined />;
    }
  };

  const items = Object.entries(categories)
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
      width={260}
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
      <div style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
        <Link to="/">
          <CPLogo cpType="dark" />
        </Link>
        <div
          style={{
            marginTop: '4px',
            padding: '2px 8px',
            background: colors.brandPrimary,
            color: 'white',
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
          prefix={<SearchOutlined style={{ color: colors.neutralSecondaryText }} />}
          bordered={false}
          style={{
            background: 'white',
            borderRadius: '8px',
            padding: '8px 12px',
            border: `1px solid ${colors.neutralBorder}`,
          }}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      <Menu
        mode="inline"
        selectedKeys={[getSelectedKey()]}
        style={{ background: 'transparent', borderRight: 0 }}
        items={items}
      />

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
        <Link to="/" style={{ color: colors.neutralSecondaryText, display: 'flex', alignItems: 'center', gap: '8px' }}>
          &larr; Back to App
        </Link>
      </div>
    </Sider>
  );
};

export default DocsSidebar;
