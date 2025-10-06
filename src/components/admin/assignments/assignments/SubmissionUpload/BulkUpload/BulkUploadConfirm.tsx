/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */

/* ant imports */
import { Collapse, Divider, Switch, Table, Tag, Typography } from 'antd';
/* codePost imports */
import CPTooltip from '../../../../../../components/core/CPTooltip';
import { tooltips } from '../../../../../../components/core/tooltips';

import LogViewer from '../../../../../../components/core/LogViewer';

import { STUDENT_STATUS, getSubforStudent, isEqual } from './BulkUploadHelpers';

import { IProtoSubmission } from './../FileReader';

const Panel = Collapse.Panel;

interface IBulkUploadConfirmProps {
  students: string[];
  protoSubmissions: IProtoSubmission[];
  studentMap: { [student: string]: STUDENT_STATUS };
  overwriteMode: boolean;
  toggleOverwriteMode: () => void;
  errorPaths: string[];
}

const BulkUploadConfirm = (props: IBulkUploadConfirmProps) => {
  const studentLists = {
    impacted: {} as { [student: string]: IProtoSubmission },
    missing: [] as string[],
    uploaded: [] as string[],
  };

  const lowerCaseStudents = props.students.map((student) => {
    return student.toLowerCase();
  });

  for (const student of lowerCaseStudents) {
    const sub = getSubforStudent(student, props.protoSubmissions);
    if (sub !== undefined) {
      studentLists.impacted[student] = sub;
    } else {
      // does student have an existing submission?
      if (props.studentMap[student] === STUDENT_STATUS.EXISTING) {
        studentLists.uploaded.push(student);
      } else {
        studentLists.missing.push(student);
      }
    }
  }

  // columns for impacted table
  const columns = [
    {
      title: 'Student',
      dataIndex: 'student',
      key: 'student',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      align: 'center' as 'center' | 'left' | 'right',
    },
    {
      title: 'Partners',
      dataIndex: 'partners',
      key: 'partners',
    },
    {
      title: 'Files',
      dataIndex: 'files',
      key: 'files',
    },
  ];

  // columns for non-impacted tables
  const studentColumns = [
    {
      title: 'Student',
      dataIndex: 'student',
      key: 'student',
    },
  ];

  // data for impacted table
  let hasCollisions = false;
  const dataSource = Object.keys(studentLists.impacted)
    .sort((a, b) => {
      const studentMap = props.studentMap;
      return studentMap[a] - studentMap[b];
    })
    .map((el) => {
      let status;
      const sub = studentLists.impacted[el];

      if (sub.isCollision) {
        hasCollisions = true;
        if (props.overwriteMode) {
          status = (
            <Tag color="green" key={el}>
              Ok
            </Tag>
          );
        } else {
          let tooltipText;
          if (props.studentMap[el] === STUDENT_STATUS.EXISTING) {
            tooltipText = 'This student already has a submission uploaded for this assignment.';
          } else {
            tooltipText = `One of this student's partners in the submission you
               uploaded aleady has a submission uploaded for this assignment.`;
          }
          status = (
            <CPTooltip title={tooltipText}>
              <Tag color="volcano" key={el}>
                CONFLICT
              </Tag>
            </CPTooltip>
          );
        }
      } else {
        status = (
          <Tag color="green" key={el}>
            Ok
          </Tag>
        );
      }

      // tslint:disable
      return {
        key: el,
        student: el,
        status,
        partners: sub ? sub.students.filter((student) => !isEqual(student, el)).join(', ') : '',
        files: sub
          ? sub.files
              .map((file) => {
                return file.name;
              })
              .join(', ')
          : '',
      };
      // tslint:enable
    });

  // data for non-impacted tables
  const withSubmissionsData = studentLists.uploaded.map((el) => {
    return {
      student: el,
    };
  });

  const withoutSubmissionsData = studentLists.missing.map((el) => {
    return {
      student: el,
    };
  });

  // for customizing instructions
  const numSubmissions = Object.values(studentLists.impacted).length;
  const numStudents = Object.keys(studentLists.impacted).length;

  return (
    <div>
      {props.errorPaths.length > 0 ? (
        <div>
          <Divider orientation="left" style={{ color: 'red' }}>
            Errors
          </Divider>
          <div>
            <div>
              The following files were rejected. Hit "start over" if you want to re-upload submissions.{' '}
              <CPTooltip
                title={tooltips.admin.assignments.uploadSubmissionFileTypes}
                infoIcon={true}
                iconStyle={{ paddingLeft: 5 }}
              />
            </div>
            <LogViewer text={props.errorPaths.join('\n')} />

            <br />
          </div>
        </div>
      ) : null}
      <Divider orientation="left">Instructions</Divider>
      You are about to upload <Typography.Text strong>{numSubmissions}</Typography.Text> submission
      {numSubmissions > 1 ? 's ' : ' '}
      corresponding to <Typography.Text strong>{numStudents}</Typography.Text> student
      {numStudents > 1 ? 's' : ''}
      . You can view information about the submissions you are about to upload below. If you want to make changes, just
      hit "Start over" to re-upload.
      <br />
      <br />
      {hasCollisions ? (
        <div>
          <br />
          <Tag color="volcano" key="collision-warning">
            CONFLICT
          </Tag>{' '}
          &nbsp; Existing submissions will be overwritten by this upload. Turn on Overwrite mode if you want to upload
          these submissions. Otherwise, they will be excluded from your upload.
          <br />
          <br /> Overwrite mode: &nbsp;{' '}
          <Switch onChange={props.toggleOverwriteMode} defaultChecked={props.overwriteMode} /> &nbsp;
          <br />
          <br />
        </div>
      ) : null}
      <Table pagination={{ pageSize: 5 }} dataSource={dataSource} columns={columns} />
      <Divider orientation="left">Students not uploaded</Divider>
      <Collapse>
        <Panel header="Students without submissions" key="1">
          <Table pagination={{ pageSize: 5 }} dataSource={withoutSubmissionsData} columns={studentColumns} />
        </Panel>
        <Panel header="Students with submissions" key="2">
          <Table pagination={{ pageSize: 5 }} dataSource={withSubmissionsData} columns={studentColumns} />
        </Panel>
      </Collapse>
    </div>
  );
};

export default BulkUploadConfirm;
