// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial Licensed, included with this software.
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tag, Space } from 'antd';
import { EditOutlined, EyeOutlined, CloseOutlined, HomeOutlined } from '@ant-design/icons';
import CPButton from '../../components/core/CPButton';
import { brandColors } from '../../theme/colors';
import { CODE_DEMO } from '../../routes';

interface DemoBannerProps {
  isStudentView: boolean;
  /** Optional override for the tag label and description */
  label?: string;
  description?: string;
  /** Hide the switch-view button (useful for consoles with no counterpart) */
  hideSwitchButton?: boolean;
  /** Override the switch button label */
  switchLabel?: string;
  /** Override where the switch button navigates */
  switchTo?: string;
}

const DemoBanner: React.FC<DemoBannerProps> = ({
  isStudentView,
  label,
  description,
  hideSwitchButton,
  switchLabel,
  switchTo,
}) => {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const defaultSwitchTo = isStudentView ? `${CODE_DEMO}/grader` : `${CODE_DEMO}/student`;
  const defaultSwitchLabel = isStudentView ? 'Switch to Grader' : 'Switch to Student';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 16px',
        background: isStudentView ? '#e6f4ff' : brandColors.light,
        borderBottom: `1px solid ${isStudentView ? '#91caff' : brandColors.vibrant}`,
        fontSize: 13,
        flexShrink: 0,
        gap: 12,
      }}
    >
      <Space size={12} style={{ flexWrap: 'wrap' }}>
        <Tag
          color={isStudentView ? 'blue' : 'green'}
          style={{ margin: 0, fontWeight: 600 }}
          icon={isStudentView ? <EyeOutlined /> : <EditOutlined />}
        >
          {label ?? (isStudentView ? 'Student View' : 'Grader View')}
        </Tag>
        <span style={{ color: 'rgba(0,0,0,0.65)' }}>
          {description ??
            (isStudentView
              ? 'You are viewing feedback as a student would see it after grades are released.'
              : 'You are grading as a course grader. Try adding comments, applying rubric items, or reviewing tests.')}
        </span>
      </Space>

      <Space size={8}>
        {!hideSwitchButton && (
          <CPButton
            cpType="default"
            size="small"
            onClick={() => navigate(switchTo ?? defaultSwitchTo)}
            style={{ fontSize: 12 }}
          >
            {isStudentView ? <EditOutlined /> : <EyeOutlined />} {switchLabel ?? defaultSwitchLabel}
          </CPButton>
        )}
        <CPButton
          cpType="default"
          size="small"
          onClick={() => navigate(CODE_DEMO)}
          style={{ fontSize: 12 }}
          title="Back to demo home"
        >
          <HomeOutlined />
        </CPButton>
        <CPButton
          cpType="default"
          size="small"
          onClick={() => setDismissed(true)}
          style={{ fontSize: 12, padding: '0 6px' }}
          title="Dismiss banner"
        >
          <CloseOutlined />
        </CPButton>
      </Space>
    </div>
  );
};

export default DemoBanner;
