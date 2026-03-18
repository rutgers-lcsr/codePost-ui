// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import React, { useEffect, useMemo, useState } from 'react';

/* antd imports */
import { Breadcrumb, Button, Skeleton, Tabs, Typography } from 'antd';

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
          <Typography.Text>
            Settings for assignments are located in the `Grading` tab inside Assignment settings. There you can set how
            tests behave based on the assignment
          </Typography.Text>
        </div>
      </div>
    ),
  });

  const content = (
    <Tabs defaultActiveKey="environment" activeKey={currTab} onChange={onChange} animated={false} items={items} />
  );

  const actions = [
    <Button key="view-results" type="primary">
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
        title={`${props.currentAssignment.name} | Environment & Tests`}
        actions={actions}
        content={content}
      />
    </div>
  );
};
