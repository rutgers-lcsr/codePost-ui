/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import React, { useState, useEffect } from 'react';

/* library imports */
import { Modal, Button, Collapse, Divider, Select, Typography, Empty, message } from 'antd';

/* codePost object imports */
import { AssignmentPatchType, AssignmentType } from '../../../../../infrastructure/assignment';
import { Environment, EnvironmentType } from '../../../../../infrastructure/autograder/environment';

/* codePost component imports */
import { CodeWindow } from './CodeWindow';

/* codePost util imports */
import { languages, hasDependenciesSupport } from './languageUtils';

import { TestFileList } from './TestFileList';

import { SolutionFileType } from '../../../../../infrastructure/autograder/solutionFile';
import { HelperFileType } from '../../../../../infrastructure/autograder/helperFile';

import CPTooltip from '../../../../core/CPTooltip';

import { FILE_TYPE } from './TestingSetup';

import locale from './languageLocale';

const { Option } = Select;
const { Panel } = Collapse;
const { confirm } = Modal;

/**********************************************************************************************************************/

interface IProps {
  currentAssignment: AssignmentType;
  onCancel: () => void;
  onContinue: () => void;
  updateAssignment: (assignment: AssignmentPatchType) => Promise<void>;
  env: EnvironmentType | undefined;
  createEnv: (language: string, compileText: string, dependencies: string[]) => void;
  updateEnv: (env: EnvironmentType) => void;
  deleteEnv: () => void;
  helpers: SolutionFileType[] | HelperFileType[];
  solutions: SolutionFileType[] | HelperFileType[];
  addFile: (type: FILE_TYPE, name: string, code: string) => Promise<void>;
  deleteFile: (type: FILE_TYPE, id: number) => Promise<void>;
  updateFile: (type: FILE_TYPE, id: number, newCode: string) => Promise<void>;
}

export const EnvironmentSpecs = (props: IProps) => {
  /******************************* State Variables ****************************/
  const [language, setLanguage] = useState<string | null>(props.env ? props.env.language : null);
  const [dependencies, setDependencies] = useState<string[]>(props.env ? JSON.parse(props.env.dependencies) : []);
  const [errorLogs, setErrorLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  /******************************* API / State Change Functions ****************************/

  useEffect(() => {
    if (props.env) {
      setLanguage(props.env.language);
    }
  }, [props.env]);

  const saveEnv = async () => {
    if (!props.env) {
      setLoading(true);
      await props.createEnv(language !== null ? language : '', '', []);
      setLoading(false);
      message.success('Environment created');
    } else {
      setLoading(true);
      const payload = {
        id: props.env.id,
        dependencies: dependencies,
        language: language!,
        simulate: false,
      };
      const newEnv = await Environment.updateBuild(payload);
      if (newEnv) {
        props.updateEnv(newEnv);
      }
      message.success('Environment saved');
      setLoading(false);
    }
  };

  const saveCompileText = async (newText: string) => {
    if (!props.env) {
      return;
    }
    const payload = {
      id: props.env.id,
      compileText: newText,
    };
    const newEnv = await Environment.update(payload);
    if (newEnv) {
      props.updateEnv(newEnv);
    }
  };

  const deleteEnv = async () => {
    if (props.env !== undefined) {
      confirm({
        title: 'Are you sure you want to delete your environment?',
        content: 'This will delete all of your tests, too.',
        onOk() {
          return new Promise((resolve, reject) => {
            setLanguage(null);
            resolve(props.deleteEnv());
          }).catch(() => console.log('Oops errors!'));
        },
      });
    }
  };

  /******************************* State Change Functions ****************************/
  const onLanguageChange = (value: string) => {
    setLanguage(value);
  };

  const onDependenciesChange = (newDependencies: string[]) => {
    setDependencies(newDependencies);
  };

  /******************************* Return ****************************/

  const selectLanguage = (
    <Select
      value={language || undefined}
      onChange={onLanguageChange}
      style={{ minWidth: 300 }}
      disabled={props.env !== undefined}
    >
      {languages.map((language) => {
        return (
          <Option key={language} value={language}>
            {language}
          </Option>
        );
      })}
    </Select>
  );

  // Fixme: refactor into util
  const dependencyText = language && locale[language].dependencies;
  const envSpecText = language && locale[language].environment;

  const selectDependencies = (
    <Select
      mode="tags"
      style={{ minWidth: 300 }}
      value={dependencies}
      placeholder={dependencyText}
      onChange={onDependenciesChange}
      disabled={language === null || !hasDependenciesSupport(language)}
    />
  );

  if (props.env === undefined && language === null) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Empty
          style={{ marginTop: '20px', maxWidth: '400px' }}
          description={
            <span>
              To run tests using codePost, start by creating a language. Otherwise, you can define tests but you'll have
              to run them elsewhere.
            </span>
          }
        >
          Select language: {selectLanguage}
        </Empty>
      </div>
    );
  }

  // const errorPanel =
  //   errorLogs.length === 0 ? (
  //     <div />
  //   ) : (
  //     <Collapse bordered={false} defaultActiveKey={[]}>
  //       <Panel header="Traceback" key="1">
  //         {errorLogs.map((error, i) => {
  //           return <div key={i}>{error}</div>;
  //         })}
  //       </Panel>
  //     </Collapse>
  //   );

  const showAfterCreation = (
    <div>
      <Divider />
      <Typography.Title level={3}>2. Create a runscript</Typography.Title>
      <CodeWindow code={(props.env && props.env.compileText) || ''} name={'.sh'} onSave={saveCompileText} />
      <Divider />
      <Typography.Title level={3}>3. Add custom dependencies</Typography.Title>
      <TestFileList
        files={props.helpers}
        addFile={props.addFile.bind({}, FILE_TYPE.HELPER)}
        deleteFile={props.deleteFile.bind({}, FILE_TYPE.HELPER)}
        updateFile={props.updateFile.bind({}, FILE_TYPE.HELPER)}
        height={300}
        title="Upload custom dependencies"
      />
      <Divider />
      <Typography.Title level={3}>4. Add solution code</Typography.Title>
      <TestFileList
        files={props.solutions}
        addFile={props.addFile.bind({}, FILE_TYPE.SOLUTION)}
        deleteFile={props.deleteFile.bind({}, FILE_TYPE.SOLUTION)}
        updateFile={props.updateFile.bind({}, FILE_TYPE.SOLUTION)}
        height={300}
        title="Upload solution code"
      />
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography.Title level={3}>1. Define environment</Typography.Title>
        <div>
          {props.env ? (
            <Button type="danger" onClick={deleteEnv}>
              Delete
            </Button>
          ) : (
            undefined
          )}
          &nbsp;
          <Button type="primary" onClick={saveEnv} loading={loading}>
            {props.env ? 'Save' : 'Create'}
          </Button>
        </div>
      </div>
      Language: {selectLanguage} &nbsp;
      <CPTooltip infoIcon={true} title={envSpecText} />
      <br />
      <br />
      Custom dependencies: {selectDependencies}
      {props.env ? showAfterCreation : null}
    </div>
  );
};
