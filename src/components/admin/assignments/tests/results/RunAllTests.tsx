// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/* react imports */
import { useState } from 'react';

/* library imports */
import { Button, Checkbox, Modal } from 'antd';

/* other library imports */

/* codePost object imports */
import { AssignmentType, EnvironmentType } from '../../../../../types/models';
import RunAllProgressModal from './RunAllProgressModal';

/* codePost util imports */
import { TestCasesByCategory } from '../../../../core/testFetchUtils';

interface IProps {
  numSubmissions: number;
  testCasesByCategory: TestCasesByCategory;
  runAllSubmissions: (
    progressCallback: (progress: string) => void,
    onFinishCallback: () => void,
    sendEmail: boolean,
  ) => void;
  env: EnvironmentType | undefined;
  assignment: AssignmentType;
}

enum MODAL_STATUS {
  None,
  PendingRunAll,
  RunAll,
}

const RunAllTests = (props: IProps) => {
  // ******************************************** State Variables ************************************
  // Run all specific
  const [progress, setProgress] = useState('{}');
  const [sendEmail, setSendEmail] = useState(true);

  // Page state
  const [modalStatus, setModalStatus] = useState<MODAL_STATUS>(MODAL_STATUS.None);

  // ******************************************** Can you run all tests? ************************************
  const testCases = Object.values(props.testCasesByCategory).flat();
  const hasSubmissions = props.numSubmissions > 0;
  const hasTestCases = testCases.length > 0;
  const notTooBig = props.numSubmissions < 800; // disable run all for really big courses -- takes forever
  const notCodeInPlace = props.assignment.course !== 925; // disable for code in place
  const canRun = hasSubmissions && hasTestCases && props.numSubmissions && notTooBig && notCodeInPlace;
  // ******************************************** State functions ************************************

  //   Callback for run progress
  const progressCallback = (progress: string) => {
    setProgress(progress);
  };

  //   Callback for run finish
  const finishCallback = () => {
    setModalStatus(MODAL_STATUS.None);
    setProgress('{}');
  };

  const onCloseRunAll = () => {
    setModalStatus(MODAL_STATUS.None);
    setProgress('{}');
  };

  //   On initial run all click
  const onTrigger = () => {
    setModalStatus(MODAL_STATUS.PendingRunAll);
  };

  //   On confirmation modal click
  const onConfirm = () => {
    setModalStatus(MODAL_STATUS.RunAll);
    props.runAllSubmissions(progressCallback, finishCallback, sendEmail);
  };

  // ******************************************** Utils  ************************************
  const getEstimate = (numSubmissions: number) => {
    const showWith0 = (value: number) => (value < 10 ? `0${value}` : `${value}`);
    const estimateInSeconds = numSubmissions * 4;

    const hours = showWith0(Math.floor((estimateInSeconds / (60 * 60)) % 60));
    const minutes = showWith0(Math.floor((estimateInSeconds / 60) % 60));
    const seconds = showWith0(Math.floor(estimateInSeconds % 60));
    return `${parseInt(hours) ? `${hours}hr` : ''}${minutes}m ${seconds}s`;
  };

  const hasExternalTests = () => {
    let hasExternal = false;
    Object.keys(props.testCasesByCategory).forEach((category: string) => {
      props.testCasesByCategory[parseInt(category, 10)].forEach(
        (test) => test.type === 'external' && (hasExternal = true),
      );
    });

    return hasExternal;
  };

  // ******************************************** Render  ************************************

  return (
    <div>
      <Button type="default" disabled={!canRun} onClick={onTrigger} loading={props.env && (props.env as any).isRunning}>
        Run all tests
      </Button>
      <RunAllProgressModal
        visible={modalStatus === MODAL_STATUS.RunAll}
        onCancel={onCloseRunAll}
        cases={testCases}
        raw={progress}
        numSubmissions={props.numSubmissions}
      />
      <Modal
        open={modalStatus === MODAL_STATUS.PendingRunAll}
        onCancel={setModalStatus.bind({}, MODAL_STATUS.None)}
        onOk={onConfirm}
        okText="Run"
        title="Confirm Run All Tests"
      >
        <div style={{ fontSize: 16 }}>
          {hasExternalTests() && (
            <div style={{ fontSize: 14, marginBottom: 15, color: 'orange' }}>
              WARNING: You have some tests with type 'external'. External tests are to be set using the API, and will
              not be run when you run tests in the codePost autograder. If you would like them to be run in the codePost
              autograder, then please change the test type.
            </div>
          )}
          <div>
            Estimated time to complete: <b>{getEstimate(props.numSubmissions)}</b>
          </div>
          <br />
          <div>
            <Checkbox checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} /> Send me an email when
            completed
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RunAllTests;
