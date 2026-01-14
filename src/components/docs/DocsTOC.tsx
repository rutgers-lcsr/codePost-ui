import React from 'react';
import { Typography, Anchor } from 'antd';
import { colors } from '../../theme/colors';

const { Link } = Anchor;
const { Text } = Typography;

export interface TOCItem {
  id: string;
  text: string;
  level: number;
}

interface DocsTOCProps {
  items: TOCItem[];
}

const DocsTOC: React.FC<DocsTOCProps> = ({ items }) => {
  if (items.length === 0) return null;

  return (
    <div
      style={{
        width: '250px',
        paddingLeft: '20px',
        position: 'sticky',
        top: '100px',
        alignSelf: 'start',
      }}
    >
      <Text
        strong
        style={{
          display: 'block',
          marginBottom: '12px',
          fontSize: '12px',
          textTransform: 'uppercase',
          color: colors.neutralMainText,
          letterSpacing: '0.05em',
        }}
      >
        On this page
      </Text>
      <Anchor
        affix={false}
        showInkInFixed={true}
        getContainer={() => document.getElementById('docs-scroll-container')!}
        items={items.map((item) => ({
          key: item.id,
          href: `#${item.id}`,
          title: item.text,
          className: `toc-link-level-${item.level}`,
        }))}
        style={{
          background: 'transparent',
        }}
        targetOffset={100}
      />

      <style>{`
        .ant-anchor-link {
            padding: 4px 0 4px 16px !important;
        }
        .ant-anchor-link-title {
            font-size: 13px !important;
        }
        .toc-link-level-3 > .ant-anchor-link-title {
            padding-left: 12px;
            font-size: 12px !important;
            color: ${colors.neutralSecondaryText};
        }
      `}</style>
    </div>
  );
};

export default DocsTOC;
