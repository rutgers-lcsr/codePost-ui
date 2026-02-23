// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { useState, useRef, useEffect } from 'react';
import { message, Modal } from 'antd';
import { autograderApi } from '../../../../../../api-client/clients';
import { getScanner } from '../utils/scanners';
import type { ScannedFile } from '../utils/scanners';
import { BuildTypeEnum, Environment, LanguageEnum } from '../../../../../../api-client';

export interface EnvironmentState {
  language: string;
  buildType: string;
  dependencies: string;
  customDockerfile: string;
  requirements: string;
  autoDetect: boolean;
  envVars: Record<string, string>;
}

interface EnvironmentSpecsProps {
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
  reloadEnv?: () => void;
  helpers?: ScannedFile[];
  solutions?: ScannedFile[];
}

export const useEnvironmentSpecs = (props: EnvironmentSpecsProps, initialLanguage: LanguageEnum) => {
  const [language, setLanguage] = useState<LanguageEnum | 'other'>(initialLanguage);
  const [buildType, setBuildType] = useState<BuildTypeEnum>(BuildTypeEnum.Default);
  const [dependencies, setDependencies] = useState<string>('');
  const [customDockerfile, setCustomDockerfile] = useState<string>('');
  const [requirements, setRequirements] = useState<string>('');
  const [autoDetect, setAutoDetect] = useState<boolean>(true);
  const [envVars, setEnvVars] = useState<Record<string, string>>({});

  const [buildInProgress, setBuildInProgress] = useState<boolean>(false);
  const [buildLogs, setBuildLogs] = useState<string>('');
  const [buildIsSuccess, setBuildIsSuccess] = useState<boolean | null>(null);
  const [buildDockerfile, setBuildDockerfile] = useState<string>('');

  const lastEnvIdRef = useRef<number | null>(null);

  // Ref to hold current state for async operations to avoid stale closures
  const stateRef = useRef<EnvironmentState>({
    language,
    buildType,
    dependencies,
    customDockerfile,
    requirements,
    autoDetect,
    envVars,
  });

  // Sync ref with state
  useEffect(() => {
    stateRef.current = {
      language,
      buildType,
      dependencies,
      customDockerfile,
      requirements,
      autoDetect,
      envVars,
    };
  }, [language, buildType, dependencies, customDockerfile, requirements, autoDetect, envVars]);

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

  // Initial Data Load (and env id changes)
  useEffect(() => {
    if (props.env) {
      const envId = props.env.id;
      const envVarsFromServer = (props.env.envVars || {}) as Record<string, string>;

      const envChanged = lastEnvIdRef.current !== envId;
      const envVarsMatch = dictionariesEqual(stateRef.current.envVars, envVarsFromServer);

      if (envChanged) {
        lastEnvIdRef.current = envId;
        setLanguage(props.env.language ?? initialLanguage);
        setDependencies((props.env.dockerRunInstructions ?? []).join('\n'));
        setBuildType(props.env.buildType ?? BuildTypeEnum.Default);
        setCustomDockerfile(props.env.dockerfile ?? '');
        setRequirements(props.env.requirements ?? '');
        setAutoDetect(props.env.autoDetect ?? true);
        setEnvVars(envVarsFromServer);
        return;
      }

      // Avoid clobbering local edits if the env id hasn't changed
      if (envVarsMatch) {
        setEnvVars(envVarsFromServer);
      }
    }
  }, [props.env, initialLanguage]);

  // Manifest Scanning Logic
  const scanForManifests = (manualTrigger: boolean = false) => {
    // Logic from EnvironmentSpecs
    if (!props.env) return;
    if (!manualTrigger && props.env.requirements && props.env.requirements.trim().length > 0) return;

    const allFiles = [...(props.helpers || []), ...(props.solutions || [])];

    // 1. Detect Dominant Language if needed (or verify current support)
    let detectedLang = language;
    if (!detectedLang) {
      if (allFiles.some((f) => f.name.endsWith('.py'))) {
        detectedLang = LanguageEnum.Python312;
      } else if (allFiles.some((f) => f.name.endsWith('.js') || f.name.endsWith('.ts'))) {
        detectedLang = LanguageEnum.Node20;
      } else if (allFiles.some((f) => f.name.endsWith('.R') || f.name.endsWith('.r'))) {
        detectedLang = LanguageEnum.R4;
      } else if (allFiles.some((f) => f.name.endsWith('.java'))) {
        detectedLang = LanguageEnum.Java17;
      } else if (allFiles.some((f) => f.name.endsWith('.ipynb'))) {
        detectedLang = LanguageEnum.Python312;
        //# TODO - This should look at the kernal
      }
      if (detectedLang) setLanguage(detectedLang);
    }

    if (!detectedLang) {
      if (manualTrigger) message.error('Could not detect language from files.');
      return;
    }

    const scanner = getScanner(detectedLang);
    if (!scanner) {
      if (manualTrigger) message.warning(`No manifest scanner available for ${detectedLang}`);
      return;
    }

    const result = scanner.scan(allFiles, detectedLang);

    if (result.detected) {
      if (result.content) {
        setRequirements(result.content);
        if (manualTrigger) message.success(`Generated manifest based on ${result.packages.size} detected packages.`);
      } else if (manualTrigger) {
        message.info('Scanned files but found no external packages to add to manifest.');
      }
    } else if (manualTrigger) {
      message.info('No imports detected in source files.');
    }
  };

  // Build Logic
  const buildEnv = async (
    lang: string,
    deps: string,
    dockerfile: string,
    bType: string,
    reqs: string,
    auto: boolean,
    eVars: Record<string, string>,
    shouldBuild: boolean = true,
  ) => {
    // API Update
    const newEnvironment = await props.updateEnv(lang, deps, dockerfile, bType, reqs, auto, eVars);

    if (shouldBuild) {
      setBuildInProgress(true);
      setBuildLogs('');
      try {
        await autograderApi.environmentsBuildPartialUpdate({
          id: newEnvironment.id,
          patchedEnvironmentBuildRequest: {},
        });
        // Poll for completion
        let pollCount = 0;
        const pollInterval = setInterval(async () => {
          try {
            const status = await autograderApi.environmentsBuildStatusRetrieve({ id: newEnvironment.id });
            if (!status.inProgress) {
              clearInterval(pollInterval);
              setBuildInProgress(false);
              setBuildIsSuccess(status.isSuccess);
              setBuildLogs(status.logs || '');
              setBuildDockerfile(status.dockerfile || '');

              if (status.isSuccess) {
                message.success('Build completed successfully!');
                if (props.reloadEnv) props.reloadEnv();
              } else {
                message.error('Build failed. Check logs.');
              }
            } else {
              // Update logs while building
              setBuildLogs(status.logs || '');
            }

            pollCount++;
            if (pollCount > 1800) {
              // 30 minutes timeout
              clearInterval(pollInterval);
              setBuildInProgress(false);
              message.error('Build status check timed out (build may still be running).');
            }
          } catch (err) {
            console.error('Polling error', err);
          }
        }, 1000);
      } catch (err: unknown) {
        message.error('Failed to trigger build: ' + String(err));
        setBuildInProgress(false);
      }
    } else {
      message.success('Configuration saved.');
    }
  };

  const saveEnv = async (shouldBuild: boolean = true) => {
    const current = stateRef.current;

    // Validation for Manual Mode
    if (!current.autoDetect) {
      if (current.buildType === 'default' && !current.language) {
        message.error('Please select a language for the Managed environment.');
        return;
      }
    }

    // Warning for custom build switch
    if (
      props.env &&
      props.env.buildType === 'default' &&
      current.buildType !== props.env.buildType &&
      current.language !== 'other'
    ) {
      Modal.confirm({
        title: `Are you sure you want to use a custom build?`,
        content: 'If you switch to a custom build, we cannot guarantee that the environment will be built correctly.',
        async onOk() {
          await buildEnv(
            current.language,
            current.dependencies,
            current.buildType === 'default' ? '' : current.customDockerfile,
            current.buildType,
            current.requirements,
            current.autoDetect,
            current.envVars,
            shouldBuild,
          );
        },
      });
    } else {
      // Fix: Backend requires language field.
      // If in auto-detect mode and no language selected, use a default (e.g. python-3.12) to satisfy validation.
      // The autoDetect flag overrides the actual language usage in the backend logic.
      const langToSend = current.autoDetect && !current.language ? 'python-3.12' : current.language;

      await buildEnv(
        langToSend,
        current.dependencies,
        current.buildType === 'default' ? '' : current.customDockerfile,
        current.buildType,
        current.requirements,
        current.autoDetect,
        current.envVars,
        shouldBuild,
      );
    }
  };

  return {
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
  };
};
