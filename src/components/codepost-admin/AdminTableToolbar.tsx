// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial Licensed, included with this software.
import React from 'react';
import { Button, Input, Space } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';

const { Search } = Input;

interface AdminTableToolbarProps {
  searchPlaceholder?: string;
  searchValue?: string;
  onSearch: (value: string) => void;
  /** Extra filter controls to render between search and actions. */
  filters?: React.ReactNode;
  /** Label for the create action button. If omitted, no create button is shown. */
  createLabel?: string;
  onCreate?: () => void;
  onRefresh?: () => void;
  refreshLoading?: boolean;
}

const AdminTableToolbar: React.FC<AdminTableToolbarProps> = ({
  searchPlaceholder = 'Search…',
  searchValue,
  onSearch,
  filters,
  createLabel,
  onCreate,
  onRefresh,
  refreshLoading,
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      marginBottom: 16,
      flexWrap: 'wrap',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
      <Search
        placeholder={searchPlaceholder}
        allowClear
        enterButton
        value={searchValue}
        onChange={(e) => onSearch(e.target.value)}
        onSearch={onSearch}
        style={{ maxWidth: 480 }}
      />
      {filters}
    </div>
    <Space>
      {onRefresh && (
        <Button icon={<ReloadOutlined spin={refreshLoading} />} onClick={onRefresh}>
          Refresh
        </Button>
      )}
      {createLabel && onCreate && (
        <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
          {createLabel}
        </Button>
      )}
    </Space>
  </div>
);

export default AdminTableToolbar;
