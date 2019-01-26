import * as React from 'react';
import { DataTable, TableBody, TableColumn, TableHeader, TableRow } from 'react-md';

import { openSubmission } from '../admin/AdminUtils';

import { Assignment, AssignmentType } from '../../infrastructure/assignment';
import { Course, CourseType, RosterType } from '../../infrastructure/course';
import { SubmissionType } from '../../infrastructure/submission';

interface IProps {
  currentCourse: CourseType;
  currentAssignment: AssignmentType;
}
interface IState {
  graders: string[];
  submissions: SubmissionType[];
}

class ViewAllPanel extends React.Component<IProps, IState> {
  public state: Readonly<IState> = {
    graders: [],
    submissions: [],
  };

  public constructor(props: any) {
    super(props);
    this.loadSubmissions();
    this.loadRoster();
  }
  public loadSubmissions = () => {
    Assignment.readSubmissions(this.props.currentAssignment.id, {}).then((submissions: SubmissionType[]) => {
      this.setState({ submissions });
    });
  };

  public loadRoster = () => {
    Course.readRoster(this.props.currentCourse.id, {}).then((roster: RosterType) => {
      this.setState({ graders: roster.graders });
    });
  };

  public render() {
    const { graders, submissions } = this.state;
    let tableBody;
    if (!graders || !submissions) {
      tableBody = <div>Loading</div>;
    } else {
      tableBody = submissions.map((submission) => {
        const grade = submission.isFinalized ? String(submission.grade) : 'Not graded';
        return (
          <TableRow key={submission.id} onClick={openSubmission.bind(this.props, submission.id)}>
            <TableColumn>{submission.students.toString()}</TableColumn>
            <TableColumn>{grade}</TableColumn>
            <TableColumn>{submission.grader}</TableColumn>
          </TableRow>
        );
      });
    }
    return (
      <DataTable className="DataTable--ViewAll" plain={true}>
        <TableHeader>
          <TableRow>
            <TableColumn key={'Student'}>Student Name</TableColumn>
            <TableColumn key={'Grade'}>Grade</TableColumn>
            <TableColumn key={'Grader'}>Grader</TableColumn>
          </TableRow>
        </TableHeader>
        <TableBody>{tableBody}</TableBody>
      </DataTable>
    );
  }
}

export default ViewAllPanel;
