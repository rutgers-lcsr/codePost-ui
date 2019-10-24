/* react imports */
import React, { useState } from 'react';

/* library imports */
import { Breadcrumb, Tabs } from 'antd';

/* codePost object imports */
import { AssignmentPatchType, AssignmentType } from '../../../../../infrastructure/assignment';

/* codePost component imports */
import CPAdminDetail from '../../../other/CPAdminDetail';
import { EnvironmentSpecs } from './TestingSetup/EnvironmentSpecs';
import { TestDefinitions } from './TestingSetup/TestDefinitions';

const { TabPane } = Tabs;

interface IProps {
  currentAssignment: AssignmentType;
  switchDetail: () => void;
  onCancel: () => void;
  updateAssignment: (assignment: AssignmentPatchType) => Promise<void>;
}

export const TestingSetup = (props: IProps) => {
  // ************************** State Variables ******************************
  const [currTab, setCurrTab] = useState('1');

  // ************************** Return ***************************************
  const content = (
    <Tabs defaultActiveKey="1" activeKey={currTab} onChange={setCurrTab} animated={false}>
      <TabPane tab={'Environment'} key={'1'}>
        <EnvironmentSpecs
          currentAssignment={props.currentAssignment}
          onContinue={setCurrTab.bind({}, '2')}
          onCancel={props.onCancel}
          updateAssignment={props.updateAssignment}
        />
      </TabPane>
      <TabPane tab={'Tests'} key={'2'}>
        <TestDefinitions
          currentAssignment={props.currentAssignment}
          onContinue={setCurrTab.bind({}, '3')}
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
      title={`${props.currentAssignment.name} | Tests Setup`}
      actions={[]}
      content={content}
    />
  );
};
