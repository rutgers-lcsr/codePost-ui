import * as React from 'react';

import { SubmissionType } from '../../../infrastructure/submission';

import { fetchTestsBySubmission } from '../../admin/assignments/assignments/AssignmentTest/testUtils';

interface IProps {
  submission: SubmissionType;
}

const TestDisplay = (props: IProps) => {
  const [tests, setTests] = React.useState([] as any[]);
  React.useEffect(() => {
    fetchTestsBySubmission([props.submission]).then((results) => {
      setTests(results[0]);
    });
  });

  return <div>Tests go here</div>;
};
