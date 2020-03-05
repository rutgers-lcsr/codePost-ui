import * as React from 'react';

import SplitPane from 'react-split-pane';

import { Icon, Menu, Skeleton, Spin } from 'antd';

import { CodeWindow } from '../admin/assignments/tests/edit/utils/CodeWindow';
import { PseudoTerminal } from '../admin/assignments/tests/edit/TestDefinitions/PseudoTerminal';
import useWindowSize from './useWindowSize';

import { SolutionFile, SolutionFileType } from '../../infrastructure/autograder/solutionFile';
import { SubmissionType } from '../../infrastructure/submission';
import { Environment, EnvironmentType } from '../../infrastructure/autograder/environment';
import { HelperFile, HelperFileType } from '../../infrastructure/autograder/helperFile';
import { SourceFile, SourceFileType } from '../../infrastructure/autograder/sourceFile';
import { arrayUpdate } from '../../infrastructure/immutable';
import { AssignmentType, TestCaseType, TestCategoryType, FileType } from '../../infrastructure/types';

import {
  fetchSourceFiles,
  fetchSolutionFiles,
  fetchEnvironment,
  fetchHelpers,
  fetchTestData,
  TestCasesByCategory,
} from './testFetchUtils';

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
          <PseudoTerminal submissions={[]} setTestSubject={setTestSubject} resizable={false} />
        </SplitPane>
      </SplitPane>
    </div>
  );
};

export default PseudoIDE;
