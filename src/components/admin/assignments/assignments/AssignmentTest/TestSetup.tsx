import React, { useState } from 'react';

import { AssignmentPatchType, AssignmentType } from '../../../../../infrastructure/assignment';

import { Breadcrumb, Tabs } from 'antd';
import CPAdminDetail from '../../../other/CPAdminDetail';

import { EnvironmentSpecs } from './SetupTests/EnvironmentSpecs';
import { TestDefinitions } from './SetupTests/TestDefinitions';

const { TabPane } = Tabs;

interface IProps {
  currentAssignment: AssignmentType;
  switchDetail: () => void;
  onCancel: () => void;
  updateAssignment: (assignment: AssignmentPatchType) => Promise<void>;
}

export const TestSetup = (props: IProps) => {
  const [step, setStep] = useState('1');
  const content = (
    <Tabs defaultActiveKey="1" activeKey={step} onChange={setStep} animated={false}>
      <TabPane tab={'Environment'} key={'1'}>
        <EnvironmentSpecs
          currentAssignment={props.currentAssignment}
          onContinue={setStep.bind({}, '2')}
          onCancel={props.onCancel}
          updateAssignment={props.updateAssignment}
        />
      </TabPane>
      <TabPane tab={'Tests'} key={'2'}>
        <TestDefinitions
          currentAssignment={props.currentAssignment}
          onContinue={setStep.bind({}, '3')}
          onCancel={props.onCancel}
          updateAssignment={props.updateAssignment}
        />
      </TabPane>
      <TabPane tab={'Settings'} key={'3'}>
        <div>Settings</div>
      </TabPane>
    </Tabs>
  );
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
      content={content}
    />
  );
};
