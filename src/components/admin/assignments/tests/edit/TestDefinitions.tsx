/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
// import React from 'react';

/* antd imports */
import { Result } from 'antd';

/* codePost object imports */
import { EnvironmentType } from '../../../../../infrastructure/autograder/environment';
import { SubmissionInfoType } from '../../../../../infrastructure/submission';
import { AssignmentType } from '../../../../../infrastructure/types';

/* codePost interface imports */
import { FILE_TYPE } from './TestDefinitions/FileType';

/**********************************************************************************************************************/

export interface IBasicFile {
  id: number;
  name: string;
  code: string;
  type: FILE_TYPE;
  canSave: boolean;
}

interface IProps {
  currentAssignment: AssignmentType;

  submissions: SubmissionInfoType[];
  updateEnv: (env: EnvironmentType) => void;
  env?: EnvironmentType;
  reloadEnv?: () => void;
  loading: boolean;
}

export const TestDefinitions = (_props: IProps) => {
  return (
    <div style={{ padding: '40px' }}>
      <Result
        status="info"
        title="Coming Soon"
        subTitle="The Test Editor is currently being rewritten. Please check back later."
      />
    </div>
  );
};
