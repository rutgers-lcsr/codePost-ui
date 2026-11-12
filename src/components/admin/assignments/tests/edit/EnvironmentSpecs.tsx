// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  SyncOutlined,
  BuildOutlined,
  CodeOutlined,
  EyeOutlined,
  SearchOutlined,
  DeleteOutlined,
} from '@ant-design/icons';

/* library imports */
import {
  Button,
  Divider,
  Drawer,
  Radio,
  Select,
  Skeleton,
  Tabs,
  Typography,
  Card,
  Tag,
  Alert,
  Space,
  message,
  Tooltip,
  Input,
} from 'antd';
import type { RadioChangeEvent } from 'antd';
import { Link } from 'react-router';

/* codePost object imports */

import { BuildDetailModal } from './EnvironmentSpecs/BuildDetailModal';
import { AutoDetectStatus } from './EnvironmentSpecs/AutoDetectStatus';
import { STATUS_LABEL, buildLogTail, environmentStatus } from './EnvironmentSpecs/environmentStatus';
import { EnvironmentShellWidget } from '../../assignments/EnvironmentShellWidget';

/* codePost component imports */
import { CodeWindow } from './utils/CodeWindow';
import CPTooltip from '../../../../core/CPTooltip';

/* codePost util imports */
import { languages } from './utils/languageUtils';
import { useEnvironmentSpecs } from './hooks/useEnvironmentSpecs';
import type { ScannedFile } from './utils/scanners';

import locale from './utils/languageLocale';

import { apiErrorMessageAsync } from '../../../../../lib/apiError';
import { GREEN_TAG, ORANGE_TAG } from '../../../../../theme/tagStyles';

import Editor from '../../../../../lib/monaco';
import { BuildTypeEnum, Environment, LanguageEnum } from '../../../../../api-client/index.js';
import { autograderApi } from '../../../../../api-client/clients.js';
import { AssignmentType } from '../../../../../types/models';

const { Option } = Select;

// DESIGN.md: ink-secondary and line-soft.
const INK_SECONDARY = 'rgba(0, 0, 0, 0.6)';
const LINE_SOFT = 'rgba(0, 0, 0, 0.1)';
const sectionTitle = { fontSize: 16, marginTop: 0, marginBottom: 8 };

/**********************************************************************************************************************/

