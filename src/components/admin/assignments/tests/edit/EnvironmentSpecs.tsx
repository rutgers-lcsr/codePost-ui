// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
import { AutoDetectStatus, type VersionEntry } from './EnvironmentSpecs/AutoDetectStatus';
import {
  STATUS_LABEL,
  TAB_TOGGLE_KEY,
  buildLogTail,
  environmentStatus,
  prefersReducedMotion,
} from './EnvironmentSpecs/environmentStatus';
import { EnvironmentShellWidget } from '../../assignments/EnvironmentShellWidget';

/* codePost component imports */
import { CodeWindow } from './utils/CodeWindow';

/* codePost util imports */
import { languages } from './utils/languageUtils';
import { dictionariesEqual, useEnvironmentSpecs } from './hooks/useEnvironmentSpecs';
import type { ScannedFile } from './utils/scanners';

import locale from './utils/languageLocale';

import { apiErrorMessageAsync } from '../../../../../lib/apiError';
import { GREEN_TAG, ORANGE_TAG } from '../../../../../theme/tagStyles';
import { INK_SECONDARY, LINE_SOFT, NEUTRAL_BACKGROUND } from '../../../../../theme/tokens';

import Editor from '../../../../../lib/monaco';
import { BuildTypeEnum, Environment, LanguageEnum } from '../../../../../api-client/index.js';
import { autograderApi } from '../../../../../api-client/clients.js';
import { AssignmentType } from '../../../../../types/models';

const { Option } = Select;

// DESIGN.md "title": 15px, 600.
const sectionTitle = { fontSize: 15, marginTop: 0, marginBottom: 8 };

