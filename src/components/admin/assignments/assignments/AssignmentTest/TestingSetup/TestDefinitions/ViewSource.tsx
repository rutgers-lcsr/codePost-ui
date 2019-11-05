/* react imports */
import React, { useEffect, useState } from 'react';

/* library imports  */
import { Button, Layout, Menu, Spin } from 'antd';
import { ClickParam } from 'antd/lib/menu';

import JSZip from 'jszip';
import { saveAs } from 'file-saver';

/* codePost object imports  */
import {
  Environment,
  EnvironmentType,
  TestsSourceType,
  TestTemplateType,
} from '../../../../../../../infrastructure/autograder/environment';
import { SolutionFileType } from '../../../../../../../infrastructure/autograder/solutionFile';
import { FileType } from '../../../../../../../infrastructure/file';
import { HelperFileType } from '../../../../../../../infrastructure/autograder/helperFile';
import { SubmissionType } from '../../../../../../../infrastructure/submission';

/* codePost other imports  */
import { CodeWindow } from '../utils/CodeWindow';
import { CodeSwitcher } from '../utils/CodeSwitcher';

const { Sider, Content } = Layout;
const { SubMenu } = Menu;
interface ViewSourceProps {
  env: EnvironmentType;
  solutions: SolutionFileType[];
  helpers: HelperFileType[];
  submissions: SubmissionType[];
}

// FIXME: This component shares the same basic structure as ProMode.
// Abstract out the menu codeviewer + code switcher into a base component
export const ViewSource = (props: ViewSourceProps) => {
  const [loading, setLoading] = useState(false);
  const [currentIndex, setIndex] = useState('bash');
  const [tests, setTests] = useState<TestTemplateType[]>([]);
  const [main, setMain] = useState('');
  const [currentFiles, setCurrentFiles] = useState<(SolutionFileType | FileType)[]>(props.solutions);
  const changeIndex = (e: ClickParam) => {
    setIndex(e.key);
  };

  let currentCode;
  let currentName;

  if (currentIndex === 'bash') {
    currentCode = main;
    currentName = 'main.sh';
  } else if (currentIndex.includes('helpers-')) {
    const index = currentIndex.split('-')[1];
    currentCode = props.helpers[parseInt(index, 10)].code;
    currentName = props.helpers[parseInt(index, 10)].name;
  } else if (currentIndex.includes('files')) {
    const index = currentIndex.split('-')[1];
    currentCode = currentFiles[parseInt(index, 10)].code;
    currentName = currentFiles[parseInt(index, 10)].name;
  } else {
    const index = currentIndex.split('-')[1];
    currentCode = tests[parseInt(index, 10)].code;
    currentName = tests[parseInt(index, 10)].extension;
  }

  /******************************** Set up ****************************/
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const source: TestsSourceType = await Environment.eject(props.env.id);
      setMain(source.main);
      setTests(source.templates);
      setLoading(false);
    };
    fetchData();
  }, [props.env.id]);

  const helperMenu = (
    <SubMenu key="helpers" title={<div style={{ display: 'flex', alignItems: 'center' }}>helpers &nbsp;</div>}>
      {props.helpers.map((file, index) => {
        return (
          <Menu.Item key={`helpers-${index.toString()}`} style={{ height: 'fit-content', minHeight: 40 }}>
            <div>{file.name}</div>
          </Menu.Item>
        );
      })}
    </SubMenu>
  );

  const currentFileMenu = (
    <SubMenu
      key="files"
      title={
        <div style={{ display: 'flex', alignItems: 'center' }}>
          files &nbsp;
          <CodeSwitcher solutionFiles={props.solutions} submissions={props.submissions} setFiles={setCurrentFiles} />
        </div>
      }
    >
      {currentFiles.map((file, index) => {
        return (
          <Menu.Item key={`files-${index.toString()}`} style={{ height: 'fit-content', minHeight: 40 }}>
            <div>{file.name}</div>
          </Menu.Item>
        );
      })}
    </SubMenu>
  );

  const currentTemplates = (
    <SubMenu key="tests" title={<div style={{ display: 'flex', alignItems: 'center' }}>tests &nbsp;</div>}>
      {tests.map((test, index) => {
        return (
          <Menu.Item key={`tests-${index.toString()}`} style={{ height: 'fit-content', minHeight: 40 }}>
            <div>{`Test${test.id}${test.extension}`}</div>
          </Menu.Item>
        );
      })}
    </SubMenu>
  );

  // FIXME: Turn zipping of a directory into a generic helper function
  const download = () => {
    const zip = new JSZip();
    zip.file('main.sh', main);
    let dir = zip.folder('tests');
    tests.map((test) => {
      dir.file(`Test${test.id}${test.extension}`, test.code);
    });
    dir = zip.folder('files');
    currentFiles.map((file) => {
      dir.file(file.name, file.code);
    });
    dir = zip.folder('helpers');
    props.helpers.map((file) => {
      dir.file(file.name, file.code);
    });

    zip.generateAsync({ type: 'blob' }).then(function(content: any) {
      saveAs(content, `test-directory.zip`);
    });
  };

  /************************** Return  ****************************/
  if (loading) {
    return <Spin />;
  }
  return (
    <div>
      <Button onClick={download} style={{ float: 'right', marginBottom: 10 }} type="primary" icon="download">
        Download
      </Button>
      <div
        id="Autograder"
        style={{
          boxShadow: 'rgba(0, 0, 0, 0.1) 0px 2px 15px 0px',
          padding: '15px 5px',
          margin: 5,
          width: '95%',
          overflow: 'auto',
          minHeight: 'fit-content',
        }}
      >
        <Layout style={{ maxHeight: 450 }}>
          <Sider theme="light">
            <Menu
              selectedKeys={[currentIndex]}
              openKeys={['helpers', 'files', 'tests']}
              mode="inline"
              onClick={changeIndex}
            >
              <Menu.Item key={'bash'} style={{ height: 'fit-content', minHeight: 40 }}>
                <div>{'Main.sh'}</div>
              </Menu.Item>
              {helperMenu}
              {currentFileMenu}
              {currentTemplates}
            </Menu>
          </Sider>
          <Content style={{ maxHeight: '70vh', overflow: 'auto', fontSize: 12, marginLeft: 5 }}>
            {currentFiles && <CodeWindow code={currentCode} name={currentName} />}
          </Content>
        </Layout>
      </div>
    </div>
  );
};
