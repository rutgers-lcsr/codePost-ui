// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/* react imports */
import React, { useEffect, useState } from 'react';

/* library imports */
import { Breadcrumb, Button } from 'antd';

/* other library imports */
import { Link, useLocation } from 'react-router-dom';

/* codePost object imports */
import {
  EnvironmentType,
  SubmissionInfoType,
  SubmissionWithTestsType,
  TestCategoryType,
  AssignmentType,
} from '../../../../../types/models';
import { autograderApi } from '../../../../../api-client/clients';

import { awaitTestResult } from '../autograderPollingUtils';

/* codePost component imports */

import TestResultsTable from './TestResultsTable';

import RunAllTests from './RunAllTests';

/* codePost util imports */
import {
  fetchEnvironment,
  fetchTestData,
  fetchTestsBySubmission,
  TestCasesByCategory,
  TestsBySubmission,
} from '../../../../core/testFetchUtils';
import { useCourseCapabilities } from '../../../../../stores/usePermissionsStore';

interface IProps {
  breadcrumbs?: Array<{ title: React.ReactNode }>;
  submissions: SubmissionInfoType[];
  currentAssignment: AssignmentType;
  tableOnly: boolean;
  fullSubmissionsLoadComplete: boolean;
}

type EnvironmentState = EnvironmentType & { isRunning?: boolean };

export const TestingSummary = (props: IProps) => {
  const location = useLocation();
  const courseCaps = useCourseCapabilities(props.currentAssignment.course);
  const canManageTests = courseCaps.manage_test_cases ?? false;

  // ************************** State Variables ******************************
  // objects
  const [env, setEnv] = useState<EnvironmentState | undefined>(undefined);
  const [categories, setCategories] = useState<TestCategoryType[]>([]);

  // Calculated data structures
  const [testCasesByCategory, setTestCasesByCategory] = useState<TestCasesByCategory>({});
  const [testsBySubmission, setTestsBySubmission] = useState<TestsBySubmission>({});

  // Loading
  const [subsLoading, setSubsLoading] = useState<number[]>([]);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [resultsLoading, setResultsLoading] = useState(false);
  // ************************** Fetch Data ******************************
  const submissionTestsCallback = (results: SubmissionWithTestsType[]) => {
    setTestsBySubmission((prevState) => {
      const oldTests = { ...prevState };
      results.forEach((submission) => {
        oldTests[submission.id] = submission.tests;
      });
      return oldTests;
    });
  };

  const fetchPaginatedResults = async () => {
    if (props.currentAssignment) {
      setResultsLoading(true);
      const tests = await fetchTestsBySubmission(props.submissions);
      const results: SubmissionWithTestsType[] = Object.keys(tests).map((id) => ({
        id: Number(id),
        tests: tests[Number(id)],
      }));
      submissionTestsCallback(results);
      setResultsLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (props.currentAssignment) {
        setFetchLoading(true);
        const [categories, casesByCategory] = (await fetchTestData(props.currentAssignment)) as [
          TestCategoryType[],
          TestCasesByCategory,
        ];
        setCategories(categories);
        setTestCasesByCategory(casesByCategory);
        const currEnv = await fetchEnvironment(props.currentAssignment);
        setEnv(currEnv);
        if (canManageTests) {
          // Admin console, read paginated test results
          fetchPaginatedResults();
        } else {
          // Section leader console, read tests by submission
          const tests = await fetchTestsBySubmission(props.submissions);
          setTestsBySubmission(tests);
        }
        setFetchLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.currentAssignment && props.currentAssignment.id]);

  // ******************************* API / State change functions  *******************************

  const runAllCallback = () => {
    fetchPaginatedResults();
    // Reset isRunning on the frontend env after completion
    if (env) {
      setEnv({ ...env, isRunning: false });
    }
  };

  const runAllSubmissions = async (
    progressCallback: (progress: string) => void,
    onFinishCallback: () => void,
    sendEmail: boolean,
  ) => {
    if (env) {
      const result = (await autograderApi.environmentsRunAllPartialUpdate({
        id: env.id,
        patchedEnvironmentRunAllRequest: { sendEmail: sendEmail } as unknown as Parameters<
          typeof autograderApi.environmentsRunAllPartialUpdate
        >[0]['patchedEnvironmentRunAllRequest'],
      })) as unknown as { task: string };
      awaitTestResult(
        result.task,
        () => {
          runAllCallback();
          onFinishCallback();
        },
        (progress: unknown) => progressCallback(String(progress)),
      );
      setEnv({ ...env, isRunning: true });
    }
  };

  const runSubmissionCallback = async (sub: SubmissionInfoType, _result: unknown) => {
    // Re-fetch this submission's tests from the backend after run completes
    const tests = await fetchTestsBySubmission([sub]);
    const newTestBySub = { ...testsBySubmission };
    newTestBySub[sub.id] = tests[sub.id] || [];
    setTestsBySubmission(newTestBySub);
    const newLoadingSubs = subsLoading.filter((id) => {
      return id !== sub.id;
    });
    setSubsLoading(newLoadingSubs);
  };

  const runSubmission = async (sub: SubmissionInfoType) => {
    if (env) {
      setSubsLoading([...subsLoading, sub.id]);
      const result = (await autograderApi.environmentsRunPartialUpdate({
        id: env.id,
        patchedEnvironmentRunRequest: {
          submission: sub.id,
          simulate: false,
        } as unknown as Parameters<
          typeof autograderApi.environmentsRunPartialUpdate
        >[0]['patchedEnvironmentRunRequest'],
      })) as unknown as { task: string };
      awaitTestResult(result.task, (result: unknown) => runSubmissionCallback(sub, result));
    }
  };

  // ******************************* Return  *******************************
  //  Only allow run all and edit tests if admin
  const actions = !canManageTests
    ? []
    : [
        <RunAllTests
          key="run-all"
          numSubmissions={props.submissions.length}
          testCasesByCategory={testCasesByCategory}
          runAllSubmissions={runAllSubmissions}
          assignment={props.currentAssignment}
          env={env}
        />,
        <Button key="edit-tests" type="primary">
          <Link to={location.pathname.replace(/\/results.*$/, '/edit')}>Edit tests</Link>
        </Button>,
      ];

  const uniqueSubmissions = React.useMemo(() => {
    const seen = new Set<number>();
    return props.submissions.filter((sub) => {
      if (seen.has(sub.id)) {
        return false;
      }
      seen.add(sub.id);
      return true;
    });
  }, [props.submissions]);

  return (
    <TestResultsTable
      breadcrumbs={
        <Breadcrumb
          items={[...(props.breadcrumbs || []), { title: props.currentAssignment.name }, { title: 'Results' }]}
        />
      }
      tableOnly={props.tableOnly}
      title={`${props.currentAssignment.name} | Tests Summary`}
      parentActions={actions}
      submissions={uniqueSubmissions}
      assignment={props.currentAssignment}
      testCasesByCategory={testCasesByCategory}
      testsBySubmission={testsBySubmission}
      categories={categories}
      isLoading={fetchLoading || !props.fullSubmissionsLoadComplete}
      subsLoading={subsLoading}
      resultsLoading={resultsLoading}
      runSubmission={runSubmission}
    />
  );
};