/** The code editors keep Tab for indenting, so say how to get out of them without a mouse. */
const EditorKeyboardHint = () => (
  <div style={{ fontSize: 12, color: INK_SECONDARY, marginTop: 4 }}>
    Tab indents inside the editor. Press {TAB_TOGGLE_KEY} to make Tab move to the next control instead.
  </div>
);

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
    setBuildDockerfile,
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
  const [restoring, setRestoring] = useState(false);
  const [showScript, setShowScript] = useState(Boolean(props.env?.compileText?.trim()));
  const rootRef = useRef<HTMLDivElement>(null);
  const preRunRef = useRef<HTMLDivElement>(null);
  const hasAssignmentFiles = (props.currentAssignment?.files?.length || 0) > 0;

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

  // Rebuild the image from the saved configuration.
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

  // The way back from a change that broke the build: the package list of a version that built.
  const restoreVersion = async (version: number) => {
    if (!props.env) return;
    setRestoring(true);
    try {
      await autograderApi.environmentsRollbackCreate({
        environmentId: props.env.id,
        environmentRollbackRequest: { version },
      });
      message.success(`Back on version ${version} and its package list.`);
      reloadEnv();
    } catch (e) {
      message.error((await apiErrorMessageAsync(e)) || 'Could not roll back.');
    } finally {
      setRestoring(false);
    }
  };

  // The Dockerfile tab of the build modal: the hook only learns it when a build finishes in this
  // session, so ask for it when the modal opens on an environment built earlier.
  const environmentId = props.env?.id;
  useEffect(() => {
    if (!showLogsModal || buildDockerfile || environmentId === undefined) return;
    let cancelled = false;
    autograderApi
      .environmentsBuildStatusRetrieve({ id: environmentId })
      .then((buildStatus) => {
        if (!cancelled) setBuildDockerfile(buildStatus.dockerfile || '');
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [showLogsModal, buildDockerfile, environmentId, setBuildDockerfile]);

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

  const envVarsDirty = !props.env || !dictionariesEqual(envVars, props.env.envVars || {});

  const isDirty = () => {
    if (!props.env) return true;
    if (autoDetect !== props.env.autoDetect || envVarsDirty) return true;
    // Auto-Detect owns the language and packages; the fields below are only edited in manual mode.
    if (autoDetect) return false;
    return (
      language !== props.env.language ||
      buildType !== props.env.buildType ||
      dependencies !== props.env.dockerRunInstructions.join('\n') ||
      customDockerfile !== props.env.dockerfile ||
      requirements !== (props.env.requirements || '')
    );
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

  // Keyboard shortcut for Save (Ctrl+S / Cmd+S). The tab stays mounted while another one is
  // open, and the pre-run script editor has its own Ctrl+S, so this one answers only for what
  // is on screen and unsaved. saveEnv reports the outcome itself.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!((e.ctrlKey || e.metaKey) && e.key === 's')) return;
      const root = rootRef.current;
      if (!root || root.offsetParent === null) return;
      if (preRunRef.current?.contains(e.target as Node)) return;
      e.preventDefault();
      if (isDirty()) void saveEnv(false);
    };
    // Use capture phase to intercept Ctrl+S before Monaco Editor consumes it
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  });

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
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
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
        <Button icon={<SearchOutlined aria-hidden />} onClick={() => scanForManifests(true)}>
          Detect packages from files
        </Button>
      </Tooltip>
    </div>
  );

  //************ 1B. ENVIRONMENT -  SELECT BUILD TYPE

  const depConfig = language && locale[language] && locale[language].dependencyFile ? locale[language] : null;

  //************ 2. ADVANCED CONFIGURATION

  const dependenciesInput = (
    <>
      <Editor
        height="250px"
        defaultLanguage="shell"
        value={dependencies}
        onChange={onDependenciesChange}
        theme="vs-dark"
        options={{ minimap: { enabled: false }, fontSize: 13, wordWrap: 'on', padding: { top: 10 } }}
      />
      <EditorKeyboardHint />
    </>
  );

  const customDockerInput = props.env && (
    <>
      <Editor
        height="300px"
        defaultLanguage="dockerfile"
        value={customDockerfile}
        onChange={onCustomDockerfileChange}
        theme="vs-dark"
        options={{ minimap: { enabled: false }, fontSize: 13, wordWrap: 'on', padding: { top: 10 } }}
      />
      <EditorKeyboardHint />
    </>
  );

  const manifestTab = depConfig
    ? {
        key: '1',
        label: depConfig.dependencyFile, // e.g. "Project Dependencies (pom.xml)"? User said "Manifest" defaults.
        children: (
          <>
            <Typography.Paragraph style={{ color: INK_SECONDARY, marginBottom: 12 }}>
              {depConfig.dependencyHelp}
            </Typography.Paragraph>
            <Editor
              height="250px"
              defaultLanguage={depConfig.dependencyMode || 'text'}
              value={requirements}
              onChange={(value) => setRequirements(value || '')}
              theme="vs-dark"
              options={{ minimap: { enabled: false }, fontSize: 13, wordWrap: 'on', padding: { top: 10 } }}
            />
            <EditorKeyboardHint />
          </>
        ),
      }
    : null;

  const systemTab = {
    key: '2',
    label: 'System packages',
    children: (
      <>
        <Typography.Paragraph style={{ color: INK_SECONDARY, marginBottom: 12 }}>
          System-level packages to install, for example with apt-get or apk.
        </Typography.Paragraph>
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
    if (newEnvKey.trim() in envVars) {
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
        Available to student code when it runs. Changes here take effect after Save changes.
      </Typography.Paragraph>

      {Object.entries(envVars).map(([k, v]) => (
        <div key={k} style={{ display: 'flex', marginBottom: 8, gap: 8, maxWidth: 720 }}>
          <Input value={k} disabled aria-label="Variable name" style={{ width: '30%' }} />
          <Input
            value={v}
            onChange={(e) => updateEnvVarVal(k, e.target.value)}
            style={{ flex: 1 }}
            placeholder="Value"
            aria-label={`Value of ${k}`}
          />
          <Button icon={<DeleteOutlined aria-hidden />} aria-label={`Remove ${k}`} onClick={() => removeEnvVar(k)} />
        </div>
      ))}

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', maxWidth: 720 }}>
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
    label: 'Environment variables',
    children: envVarsInput,
  };

  // Logic: Use Manifest tab as default if available.
  const DEFAULT_TAB = manifestTab ? '1' : '2';

  const compileTextPlaceholder =
    '#!/bin/bash\n# This script runs before each test execution inside the Docker container.\n# Assignment files are read-only. Write new files to /work or /tmp.\n';

  const showAfterCreation = (
    <section aria-labelledby="env-prerun-heading" ref={preRunRef}>
      <Typography.Title level={3} id="env-prerun-heading" style={sectionTitle}>
        <CodeOutlined aria-hidden /> Pre-run script
      </Typography.Title>
      <Typography.Paragraph style={{ color: INK_SECONDARY, marginBottom: 12 }}>
        A shell script that runs inside the container before each run, for example to compile or move files. It may not
        work in some custom images.
      </Typography.Paragraph>
      {showScript ? (
        <>
          <CodeWindow
            language={'shell'}
            code={(props.env && props.env.compileText) || compileTextPlaceholder}
            name={'bash.sh'}
            onSave={saveCompileText}
            height={'200px'}
          />
          <EditorKeyboardHint />
        </>
      ) : (
        <Button onClick={() => setShowScript(true)}>Add a pre-run script</Button>
      )}
    </section>
  );

  const openLogs = () => setShowLogsModal(true);

  const spin = !prefersReducedMotion();
  const STATUS_TAG: Record<string, { icon: React.ReactNode; style?: React.CSSProperties; color?: string }> = {
    building: { icon: <SyncOutlined aria-hidden spin={spin} />, color: 'processing' },
    queued: { icon: <ClockCircleOutlined aria-hidden />, color: 'processing' },
    failed: { icon: <CloseCircleOutlined aria-hidden />, color: 'error' },
    outOfDate: { icon: <ExclamationCircleOutlined aria-hidden />, style: ORANGE_TAG },
    ready: { icon: <CheckCircleOutlined aria-hidden />, style: GREEN_TAG },
    waiting: { icon: <ClockCircleOutlined aria-hidden /> },
    notBuilt: { icon: <ClockCircleOutlined aria-hidden /> },
  };
  const statusBadge = status && (
    <Tag icon={STATUS_TAG[status].icon} color={STATUS_TAG[status].color} style={STATUS_TAG[status].style}>
      {STATUS_LABEL[status]}
    </Tag>
  );

  // last_built is only stamped by a build that succeeded.
  const lastBuilt = props.env.lastBuilt
    ? new Date(props.env.lastBuilt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    : null;

  // While this page drives a build the hook streams its log; otherwise the environment has it.
  const currentLogs = buildInProgress ? buildLogs : props.env.buildLogs || buildLogs;
  const failureTail = status === 'failed' ? buildLogTail(currentLogs) : '';

  // The version whose image is in use, and whether the package list has moved on since it was
  // built: if so, that change is what a failed build tripped on, and going back to it is the fix.
  const versions: VersionEntry[] = props.env.imageHistory || [];
  const inUse = versions[versions.map((entry) => entry.image_name).lastIndexOf(props.env.imageName || '')];
  const canGoBack =
    props.env.autoDetect && Boolean(inUse) && (inUse.requirements || '') !== (props.env.requirements || '');

  const dirty = isDirty();
  const viewLogsButton = (
    <Button size="small" onClick={openLogs}>
      View build logs
    </Button>
  );

  // The same status as the badge, said in full, with the one thing to do about it.
  const statusNotice = (() => {
    switch (status) {
      case 'building':
        return (
          <Alert
            type="info"
            showIcon
            icon={<SyncOutlined aria-hidden spin={spin} />}
            title="Building the image"
            description="Usually a minute or two. Runs that start now wait for it."
            action={viewLogsButton}
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
                  ? 'Runs still use the previous image. '
                  : 'There is no image to run student code in yet. '}
                {canGoBack
                  ? `The package list changed after version ${inUse.version} was built. Rolling back restores that list.`
                  : 'If the cause looks temporary, such as a network error, build again.'}
                {failureTail && (
                  <pre
                    // A scrolling region has to be reachable without a mouse.
                    role="region"
                    // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex
                    tabIndex={0}
                    aria-label="End of the build log"
                    style={{
                      margin: '8px 0 0',
                      padding: 8,
                      maxHeight: 160,
                      overflow: 'auto',
                      fontSize: 12,
                      whiteSpace: 'pre-wrap',
                      background: NEUTRAL_BACKGROUND,
                      borderRadius: 4,
                    }}
                  >
                    {failureTail}
                  </pre>
                )}
              </>
            }
            action={
              <Space direction="vertical" size={8} style={{ alignItems: 'stretch' }}>
                {canGoBack ? (
                  <Button size="small" type="primary" loading={restoring} onClick={() => restoreVersion(inUse.version)}>
                    Roll back to version {inUse.version}
                  </Button>
                ) : (
                  <Button size="small" type="primary" loading={rebuilding} onClick={rebuildNow}>
                    Build again
                  </Button>
                )}
                {viewLogsButton}
              </Space>
            }
          />
        );
      case 'outOfDate':
        return (
          <Alert
            type="warning"
            showIcon
            title="The image does not match the package list"
            description="Each run installs the missing packages itself, which is slow. Rebuilding takes a minute or two."
            action={
              <Button size="small" type="primary" onClick={rebuildNow} loading={rebuilding}>
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
            description="Student code runs in the plain language image until one is built."
            action={
              <Button size="small" type="primary" onClick={rebuildNow} loading={rebuilding}>
                Build now
              </Button>
            }
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
        buttonStyle="solid"
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
        style={{ marginBottom: 16 }}
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
            Reset to template
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
          Environment variables{' '}
          {envVarsDirty && <Tag style={{ ...ORANGE_TAG, marginInlineStart: 8, fontWeight: 400 }}>Not saved yet</Tag>}
        </Typography.Title>
        {envVarsInput}
      </section>
    </div>
  );

  return (
    <div ref={rootRef} style={{ padding: '8px 0 24px' }}>
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
          <Typography.Title level={2} style={{ fontSize: 20, marginTop: 0, marginBottom: 8 }}>
            Environment Configuration
          </Typography.Title>
          <Space size={8} wrap>
            {statusBadge}
            {lastBuilt && (
              <span style={{ color: INK_SECONDARY }}>
                {status === 'failed' ? 'Last successful build' : 'Built'} {lastBuilt}
              </span>
            )}
          </Space>
        </div>
        <Space wrap>
          {dirty && <Tag style={{ ...ORANGE_TAG, marginInlineEnd: 0 }}>Unsaved changes</Tag>}
          <Button onClick={openLogs} icon={<BuildOutlined aria-hidden />}>
            Build logs
          </Button>
          <Tooltip title="The Dockerfile these settings produce">
            <Button icon={<EyeOutlined aria-hidden />} onClick={() => setPreviewVisible(true)}>
              Preview
            </Button>
          </Tooltip>
          <Tooltip title="Save these settings. The image is not rebuilt.">
            <Button onClick={() => saveEnv(false)} loading={buildInProgress} disabled={!dirty}>
              Save changes
            </Button>
          </Tooltip>
          {/* One verb for building. It leads only when there is something to save: a notice
              above owns the primary action when the image itself needs attention. */}
          <Tooltip
            title={dirty ? 'Save these settings, then rebuild the image' : 'Rebuild the image from the saved settings'}
          >
            <Button type={dirty ? 'primary' : 'default'} onClick={() => saveEnv(true)} loading={buildInProgress}>
              {dirty ? 'Save and rebuild' : 'Rebuild'}
            </Button>
          </Tooltip>
        </Space>
      </div>

      {/* What state the image is in, and the one thing to do about it. The notice is an alert, so it is announced. */}
      <div style={{ marginBottom: statusNotice ? 24 : 0 }}>{statusNotice}</div>

      {/* Mode */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 12,
          paddingBottom: 16,
          marginBottom: 24,
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
          <Radio.Button value="manual">Manual configuration</Radio.Button>
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

      {/* Pre-run script */}
      <Divider style={{ margin: '24px 0' }} />
      {showAfterCreation}

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
        title="Dockerfile preview"
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
          <Typography.Paragraph style={{ color: INK_SECONDARY }}>
            The Dockerfile codePost would build from the settings on the page, saved or not.
          </Typography.Paragraph>
          <div style={{ flex: 1, border: `1px solid ${LINE_SOFT}` }}>
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
