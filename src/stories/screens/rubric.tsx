import * as React from 'react';

import { Menu } from 'antd';

import CPLayoutAdmin from '../../components/admin/other/CPLayoutAdmin';

import CPAdminRubric from '../../components/admin/assignments/rubric/CPAdminRubric';
// import CPRubricCategory from '../../components/admin/assignments/rubric/CPRubricCategory';

import CPButton from '../../components/core/CPButton';
import CPDropdown from '../../components/core/CPDropdown';
import CPFlex from '../../components/core/CPFlex';

// import { RubricCategoryMock } from '../../infrastructure/rubricCategory';
// import { RubricCommentMock } from '../../infrastructure/rubricComment';

// --------- Mock Data --------- //

// const category1 = RubricCategoryMock;
// const category2 = { ...RubricCategoryMock, id: 2, name: 'Another Category' };
//
// const comments1 = [RubricCommentMock, { ...RubricCommentMock, id: 2, text: 'another rubric comment' }];
// const comments2 = [{ ...RubricCommentMock, id: 3, category: 2, text: 'missing a semicolon' }];

// ------------------------------ //

const menu = (
  <Menu>
    <Menu.Item key="1">1st menu item</Menu.Item>
    <Menu.Item key="2">2nd menu item</Menu.Item>
    <Menu.Item key="3">3rd item</Menu.Item>
  </Menu>
);

const dropdown = <CPDropdown value="COS126 | Spring 2019" overlay={menu} />;

const createButton = (
  <CPButton cpType="secondary" fallback="plus">
    Create Course
  </CPButton>
);

const headerLeft = [dropdown, createButton];

const headerRight = [
  <span key={0} className="cp-label cp-label--bold">
    Hello, hello@andreacg.com!
  </span>,
  <CPButton key={1} cpType="secondary" icon="setting" size="small" />,
  <CPButton key={2} cpType="secondary" icon="logout" size="small" />,
];

const header = <CPFlex left={headerLeft} right={headerRight} gutterSize={10} />;

export const Rubric = () => {
  const actions = [
    <CPButton key="action-1" cpType="primary" fallback="upload">
      Upload/Download Rubric
    </CPButton>,
    <CPButton key="action-2" cpType="secondary" fallback="fork">
      Merge Comments
    </CPButton>,
  ];

  // const content = (
  //   <div>
  //     <CPRubricCategory rubricCategory={category1} rubricComments={comments1} />
  //     <CPRubricCategory rubricCategory={category2} rubricComments={comments2} />
  //   </div>
  // );

  const onClick = (e: any) => null;
  const rubric = (
    <CPAdminRubric goBack={'1'} title="Hello World (WIP)" actions={actions} isEmpty={false} content={<div />} />
  );
  return <CPLayoutAdmin onClick={onClick} selectedPanel={0} header={header} detail={rubric} />;
};
