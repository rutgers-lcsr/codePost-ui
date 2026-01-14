import React from 'react';
import { Layout } from 'antd';
import DocsSidebar from './DocsSidebar';
import DocsContent from './DocsContent';
import { colors } from '../../theme/colors';

const { Content } = Layout;

const DocsPage: React.FC = () => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <DocsSidebar />
      <Layout style={{ backgroundColor: '#fff' }}>
        <Content
          id="docs-scroll-container"
          style={{
            height: '100vh',
            overflowY: 'auto',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          {/* Main content container with max-width for readability */}
          <div style={{ width: '100%', maxWidth: '1200px', display: 'flex' }}>
            <div style={{ flex: 1 }}>
              <DocsContent />
            </div>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default DocsPage;
