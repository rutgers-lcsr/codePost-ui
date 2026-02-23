// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import React, { useEffect, useMemo, useState } from 'react';

/* antd imports */
import { Breadcrumb, Button, Checkbox, InputNumber, message, Skeleton, Tabs, Typography } from 'antd';

/* other library imports */
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';

/* codePost object imports */
import { assignmentsApi, assignmentFilesApi, autograderApi } from '../../../../../api-client/clients';
import type {
  EnvironmentsCreateRequest,
  EnvironmentsPartialUpdateRequest,
} from '../../../../../api-client/apis/AutograderApi';

import { AssignmentType, SubmissionInfoType, UserType } from '../../../../../types/models';

/* codePost component imports */
import CPTooltip from '../../../../core/CPTooltip';
import CPAdminDetail from '../../../other/CPAdminDetail';
import { EnvironmentSpecs } from './EnvironmentSpecs';
import { TestManager } from './manager/TestManager';

/* codePost util imports */
import { fetchEnvironment } from '../../../../core/testFetchUtils';

import { AssignmentFile, Environment } from '../../../../../api-client';

/**********************************************************************************************************************/

interface IProps {
  currentAssignment: AssignmentType;
  submissions: SubmissionInfoType[];
  updateAssignment: (assignmentID: number, field: string, value: number) => void;
  breadcrumbs?: Array<{ title: React.ReactNode }>;
  user: UserType;
}

type EnvironmentPatchPayload = NonNullable<EnvironmentsPartialUpdateRequest['patchedEnvironment']>;

