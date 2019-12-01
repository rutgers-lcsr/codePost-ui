/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

import * as React from 'react';

import { RouteComponentProps } from 'react-router';
import { Link } from 'react-router-dom';

import { Button, Breadcrumb, Dropdown, Empty, Menu, Icon } from 'antd';

import CPAdminDetail from '../../other/CPAdminDetail';

import { AssignmentType } from '../../../../infrastructure/types';

import { encodeForLink } from '../../../core/URLutils';

/**********************************************************************************************************************/

interface IProps {
  assignments: AssignmentType[];
}

const TestsOverview = (props: IProps & RouteComponentProps) => {
  return (
    <CPAdminDetail
      breadcrumbs={
        <Breadcrumb>
          <Breadcrumb.Item>Assignments</Breadcrumb.Item>
          <Breadcrumb.Item>Tests</Breadcrumb.Item>
        </Breadcrumb>
      }
      actions={[]}
      goBack={null}
      title={'Tests'}
      content={
        <div style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Empty
            imageStyle={{
              height: 60,
            }}
            description={
              <span>The codePost autograder is coming soon! Let us know if you want to participate in our beta.</span>
            }
          ></Empty>
        </div>
      }
    />
  );
};

export default TestsOverview;
