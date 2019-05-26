import React from 'react';

import { Menu } from 'antd';

import CPLayoutAdmin from '../../components/core/CPLayoutAdmin';

import CPAdminRubric from '../../components/core/CPAdminRubric';

import CPButton from '../../components/core/CPButton';
import CPDropdown from '../../components/core/CPDropdown';
import CPRubricCategory from '../../components/core/CPRubricCategory';

const menu = (
  <Menu>
    <Menu.Item key="1">1st menu item</Menu.Item>
    <Menu.Item key="2">2nd menu item</Menu.Item>
    <Menu.Item key="3">3rd item</Menu.Item>
  </Menu>
);

const dropdown = <CPDropdown value="COS126 | Spring 2019" overlay={menu} />;

const createButton = <CPButton cpType="secondary">Create Course</CPButton>;

const header = (
  <div className="cp-flex--normal">
    <div className="left">{dropdown}</div>
    <div className="left">{createButton}</div>
    <div className="gap" />
    <div className="right">
      <span className="cp-label cp-label--bold">Hello, hello@andreacg.com!</span>
    </div>
    <div className="right">
      <CPButton cpType="secondary" icon="setting" size="small" />
    </div>
    <div className="right">
      <CPButton cpType="secondary" icon="logout" size="small" />
    </div>
  </div>
);

export const Rubric = () => {
  const actions = [
    <CPButton key="action-1" cpType="primary">
      Upload/Download Rubric
    </CPButton>,
    <CPButton key="action-2" cpType="secondary">
      Merge Comments
    </CPButton>,
  ];

  const content = (
    <div>
      <CPRubricCategory />
      <CPRubricCategory />
    </div>
  );

  const onClick = (e: any) => null;
  const rubric = <CPAdminRubric goBack={'1'} title="Hello World (WIP)" actions={actions} content={content} />;
  return <CPLayoutAdmin onClick={onClick} header={header} detail={rubric} isRubric={true} />;
};
