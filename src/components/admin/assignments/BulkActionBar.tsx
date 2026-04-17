// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

import React from 'react';
import { Flex, Tooltip } from 'antd';
import {
  CheckCircleOutlined,
  CloseOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  SendOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';

import CPButton from '../../core/CPButton';
import { colors } from '../../../theme/colors';

/**********************************************************************************************************************/
/* Types
/**********************************************************************************************************************/

interface IProps {
  selectedCount: number;
  isLoading: boolean;
  canEditAssignment: boolean;
  canReleaseGrades: boolean;
  onPublish: () => void;
  onShow: () => void;
  onHide: () => void;
  onReleaseFeedback: () => void;
  onClearSelection: () => void;
}

/**********************************************************************************************************************/
/* Component
/**********************************************************************************************************************/

const BulkActionBar: React.FC<IProps> = ({
  selectedCount,
  isLoading,
  canEditAssignment,
  canReleaseGrades,
  onPublish,
  onShow,
  onHide,
  onReleaseFeedback,
  onClearSelection,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div
      style={{
        background: colors.brandLight,
        border: `1px solid ${colors.brandPrimary}`,
        borderRadius: 8,
        padding: '8px 14px',
        marginBottom: 12,
      }}
      role="toolbar"
      aria-label="Bulk assignment actions"
    >
      <Flex align="center" gap={10} wrap="wrap">
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: colors.brandPrimary,
            whiteSpace: 'nowrap',
          }}
        >
          <ThunderboltOutlined style={{ marginRight: 4 }} />
          {selectedCount} selected
        </span>

        <div style={{ width: 1, height: 20, background: colors.neutralBorder, margin: '0 2px' }} aria-hidden="true" />

        {canEditAssignment && (
          <Tooltip title="Set isReleased = true for all selected assignments so students can start work">
            <CPButton
              cpType="primary"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={onPublish}
              disabled={isLoading}
            >
              Publish
            </CPButton>
          </Tooltip>
        )}

        {canEditAssignment && (
          <Tooltip title="Make all selected assignments visible in the Student Console">
            <CPButton cpType="secondary" size="small" icon={<EyeOutlined />} onClick={onShow} disabled={isLoading}>
              Show
            </CPButton>
          </Tooltip>
        )}

        {canEditAssignment && (
          <Tooltip title="Hide all selected assignments from the Student Console">
            <CPButton
              cpType="secondary"
              size="small"
              icon={<EyeInvisibleOutlined />}
              onClick={onHide}
              disabled={isLoading}
            >
              Hide
            </CPButton>
          </Tooltip>
        )}

        {canReleaseGrades && (
          <Tooltip title="Release feedback for all selected assignments so students can view their grades">
            <CPButton
              cpType="secondary"
              size="small"
              icon={<SendOutlined />}
              onClick={onReleaseFeedback}
              disabled={isLoading}
            >
              Release feedback
            </CPButton>
          </Tooltip>
        )}

        <div style={{ marginLeft: 'auto' }}>
          <CPButton
            cpType="secondary"
            size="small"
            icon={<CloseOutlined />}
            onClick={onClearSelection}
            disabled={isLoading}
            aria-label="Clear selection"
          >
            Clear
          </CPButton>
        </div>
      </Flex>
    </div>
  );
};

export default BulkActionBar;
