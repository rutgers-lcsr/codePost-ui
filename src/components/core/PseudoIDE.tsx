import * as React from 'react';

import SplitPane from 'react-split-pane';

import { Menu, message, Select, Skeleton } from 'antd';

import { CodeWindow } from '../admin/assignments/tests/edit/utils/CodeWindow';
import { PseudoTerminal, RESULT_TYPE, ILogType } from '../admin/assignments/tests/edit/TestDefinitions/PseudoTerminal';
import useWindowSize from './useWindowSize';
import _ from 'lodash';

import { AnonymousSubmissionType } from '../../infrastructure/submission';
import { EnvironmentType } from '../../infrastructure/autograder/environment';
// import { SolutionFile, SolutionFileType } from '../../infrastructure/autograder/solutionFile';
// import { HelperFile, HelperFileType } from '../../infrastructure/autograder/helperFile';
// import { SourceFile, SourceFileType } from '../../infrastructure/autograder/sourceFile';
import { arrayUpdate } from '../../infrastructure/immutable';
import { AssignmentType, TestCaseType, TestCategoryType, FileType } from '../../infrastructure/types';
import { TestEditorResultType, BasicTestResultType } from '../../infrastructure/autograder/runTypes';
import { TestCase } from '../../infrastructure/testCase';

import { fetchEnvironment, fetchTestData, TestCasesByCategory } from './testFetchUtils';

import { awaitTestResult } from '../admin/assignments/tests/autograderPollingUtils';

interface IPseudoIDEProps {
  files: FileType[];
  assignment: AssignmentType;
  submission: AnonymousSubmissionType;
}

const PseudoIDE = (props: IPseudoIDEProps) => {
  const [loading, setLoading] = React.useState<boolean>(true);

  const [filesCopy, setFilesCopy] = React.useState<FileType[]>(_.cloneDeep(props.files));
  const [currentFileID, setCurrentFileID] = React.useState<number | undefined>(undefined);

  const height = useWindowSize().height * 0.85;

  const setTestSubject = (tmp: string) => {
    // console.log('placeholder');
  };

  const onSave = (code: string) => {
    const thisFileIndex = filesCopy.findIndex((file: FileType) => {
      return file.id === currentFileID;
    });

    if (thisFileIndex === -1) {
      return Promise.resolve();
    }

    let thisFile = filesCopy[thisFileIndex];
    thisFile.code = code;

    setFilesCopy(arrayUpdate(filesCopy, thisFile, thisFileIndex));
    return Promise.resolve();
  };

  React.useEffect(() => {
    if (props.files.length > 0 && currentFileID === undefined) {
      setFilesCopy(_.cloneDeep(props.files));
      setCurrentFileID(props.files[0].id);
    }
  }, [props.files]);

  const handleClick = (e: any) => {
    const fileID = +e.key.split('-')[1];

    setCurrentFileID(fileID);
  };

  //////////////////////////////////////////////////////////
  /***************** Test Loading *************************/
  //////////////////////////////////////////////////////////

  const [env, setEnv] = React.useState<EnvironmentType | undefined>(undefined);
  // const [solutions, setSolutions] = React.useState<SolutionFileType[]>([]);
  // const [helpers, setHelpers] = React.useState<HelperFileType[]>([]);
  // const [sourceFiles, setSourceFiles] = React.useState<SourceFileType[]>([]);
  const [casesByCategory, setCasesByCategory] = React.useState<TestCasesByCategory>({});
  const [categories, setCategories] = React.useState<TestCategoryType[]>([]);

  const [selectedTestCase, setSelectedTestCase] = React.useState<TestCaseType | undefined>(undefined);

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const currEnv = await fetchEnvironment(props.assignment);
      setEnv(currEnv);
      if (currEnv) {
        // const solutionFiles = await fetchSolutionFiles(currEnv);
        // setSolutions(solutionFiles);
        // const helpers = await fetchHelpers(currEnv);
        // setHelpers(helpers);
        // const sourceFiles: SourceFileType[] = await fetchSourceFiles(currEnv);
        // setSourceFiles(sourceFiles);
        const [_categories, _casesByCategory]: any = await fetchTestData(props.assignment);
        setCategories(_categories);
        setCasesByCategory(_casesByCategory);
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
          code: file.code,
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
          <span style={{ color: '#678CAB' }}>{response.logs}</span>
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
        <SplitPane split="vertical" defaultSize="20%" minSize={100}>
          <div style={{ padding: '20px 40px' }}>
            <Skeleton active />
          </div>
          <SplitPane split="vertical" defaultSize="50%" pane1Style={{ overflowY: 'auto' }} minSize={100}>
            <div style={{ padding: '20px 40px' }}>
              <Skeleton active />
            </div>

            <div />
          </SplitPane>
        </SplitPane>
      </div>
    );
  }

  const onTestCaseSelectChange = (_value: any) => {
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
        if (casesByCategory.hasOwnProperty(+category.id)) {
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
      <SplitPane split="vertical" defaultSize="20%" minSize={100}>
        <div>
          <div style={{ backgroundColor: '#fafafa', padding: '8px 16px', fontSize: '20px', fontWeight: 500 }}>
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
                <Menu.Item key={`file - ${file.id} `}>
                  {file.path && <span style={{ color: '#c0c0c0' }}>{file.path}/</span>}
                  <span style={{ fontWeight: 500 }}>{file.name}</span>
                </Menu.Item>
              );
            })}
          </Menu>
        </div>
        <SplitPane
          split="vertical"
          defaultSize="50%"
          pane1Style={{ overflowY: 'auto' }}
          pane2Style={{ overflowX: 'auto' }}
          minSize={100}
        >
          <div>
            <div style={{ display: 'flex', padding: '4px 0px' }}>
              <div
                style={{
                  backgroundColor: '#999',
                  color: '#fff',
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
              code={currentFile === undefined ? ' ' : currentFile.code}
              name={currentFile === undefined ? ' ' : currentFile.name}
              onSave={onSave}
            />
          </div>

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
        </SplitPane>
      </SplitPane>
    </div>
  );
};

export default PseudoIDE;
