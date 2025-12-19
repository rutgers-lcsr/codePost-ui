/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import { useEffect, useState } from 'react';

import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  BuildOutlined,
  CodeOutlined,
  RobotOutlined,
  EyeOutlined,
  SearchOutlined,
  DeleteOutlined,
} from '@ant-design/icons';

/* library imports */
import {
  Button,
  Drawer,
  Radio,
  Select,
  Skeleton,
  Tabs,
  Typography,
  Card,
  Tag,
  Result,
  Alert,
  Space,
  message,
  Tooltip,
  Input,
} from 'antd';

/* codePost object imports */
import { AssignmentType } from '../../../../../infrastructure/assignment';
import { Environment, EnvironmentType } from '../../../../../infrastructure/autograder/environment';

import { BuildDetailModal } from './EnvironmentSpecs/BuildDetailModal';
import { AutoDetectStatus } from './EnvironmentSpecs/AutoDetectStatus';

/* codePost component imports */
import { CodeWindow } from './utils/CodeWindow';
import CPTooltip from '../../../../core/CPTooltip';

/* codePost util imports */
import { languages } from './utils/languageUtils';
import { useEnvironmentSpecs } from './hooks/useEnvironmentSpecs';

import locale from './utils/languageLocale';

import themeVars from '../../../../../styles/abstracts/_theme.js';

import { awaitBuildResult } from '../autograderPollingUtils';
import Editor from '@monaco-editor/react';

const { Option } = Select;

/**********************************************************************************************************************/

interface IProps {
  currentAssignment: AssignmentType;
  env: EnvironmentType | undefined;
  updateEnv: (
    language: string,
    dependencies: string,
    customDockerfile: string,
    buildType: string,
    requirements: string,
    autoDetect: boolean,
    envVars: Record<string, string>,
  ) => Promise<EnvironmentType>;
  reloadEnv: () => void;
  updateCompileText: (compileText: string) => Promise<void>;
  loading: boolean;
  helpers?: any[];
  solutions?: any[];
}

