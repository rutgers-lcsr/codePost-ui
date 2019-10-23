import React, { useEffect, useState } from 'react';

import { Assignment, AssignmentPatchType, AssignmentType } from '../../../../../../../infrastructure/assignment';

import { TestCase, TestCaseType } from '../../../../../../../infrastructure/testCase';

import { SolutionFileType } from '../../../../../../../infrastructure/solutionFile';

import { TestItem } from './TestItem';

import { Button, Collapse } from 'antd';
const { Panel } = Collapse;

interface IProps {
  currentAssignment: AssignmentType;
  files: SolutionFileType[];
}

const getTestCases = async (assignment: AssignmentType) => {
  const testPromises = assignment.testCases.map((id) => {
    return TestCase.read(id);
  });
  return await Promise.all(testPromises);
};

export const TestsList = (props: IProps) => {
  const [testCases, setTestCases] = useState<TestCaseType[]>([]);
  const [newTestCounter, setNewTestCounter] = useState(-1);

  useEffect(() => {
    const fetchData = async () => {
      const tests = await getTestCases(props.currentAssignment);
      setTestCases(tests);
    };
    fetchData();
  }, [props.currentAssignment]);

  const saveTest = async (testcase: TestCaseType) => {
    let newTest;
    if (testcase.id < 0) {
      newTest = await TestCase.create(testcase);
    } else {
      newTest = await TestCase.update(testcase);
    }
    const filteredTests = testCases.filter((tc) => {
      return tc.id != testcase.id;
    });
    setTestCases([...filteredTests, newTest]);

    return newTest;
  };

  const addTest = () => {
    const dummyTestCase = {
      id: newTestCounter,
      name: '',
      expectedOutput: '',
      pointsPass: 0,
      pointsFail: 0,
      language: 'python',
      type: 'functional',
      text: '',
      assignment: props.currentAssignment.id,
      sortKey: 0,
      fileName: '',
    };
    setNewTestCounter(newTestCounter - 1);
    setTestCases([...testCases, dummyTestCase]);
  };

  const testItems = (
    <Collapse>
      {TestCase.sort(testCases).map((testCase) => {
        return (
          <Panel header={testCase.name} key={testCase.id}>
            <TestItem
              currentAssignment={props.currentAssignment}
              testCase={testCase}
              saveTest={saveTest}
              files={props.files}
            />
          </Panel>
        );
      })}
    </Collapse>
  );

  return (
    <div>
      {testItems}
      <Button onClick={addTest}>Add Test</Button>
    </div>
  );
};
