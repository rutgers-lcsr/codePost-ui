/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import { useEffect, useState } from 'react';

import { DatabaseTwoTone, InfoOutlined } from '@ant-design/icons';

/* library imports */
import { Button, Divider, Empty, Modal, Radio, Select, Skeleton, Tabs, Tooltip, Typography } from 'antd';

/* codePost object imports */
import { Assignment, AssignmentType } from '../../../../../infrastructure/assignment';
import { EnvironmentType } from '../../../../../infrastructure/autograder/environment';

import { BuildDetailModal } from './EnvironmentSpecs/BuildDetailModal';

/* codePost component imports */
import { CodeWindow } from './utils/CodeWindow';

/* codePost util imports */
import { languages } from './utils/languageUtils';

import { Environment } from '../../../../../infrastructure/autograder/environment';
import { TestFileList } from './EnvironmentSpecs/TestFileList';

import { HelperFileType } from '../../../../../infrastructure/autograder/helperFile';
import { SolutionFileType } from '../../../../../infrastructure/autograder/solutionFile';

import { FILE_TYPE } from './TestingSetup';

import locale from './utils/languageLocale';

import themeVars from '../../../../../styles/abstracts/_theme.js';

import { awaitBuildResult } from '../autograderPollingUtils';
import Editor from '@monaco-editor/react';

const { Option } = Select;
const { confirm } = Modal;

/**********************************************************************************************************************/

interface IProps {
  currentAssignment: AssignmentType;
  env: EnvironmentType | undefined;
  updateEnv: (
    language: string,
    dependencies: string,
    customDockerfile: string,
    buildType: string,
  ) => Promise<EnvironmentType>;
  reloadEnv: () => void;
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
  // Environment specification variables
  const [language, setLanguage] = useState<string | null>(props.env ? props.env.language : null);
  const [buildType, setBuildType] = useState<string>(props.env ? props.env.buildType : 'default');
  const [dependencies, setDependencies] = useState<string>(props.env ? props.env.dockerRunInstructions.join('\n') : '');
  const [customDockerfile, setCustomDockerfile] = useState<string>(props.env ? props.env.dockerfile : '');

  // Build status variables
  const [buildInProgress, setBuildInProgress] = useState(false);
  const [buildIsSuccess, setBuildIsSuccess] = useState<boolean | null>(null);
  const [buildLogs, setBuildLogs] = useState('');
  const [dockerfile, setDockerfile] = useState('');

  /******************************* API / State Change Functions ****************************/

  useEffect(() => {
    if (props.env) {
      setLanguage(props.env.language);
      setDependencies(props.env.dockerRunInstructions.join('\n'));
      setBuildType(props.env.buildType);
      setCustomDockerfile(props.env.dockerfile);
    }
  }, [props.env]);

  useEffect(() => {
    // Get the last result (if completed)
    // If in progress, this restarts polling to give the user updates
    if (props.env && props.env.id) {
      awaitBuildResult(props.env.id, buildStatusCallback);
    }
  }, [props.env && props.env.id]);

  useEffect(() => {
    // If language was just created, launch a save
    // We don't do this in the on save function because useState is asynchronous
    if (!props.env && language) {
      onSave();
    }
  }, [language]);