export const EnvironmentSpecs = (props: IProps) => {
  const {
    language,
    setLanguage,
    buildType,
    setBuildType,
    dependencies,
    setDependencies,
    customDockerfile,
    setCustomDockerfile,
    requirements,
    setRequirements,
    autoDetect,
    setAutoDetect,
    buildInProgress,
    setBuildInProgress,
    buildLogs,
    setBuildLogs,
    buildIsSuccess,
    setBuildIsSuccess,
    buildDockerfile,
    setBuildDockerfile,
    stateRef,
    scanForManifests,
    saveEnv,
    envVars,
    setEnvVars,
  } = useEnvironmentSpecs(props, props.env ? props.env.language : '');

  // UI State (local to component)
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [newEnvKey, setNewEnvKey] = useState('');
  const [newEnvVal, setNewEnvVal] = useState('');

  // Helper to normalize family names consistently
  const getLanguageFamily = (lang: string) => {
    if (!lang) return null;
    let family = lang;
    if (lang.includes('-')) {
      family = lang.split('-')[0];
    }
    family = family.toLowerCase();

    if (family === 'python') return 'Python';
    if (family === 'java') return 'Java';
    if (family === 'javascript' || family === 'node' || family === 'js') return 'Node.js';
    if (family === 'r') return 'R';
    if (family === 'c/c++') return 'C/C++';
    if (family === 'haskell') return 'Haskell';
    if (family === 'ocaml') return 'Ocaml';
    if (family === 'ruby') return 'Ruby';
    if (family === 'php') return 'PHP';

    return family.charAt(0).toUpperCase() + family.slice(1);
  };

  // Derived State for Language Selector
  const languageFamilyMap = languages.reduce((acc: any, lang) => {
    const family = getLanguageFamily(lang);

    // Determine version for display
    let version = 'Default';
    if (lang.includes('-')) {
      version = lang.split('-')[1];
    } else {
      // e.g. 'java' -> 'Default' (or could use "Latest")
    }

    if (family) {
      if (!acc[family]) acc[family] = [];
      acc[family].push({ key: lang, version });
    }
    return acc;
  }, {});

  const currentFamily = getLanguageFamily(language || '');
  const currentVersions = currentFamily && languageFamilyMap[currentFamily] ? languageFamilyMap[currentFamily] : [];

  const isDirty = () => {
    if (!props.env) return true;
    const currentRunInstructions = dependencies;
    const initialRunInstructions = props.env.dockerRunInstructions.join('\n');

    return (
      language !== props.env.language ||
      buildType !== props.env.buildType ||
      currentRunInstructions !== initialRunInstructions ||
      customDockerfile !== props.env.dockerfile ||
      requirements !== (props.env.requirements || '') ||
      autoDetect !== props.env.autoDetect ||
      !dictionariesEqual(envVars, props.env.envVars || {})
    );
  };

  const dictionariesEqual = (a: Record<string, string>, b: Record<string, string>) => {
    const aKeys = Object.keys(a).sort();
    const bKeys = Object.keys(b).sort();
    if (aKeys.length !== bKeys.length) return false;
    for (let i = 0; i < aKeys.length; i++) {
      const key = aKeys[i];
      if (key !== bKeys[i] || a[key] !== b[key]) return false;
    }
    return true;
  };

  const buildStatusCallback = (result: any) => {
    const { inProgress, isSuccess, logs, dockerfile } = result;
    setBuildLogs(logs || '');
    setBuildDockerfile(dockerfile || '');
    if (inProgress === false) {
      setBuildInProgress(false);
      setBuildIsSuccess(isSuccess);
      props.reloadEnv();
    }
  };

  // Preview Logic
  const fetchPreview = async () => {
    if (!props.env) return;
    try {
      const result = await Environment.preview({
        id: props.env.id,
        language: language || props.env.language,
        buildType: buildType,
        dockerfile: customDockerfile,
        dockerRunInstructions: dependencies ? dependencies.split('\n') : [],
        requirements: requirements,
      });
      setPreviewContent(result);
    } catch (e) {
      message.error('Failed to generate preview');
    }
  };

  useEffect(() => {
    if (previewVisible) {
      fetchPreview();
    }
  }, [previewVisible]);

  // Keyboard shortcut for Save (Ctrl+S / Cmd+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        message.loading({ content: 'Saving...', key: 'save_shortcut' });
        saveEnv(false).then(() => {
          message.success({ content: 'Saved via shortcut', key: 'save_shortcut' });
        });
      }
    };
    // Use capture phase to intercept Ctrl+S before Monaco Editor consumes it
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [saveEnv]);

  const saveCompileText = async (newText: string) => {
    await props.updateCompileText(newText);
  };

  const downloadDockerfile = async () => {
    if (props.env) {
      const dockerfile = await Environment.dockerfile(props.env.id);
      const a = document.createElement('a');
      a.href = `data:text/plain;charset=utf-8,${encodeURIComponent(dockerfile)}`;
      a.download = `${props.currentAssignment.name}-dockerfile`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  // Run on mount
  useEffect(() => {
    scanForManifests(false);
  }, [props.env?.id]);

  /******************************* API / State Change Functions ****************************/

  useEffect(() => {
    if (props.env) {
      // Only set these if they aren't already set, or if we switched environments
      setLanguage(props.env.language);
      setDependencies(props.env.dockerRunInstructions.join('\n'));
      setBuildType(props.env.buildType);
      setCustomDockerfile(props.env.dockerfile);
      setRequirements(props.env.requirements || '');
      setAutoDetect(props.env.autoDetect);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.env?.id]);

  useEffect(() => {
    if (props.env && props.env.id) {
      awaitBuildResult(props.env.id, buildStatusCallback);
    }
  }, [props.env && props.env.id]);

  useEffect(() => {
    if (!props.env && language) {
      // Logic for new environment creation immediate save (if applicable)
    }
  }, [language]);

  /******************************* UI Helpers ****************************/

  const onFamilyChange = (family: string) => {
    if (!family) {
      setLanguage('');
      return;
    }
    const versions = languageFamilyMap[family];
    // Default to first version
    if (versions && versions.length > 0) {
      onLanguageChange(versions[0].key);
    }
  };

  const onLanguageChange = (value: string) => {
    setLanguage(value || '');
    if (value === 'other') {
      setBuildType('ubuntu');
    } else {
      setBuildType('default');
    }
  };

  // ... (deps change handlers same as before) ...
  const onDependenciesChange = (value: string | undefined) => {
    const newVal = value || '';
    setDependencies(newVal);
    stateRef.current.dependencies = newVal;
  };

  const onCustomDockerfileChange = (value: string | undefined) => {
    const newVal = value || '';
    setCustomDockerfile(newVal);
    stateRef.current.customDockerfile = newVal;
  };

  const changeBuildType = (type: string) => {
    setBuildType(type);
  };

  const onAutoDetectChange = (checked: boolean) => {
    setAutoDetect(checked);
  };

  /******************************* Return ****************************/

  if (props.loading) {
    return <Skeleton active />;
  }

  // Show auto-detect status panel when autoDetect is enabled
  const autoDetectStatusPanel = props.env && props.env.autoDetect && (
    <AutoDetectStatus environment={props.env} onRefresh={props.reloadEnv} />
  );

  //************ 1A. ENVIRONMENT -  SELECT TEMPLATE
  const selectTemplate = (
    <div style={{ display: 'flex', gap: 10 }}>
      <Select
        placeholder="Select Language"
        value={currentFamily || undefined}
        onChange={onFamilyChange}
        style={{ width: 200 }}
        size="large"
      >
        {Object.keys(languageFamilyMap).map((family) => (
          <Option key={family} value={family}>
            {family}
          </Option>
        ))}
      </Select>

      {currentVersions.length > 1 && (
        <Select
          placeholder="Version"
          value={language || undefined}
          onChange={onLanguageChange}
          style={{ width: 150 }}
          size="large"
        >
          {currentVersions.map((v: any) => (
            <Option key={v.key} value={v.key}>
              {v.version}
            </Option>
          ))}
        </Select>
      )}
      <Tooltip
        title={`Scan for ${locale[language || 'python-3.12']?.dependencyFile || 'manifest'} files in the assignment`}
      >
        <Button icon={<SearchOutlined />} onClick={() => scanForManifests(true)} size="large">
          Scan for Manifests
        </Button>
      </Tooltip>
    </div>
  );

  //************ 1B. ENVIRONMENT -  SELECT BUILD TYPE

  const depConfig = language && locale[language] && locale[language].dependencyFile ? locale[language] : null;

  //************ 2. ADVANCED CONFIGURATION

  const dependenciesInput = (
    <Editor
      height="250px"
      defaultLanguage="shell"
      value={dependencies}
      onChange={onDependenciesChange}
      theme="vs-dark"
      options={{ minimap: { enabled: false }, fontSize: 13, wordWrap: 'on', padding: { top: 10 } }}
    />
  );

  const customDockerInput = props.env && (
    <Editor
      height="300px"
      defaultLanguage="dockerfile"
      value={customDockerfile}
      onChange={onCustomDockerfileChange}
      theme="vs-dark"
      options={{ minimap: { enabled: false }, fontSize: 13, wordWrap: 'on', padding: { top: 10 } }}
    />
  );

  const manifestTab = depConfig
    ? {
        key: '1',
        label: depConfig.dependencyFile, // e.g. "Project Dependencies (pom.xml)"? User said "Manifest" defaults.
        children: (
          <>
            <Alert message={depConfig.dependencyHelp} type="info" showIcon style={{ marginBottom: 10 }} />
            <Editor
              height="250px"
              defaultLanguage={depConfig.dependencyMode || 'text'}
              value={requirements}
              onChange={(value) => setRequirements(value || '')}
              theme="vs-dark"
              options={{ minimap: { enabled: false }, fontSize: 13, wordWrap: 'on', padding: { top: 10 } }}
            />
          </>
        ),
      }
    : null;

  const systemTab = {
    key: '2',
    label: 'System Packages',
    children: (
      <>
        <Alert
          message="Install system-level packages (e.g. via apt-get or apk)."
          type="info"
          showIcon
          style={{ marginBottom: 10 }}
        />
        {dependenciesInput}
      </>
    ),
  };

  // Env Vars Logic

  const addEnvVar = () => {
    if (!newEnvKey.trim()) {
      message.warning('Key cannot be empty');
      return;
    }
    if (envVars[newEnvKey.trim()]) {
      message.warning('Key already exists');
      return;
    }
    setEnvVars({ ...envVars, [newEnvKey.trim()]: newEnvVal });
    setNewEnvKey('');
    setNewEnvVal('');
  };

  const removeEnvVar = (key: string) => {
    const next = { ...envVars };
    delete next[key];
    setEnvVars(next);
  };

  const updateEnvVarVal = (key: string, val: string) => {
    setEnvVars({ ...envVars, [key]: val });
  };

  const envVarsInput = (
    <div style={{ padding: 10 }}>
      <Typography.Title level={5}>Runtime Environment Variables</Typography.Title>
      <Alert
        message="These variables will be available to the student code at runtime."
        type="info"
        showIcon
        style={{ marginBottom: 15 }}
      />

      {Object.entries(envVars).map(([k, v]) => (
        <div key={k} style={{ display: 'flex', marginBottom: 8, gap: 10 }}>
          <Input value={k} disabled style={{ width: '30%' }} />
          <Input
            value={v}
            onChange={(e) => updateEnvVarVal(k, e.target.value)}
            style={{ flex: 1 }}
            placeholder="Value"
          />
          <Button danger icon={<DeleteOutlined />} onClick={() => removeEnvVar(k)} />
        </div>
      ))}

      <div
        style={{
          display: 'flex',
          marginTop: 15,
          gap: 10,
          alignItems: 'center',
          borderTop: '1px solid #eee',
          paddingTop: 15,
        }}
      >
        <Input
          placeholder="NEW_VAR_NAME"
          value={newEnvKey}
          onChange={(e) => setNewEnvKey(e.target.value.toUpperCase())}
          style={{ width: '30%' }}
        />
        <Input
          placeholder="Value"
          value={newEnvVal}
          onChange={(e) => setNewEnvVal(e.target.value)}
          style={{ flex: 1 }}
          onPressEnter={addEnvVar}
        />
        <Button type="primary" onClick={addEnvVar}>
          Add
        </Button>
      </div>
    </div>
  );

  const envVarsTab = {
    key: '4',
    label: 'Environment Variables',
    children: envVarsInput,
  };

  // Logic: Use Manifest tab as default if available.
  const DEFAULT_TAB = manifestTab ? '1' : '2';

  const showAfterCreation = (
    <Card
      title={
        <span>
          <CodeOutlined /> Pre-test Runscript{' '}
          <CPTooltip title="Runs before tests (e.g., compile code)." infoIcon={true} style={{ marginLeft: 8 }} />
        </span>
      }
      style={{ marginTop: 20 }}
      extra={<Typography.Text type="secondary">Runs before tests (e.g., compile code)</Typography.Text>}
      variant="borderless"
    >
      <CodeWindow
        code={(props.env && props.env.compileText) || ''}
        name={'.sh'}
        onSave={saveCompileText}
        height={'200px'}
      />
    </Card>
  );

  // ****************** RENDER HELPERS ******************

  let statusBadge = (
    <Tag icon={<CloseCircleOutlined />} color="default">
      Not Configured
    </Tag>
  );

  if (buildInProgress) {
    statusBadge = (
      <Tag icon={<SyncOutlined spin />} color="processing">
        Building...
      </Tag>
    );
  } else if (buildIsSuccess === true) {
    statusBadge = (
      <Tag
        icon={<CheckCircleOutlined />}
        color="success"
        style={{ cursor: 'pointer' }}
        onClick={() => setShowLogsModal(true)}
      >
        Build Successful
      </Tag>
    );
  } else if (buildIsSuccess === false) {
    if (buildLogs && buildLogs.includes('Reset for Auto-Detection')) {
      statusBadge = (
        <Tag icon={<SyncOutlined />} color="processing">
          Waiting for Auto-Detect
        </Tag>
      );
    } else {
      statusBadge = (
        <Tag
          icon={<CloseCircleOutlined />}
          color="error"
          style={{ cursor: 'pointer' }}
          onClick={() => setShowLogsModal(true)}
        >
          Build Failed
        </Tag>
      );
    }
  } else if (props.env) {
    // Existing env but no recent build info in session vertical
    // Use lastBuilt if available or just say "Ready"
    statusBadge = (
      <Tag icon={<CheckCircleOutlined />} color="default">
        Ready
      </Tag>
    );
  }

  //************ 1B. ENVIRONMENT -  STRATEGY SELECTION
  // Grouping Build Type and Base Image logic into a clearer "Strategy" selector

  const onStrategyChange = (e: any) => {
    const strategy = e.target.value;
    if (strategy === 'default') {
      setBuildType('default');
      // If language was 'other', reset to python default or something?
      if (language === 'other') {
        onFamilyChange('Python'); // fallback
      }
    } else {
      // Custom strategy
      setBuildType('ubuntu'); // default custom base
      setLanguage('other');
    }
  };

  const strategySelector = (
    <div style={{ marginBottom: 20 }}>
      <Typography.Title level={5}>
        1. Environment Strategy
        <CPTooltip
          title="Choose between a pre-configured environment (Managed) or a fully custom Dockerfile."
          infoIcon={true}
          style={{ marginLeft: 8 }}
        />
      </Typography.Title>
      <Radio.Group onChange={onStrategyChange} value={buildType === 'default' ? 'default' : 'custom'}>
        <Radio.Button value="default" style={{ width: 150, textAlign: 'center' }}>
          Managed
        </Radio.Button>
        <Radio.Button value="custom" style={{ width: 150, textAlign: 'center' }}>
          Custom Dockerfile
        </Radio.Button>
      </Radio.Group>
      <div style={{ marginTop: 8 }}>
        {buildType === 'default' ? (
          <Typography.Text type="secondary">
            Pre-built environments for common languages. Easy to configure.
          </Typography.Text>
        ) : (
          <Typography.Text type="secondary">Full control via Dockerfile. For advanced users.</Typography.Text>
        )}
      </div>
    </div>
  );

  //************ 2. MANAGED CONFIGURATION
  const managedConfig = (
    <div style={{ marginTop: 20 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20 }}>{selectTemplate}</div>

      <Typography.Title level={5}>
        2. Configuration
        <CPTooltip title="Manage dependencies and packages." infoIcon={true} style={{ marginLeft: 8 }} />
      </Typography.Title>
      <Tabs
        defaultActiveKey={DEFAULT_TAB}
        type="card"
        items={[...(manifestTab ? [manifestTab] : []), systemTab, envVarsTab]}
      />
    </div>
  );

  //************ 3. CUSTOM CONFIGURATION
  const customConfig = (
    <div style={{ marginTop: 20 }}>
      <div style={{ marginBottom: 20 }}>
        <Typography.Text strong>Base Image Logic: </Typography.Text>
        <Radio.Group
          onChange={(e) => changeBuildType(e.target.value)}
          value={buildType === 'ubuntu' || buildType === 'alpine' ? buildType : 'ubuntu'}
        >
          <Radio value={'ubuntu'}>Ubuntu 18.04 (apt-get)</Radio>
          <Radio value={'alpine'}>Alpine Linux (apk)</Radio>
        </Radio.Group>
      </div>

      <Alert
        message={`You are in Custom Mode. The detected overrides will be appended to the ${buildType === 'alpine' ? 'Alpine' : 'Ubuntu'} base image.`}
        type="info"
        showIcon
        style={{ marginBottom: 15 }}
        action={
          <Button
            size="small"
            type="primary"
            onClick={() => {
              // Load template
              const isAlpine = buildType === 'alpine';
              const install = isAlpine ? 'apk add' : 'apt-get install -y';
              const base = isAlpine ? 'alpine:3.11' : 'ubuntu:18.04';

              const content = `# Dockerfile template for Custom Build\n# Base Image: ${base} (inc. bash, python3, make)\n\nRUN ${install} git\n\n`;
              setCustomDockerfile(content);
            }}
          >
            Reset to Template
          </Button>
        }
      />
      <Typography.Title level={5}>Additional Dockerfile Commands</Typography.Title>
      {customDockerInput}
    </div>
  );

  const manualConfiguration = (
    <div style={{ marginTop: 20 }}>
      {strategySelector}

      {buildType === 'default' ? managedConfig : customConfig}
    </div>
  );

  const autoDetectView = (
    <div style={{ padding: '20px 0' }}>
      <div style={{ textAlign: 'center' }}>
        <Result
          icon={<RobotOutlined style={{ color: themeVars.theme.brandPrimary }} />}
          title="Auto-Detect Enabled"
          subTitle="We will automatically detect the language and dependencies from student submissions."
          extra={[
            <div key="desc" style={{ maxWidth: 500, margin: '0 auto', textAlign: 'left', color: 'rgba(0,0,0,0.65)' }}>
              <ul style={{ listStyleType: 'circle' }}>
                <li>
                  Submissions with <b>.py</b> files will trigger Python environment.
                </li>
                <li>
                  Submissions with <b>pkg.json</b> or <b>requirements.txt</b> will auto-install dependencies.
                </li>
                <li>
                  <b>Note:</b> You can still define a Runscript below.
                </li>
              </ul>
            </div>,
          ]}
        />
      </div>

      {/* Environment Variables (available in both modes) */}
      <Card
        title="Runtime Environment Variables"
        style={{ marginTop: 20, textAlign: 'left', maxWidth: 700, margin: '20px auto' }}
      >
        {envVarsInput}
      </Card>

      {/* Auto-Detect Status Panel moved below Env Vars as requested */}
      {autoDetectStatusPanel}
    </div>
  );

  return (
    <div style={{ padding: 20, backgroundColor: '#f0f2f5', minHeight: '100%' }}>
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <Typography.Title level={4} style={{ marginBottom: 5 }}>
            Environment Configuration
          </Typography.Title>
          <Space>
            Status: {statusBadge}
            {buildIsSuccess === false && (
              <Button size="small" type="link" onClick={() => setShowLogsModal(true)}>
                View Logs
              </Button>
            )}
          </Space>
        </div>
        <Space>
          <Button type="default" size="large" onClick={() => setShowLogsModal(true)} icon={<BuildOutlined />}>
            Build Logs
          </Button>

          <Button icon={<EyeOutlined />} onClick={() => setPreviewVisible(true)} size="large">
            Preview
          </Button>
          <Button
            type="default"
            size="large"
            onClick={() => saveEnv(false)}
            loading={buildInProgress}
            disabled={!isDirty()}
          >
            Save Changes
          </Button>
          <Button type="primary" size="large" onClick={() => saveEnv(true)} loading={buildInProgress}>
            {props.env ? 'Update & Build' : 'Create & Build'}
          </Button>
        </Space>
      </div>

      {/* Main Configuration Card */}
      <Card bordered={false} style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', paddingBottom: 20, borderBottom: '1px solid #f0f0f0' }}>
          <span style={{ marginRight: 15, fontWeight: 600, fontSize: 16 }}>Mode:</span>
          <Radio.Group
            value={autoDetect ? 'auto' : 'manual'}
            onChange={(e) => onAutoDetectChange(e.target.value === 'auto')}
            buttonStyle="solid"
          >
            <Radio.Button value="auto">Auto-Detect</Radio.Button>
            <Radio.Button value="manual">Manual Configuration</Radio.Button>
          </Radio.Group>

          {autoDetect && (
            <Tag color="blue" style={{ marginLeft: 15 }}>
              Recommended
            </Tag>
          )}
        </div>

        {autoDetect ? autoDetectView : manualConfiguration}
      </Card>

      {/* Runscript Section */}
      {props.env ? showAfterCreation : null}

      {/* Modals */}
      <BuildDetailModal
        visible={showLogsModal}
        onClose={() => setShowLogsModal(false)}
        inProgress={buildInProgress}
        isSuccess={buildIsSuccess}
        logs={buildLogs}
        dockerfile={buildDockerfile}
      />

      {/* Dockerfile Preview Drawer */}
      <Drawer
        title="Parsed Dockerfile Preview"
        placement="right"
        width={720}
        onClose={() => setPreviewVisible(false)}
        open={previewVisible}
        extra={
          <Button type="primary" onClick={downloadDockerfile}>
            Download
          </Button>
        }
      >
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Alert
            message="This is a preview of the Dockerfile that will be generated based on your current settings."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <div style={{ flex: 1, border: '1px solid #d9d9d9' }}>
            <Editor
              language="dockerfile"
              theme="vs-light"
              value={previewContent || '// Loading...'}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 12,
                scrollBeyondLastLine: false,
              }}
            />
          </div>
        </div>
      </Drawer>
    </div>
  );
};
