/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import React, { useState, useEffect } from 'react';

/* library imports */
import { Modal, Button, Divider, Icon, Radio, Select, Spin, Tooltip, Tag, Typography, Empty } from 'antd';

/* codePost object imports */
import { AssignmentPatchType, AssignmentType } from '../../../../../infrastructure/assignment';
import { EnvironmentType } from '../../../../../infrastructure/autograder/environment';

/* codePost component imports */
import { CodeWindow } from './utils/CodeWindow';

/* codePost util imports */
import { languages } from './utils/languageUtils';

import { TestFileList } from './EnvironmentSpecs/TestFileList';
import { Environment } from '../../../../../infrastructure/autograder/environment';

import { SolutionFileType } from '../../../../../infrastructure/autograder/solutionFile';
import { HelperFileType } from '../../../../../infrastructure/autograder/helperFile';

import CPTooltip from '../../../../core/CPTooltip';

import { FILE_TYPE } from './TestingSetup';

import locale from './utils/languageLocale';

import themeVars from '../../../../../styles/abstracts/_theme';

const { Option } = Select;
const { confirm } = Modal;

/**********************************************************************************************************************/

interface IProps {
  currentAssignment: AssignmentType;
  updateAssignment: (assignment: AssignmentPatchType) => Promise<void>;
  env: EnvironmentType | undefined;
  buildEnv: (language: string, dependencies: string[], buildType: string) => Promise<void>;
  updateCompileText: (compileText: string) => Promise<void>;
  helpers: SolutionFileType[] | HelperFileType[];
  solutions: SolutionFileType[] | HelperFileType[];
  addFile: (type: FILE_TYPE, name: string, code: string, path?: string) => Promise<void>;
  deleteFile: (type: FILE_TYPE, id: number) => Promise<void>;
  updateFile: (type: FILE_TYPE, id: number, newCode: string) => Promise<void>;
  loading: boolean;
}