interface IProps {
  currentAssignment: AssignmentType;
  env?: Environment;
  updateEnv: (
    language: string,
    dependencies: string,
    customDockerfile: string,
    buildType: string,
    requirements: string,
    autoDetect: boolean,
    envVars: Record<string, string>,
  ) => Promise<Environment>;
  reloadEnv: () => void;
  updateCompileText: (compileText: string) => Promise<void>;
  loading: boolean;
  helpers?: ScannedFile[];
  solutions?: ScannedFile[];
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
    buildLogs,
    buildDockerfile,
    stateRef,
    scanForManifests,
    saveEnv,
    envVars,
    setEnvVars,
  } = useEnvironmentSpecs(props, props.env?.language ?? LanguageEnum.Python312);

  // UI State (local to component)
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [newEnvKey, setNewEnvKey] = useState('');
  const [newEnvVal, setNewEnvVal] = useState('');
  const [rebuilding, setRebuilding] = useState(false);
  const hasAssignmentFiles = (props.currentAssignment?.files?.length || 0) > 0;

  const envId = props.env?.id;
  const hasEnv = Boolean(props.env);

  // One status for the header badge and the notice under it.
  const status = props.env ? environmentStatus(props.env, buildInProgress) : null;

  // A build this page did not start (a queued or automatic rebuild) reports through the
  // environment itself, so keep it fresh until that build lands.
  const waitingOnServer = !buildInProgress && (status === 'building' || status === 'queued');
  const { reloadEnv } = props;
  useEffect(() => {
    if (!waitingOnServer) return undefined;
    const timer = setInterval(reloadEnv, 5000);
    return () => clearInterval(timer);
  }, [waitingOnServer, reloadEnv]);

  // Rebuild the image from the saved configuration, without the reset that Update & Build does.
  const rebuildNow = async () => {
    if (!props.env) return;
    setRebuilding(true);
    try {
      await autograderApi.environmentsBuildPartialUpdate({ id: props.env.id, patchedEnvironmentBuildRequest: {} });
      message.success('Rebuild started.');
      reloadEnv();
    } catch (e) {
      message.error((await apiErrorMessageAsync(e)) || 'Could not start the rebuild.');
    } finally {
      setRebuilding(false);
    }
  };

  // Helper to normalize family names consistently
  const getLanguageFamily = useCallback((lang: string) => {
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
  }, []);

  // Derived State for Language Selector
  type LanguageVersion = { key: string; version: string };
  type LanguageFamilyMap = Record<string, LanguageVersion[]>;

  const languageFamilyMap: LanguageFamilyMap = useMemo(() => {
    return languages.reduce<LanguageFamilyMap>((acc, lang) => {
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
  }, [getLanguageFamily]);

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

  // Preview Logic
  const fetchPreview = useCallback(async () => {
    if (!props.env) return;
    try {
      if (language === 'other') {
        message.error('Language "other" is not supported for preview');
        return;
      }

      const result = await autograderApi.environmentsPreviewCreate({
        id: props.env.id,
        environmentPreviewRequest: {
          language: language || props.env.language,
          buildType: buildType,
          dockerfile: customDockerfile,
          dockerRunInstructions: dependencies ? dependencies.split('\n') : [],
          requirements: requirements,
        },
      });
      setPreviewContent(result);
    } catch {
      message.error('Failed to generate preview');
    }
  }, [props.env, language, buildType, customDockerfile, dependencies, requirements]);

  useEffect(() => {
    if (previewVisible) {
      fetchPreview();
    }
  }, [previewVisible, fetchPreview]);

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
      const { dockerfile } = await autograderApi.environmentsRetrieve({
        id: props.env.id,
      });
      const a = document.createElement('a');
      a.href = `data:text/plain;charset=utf-8,${encodeURIComponent(dockerfile || 'Unable to download dockerfile')}`;
      a.download = `${props.currentAssignment.name}-dockerfile`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  // Run on mount
  useEffect(() => {
    scanForManifests(false);
  }, [envId, scanForManifests]);

  /******************************* API / State Change Functions ****************************/

  useEffect(() => {
    if (props.env) {
      // Only set these if they aren't already set, or if we switched environments

      // check for values in environment, console.log error
      if (props.env.language) {
        setLanguage(props.env.language);
      } else {
        console.error(`Environment ${props.env.id} is missing language`);
      }
      if (props.env.dockerRunInstructions) {
        setDependencies(props.env.dockerRunInstructions.join('\n'));
      } else {
        console.error(`Environment ${props.env.id} is missing dockerRunInstructions`);
      }
      if (props.env.buildType) {
        setBuildType(props.env.buildType);
      } else {
        console.error(`Environment ${props.env.id} is missing buildType`);
      }
      if (props.env.dockerfile !== undefined && props.env.dockerfile !== null) {
        setCustomDockerfile(props.env.dockerfile);
      } else {
        console.error(`Environment ${props.env.id} is missing dockerfile`);
      }
      if (props.env.requirements !== undefined && props.env.requirements !== null) {
        setRequirements(props.env.requirements);
      } else {
        console.error(`Environment ${props.env.id} is missing requirements`);
      }
      if (props.env.autoDetect !== undefined && props.env.autoDetect !== null) {
        setAutoDetect(props.env.autoDetect);
      } else {
        console.error(`Environment ${props.env.id} is missing autoDetect`);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.env?.id]);

  useEffect(() => {
    if (!hasEnv && language) {
      // Logic for new environment creation immediate save (if applicable)
    }
  }, [hasEnv, language]);

  /******************************* UI Helpers ****************************/

  const onFamilyChange = (family: string) => {
    if (!family) {
      setLanguage(LanguageEnum.Python312);
      return;
    }
    const versions = languageFamilyMap[family];
    // Default to first version
    if (versions && versions.length > 0) {
      onLanguageChange(versions[0].key as LanguageEnum);
    }
  };

  const onLanguageChange = (value: LanguageEnum | 'other') => {
    setLanguage(value || 'other');
    if (value === 'other') {
      setBuildType(BuildTypeEnum.Ubuntu);
    } else {
      setBuildType(BuildTypeEnum.Default);
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

  const changeBuildType = (type: BuildTypeEnum) => {
    setBuildType(type);
  };

  const onAutoDetectChange = (checked: boolean) => {
    setAutoDetect(checked);
  };

  /******************************* Return ****************************/

  if (props.loading) {
    return <Skeleton active />;
  }

  if (!props.env) {
    return null;
  }

  // Show auto-detect status panel when autoDetect is enabled
  const autoDetectStatusPanel = props.env && props.env.autoDetect && (
    <AutoDetectStatus environment={props.env} onRefresh={props.reloadEnv} />
  );

  //************ 1A. ENVIRONMENT -  SELECT TEMPLATE
  const selectTemplate = (
    <div style={{ display: 'flex', gap: 10 }}>
      <Select
        aria-label="Language"
        placeholder="Select Language"
        value={currentFamily || undefined}
        onChange={onFamilyChange}
        style={{ width: 200 }}
      >
        {Object.keys(languageFamilyMap).map((family) => (
          <Option key={family} value={family}>
            {family}
          </Option>
        ))}
      </Select>

      {currentVersions.length > 1 && (
        <Select
          aria-label="Language version"
          placeholder="Version"
          value={language || undefined}
          onChange={onLanguageChange}
          style={{ width: 150 }}
        >
          {currentVersions.map((v) => (
            <Option key={v.key} value={v.key}>
              {v.version}
            </Option>
          ))}
        </Select>
      )}
      <Tooltip
        title={`Scan for ${locale[language || 'python-3.12']?.dependencyFile || 'manifest'} files in the assignment`}
      >
        <Button icon={<SearchOutlined />} onClick={() => scanForManifests(true)}>
          Detect packages from files
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
            <Alert title={depConfig.dependencyHelp} type="info" showIcon style={{ marginBottom: 10 }} />
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
          title="Install system-level packages (e.g. via apt-get or apk)."
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
    <div>
      <Typography.Paragraph style={{ color: INK_SECONDARY, marginBottom: 12 }}>
        Available to student code when it runs.
      </Typography.Paragraph>

      {Object.entries(envVars).map(([k, v]) => (
        <div key={k} style={{ display: 'flex', marginBottom: 8, gap: 10 }}>
          <Input value={k} disabled aria-label="Variable name" style={{ width: '30%' }} />
          <Input
            value={v}
            onChange={(e) => updateEnvVarVal(k, e.target.value)}
            style={{ flex: 1 }}
            placeholder="Value"
            aria-label={`Value of ${k}`}
          />
          <Button icon={<DeleteOutlined />} aria-label={`Remove ${k}`} onClick={() => removeEnvVar(k)} />
        </div>
      ))}

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', maxWidth: 720 }}>
        <Input
          placeholder="NEW_VAR_NAME"
          aria-label="New variable name"
          value={newEnvKey}
          onChange={(e) => setNewEnvKey(e.target.value.toUpperCase())}
          style={{ width: '30%' }}
        />
        <Input
          placeholder="Value"
          aria-label="New variable value"
          value={newEnvVal}
          onChange={(e) => setNewEnvVal(e.target.value)}
          style={{ flex: 1 }}
          onPressEnter={addEnvVar}
        />
        <Button onClick={addEnvVar}>Add variable</Button>
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

  const compileTextPlaceholder =
    '#!/bin/bash\n# This script runs before each test execution inside the Docker container.\n# Assignment files are read-only. Write new files to /work or /tmp.\n';

  const showAfterCreation = (
    <Card
      title={
        <span>
          <CodeOutlined /> Pre-run script
          <CPTooltip
            title="A shell script that runs inside the container before each run, for example to compile or move files. It may not work in some custom images."
            infoIcon={true}
            iconStyle={{ marginLeft: 8 }}
          />
        </span>
      }
      style={{ marginTop: 24 }}
      extra={<span style={{ color: INK_SECONDARY }}>Shell script, runs before each run</span>}
    >
      <CodeWindow
        language={'shell'}
        code={(props.env && props.env.compileText) || compileTextPlaceholder}
        name={'bash.sh'}
        onSave={saveCompileText}
        height={'200px'}
      />
    </Card>
  );

  // ****************** RENDER HELPERS ******************

  const openLogs = () => setShowLogsModal(true);

  const STATUS_TAG: Record<string, { icon: React.ReactNode; style?: React.CSSProperties; color?: string }> = {
    building: { icon: <SyncOutlined spin />, color: 'processing' },
    queued: { icon: <ClockCircleOutlined />, color: 'processing' },
    failed: { icon: <CloseCircleOutlined />, color: 'error' },
    outOfDate: { icon: <ExclamationCircleOutlined />, style: ORANGE_TAG },
    ready: { icon: <CheckCircleOutlined />, style: GREEN_TAG },
    waiting: { icon: <ClockCircleOutlined /> },
    notBuilt: { icon: <ClockCircleOutlined /> },
  };
  const statusBadge = status && (
    <Tag icon={STATUS_TAG[status].icon} color={STATUS_TAG[status].color} style={STATUS_TAG[status].style}>
      {STATUS_LABEL[status]}
    </Tag>
  );

  const lastBuilt = props.env.lastBuilt
    ? new Date(props.env.lastBuilt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    : null;

  // While this page drives a build the hook streams its log; otherwise the environment has it.
  const currentLogs = buildInProgress ? buildLogs : props.env.buildLogs || buildLogs;
  const failureTail = status === 'failed' ? buildLogTail(currentLogs) : '';

  // The same status as the badge, said in full with what to do about it.
  const statusNotice = (() => {
    switch (status) {
      case 'building':
        return (
          <Alert
            type="info"
            showIcon
            icon={<SyncOutlined spin />}
            title="Building the image"
            description="This usually takes a minute or two. Runs that start now wait for the new image."
            action={
              <Button size="small" onClick={openLogs}>
                View build logs
              </Button>
            }
          />
        );
      case 'queued':
        return (
          <Alert
            type="info"
            showIcon
            title="A rebuild is queued"
            description="It starts on its own shortly, so several changes become one build."
          />
        );
      case 'failed':
        return (
          <Alert
            type="error"
            showIcon
            title="The last build failed"
            description={
              <>
                {props.env.imageName
                  ? 'Runs still use the previous image. The end of the build log:'
                  : 'There is no image to run student code in yet. The end of the build log:'}
                {failureTail && (
                  <pre
                    style={{
                      margin: '8px 0 0',
                      padding: 8,
                      maxHeight: 160,
                      overflow: 'auto',
                      fontSize: 12,
                      whiteSpace: 'pre-wrap',
                      background: 'rgba(0, 0, 0, 0.04)',
                      borderRadius: 4,
                    }}
                  >
                    {failureTail}
                  </pre>
                )}
              </>
            }
            action={
              <Button size="small" onClick={openLogs}>
                View build logs
              </Button>
            }
          />
        );
      case 'outOfDate':
        return (
          <Alert
            type="warning"
            showIcon
            title="The image does not match the package list"
            description="Until it is rebuilt, each run installs the missing packages itself, which is slow. A rebuild takes a minute or two, and runs that start meanwhile wait for it."
            action={
              <Button size="small" onClick={rebuildNow} loading={rebuilding}>
                Rebuild now
              </Button>
            }
          />
        );
      case 'waiting':
        return (
          <Alert
            type="info"
            showIcon
            title="Nothing to detect from yet"
            description="Upload assignment files, or wait for the first submission. The language and packages are detected from them and the image is built."
          />
        );
      case 'notBuilt':
        return (
          <Alert
            type="info"
            showIcon
            title="No image has been built yet"
            description="Student code runs in the plain language image until one is built. Update & Build builds it now."
          />
        );
      default:
        return null;
    }
  })();

  //************ 1B. ENVIRONMENT -  STRATEGY SELECTION
  // Grouping Build Type and Base Image logic into a clearer "Strategy" selector

  const onStrategyChange = (e: RadioChangeEvent) => {
    const strategy = e.target.value;
    if (strategy === 'default') {
      setBuildType(BuildTypeEnum.Default);
      // If language was 'other', reset to python default or something?
      if (language && !Object.values(LanguageEnum).includes(language as LanguageEnum)) {
        onFamilyChange('Python'); // fallback
      }
    } else {
      // Custom strategy
      setBuildType(BuildTypeEnum.Ubuntu); // default custom base
      setLanguage('other');
    }
  };

  const strategySelector = (
    <div style={{ marginBottom: 24 }}>
      <Typography.Title level={3} id="env-strategy-heading" style={sectionTitle}>
        Strategy
      </Typography.Title>
      <Radio.Group
        aria-labelledby="env-strategy-heading"
        onChange={onStrategyChange}
        value={buildType === 'default' ? 'default' : 'custom'}
      >
        <Radio.Button value="default">Managed</Radio.Button>
        <Radio.Button value="custom">Custom Dockerfile</Radio.Button>
      </Radio.Group>
      <div style={{ marginTop: 8, color: INK_SECONDARY }}>
        {buildType === 'default'
          ? 'Pick a language and list its packages. codePost writes the Dockerfile.'
          : 'You write the Dockerfile commands yourself. For instructors who know Docker.'}
      </div>
    </div>
  );

  //************ 2. MANAGED CONFIGURATION
  const managedConfig = (
    <div>
      <Typography.Title level={3} style={sectionTitle}>
        Language and packages
      </Typography.Title>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 16 }}>
        {selectTemplate}
      </div>
      <Tabs
        defaultActiveKey={DEFAULT_TAB}
        type="card"
        items={[...(manifestTab ? [manifestTab] : []), systemTab, envVarsTab]}
      />
    </div>
  );

  //************ 3. CUSTOM CONFIGURATION
  const customConfig = (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Typography.Text strong id="env-base-image-label">
          Base image:{' '}
        </Typography.Text>
        <Radio.Group
          aria-labelledby="env-base-image-label"
          onChange={(e) => changeBuildType(e.target.value)}
          value={buildType === 'ubuntu' || buildType === 'alpine' ? buildType : 'ubuntu'}
        >
          <Radio value={'ubuntu'}>Ubuntu 18.04 (apt-get)</Radio>
          <Radio value={'alpine'}>Alpine Linux (apk)</Radio>
        </Radio.Group>
      </div>

      <Alert
        title={`The commands below are added on top of the ${buildType === 'alpine' ? 'Alpine' : 'Ubuntu'} base image.`}
        type="info"
        showIcon
        style={{ marginBottom: 15 }}
        action={
          <Button
            size="small"
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
      <Typography.Title level={3} style={sectionTitle}>
        Additional Dockerfile commands
      </Typography.Title>
      {customDockerInput}
    </div>
  );

  const manualConfiguration = (
    <div>
      {strategySelector}

      {buildType === 'default' ? managedConfig : customConfig}
    </div>
  );

  const autoDetectView = (
    <div>
      {autoDetectStatusPanel || (
        <Alert
          type="info"
          showIcon
          title="Save to switch to Auto-Detect"
          description="After you save, codePost detects the language and packages and lists them here."
        />
      )}

      <Divider style={{ margin: '24px 0' }} />

      <section aria-labelledby="env-vars-heading">
        <Typography.Title level={3} id="env-vars-heading" style={sectionTitle}>
          Environment variables
        </Typography.Title>
        {envVarsInput}
      </section>
    </div>
  );

  return (
    <div style={{ padding: '8px 0 24px' }}>
      {/* Header Section */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div>
          <Typography.Title level={2} style={{ fontSize: 20, marginTop: 0, marginBottom: 6 }}>
            Environment Configuration
          </Typography.Title>
          <Space size={8} wrap>
            {statusBadge}
            {lastBuilt && <span style={{ color: INK_SECONDARY }}>Last built {lastBuilt}</span>}
          </Space>
        </div>
        <Space wrap>
          <Button onClick={openLogs} icon={<BuildOutlined />}>
            Build Logs
          </Button>
          <Tooltip title="The Dockerfile these settings produce">
            <Button icon={<EyeOutlined />} onClick={() => setPreviewVisible(true)}>
              Preview
            </Button>
          </Tooltip>
          <Tooltip title="Save these settings without rebuilding the image">
            <Button onClick={() => saveEnv(false)} loading={buildInProgress} disabled={!isDirty()}>
              Save Changes
            </Button>
          </Tooltip>
          <Tooltip title="Save these settings and rebuild the image now">
            <Button type="primary" onClick={() => saveEnv(true)} loading={buildInProgress}>
              {props.env ? 'Update & Build' : 'Create & Build'}
            </Button>
          </Tooltip>
        </Space>
      </div>

      {/* What state the image is in, and what to do about it. Announced when it changes. */}
      <div aria-live="polite" style={{ marginBottom: statusNotice ? 20 : 0 }}>
        {statusNotice}
      </div>

      {/* Mode */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 12,
          paddingBottom: 16,
          marginBottom: 20,
          borderBottom: `1px solid ${LINE_SOFT}`,
        }}
      >
        <span id="env-mode-label" style={{ fontWeight: 600 }}>
          Mode
        </span>
        <Radio.Group
          aria-labelledby="env-mode-label"
          value={autoDetect ? 'auto' : 'manual'}
          onChange={(e) => onAutoDetectChange(e.target.value === 'auto')}
          buttonStyle="solid"
        >
          <Radio.Button value="auto">Auto-Detect</Radio.Button>
          <Radio.Button value="manual">Manual Configuration</Radio.Button>
        </Radio.Group>
        <span style={{ color: INK_SECONDARY, flex: '1 1 360px' }}>
          {autoDetect
            ? 'Student code runs in an image: a saved copy of the language and its packages. codePost works out both from your files, your tests and what student code needs when it runs.'
            : 'Student code runs in an image: a saved copy of the language and its packages. You choose the language and list every package yourself.'}{' '}
          <Link to="/docs/instructor-environment-testing" target="_blank" rel="noreferrer">
            How environments work
          </Link>
        </span>
      </div>

      {autoDetect ? autoDetectView : manualConfiguration}

      {/* Runscript Section */}
      {props.env ? showAfterCreation : null}

      {/* Environment Shell */}
      {props.env ? (
        <div style={{ marginTop: 24 }}>
          <EnvironmentShellWidget
            environmentId={props.env.id}
            hasAssignmentFiles={hasAssignmentFiles}
            assignmentId={props.currentAssignment?.id}
          />
        </div>
      ) : null}

      {/* Modals */}
      <BuildDetailModal
        open={showLogsModal}
        onClose={() => setShowLogsModal(false)}
        inProgress={status === 'building'}
        isSuccess={status === 'failed' ? false : props.env.buildStatus === 2 ? true : null}
        logs={currentLogs}
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
            title="This is a preview of the Dockerfile that will be generated based on your current settings."
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
