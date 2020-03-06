import * as React from 'react';

import SplitPane from 'react-split-pane';

import { Icon, Menu, Skeleton, Spin } from 'antd';

import { CodeWindow } from '../admin/assignments/tests/edit/utils/CodeWindow';
import { PseudoTerminal, RESULT_TYPE, ILogType } from '../admin/assignments/tests/edit/TestDefinitions/PseudoTerminal';
import useWindowSize from './useWindowSize';

import { SolutionFile, SolutionFileType } from '../../infrastructure/autograder/solutionFile';
import { SubmissionType } from '../../infrastructure/submission';
import { Environment, EnvironmentType } from '../../infrastructure/autograder/environment';
import { HelperFile, HelperFileType } from '../../infrastructure/autograder/helperFile';
import { SourceFile, SourceFileType } from '../../infrastructure/autograder/sourceFile';
import { arrayUpdate } from '../../infrastructure/immutable';
import { AssignmentType, TestCaseType, TestCategoryType, FileType } from '../../infrastructure/types';
import { TestEditorResultType } from '../../infrastructure/autograder/runTypes';
import { TestCase } from '../../infrastructure/testCase';

import {
  fetchSourceFiles,
  fetchSolutionFiles,
  fetchEnvironment,
  fetchHelpers,
  fetchTestData,
  TestCasesByCategory,
} from './testFetchUtils';

import { awaitTestResult } from '../admin/assignments/tests/testResult';

interface IPseudoIDEProps {
  files: FileType[];
  assignment: AssignmentType;
}

const PseudoIDE = (props: IPseudoIDEProps) => {
  const [loading, setLoading] = React.useState<boolean>(true);

  const [filesCopy, setFilesCopy] = React.useState<FileType[]>(props.files);
  const [currentFileID, setCurrentFileID] = React.useState<number | undefined>(undefined);

  const height = useWindowSize().height * 0.85;

  const setTestSubject = (tmp: string) => {
    console.log('sset');
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
    if (props.files.length > 0) {
      setFilesCopy(props.files);
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
  const [solutions, setSolutions] = React.useState<SolutionFileType[]>([]);
  const [helpers, setHelpers] = React.useState<HelperFileType[]>([]);
  const [sourceFiles, setSourceFiles] = React.useState<SourceFileType[]>([]);
  const [casesByCategory, setCasesByCategory] = React.useState<TestCasesByCategory>({});
  const [categories, setCategories] = React.useState<TestCategoryType[]>([]);

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const currEnv = await fetchEnvironment(props.assignment);
      setEnv(currEnv);
      if (currEnv) {
        const solutionFiles = await fetchSolutionFiles(currEnv);
        setSolutions(solutionFiles);
        const helpers = await fetchHelpers(currEnv);
        setHelpers(helpers);
        const sourceFiles: SourceFileType[] = await fetchSourceFiles(currEnv);
        setSourceFiles(sourceFiles);
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
  /***************** Test Running *************************/
  //
  // Mostly copied from
  // - TestDefinitions.tsx
  // - TestingSetup.tsx
  // - SourceEditor.tsx
  //////////////////////////////////////////////////////////

  const [running, setRunning] = React.useState<boolean>(false);
  const [logs, setLogs] = React.useState<ILogType[]>([]);

  const replaceTestCase = (newCase: TestCaseType, oldID: number) => {
    setCasesByCategory((prevState) => {
      const filteredTests = prevState[newCase.testCategory]
        ? prevState[newCase.testCategory].filter((tc) => {
            return tc.id !== oldID;
          })
        : [];
      const newCases = { ...prevState };
      newCases[newCase.testCategory] = [...filteredTests, newCase];
      return newCases;
    });
  };

  const updateTestStatus = async (testCaseID: number, result: number) => {
    const newTest = await TestCase.update({ id: testCaseID, lastSolutionRun: result });
    replaceTestCase(newTest, testCaseID);
    // updateActiveTest(newTest, true);
  };

  const parseFileModeResults = async (response: TestEditorResultType) => {
    // In case new tests were created (if file mode, test parsing turned off),
    //    fetch the newest tests before setting resylts
    const [_categories, _casesByCategory]: any = await fetchTestData(props.assignment);
    setCategories(_categories);
    setCasesByCategory(_casesByCategory);

    // if (props.env && props.env.dumpMode && activeSubmission) {
    //   // Refresh submission files after dump, in case a _tests.txt file was created
    //   setTestSubject(activeSubmission.id.toString());
    // }

    //
    const formatted = {
      log: <span style={{ color: '#678CAB' }}>{response.logs}</span>,
      target: 'solution code',
      result: RESULT_TYPE.NONE,
      testCaseName: '',
    };

    const logs = response.results.map((el) => {
      const testCase = _casesByCategory[el.testCategory].find((tc: TestCaseType) => tc.id === el.testCase)!;
      const status = el.isError ? RESULT_TYPE.ERROR : el.passed ? RESULT_TYPE.PASSED : RESULT_TYPE.FAILED;

      if (testCase) {
        // if (!activeSubmission) {
        //   updateTestStatus(testCase.id, status);
        // }
        updateTestStatus(testCase.id, status);
      }

      return {
        log: el.logs,
        target: 'solution code',
        result: status,
        testCaseName: testCase ? testCase.description : '',
      };
    });

    return [formatted, ...logs];
  };

  const callback = async (response: TestEditorResultType) => {
    const newLogs = await parseFileModeResults(response);
    setRunning(false);
    setLogs(newLogs);
  };

  const fileToRun = 'main.sh';

  const runTest = async () => {
    if (env) {
      setRunning(true);
      let result: any;
      if (fileToRun === 'main.sh') {
        // Run all tests
        // result = await Environment.run(
        //   props.env.id,
        //   props.activeSubmission ? { submission: props.activeSubmission.id.toString(), simulate: 'True' } : {},
        // );
        result = await Environment.run(env.id, {});
      }
      // else {
      //   const found = props.sourceFiles.find((el) => el.name === fileToRun);
      //   if (found !== undefined) {
      //     result = await SourceFile.run(
      //       found.id,
      //       props.activeSubmission
      //         ? {
      //             submission: props.activeSubmission.id.toString(),
      //           }
      //         : {},
      //     );
      //   }
      // }
      awaitTestResult(result.task, callback);
    }
  };

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

  return (
    <div style={{ height: `${height}px`, position: 'relative' }} className="pseudo-ide">
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
              return <Menu.Item key={`file-${file.id}`}>{file.name}</Menu.Item>;
            })}
          </Menu>
        </div>
        <SplitPane split="vertical" defaultSize="50%" pane1Style={{ overflowY: 'auto' }} minSize={100}>
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
                {currentFile === undefined ? '---' : currentFile.name}
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
            submissions={[]}
            setTestSubject={setTestSubject}
            resizable={false}
            log={logs}
            isRunning={running}
            runTest={runTest}
          />
        </SplitPane>
      </SplitPane>
    </div>
  );
};

export default PseudoIDE;
