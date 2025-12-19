import * as React from 'react';

import { Menu, message, Select, Skeleton, theme } from 'antd';

import _ from 'lodash';
import { ILogType, PseudoTerminal, RESULT_TYPE } from '../admin/assignments/tests/edit/TestDefinitions/PseudoTerminal';
import { CodeWindow } from '../admin/assignments/tests/edit/utils/CodeWindow';
import useWindowSize from './useWindowSize';

import { EnvironmentType } from '../../infrastructure/autograder/environment';
import { AnonymousSubmissionType } from '../../infrastructure/submission';
import { BasicTestResultType, TestEditorResultType } from '../../infrastructure/autograder/runTypes';
import { getFileContent } from '../../infrastructure/file';
import { arrayUpdate } from '../../infrastructure/immutable';
import { TestCase } from '../../infrastructure/testCase';
import { AssignmentType, FileType, TestCaseType, TestCategoryType } from '../../infrastructure/types';

import { fetchEnvironment, fetchTestData, TestCasesByCategory } from './testFetchUtils';

import { awaitTestResult } from '../admin/assignments/tests/autograderPollingUtils';

interface IPseudoIDEProps {
  files: FileType[];
  assignment: AssignmentType;
  submission: AnonymousSubmissionType;
}

const PseudoIDE = (props: IPseudoIDEProps) => {
  const { token } = theme.useToken();
  const [loading, setLoading] = React.useState<boolean>(true);

  const [filesCopy, setFilesCopy] = React.useState<FileType[]>(_.cloneDeep(props.files));
  const [currentFileID, setCurrentFileID] = React.useState<number | undefined>(undefined);

  const height = useWindowSize().height * 0.85;

  const setTestSubject = () => {
    // console.log('placeholder');
  };

  const onSave = (code: string) => {
    const thisFileIndex = filesCopy.findIndex((file: FileType) => {
      return file.id === currentFileID;
    });

    if (thisFileIndex === -1) {
      return Promise.resolve();
    }

    const thisFile = filesCopy[thisFileIndex];
    thisFile.data = code;

    setFilesCopy(arrayUpdate(filesCopy, thisFile, thisFileIndex));
    return Promise.resolve();
  };

  React.useEffect(() => {
    if (props.files.length > 0 && currentFileID === undefined) {
      setFilesCopy(_.cloneDeep(props.files));
      setCurrentFileID(props.files[0].id);
    }
  }, [props.files, currentFileID]);

  const handleClick = (e: { key: string }) => {
    const fileID = +e.key.split('-')[1];

    setCurrentFileID(fileID);
  };

  //////////////////////////////////////////////////////////
  /***************** Test Loading *************************/
  //////////////////////////////////////////////////////////

  const [env, setEnv] = React.useState<EnvironmentType | undefined>(undefined);
  const [casesByCategory, setCasesByCategory] = React.useState<TestCasesByCategory>({});
  const [categories, setCategories] = React.useState<TestCategoryType[]>([]);

  const [selectedTestCase, setSelectedTestCase] = React.useState<TestCaseType | undefined>(undefined);

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const currEnv = await fetchEnvironment(props.assignment);
      setEnv(currEnv);
      if (currEnv) {
        const [testCategories, testCasesByCategory] = await fetchTestData(props.assignment);
        if (Array.isArray(testCategories)) {
          setCategories(testCategories);
        }
        if (!Array.isArray(testCasesByCategory)) {
          setCasesByCategory(testCasesByCategory);
        }
      }
      setLoading(false);
    };
    fetchData();
  }, [props.assignment]);

  //////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////

  //////////////////////////////////////////////////////////
  /***************** Test Running *************************/
  //
  // Mostly copied from
  // - TestDefinitions.tsx
  // - TestFormItem.tsx
  // - TestingSetup.tsx
  // - SourceEditor.tsx
  //////////////////////////////////////////////////////////

  const [running, setRunning] = React.useState<boolean>(false);
  const [logs, setLogs] = React.useState<ILogType | undefined>(undefined);

  const runTest = async () => {
    if (selectedTestCase === undefined) {
      message.error('Select a test case before running.');
      return;
    } else {
      setRunning(true);

      const filesJson = filesCopy.map((file: FileType) => {
        return {
          name: file.name,
          code: getFileContent(file),
          path: file.path === undefined || file.path === null ? '' : file.path,
        };
      });

      const payload = {
        id: selectedTestCase.id,
        submission: props.submission.id.toString(),
        files: JSON.stringify(filesJson),
      };
      const result = await TestCase.run(payload);
      awaitTestResult(result.task, callback.bind({}, selectedTestCase));
    }
  };

  const callback = (testCase: TestCaseType, response: TestEditorResultType) => {
    const result: BasicTestResultType = response.results[0];

    const formatted = {
      log: (
        <span>
          <span style={{ color: token.colorInfo }}>{response.logs}</span>
          {`\n${result.logs}`}
        </span>
      ),
      target: 'solution code',
      result: result.passed ? RESULT_TYPE.PASSED : result.isError ? RESULT_TYPE.ERROR : RESULT_TYPE.FAILED,
      testCaseName: testCase.description,
    };

    // if (!props.activeSubmission) {
    //   props.updateTestStatus(testCase.id, formatted.result);
    // }

    setLogs(formatted);
    setRunning(false);
  };

  //////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////

  const defaultSelectedKeys = props.files.length > 0 ? [`file-${props.files[0]['id']}`] : [];

  const currentFile =
    currentFileID === undefined
      ? currentFileID
      : filesCopy.find((file: FileType) => {
          return file.id === currentFileID;
        });

  if (loading) {
    return (
      <div style={{ height: `${height}px`, position: 'relative' }} className="pseudo-ide">
        <div style={{ display: 'flex', height: '100%', width: '100%' }}>
          <div
            style={{
              width: '20%',
              minWidth: '100px',
              borderRight: `1px solid ${token.colorBorder}`,
              padding: '20px 40px',
            }}
          >
            <Skeleton active />
          </div>
          <div style={{ display: 'flex', flex: 1, minWidth: 0 }}>
            <div
              style={{
                width: '50%',
                minWidth: '100px',
                overflowY: 'auto',
                borderRight: `1px solid ${token.colorBorder}`,
                padding: '20px 40px',
              }}
            >
              <Skeleton active />
            </div>
            <div style={{ flex: 1, minWidth: '100px' }} />
          </div>
        </div>
      </div>
    );
  }

  const onTestCaseSelectChange = (value: string) => {
    const thisID = value.split('-')[1];

    const thisTestCase = Object.values(casesByCategory)
      .flat()
      .find((t: TestCaseType) => {
        return t.id === +thisID;
      });

    setSelectedTestCase(thisTestCase);
  };

  // FIXME: test for categories with no tests
  const testCaseSelect = (
    <Select
      style={{ height: '24px', minWidth: '180px', fontSize: '12px' }}
      size="small"
      showSearch
      placeholder="Select a test case"
      onChange={onTestCaseSelectChange}
    >
      {categories.map((category: TestCategoryType) => {
        let options = null;
        if (Object.prototype.hasOwnProperty.call(casesByCategory, +category.id)) {
          options = casesByCategory[+category.id].map((testcase: TestCaseType) => {
            return (
              <Select.Option key={`testcase-${testcase.id}`} value={`testcase-${testcase.id}`}>
                {testcase.description}
              </Select.Option>
            );
          });
        }
        return (
          <Select.OptGroup key={category.name} label={category.name}>
            {options}
          </Select.OptGroup>
        );
      })}
    </Select>
  );

  return (
    <div style={{ height: `${height} px`, position: 'relative' }} className="pseudo-ide">
      <div style={{ display: 'flex', height: '100%', width: '100%' }}>
        <div style={{ width: '20%', minWidth: '100px', borderRight: `1px solid ${token.colorBorder}` }}>
          <div
            style={{ backgroundColor: token.colorFillTertiary, padding: '8px 16px', fontSize: '20px', fontWeight: 500 }}
          >
            Files ({props.files.length})
          </div>
          <Menu
            defaultSelectedKeys={defaultSelectedKeys}
            mode="inline"
            style={{ height: '100%' }}
            onClick={handleClick}
          >
            {props.files.map((file: FileType) => {
              return (
                <Menu.Item key={`file-${file.id}`}>
                  {file.path && <span style={{ color: token.colorTextQuaternary }}>{file.path}/</span>}
                  <span style={{ fontWeight: 500 }}>{file.name}</span>
                </Menu.Item>
              );
            })}
          </Menu>
        </div>
        <div style={{ display: 'flex', flex: 1, minWidth: 0 }}>
          <div
            style={{
              width: '50%',
              minWidth: '100px',
              overflowY: 'auto',
              borderRight: `1px solid ${token.colorBorder}`,
            }}
          >
            <div style={{ display: 'flex', padding: '4px 0px' }}>
              <div
                style={{
                  backgroundColor: token.colorBgContainerDisabled,
                  color: token.colorTextLightSolid,
                  fontSize: '12px',
                  fontWeight: 500,
                  padding: '8px 20px',
                  marginTop: '-4px',
                }}
              >
                {currentFile === undefined
                  ? '---'
                  : `${currentFile.path ? currentFile.path + '/' : ''}${currentFile.name}`}
              </div>
              <div style={{ flexGrow: 1 }} />
            </div>
            <CodeWindow
              code={currentFile === undefined ? ' ' : getFileContent(currentFile)}
              name={currentFile === undefined ? ' ' : currentFile.name}
              onSave={onSave}
            />
          </div>

          <div style={{ flex: 1, minWidth: '100px', overflowX: 'auto' }}>
            <PseudoTerminal
              env={env}
              submissions={[]}
              setTestSubject={setTestSubject}
              resizable={false}
              log={logs}
              isRunning={running}
              runTest={runTest}
              testSelectComponent={testCaseSelect}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PseudoIDE;