export const TestingSetup = (props: IProps) => {
  // ************************** State Variables ******************************
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams<{ tabKey?: string }>();

  const currTab = useMemo(() => params.tabKey ?? 'environment', [params.tabKey]);
  const [env, setEnv] = useState<Environment | undefined>(undefined);
  const [helperFiles, setHelperFiles] = useState<AssignmentFile[]>([]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!params.tabKey) {
      navigate(`${location.pathname}/environment`, { replace: true });
    }
  }, [params.tabKey, location.pathname, navigate]);

  // Check permissions: Admin or Course Admin
  const isCourseAdmin =
    props.user.codePostAdmin ||
    (props.user.courseadminCourses &&
      props.user.courseadminCourses.some((c) => c.id === props.currentAssignment.course));

  /************************** Fetch data ******************************/
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const currEnv = await fetchEnvironment(props.currentAssignment);
      setEnv(currEnv);

      // Fetch helper files
      // Fetch helper files
      // Explicitly re-read assignment to ensure we have the latest file list (fix for stale props)
      try {
        // Re-fetch assignment to get fresh list of files
        const freshAssignment = await assignmentsApi.retrieve({
          id: props.currentAssignment.id,
        });

        if (freshAssignment.files && freshAssignment.files.length > 0) {
          const filePromises = freshAssignment.files.map((idOrFile) => {
            if (typeof idOrFile === 'number') {
              return assignmentFilesApi.retrieve({
                id: idOrFile,
              });
            }
            return Promise.resolve(idOrFile);
          });

          const fetchedFiles = await Promise.all(filePromises);
          setHelperFiles(fetchedFiles);
        } else {
          setHelperFiles([]);
        }
      } catch (e) {
        console.error('Failed to fetch assignment files', e);
        // Fallback to props if fetch fails? Or just empty.
        setHelperFiles([]);
      }

      setLoading(false);
    };
    fetchData();
  }, [props.currentAssignment]);

  /************************** API / State change functions ******************************/

  // ************************** Environment function **************************

  const reloadEnv = async () => {
    if (env) {
      const newEnv = await autograderApi.environmentsRetrieve({
        id: env.id,
      });

      // HACK: mutate to avoid propagating reference change through children
      setEnv(newEnv);
    }
  };

  const updateEnv = async (
    language: string,
    dependencies: string,
    customDockerfile: string,
    buildType: string,
    requirements: string,
    autoDetect: boolean,
    envVars: Record<string, string>,
  ) => {
    let thisEnvironment = env;
    // If environment doesn't exist create it

    if (!thisEnvironment) {
      const payload: EnvironmentsCreateRequest['environment'] = {
        language: language as EnvironmentsCreateRequest['environment']['language'],
        dockerRunInstructions: dependencies && !customDockerfile ? dependencies.split('\n') : [],
        dockerfile: customDockerfile,
        requirements: requirements,
        autoDetect,
        buildType: buildType as EnvironmentsCreateRequest['environment']['buildType'], // Restored
        assignment: props.currentAssignment.id,
        compileText: '', // default
        allowNetworkAccess: false, // default
        maxStudentTestRuns: null,
        maxExposedFailedTests: null,
        envVars,
      };

      thisEnvironment = await autograderApi.environmentsCreate({
        environment: payload,
      });

      // Update the assignment to point to this environment
      props.updateAssignment(props.currentAssignment.id, 'environment', thisEnvironment.id);

      setEnv(thisEnvironment);
      return thisEnvironment;
    } else {
      const payload: EnvironmentPatchPayload = {
        language: language as EnvironmentPatchPayload['language'],
        dockerRunInstructions: dependencies && !customDockerfile ? dependencies.split('\n') : [],
        dockerfile: customDockerfile,
        requirements: requirements,
        autoDetect,
        buildType: buildType as EnvironmentPatchPayload['buildType'], // Restored
        envVars,
      };

      const newEnv = await autograderApi.environmentsPartialUpdate({
        id: thisEnvironment.id,
        patchedEnvironment: payload,
      });
      setEnv(newEnv);
      return newEnv;
    }
  };

  const updateCompileText = async (val: string) => {
    if (env) {
      const payload: EnvironmentPatchPayload = {
        compileText: val,
      };
      const newEnv = await autograderApi.environmentsPartialUpdate({
        id: env.id,
        patchedEnvironment: payload,
      });
      setEnv(newEnv);
    }
  };

  const onChange = (val: string) => {
    const newUrl = `${location.pathname.split('/').slice(0, -1).join('/')}/${val}`;
    navigate(newUrl);
  };

  const updateEnvSetting = async (field: string, value: string | number | boolean | null) => {
    if (env) {
      const payload: EnvironmentPatchPayload = {
        [field]: value,
      };
      const newEnv = await autograderApi.environmentsPartialUpdate({
        id: env.id,
        patchedEnvironment: payload,
      });
      if (typeof value === 'boolean') {
        // we only show message for boolean settings. Numerical or string fields would be really annoying
        message.success(value ? 'Setting enabled' : 'Setting disabled');
      }
      setEnv(newEnv);
    }
  };

  // ************************** Return ***************************************
  const items = [
    {
      key: 'environment',
      label: 'Environment',
      children: env ? (
        <EnvironmentSpecs
          currentAssignment={props.currentAssignment}
          env={env}
          updateEnv={updateEnv}
          reloadEnv={reloadEnv}
          updateCompileText={updateCompileText}
          loading={loading}
          helpers={helperFiles}
        />
      ) : (
        <div style={{ padding: '24px 32px' }}>
          <Skeleton active paragraph={{ rows: 10 }} />
        </div>
      ),
    },
  ];

  if (isCourseAdmin) {
    items.push({
      key: 'tests',
      label: 'Tests',
      children: <TestManager assignment={props.currentAssignment} helpers={helperFiles} />,
    });
  }

  items.push({
    key: 'settings',
    label: 'Settings',
    children: (
      <div style={{ padding: '24px 32px', maxWidth: 800 }}>
        <div style={{ marginBottom: 24 }}>
          <Typography.Title level={4} style={{ marginBottom: 8 }}>
            Student Submit
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            Control how test results are displayed to students when they submit.
          </Typography.Text>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Limit test runs setting */}
          <div
            style={{
              padding: '16px 20px',
              background: env?.maxStudentTestRuns !== null ? '#f6ffed' : '#fafafa',
              borderRadius: 10,
              border: env?.maxStudentTestRuns !== null ? '1px solid #b7eb8f' : '1px solid #f0f0f0',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 15, color: '#262626' }}>Limit Test Run Count</span>
                  <CPTooltip
                    infoIcon={true}
                    title="Enabling this setting will limit the amount of times students see exposed tests on student submit. After this number has been exceeded, they can still submit, but won't see test results."
                    iconStyle={{ fontSize: 12, color: '#bfbfbf' }}
                  />
                </div>
                <span
                  style={{
                    fontSize: 13,
                    color: '#8c8c8c',
                    display: 'block',
                    marginBottom: env?.maxStudentTestRuns !== null ? 12 : 0,
                  }}
                >
                  Students can only run exposed tests a limited number of times
                </span>
                {env?.maxStudentTestRuns !== null && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                    <span style={{ fontSize: 13, color: '#595959' }}>Maximum runs:</span>
                    <InputNumber
                      min={1}
                      value={env?.maxStudentTestRuns}
                      onChange={(value) => updateEnvSetting('maxStudentTestRuns', value)}
                      style={{ width: 80 }}
                      size="small"
                    />
                  </div>
                )}
              </div>
              <Checkbox
                checked={env?.maxStudentTestRuns !== null}
                onChange={(e) => updateEnvSetting('maxStudentTestRuns', e.target.checked ? 10 : null)}
                disabled={!env}
                style={{ marginTop: 2 }}
              />
            </div>
          </div>

          {/* Limit exposed failed tests setting */}
          <div
            style={{
              padding: '16px 20px',
              background: env?.maxExposedFailedTests !== null ? '#f6ffed' : '#fafafa',
              borderRadius: 10,
              border: env?.maxExposedFailedTests !== null ? '1px solid #b7eb8f' : '1px solid #f0f0f0',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 15, color: '#262626' }}>Limit Failed Test Exposure</span>
                  <CPTooltip
                    infoIcon={true}
                    title="Enabling this setting will limit the amount of failed tests a student is exposed to when they submit. This is a helpful feature if you'd like your students to slowly work through failed tests, and encourage them to write their own tests."
                    iconStyle={{ fontSize: 12, color: '#bfbfbf' }}
                  />
                </div>
                <span
                  style={{
                    fontSize: 13,
                    color: '#8c8c8c',
                    display: 'block',
                    marginBottom: env?.maxExposedFailedTests !== null ? 12 : 0,
                  }}
                >
                  Only show a limited number of failed tests per category
                </span>
                {env?.maxExposedFailedTests !== null && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                    <span style={{ fontSize: 13, color: '#595959' }}>Max failed tests per category:</span>
                    <InputNumber
                      min={1}
                      value={env?.maxExposedFailedTests}
                      onChange={(value) => updateEnvSetting('maxExposedFailedTests', value)}
                      style={{ width: 80 }}
                      size="small"
                    />
                  </div>
                )}
              </div>
              <Checkbox
                checked={env?.maxExposedFailedTests !== null}
                onChange={(e) => updateEnvSetting('maxExposedFailedTests', e.target.checked ? 3 : null)}
                disabled={!env}
                style={{ marginTop: 2 }}
              />
            </div>
          </div>
        </div>
      </div>
    ),
  });

  const content = (
    <Tabs defaultActiveKey="environment" activeKey={currTab} onChange={onChange} animated={false} items={items} />
  );

  const actions = [
    <Button type="primary">
      <Link to={location.pathname.replace(/\/edit.*$/, '/results')}>View results</Link>
    </Button>,
  ];

  return (
    <div id="Autograder">
      <CPAdminDetail
        breadcrumbs={
          <Breadcrumb
            items={[...(props.breadcrumbs || []), { title: props.currentAssignment.name }, { title: 'Edit' }]}
          />
        }
        goBack={null}
        title={`${props.currentAssignment.name} | Environment Setup`}
        actions={actions}
        content={content}
      />
    </div>
  );
};
