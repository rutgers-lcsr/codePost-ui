import React, { useState } from 'react';

import { AssignmentPatchType, AssignmentType } from '../../../../../infrastructure/assignment';

import { Breadcrumb, Steps } from 'antd';
import CPAdminDetail from '../../../other/CPAdminDetail';

import { SetEnvironment } from './SetEnvironment';

const { Step } = Steps;

interface IProps {
  currentAssignment: AssignmentType;
  switchDetail: () => void;
  onCancel: () => void;
  updateAssignment: (assignment: AssignmentPatchType) => Promise<void>;
}

enum STEP_TYPE {
  Environment = 0,
  Tests = 1,
  Settings = 2,
}

const steps: { [stepName: string]: STEP_TYPE } = {
  'Set environment': STEP_TYPE.Environment,
  'Edit tests': STEP_TYPE.Tests,
  'Manage settings': STEP_TYPE.Settings,
};

export const EditTests = (props: IProps) => {
  const [step, setStep] = useState<STEP_TYPE>(STEP_TYPE.Environment);
  const header = (
    <Steps size="small" current={step}>
      {Object.keys(steps).map((item, i) => {
        return <Step key={item} title={item} onClick={setStep.bind({}, steps[item])} />;
      })}
    </Steps>
  );
  let content;
  switch (step) {
    case STEP_TYPE.Environment:
      content = (
        <SetEnvironment
          currentAssignment={props.currentAssignment}
          onContinue={setStep.bind({}, STEP_TYPE.Tests)}
          onCancel={props.onCancel}
          updateAssignment={props.updateAssignment}
        />
      );
      break;
    case STEP_TYPE.Tests:
      content = <div />;
      break;
    case STEP_TYPE.Settings:
      content = <div />;
      break;
  }

  return (
    <CPAdminDetail
      breadcrumbs={
        <Breadcrumb>
          <Breadcrumb.Item onClick={props.onCancel}>
            {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
            <a>Assignments</a>
          </Breadcrumb.Item>
          <Breadcrumb.Item>{props.currentAssignment.name}</Breadcrumb.Item>
          <Breadcrumb.Item onClick={props.switchDetail}>Tests Summary</Breadcrumb.Item>
          <Breadcrumb.Item>Edit Tests</Breadcrumb.Item>
        </Breadcrumb>
      }
      goBack={null}
      title={`${props.currentAssignment.name} | Tests Summary`}
      actions={[]}
      content={
        <div>
          {header}
          {content}
        </div>
      }
    />
  );
};
