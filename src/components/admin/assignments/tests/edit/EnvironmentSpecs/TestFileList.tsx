/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import React, { useState, useEffect } from 'react';

/* library imports  */
import { Layout, Menu } from 'antd';
import { ClickParam } from 'antd/lib/menu';

/* codePost object imports  */
import { SolutionFileType } from '../../../../../../infrastructure/autograder/solutionFile';
import { HelperFileType } from '../../../../../../infrastructure/autograder/helperFile';

/* codePost component imports  */
import { CodeWindow } from '../utils/CodeWindow';
import { TestFileUploader } from './TestFileUploader';

import {
  IFolder,
  IDirectoryStructure,
  buildFolderMenu,
  createDirectoryStructure,
  sortFiles,
} from '../../../../../code-review/menu/fileMenuUtils';

/**********************************************************************************************************************/

const { Sider, Content } = Layout;

interface IProps {
  files: SolutionFileType[] | HelperFileType[];
  addFile: (name: string, code: string, path?: string) => Promise<void>;
  deleteFile: (id: number) => Promise<void>;
  updateFile: (id: number, newCode: string) => Promise<void>;
  height?: number;
  title: string;
}

export const TestFileList = (props: IProps) => {
  /******************************* State Variables ****************************/
  const [currentIndex, setIndex] = useState('0');
  const [sortedFiles, setSortedFiles] = useState<SolutionFileType[] | HelperFileType[]>([]);
  const [directory, setDirectory] = useState<IDirectoryStructure<SolutionFileType | HelperFileType>>();

  useEffect(() => {
    const directoryStructure = createDirectoryStructure<SolutionFileType | HelperFileType>(props.files);
    setDirectory(directoryStructure);
    const sortedFiles = sortFiles(directoryStructure);
    setSortedFiles(sortedFiles);
    setIndex('0');
  }, [props.files]);

  /******************************** API Functions ****************************/
  const onSave = (newCode: string) => {
    return props.updateFile(sortedFiles[parseInt(currentIndex, 10)].id, newCode);
  };

  /************************** State Change Functions ****************************/
  const changeIndex = (e: ClickParam) => {
    setIndex(e.key);
  };

  const buildFileMenu = (files: SolutionFileType[] | HelperFileType[]) => {
    return files.map((file) => {
      const sortedIndex = sortedFiles.findIndex((f) => {
        return f.id === file.id;
      });
      return (
        <Menu.Item key={sortedIndex.toString()} style={{ height: 'fit-content', minHeight: 40 }}>
          {file.name}
        </Menu.Item>
      );
    });
  };

  let menu;
  if (directory) {
    const folders = directory.folders.map((f: IFolder<SolutionFileType | HelperFileType>) => {
      return buildFolderMenu('', f, buildFileMenu);
    });

    menu = (
      <Menu onClick={changeIndex} mode="inline" selectedKeys={[currentIndex]}>
        {buildFileMenu(directory.files)}
        {folders}
      </Menu>
    );
  }
  /***************************** Return ****************************************/
  if (sortedFiles.length === 0) {
    return (
      <TestFileUploader
        title={props.title}
        directory={directory}
        addFile={props.addFile}
        deleteFile={props.deleteFile}
      />
    );
  } else {
    return (
      <div>
        <Layout style={{ height: props.height ? props.height : 650 }}>
          <Sider theme="light" style={{ maxHeight: 650, overflow: 'auto' }}>
            {menu}
            <TestFileUploader
              directory={directory}
              addFile={props.addFile}
              deleteFile={props.deleteFile}
              title={props.title}
            />
          </Sider>
          <Content style={{ maxHeight: '70vh', overflow: 'visible', fontSize: 12 }}>
            {sortedFiles.length === 0 ? (
              <div />
            ) : (
              <div style={{ position: 'relative', marginLeft: 5 }}>
                <CodeWindow
                  code={sortedFiles[parseInt(currentIndex, 10)].code}
                  name={sortedFiles[parseInt(currentIndex, 10)].name}
                  onSave={onSave}
                />
              </div>
            )}
          </Content>
        </Layout>
      </div>
    );
  }
};
