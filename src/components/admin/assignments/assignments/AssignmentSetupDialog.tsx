// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */

/* antd imports */
import { Button, Modal, Progress, Steps } from 'antd';
import {
  CheckCircleFilled,
  CheckOutlined,
  FileDoneOutlined,
  OrderedListOutlined,
  PlusCircleOutlined,
  TeamOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';

/* codePost imports */
import { Course } from '../../../../api-client';
import { colors } from '../../../../theme/colors';
import { Assignment } from '../../../../types/common';

import {
  getRosterURL,
  getRubricURL,
  getSettingsURL,
  getTestsURL,
  getUploadSubmissionsURL,
} from '../../../core/URLutils';

import useWindowSize from '../../../core/useWindowSize';

/**********************************************************************************************************************/

interface IProps {
  assignment: Assignment;
  course: Course;
  hasStudents: boolean;
  hasSubmissions?: boolean;
  onClose: () => void;
}

const getSteps = (course: Course, assignment: Assignment, hasStudents: boolean, hasSubmissions?: boolean) => [
  {
    title: 'Create assignment',
    url: null,
    isOptional: false,
    description: '',
    hide: false,
    isComplete: true,
    icon: <PlusCircleOutlined />,
  },
  {
    title: 'Add students',
    url: `/${getRosterURL(course)}/students`,
    isOptional: false,
    description: 'Students must be added to your roster before they can submit.',
    hide: false,
    isComplete: hasStudents,
    icon: <TeamOutlined />,
  },
  {
    title: 'Upload submissions',
    url: `/${getUploadSubmissionsURL(course, assignment)}`,
    isOptional: false,
    description: 'Upload submissions to review them in codePost.',
    hide: assignment.allowStudentUpload,
    isComplete: hasSubmissions || false,
    icon: <UploadOutlined />,
  },
  {
    title: 'Configure upload',
    url: `/${getSettingsURL(course, assignment)}`,
    isOptional: false,
    description: 'Specify required files, allow late submissions, etc...',
    hide: !assignment.allowStudentUpload,
    isComplete:
      assignment.allowStudentUploadWithPartners ||
      (assignment.files?.length ?? 0) > 0 ||
      assignment.liveFeedbackMode ||
      assignment.allowLateUploads ||
      (assignment.explanation?.length ?? 0) > 0 ||
      hasSubmissions,
    icon: <UploadOutlined />,
  },
  {
    title: 'Create tests',
    url: `/${getTestsURL(course, assignment)}`,
    isOptional: true,
    description: 'Add automated test cases to give students instant feedback on their code.',
    hide: false,
    isComplete: (assignment.testCategories?.length ?? 0) > 0,
    icon: <FileDoneOutlined />,
  },
  {
    title: 'Create rubric',
    url: `/${getRubricURL(course, assignment)}`,
    isOptional: true,
    description: 'Make it easier to review student code by creating standard comments.',
    hide: false,
    isComplete: (assignment.rubricCategories?.length ?? 0) > 0,
    icon: <OrderedListOutlined />,
  },
];

export const AssignmentSetupDialog = (props: IProps) => {
  const steps = getSteps(props.course, props.assignment, props.hasStudents, props.hasSubmissions);
  const visibleSteps = steps.filter((step) => !step.hide);
  const completedCount = visibleSteps.filter((s) => s.isComplete).length;
  const totalCount = visibleSteps.length;
  const allDone = completedCount === totalCount;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (allDone) {
    return (
      <Modal
        open={true}
        title={`Setup: ${props.assignment.name}`}
        width={520}
        onCancel={props.onClose}
        footer={<Button onClick={props.onClose}>Close</Button>}
      >
        <div style={{ textAlign: 'center', padding: '32px 0 24px' }}>
          <CheckCircleFilled style={{ fontSize: 52, color: colors.brandPrimary, marginBottom: 14 }} />
          <div style={{ fontSize: 17, fontWeight: 600, color: colors.neutralTitle, marginBottom: 8 }}>
            You're all set!
          </div>
          <div style={{ fontSize: 14, color: colors.neutralSecondaryText }}>
            This assignment is fully configured and ready to go.
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open={true}
      title={`Setup: ${props.assignment.name}`}
      width={520}
      onCancel={props.onClose}
      footer={<Button onClick={props.onClose}>Close for now</Button>}
    >
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 13, color: colors.neutralSecondaryText }}>
            {completedCount} of {totalCount} steps complete
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: colors.brandPrimary }}>{progressPercent}%</span>
        </div>
        <Progress percent={progressPercent} showInfo={false} strokeColor={colors.brandPrimary} size="small" />
      </div>
      <div>
        {visibleSteps.map((step, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              padding: '10px 0',
              borderTop: index > 0 ? `1px solid ${colors.neutralDivider}` : undefined,
            }}
          >
            <div
              style={{
                flexShrink: 0,
                width: 28,
                height: 28,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 700,
                background: step.isComplete ? colors.brandPrimary : colors.neutralBackground,
                color: step.isComplete ? '#fff' : colors.neutralSecondaryText,
                border: step.isComplete ? 'none' : `1.5px solid ${colors.neutralBorder}`,
              }}
            >
              {step.isComplete ? <CheckOutlined style={{ fontSize: 12 }} /> : index + 1}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 14,
                  color: step.isComplete ? colors.neutralSecondaryText : colors.neutralTitle,
                  textDecoration: step.isComplete ? 'line-through' : 'none',
                  marginBottom: step.isComplete || !step.description ? 0 : 2,
                }}
              >
                {step.title}
                {step.isOptional && (
                  <span style={{ fontWeight: 400, fontSize: 12, color: colors.neutralDisable, marginLeft: 6 }}>
                    optional
                  </span>
                )}
              </div>
              {!step.isComplete && step.description && (
                <div style={{ fontSize: 12, color: colors.neutralSecondaryText, lineHeight: 1.5 }}>
                  {step.description}
                </div>
              )}
            </div>
            {!step.isComplete && step.url && (
              <Link to={step.url} onClick={props.onClose} style={{ flexShrink: 0, alignSelf: 'center' }}>
                <Button type={step.isOptional ? 'default' : 'primary'} size="small">
                  Go →
                </Button>
              </Link>
            )}
          </div>
        ))}
      </div>
    </Modal>
  );
};

export const AssignmentSetupBanner = (props: IProps) => {
  const steps = getSteps(props.course, props.assignment, props.hasStudents, props.hasSubmissions);

  const onStepChange = (current: number) => {
    const url = steps[current].url;
    if (url) {
      const win = window.open(url, '_self');
      win!.focus();
    }
  };

  const windowSize = useWindowSize();

  const isSmall = windowSize.width < 1250;
  const options = (
    <Steps
      type={'navigation'}
      onChange={onStepChange}
      current={7}
      size={'small'}
      items={steps.map((step, index) =>
        step.hide
          ? { key: index.toString(), className: 'hidden-step' }
          : {
              key: index.toString(),
              title: step.title,
              subTitle: step.isOptional && !isSmall ? '(optional)' : '',
              status: step.isComplete ? 'finish' : 'wait',
              description: '',
              disabled: step.isComplete,
              icon: isSmall ? <div /> : step.icon,
            },
      )}
    />
  );

  return <div style={{ width: '100%' }}>{options}</div>;
};
