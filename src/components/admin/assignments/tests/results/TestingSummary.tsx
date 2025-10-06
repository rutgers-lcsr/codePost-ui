/* react imports */
import React, { useEffect, useState } from 'react';

/* library imports */
import { Breadcrumb, Button } from 'antd';

/* other library imports */
import { Link } from 'react-router-dom';

/* codePost object imports */
import { Assignment, AssignmentType } from '../../../../../infrastructure/assignment';
import { SubmissionInfoType, SubmissionWithTestsType } from '../../../../../infrastructure/submission';
import { TestCategoryType } from '../../../../../infrastructure/testCategory';

import { Environment, EnvironmentType } from '../../../../../infrastructure/autograder/environment';
import { SubmissionTestResultType } from '../../../../../infrastructure/autograder/runTypes';

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

interface IProps {
  breadcrumbs?: Array<{ title: React.ReactNode }>;
  submissions: SubmissionInfoType[];
  currentAssignment: AssignmentType;
  isAdmin: boolean;
  tableOnly: boolean;
  match?: any;
  fullSubmissionsLoadComplete: boolean;
}

export const TestingSummary = (props: IProps) => {
  // ************************** State Variables ******************************
  // objects
  const [env, setEnv] = useState<EnvironmentType | undefined>(undefined);
  const [categories, setCategories] = useState<TestCategoryType[]>([]);

  // Calculated data structures
  const [testCasesByCategory, setTestCasesByCategory] = useState<TestCasesByCategory>({});
  const [testsBySubmission, setTestsBySubmission] = useState<TestsBySubmission>({});

  // Loading
  const [subsLoading, setSubsLoading] = useState<number[]>([]);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [resultsLoading, setResultsLoading] = useState(false);
  // ************************** Fetch Data ******************************
  const fetchPaginatedResults = async () => {
    if (props.currentAssignment) {
      setResultsLoading(true);
      Assignment.readPaginatedTestResults(props.currentAssignment.id, submissionTestsCallback).then(() => {
        setResultsLoading(false);
      });
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (props.currentAssignment) {
        setFetchLoading(true);
        const [categories, casesByCategory]: any = await fetchTestData(props.currentAssignment);
        setCategories(categories);
        setTestCasesByCategory(casesByCategory);
        const currEnv = await fetchEnvironment(props.currentAssignment);
        setEnv(currEnv);
        if (props.isAdmin) {
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
  }, [props.currentAssignment && props.currentAssignment.id]);

  const submissionTestsCallback = (results: SubmissionWithTestsType[]) => {
    setTestsBySubmission((prevState) => {
      const oldTests = { ...prevState };
      results.forEach((submission) => {
        oldTests[submission.id] = submission.tests;
      });
      return oldTests;
    });
  };

  // ******************************* API / State change functions  *******************************

  const runAllCallback = () => {
    fetchPaginatedResults();
  };

  const runAllSubmissions = async (
    progressCallback: (progress: any) => void,
    onFinishCallback: () => void,
    sendEmail: boolean,
  ) => {
    if (env) {
      const result = await Environment.runAll({ id: env.id, sendEmail: sendEmail });
      awaitTestResult(
        result.task,
        () => {
          runAllCallback();
          onFinishCallback();
        },
        progressCallback,
      );
      const newEnv = { ...env };
      newEnv.isRunning = true;
      setEnv(newEnv);
    }
  };

  const runSubmissionCallback = (sub: SubmissionInfoType, result: SubmissionTestResultType) => {
    const newTestBySub = { ...testsBySubmission };
    newTestBySub[sub.id] = result.submissionTests;
    setTestsBySubmission(newTestBySub);
    const newLoadingSubs = subsLoading.filter((id) => {
      return id !== sub.id;
    });
    setSubsLoading(newLoadingSubs);
  };

  const runSubmission = async (sub: SubmissionInfoType) => {
    if (env) {
      setSubsLoading([...subsLoading, sub.id]);
      const payload = {
        id: env.id,
        submission: sub.id,
        simulate: false,
      };
      const result = await Environment.run(payload);
      awaitTestResult(result.task, runSubmissionCallback.bind({}, sub));
    }
  };

  // ******************************* Return  *******************************
  let actions: any = [];
  //  Only allow run all an edit tests if admin
  actions =
    !props.isAdmin || !props.match
      ? []
      : [
          <RunAllTests
            numSubmissions={props.submissions.length}
            testCasesByCategory={testCasesByCategory}
            runAllSubmissions={runAllSubmissions}
            assignment={props.currentAssignment}
            env={env}
          />,
          <Button type="primary">
            <Link
              to={[...props.match.url.split('/').slice(0, props.match.url.split('/').length - 1), 'edit'].join('/')}
            >
              Edit tests
            </Link>
          </Button>,
        ];

  console.log(props.fullSubmissionsLoadComplete);

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
      submissions={props.submissions}
      assignment={props.currentAssignment}
      testCasesByCategory={testCasesByCategory}
      testsBySubmission={testsBySubmission}
      categories={categories}
      isLoading={fetchLoading || !props.fullSubmissionsLoadComplete}
      subsLoading={subsLoading}
      resultsLoading={resultsLoading}
      runSubmission={runSubmission}
      hasSourceFiles={(env && env.sourceFiles.length > 0) || false}
    />
  );
};
