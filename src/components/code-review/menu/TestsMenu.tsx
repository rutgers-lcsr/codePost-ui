import { Badge as AntBadge } from 'antd';
import React from 'react';
import { osControlKey } from '../../core/operatingSystem';
import TestsList from '../code-panel/TestsList';
import { TestCaseType } from '../../../infrastructure/testCase';

import { RubricCategoryType } from '../../../infrastructure/rubricCategory';

import { TestCategoryType } from '../../../infrastructure/testCategory';

interface TestsMenuProps {
  submissionId: number;
  tests: TestCaseType[];
  rubricCategories?: RubricCategoryType[];
  testCategories?: TestCategoryType[];
}

const TestsMenu: React.FC<TestsMenuProps> = ({ submissionId, tests, rubricCategories, testCategories }) => {
  return (
    <div
      id="tests-info"
      style={{
        paddingLeft: '15px',
        paddingBottom: '10px',
        paddingRight: '15px',
        paddingTop: '10px',
        height: '100%',
      }}
    >
      <TestsList
        submissionId={submissionId}
        tests={tests}
        rubricCategories={rubricCategories}
        testCategories={testCategories}
      />
    </div>
  );
};

export const TestsMenuTooltip: React.FC<{ title: string; testCount?: number }> = ({ title, testCount }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span>{title}</span>
      {testCount !== undefined && testCount > 0 && (
        <AntBadge
          count={testCount}
          style={{
            backgroundColor: '#fff',
            color: 'rgba(0,0,0,0.85)',
            boxShadow: '0 0 0 1px #d9d9d9 inset',
          }}
        />
      )}
      <span style={{ opacity: 0.7 }}>({osControlKey()} + Shift + D)</span>
    </div>
  );
};

export default TestsMenu;
