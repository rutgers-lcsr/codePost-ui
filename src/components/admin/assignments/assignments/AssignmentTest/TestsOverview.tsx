/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

import * as React from 'react';

import { RouteComponentProps } from 'react-router';
import { Link } from 'react-router-dom';

import { Button, Breadcrumb, Dropdown, Empty, Menu, Icon } from 'antd';

import { TableDetail } from '../../../other/TableDetail';

import { AssignmentType } from '../../../../../infrastructure/assignment';

import { encodeForLink } from '../../../../core/URLutils';

/**********************************************************************************************************************/

interface IProps {
  assignments: AssignmentType[];
}

const TestsOverview = (props: IProps & RouteComponentProps) => {
  const columns = [
    { title: 'Assignment', key: 'assignment', dataIndex: 'assignment' },
    { title: 'Edit', key: 'edit', dataIndex: 'edit', align: 'center' as const },
    { title: 'Run', key: 'tests', dataIndex: 'tests', align: 'center' as const },
    { title: 'Actions', key: 'actions', dataIndex: 'actions', align: 'center' as const },
  ];

  const data = props.assignments.map((assignment) => {
    const menu = (
      <Menu>
        <Menu.Item key="1">
          <Icon type="download" />
          Download tests
        </Menu.Item>
      </Menu>
    );
    return {
      assignment: assignment.name,
      tests: (
        <Link to={`${props.match.url}/${encodeForLink(assignment.name)}/run`}>
          <Button disabled={assignment.testCategories.length === 0 || !assignment.environment}>Run</Button>
        </Link>
      ),
      edit: (
        <Link to={`${props.match.url}/${encodeForLink(assignment.name)}/edit`}>
          <Button>{assignment.testCategories.length > 0 ? 'Edit' : 'Create'}</Button>
        </Link>
      ),
      actions: (
        <Dropdown overlay={menu} trigger={['click']}>
          <Icon type="menu" />
        </Dropdown>
      ),
    };
  });

  return (
    <TableDetail
      loadComplete={true}
      pagination={props.assignments.length < 10 ? false : undefined}
      title={'Tests'}
      isEmpty={false}
      emptyNode={
        <Empty
          imageStyle={{
            height: 60,
          }}
          description={<span>No assignments yet</span>}
        ></Empty>
      }
      columns={columns}
      data={data}
      actions={[]}
      breadcrumbs={
        <Breadcrumb>
          <Breadcrumb.Item>Assignments</Breadcrumb.Item>
          <Breadcrumb.Item>Tests</Breadcrumb.Item>
        </Breadcrumb>
      }
    />
  );
};

export default TestsOverview;
