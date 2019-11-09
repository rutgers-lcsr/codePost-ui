/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import React, { useEffect, useState } from 'react';

/* antd imports */
import { Breadcrumb } from 'antd';

/* other library imports */
import { RouteComponentProps } from 'react-router';
import { Switch, Route } from 'react-router-dom';

/* codePost object imports */
import { Assignment, AssignmentPatchType, AssignmentType } from '../../../../../infrastructure/assignment';
import { SubmissionType } from '../../../../../infrastructure/submission';
import { UserType } from '../../../../../infrastructure/user';

/* codePost component imports */
import { TestingSetup } from './TestingSetup';
import { TestingSummary } from './TestingSummary';

/**********************************************************************************************************************/

enum DETAIL_TYPE {
  SetUp,
  Summary,
}

interface IProps {
  activeAssignment: AssignmentType;
  submissions: SubmissionType[];
  onCancel: () => void;
  user: UserType;
  updateAssignment: (assignment: AssignmentPatchType) => Promise<void>;
  breadcrumbs?: React.ReactElement[];
}

export const AssignmentTests = (props: IProps & RouteComponentProps) => {
  // ************************** State Variables ******************************
  const [detail, setDetail] = useState(DETAIL_TYPE.Summary);
  const [assignment, setAssignment] = useState(props.activeAssignment);

  // ************************** Fetch data ******************************
  useEffect(() => {
    // We want to make sure we have the latest assignment information (test language, test categories)
    const fetchData = async () => {
      const updatedAssignment = await Assignment.read(props.activeAssignment.id);
      setAssignment(updatedAssignment);
    };
    fetchData();
  }, [props.activeAssignment]);

  // ***************** API / State change functions ***********************
  const updateAssignment = async (patchObj: AssignmentPatchType) => {
    const newAssignment = await Assignment.update(patchObj);
    setAssignment(newAssignment);
  };

  const breadcrumbs = [...(props.breadcrumbs ? props.breadcrumbs : []), <Breadcrumb.Item>Tests</Breadcrumb.Item>];

  // ************************ Return ************************************
  return (
    <Switch>
      <Route
        path={`${props.match.url}/edit`}
        render={(subprops: any) => (
          <TestingSetup
            breadcrumbs={breadcrumbs}
            currentAssignment={assignment}
            switchDetail={setDetail.bind({}, DETAIL_TYPE.SetUp)}
            onCancel={props.onCancel}
            submissions={props.submissions}
            updateAssignment={updateAssignment}
          />
        )}
      />
      <Route
        path={`${props.match.url}/run`}
        render={(subprops: any) => (
          <TestingSummary
            currentAssignment={assignment}
            submissions={props.submissions}
            switchDetail={setDetail.bind({}, DETAIL_TYPE.SetUp)}
            onCancel={props.onCancel}
          />
        )}
      />
    </Switch>
  );
};
