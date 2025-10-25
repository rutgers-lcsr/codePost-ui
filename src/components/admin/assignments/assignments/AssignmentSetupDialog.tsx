/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */

/* antd imports */
import { Button, Modal, Steps, Timeline } from 'antd';
import {
  FileDoneOutlined,
  OrderedListOutlined,
  PlusCircleOutlined,
  TeamOutlined,
  UploadOutlined,
} from '@ant-design/icons';

/* codePost imports */
import { AssignmentType, CourseType } from '../../../../infrastructure/types';

import {
  getRosterURL,
  getRubricURL,
  getSettingsURL,
  getTestsURL,
  getUploadSubmissionsURL,
} from '../../../core/URLutils';

import useWindowSize from '../../../core/useWindowSize';

const { Step } = Steps;

/**********************************************************************************************************************/

interface IProps {
  assignment: AssignmentType;
  course: CourseType;
  hasStudents: boolean;
  hasSubmissions?: boolean;
  onClose: () => void;
}

const getSteps = (course: CourseType, assignment: AssignmentType, hasStudents: boolean, hasSubmissions?: boolean) => [
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
      assignment.files.length > 0 ||
      assignment.liveFeedbackMode ||
      assignment.allowLateUploads ||
      assignment.explanation.length > 0 ||
      hasSubmissions,
    icon: <UploadOutlined />,
  },
  {
    title: 'Create tests',
    url: `/${getTestsURL(course, assignment)}`,
    isOptional: true,
    description: 'Specify required files, allow late submissions, etc...',
    hide: false,
    isComplete: assignment.testCategories.length > 0,
    icon: <FileDoneOutlined />,
  },
  {
    title: 'Create rubric',
    url: `/${getRubricURL(course, assignment)}`,
    isOptional: true,
    description: 'Make it easier to review student code by creating standard comments.',
    hide: false,
    isComplete: assignment.rubricCategories.length > 0,
    icon: <OrderedListOutlined />,
  },
];

export const AssignmentSetupDialog = (props: IProps) => {
  const steps = getSteps(props.course, props.assignment, props.hasStudents);

  const timeline = (
    <Timeline>
      {steps.map((step: any) => {
        const title = step.isOptional ? `${step.title} (optional)` : step.title;
        return step.hide ? null : (
          <Timeline.Item color={step.isComplete ? 'green' : 'grey'}>
            {step.isComplete ? (
              title
            ) : (
              <div>
                <a href={step.url}>
                  <Button type={step.isOptional ? 'default' : 'primary'}>{title}</Button>
                </a>
                <p>
                  <em>{step.description}</em>
                </p>
              </div>
            )}
          </Timeline.Item>
        );
      })}
    </Timeline>
  );

  return (
    <Modal
      open={true}
      title={`Setup: ${props.assignment.name}`}
      width={550}
      onCancel={props.onClose}
      onOk={props.onClose}
    >
      <b>
        Now that your assignment has been created, here are some next steps. You can access this list from this
        assignment's "Actions" menu by selecting "Get started".
      </b>
      <br />
      <br />
      {timeline}
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
    <Steps type={'navigation'} onChange={onStepChange} current={7} size={'small'}>
      {steps.map((step, index) =>
        step.hide ? (
          <span key={index} />
        ) : (
          <Step
            key={index}
            title={step.title}
            subTitle={step.isOptional && !isSmall ? '(optional)' : ''}
            status={step.isComplete ? 'finish' : 'wait'}
            description=""
            disabled={step.isComplete}
            icon={isSmall ? <div /> : step.icon}
          />
        ),
      )}
    </Steps>
  );

  return <div style={{ width: '100%' }}>{options}</div>;
};
