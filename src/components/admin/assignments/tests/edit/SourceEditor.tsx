/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import React, { useEffect, useState } from 'react';

import { Layout, Menu } from 'antd';

/**********************************************************************************************************************/

import { CodeWindow } from './utils/CodeWindow';

import { TestCategoryType } from '../../../../../infrastructure/types';

import { SolutionFileType } from '../../../../../infrastructure/autograder/solutionFile';
import { HelperFileType } from '../../../../../infrastructure/autograder/helperFile';
import { SourceFileType } from '../../../../../infrastructure/autograder/sourceFile';

import { TestCategory } from '../../../../../infrastructure/testCategory';
import { TestCase } from '../../../../../infrastructure/testCase';

import { TestCasesByCategory } from '../../../../core/testFetchUtils';

// enum FILE_TYPE {
//   Helper,
//   Solution,
//   Source,
// }

interface GenericFile {
  id: number;
  title?: React.ReactNode;
  name: string;
  code: string;
  canSave: boolean;
}

interface IProps {
  currentFile?: GenericFile;
  sourceFiles: SourceFileType[];
  casesByCategory: TestCasesByCategory;
  categories: TestCategoryType[];
}

const { Sider, Content } = Layout;

export const SourceEditor = (props: IProps) => {
  const content = props.currentFile && <CodeWindow code={props.currentFile.code} name={props.currentFile.name} />;
  const testMenu = (
    <Menu
      defaultOpenKeys={props.categories.map((el) => el.id.toString())}
      mode="inline"
      selectedKeys={[]}
      style={{ height: '100%' }}
    >
      {TestCategory.sort(props.categories).map((category) => {
        return (
          <Menu.SubMenu key={category.id} title={<span>{category.name} </span>}>
            {category.id in props.casesByCategory
              ? TestCase.sort(props.casesByCategory[category.id]).map((el) => (
                  <Menu.Item key={el.id} style={{ height: 'fit-content', minHeight: 40 }}>
                    {el.description}
                  </Menu.Item>
                ))
              : null}
          </Menu.SubMenu>
        );
      })}
    </Menu>
  );

  return (
    <Layout>
      <Content>{content}</Content>
      <Sider>{testMenu}</Sider>
    </Layout>
  );
};