export const EnvironmentSpecs = (props: IProps) => {
  /******************************* State Variables ****************************/
  const [language, setLanguage] = useState<string | null>(props.env ? props.env.language : null);
  const [buildType, setBuildType] = useState<string>(props.env ? props.env.buildType : 'default');
  const [dependencies, setDependencies] = useState<string[]>(props.env ? JSON.parse(props.env.dependencies) : []);
  const [buildIsLoading, setBuildIsLoading] = useState(false);

  /******************************* API / State Change Functions ****************************/

  useEffect(() => {
    if (props.env) {
      setLanguage(props.env.language);
      setDependencies(JSON.parse(props.env.dependencies));
      setBuildType(props.env.buildType);
    }
  }, [props.env]);

  const onSave = () => {
    if (props.env && language !== props.env.language) {
      confirm({
        title: `Are you sure you want to change the language of the environment?`,
        content: 'This may cause existing tests to stop working.',
        onOk() {
          saveEnv();
        },
        onCancel() {
          return;
        },
      });
    } else {
      saveEnv();
    }
  };

  const saveEnv = async () => {
    setBuildIsLoading(true);
    if (buildType !== 'default' && props.env && buildType !== props.env.buildType) {
      confirm({
        title: `Are you sure you want to use a custom build?`,
        content:
          'When you use a custom build, the only default packages are those built into the operating system. Please make sure to install the required language packages for your langauge in the "Install Packages" field.',
        async onOk() {
          await props.buildEnv(language !== null ? language : '', dependencies, buildType);
        },
      });
    } else {
      await props.buildEnv(language !== null ? language : '', dependencies, buildType);
    }
    setBuildIsLoading(false);
  };

  const saveCompileText = async (newText: string) => {
    await props.updateCompileText(newText);
  };

  const downloadDockerfile = async () => {
    if (props.env) {
      const dockerfile = await Environment.dockerfile(props.env.id);
      const a = document.createElement('a');
      a.href = `data:text/plain;charset=utf-8,${dockerfile}`;
      a.download = `${props.currentAssignment.name}-dockerfile`;
      document.body.appendChild(a);
      a.click();
    }
  };

  /******************************* State Change Functions ****************************/
  const onLanguageChange = (value: string) => {
    setLanguage(value);
    setBuildType(value === 'other' ? 'alpine' : 'default');

    // if it's a new language, reset dependencies
    if (!props.env || value !== props.env.language) {
      setDependencies([]);
      setBuildType(value === 'other' ? 'alpine' : 'default');
    }
    // if we return to old language, reset dependencies to props
    if (props.env && value === props.env.language) {
      setDependencies(JSON.parse(props.env.dependencies));
      setBuildType(props.env.buildType);
    }
  };

  const onDependenciesChange = (newDependencies: string[]) => {
    setDependencies(newDependencies);
  };

  const onBuildTypeChange = (e: any) => {
    const newBuildType = e.target.value === 'default' ? 'default' : 'alpine';
    setBuildType(newBuildType);
    if (!props.env || newBuildType !== props.env.buildType) {
      setDependencies([]);
    }
    if (props.env && newBuildType === props.env.buildType) {
      setDependencies(JSON.parse(props.env.dependencies));
    }
  };

  const onCustomBuildChange = (type: string) => {
    setBuildType(type);
  };

  /******************************* Return ****************************/

  if (props.loading) {
    return (
      <div className="display-flex justify-content-center align-iterms-center">
        <Spin style={{ marginTop: 15 }} />
      </div>
    );
  }

  //************ 1A. ENVIRONMENT -  SELECT LANGUAGE
  const selectLanguage = (
    // Disable selector if environment has a custom dockerfile defined
    <Select
      value={props.env && props.env.dockerfile.length > 0 ? 'Custom' : language || undefined}
      onChange={onLanguageChange}
      style={{ minWidth: 300 }}
      disabled={props.env && props.env.dockerfile.length > 0}
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
  const lookupValue = buildType === 'default' ? language : buildType;
  const installText = (lookupValue && locale[lookupValue].installCmd) || '';
  const envSpecText = lookupValue && locale[lookupValue].environment;
  const languageIcon = (
    <Tooltip title={envSpecText}>
      <Icon type="database" theme="twoTone" twoToneColor={themeVars.theme.brandPrimary} />
    </Tooltip>
  );

  //************ 1B. ENVIRONMENT -  SELECT BUILD TYPE
  const buildOptions = (
    <Radio.Group onChange={onBuildTypeChange} value={buildType === 'default' ? 'default' : 'custom'}>
      <Radio value={'default'} disabled={language === 'other'}>
        Default (Recommended)
      </Radio>
      <Radio value={'custom'}>Custom</Radio>
    </Radio.Group>
  );

  const customBuildSelect = buildType !== 'default' && (
    <Select value={buildType} onChange={onCustomBuildChange} style={{ minWidth: 150 }}>
      <Option key={'alpine'} value={'alpine'}>
        Alpine-Linux
      </Option>
      <Option key={'ubuntu'} value={'ubuntu'}>
        Ubuntu
      </Option>
      <Option key={'windows'} disabled={true} value={'windows'}>
        Windows (coming soon)
      </Option>
    </Select>
  );

  //************ 1C. ENVIRONMENT -  SELECT DEPENDENCIES
  const selectDependencies = (
    // Disable selector if environment has a custom dockerfile defined
    <div style={{ marginLeft: 10 }}>
      <Tooltip title="This is the install command run for all packages in this build.">
        <Tag style={{ lineHeight: '32px', height: 32, marginRight: 5 }}>{installText}</Tag>
      </Tooltip>
      <Select
        mode="tags"
        style={{ minWidth: 300 }}
        value={dependencies}
        placeholder={'Add package to environment'}
        onChange={onDependenciesChange}
        disabled={language === null || (props.env && props.env.dockerfile.length > 0)}
      />
    </div>
  );

  //************ 1D. ENVIRONMENT - SHOW CUSTOM DOCKERFILE IF IT EXISTS
  const customDockerFile = props.env && props.env.dockerfile && (
    <span>Custom DockerFile:&nbsp;{props.env.dockerfile}</span>
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

  const showAfterCreation = (
    <div>
      <Divider />
      <Typography.Title level={3}>2. Create a runscript</Typography.Title>
      <span>
        <b>Instructions</b>: A runscript is run once before any test run. If you're using a compiled language, use this
        script to compile. You can also perform pre-processing here.
      </span>
      <br />
      <br />
      <CodeWindow code={(props.env && props.env.compileText) || ''} name={'.sh'} onSave={saveCompileText} />
      <Divider />
      <Typography.Title level={3}>3. Add test helper files</Typography.Title>
      <span>
        <b>Instructions</b>: Helper files can be imported by tests, student code, or solution code.
      </span>
      <br />
      <br />
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
      <span>
        <b>Instructions</b>: Solution code is used to check the correctness of your tests. Though optional, it is
        strongly recommended to verify that your tests perform as expected on solution code.
      </span>
      <br />
      <br />
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
          <Button type="primary" onClick={onSave} loading={buildIsLoading}>
            {props.env ? 'Update' : 'Create'}
          </Button>
          {props.env && (
            <Button style={{ marginLeft: 10 }} onClick={downloadDockerfile} disabled={buildIsLoading}>
              Download
            </Button>
          )}
        </div>
      </div>
      Language: {selectLanguage} &nbsp; {languageIcon}
      <br />
      <br />
      <span style={{ lineHeight: '32px' }}>Build Type:</span> {buildOptions} {customBuildSelect}
      <br />
      <br />
      <div className="display-flex align-items-center">Install packages: {selectDependencies}</div>
      {customDockerFile}
      {props.env ? showAfterCreation : null}
    </div>
  );
};