  const saveEnv = async () => {
    setBuildInProgress(true);
    // Show a warning if a user is switching from default to a custom image
    if (props.env && props.env.buildType === 'default' && buildType !== props.env.buildType && language !== 'other') {
      confirm({
        title: `Are you sure you want to use a custom build?`,
        content:
          'When you use a custom build, the only default packages are those built into the operating system. Please make sure to install the required language packages for your langauge in the "Install Packages" field.',
        async onOk() {
          await buildEnv(language !== null ? language : '', dependencies, customDockerfile, buildType);
        },
      });
    } else {
      await buildEnv(language !== null ? language : '', dependencies, customDockerfile, buildType);
    }
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

  const buildEnv = async (language: string, dependencies: string, customDockerfile: string, buildType: string) => {
    // First post/patch the new fields to the object
    const newEnvironment = await props.updateEnv(language, dependencies, customDockerfile, buildType);

    // Reset the logs and the in progress
    setBuildInProgress(true);
    setBuildLogs('');

    // Wait for the build to be triggered
    await Environment.build({ ...newEnvironment, language });

    // Set up polling for the result
    awaitBuildResult(newEnvironment.id, buildStatusCallback);
  };

  const onSave = async () => {
    const latestAssignment = await Assignment.read(props.currentAssignment.id);
    // Show a warning if the language has changed or test categories have been defined already
    if (props.env && language !== props.env.language && latestAssignment.testCategories.length > 0) {
      // prompt warning
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

  /******************************* State Change Functions ****************************/
  // Callback function for each poll to build status
  const buildStatusCallback = (result: {
    inProgress: boolean;
    isSuccess: boolean;
    logs: string;
    dockerfile: string;
  }) => {
    setBuildInProgress(result.inProgress);
    setBuildIsSuccess(result.isSuccess);
    setBuildLogs(result.logs);
    setDockerfile(result.dockerfile);

    if (result.isSuccess) {
      props.reloadEnv();
    }
  };

  const onLanguageChange = (value: string) => {
    setLanguage(value);
    setBuildType(value === 'other' ? 'alpine' : 'default');

    // if it's a new language, reset dependencies
    if (!props.env || value !== props.env.language) {
      setDependencies('');
      setBuildType(value === 'other' ? 'alpine' : 'default');
    }
    // if we return to old language, reset dependencies to props
    if (props.env && value === props.env.language) {
      setDependencies(props.env.dockerRunInstructions.join('\n'));
      setBuildType(props.env.buildType);
    }
  };

  const onDependenciesChange = (event: any) => {
    setDependencies(event.target.value);
  };

  const onCustomDockerfileChange = (event: any) => {
    setCustomDockerfile(event.target.value);
  };

  const onBuildTypeChange = (e: any) => {
    const newBuildType = e.target.value === 'default' ? 'default' : 'ubuntu';
    setBuildType(newBuildType);
    if (!props.env || newBuildType !== props.env.buildType) {
      setDependencies('');
    }
    if (props.env && newBuildType === props.env.buildType) {
      setDependencies(props.env.dockerRunInstructions.join('\n'));
    }
  };

  const onCustomBuildChange = (type: string) => {
    setBuildType(type);
  };

  /******************************* Return ****************************/

  if (props.loading) {
    return (
      <div className="display-flex justify-content-center align-items-center">
        <Skeleton active />
      </div>
    );
  }

  //************ 1A. ENVIRONMENT -  SELECT LANGUAGE
  const selectLanguage = (
    // Disable selector if environment has a custom dockerfile defined
    <Select value={language || undefined} onChange={onLanguageChange} style={{ minWidth: 300 }}>
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
      <DatabaseTwoTone twoToneColor={themeVars.theme.brandPrimary} />
    </Tooltip>
  );

  //************ 1B. ENVIRONMENT -  SELECT BUILD TYPE
  const buildOptions = (
    <Radio.Group onChange={onBuildTypeChange} value={buildType === 'default' ? 'default' : 'custom'}>
      <Radio value={'default'} disabled={language === 'other'}>
        Default (recommended)
      </Radio>
      <Radio value={'custom'}>Custom</Radio>
    </Radio.Group>
  );

  const customBuildSelect = buildType !== 'default' && (
    <Select value={buildType} onChange={onCustomBuildChange} style={{ minWidth: 200 }}>
      <Option key={'ubuntu'} value={'ubuntu'}>
        Ubuntu
      </Option>
      <Option key={'alpine'} value={'alpine'}>
        Alpine-Linux
      </Option>
      <Option key={'windows'} disabled={true} value={'windows'}>
        Windows (coming soon)
      </Option>
    </Select>
  );

  //************ 1C. Install packages ******************
  const placeholder = `// new line separated
${installText} package1
${installText} package2
...`;

  const dependenciesInput = (
    // Disable selector if environment has a custom dockerfile defined
    // <Input.TextArea
    //   autoSize={{ minRows: 4, maxRows: 8 }}
    //   value={dependencies}
    //   onChange={onDependenciesChange}
    //   placeholder={placeholder}
    //   style={{ marginLeft: '15px', width: '50%' }}
    // />
    <Editor
      height="200px"
      defaultLanguage="shell"
      value={dependencies}
      onChange={onDependenciesChange}
      defaultValue={placeholder}
      theme="vs-dark"
      options={{ minimap: { enabled: false }, fontSize: 14, wordWrap: 'on' }}
    />
  );

  const dockerPlaceholder = `// docker file syntax
// adding commands here will replace any text in 'Install packages'
RUN ${installText} package1
RUN ${installText} package2
...`;

  const customDockerInput = props.env && (
    <Editor
      height="200px"
      defaultLanguage="dockerfile"
      value={customDockerfile}
      onChange={onCustomDockerfileChange}
      defaultValue={dockerPlaceholder}
      theme="vs-dark"
      options={{ minimap: { enabled: false }, fontSize: 14, wordWrap: 'on' }}
    />
  );

  const install =
    buildType === 'default' ? (
      <span>
        <div className="display-flex">
          <div className="display-flex flex-direction-column">
            <span>
              Install packages:{' '}
              <Tooltip title="Add newline-delimited install commands">
                <InfoOutlined />
              </Tooltip>
            </span>{' '}
          </div>{' '}
          <br />
          {dependenciesInput}
        </div>
      </span>
    ) : (
      <Tabs defaultActiveKey={props.env && props.env.dockerfile.length > 0 ? '2' : '1'} style={{ width: '80%' }}>
        <Tabs.TabPane key="1" tab="Install packages">
          {dependenciesInput}
        </Tabs.TabPane>
        <Tabs.TabPane key="2" tab="[Advanced] Custom dockerfile">
          {customDockerInput}
        </Tabs.TabPane>
      </Tabs>
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

      <CodeWindow
        code={(props.env && props.env.compileText) || ''}
        name={'.sh'}
        onSave={saveCompileText}
        height={'200px'}
      />
      <Divider />
      <Typography.Title level={3}>3. Add helper files</Typography.Title>
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
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
          <Typography.Title level={3} style={{ marginBottom: 0 }}>
            1. Define environment
          </Typography.Title>
          <BuildDetailModal
            inProgress={buildInProgress}
            isSuccess={buildIsSuccess}
            logs={buildLogs}
            dockerfile={dockerfile}
          />
        </div>
        <div>
          <Button type="primary" onClick={onSave} loading={buildInProgress}>
            {props.env ? 'Update' : 'Create'}
          </Button>
          {props.env && (
            <Button style={{ marginLeft: 10 }} onClick={downloadDockerfile} disabled={buildInProgress}>
              Download
            </Button>
          )}
        </div>
      </div>
      Language: {selectLanguage} &nbsp; {languageIcon}
      <br />
      <br />
      <span style={{ lineHeight: '32px' }}>Build type:</span> {buildOptions} {customBuildSelect}
      <br />
      <br />
      <div>{install}</div>
      {props.env ? showAfterCreation : null}
    </div>
  );
};
