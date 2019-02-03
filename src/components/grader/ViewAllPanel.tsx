import * as React from 'react';
import { CircularProgress, DataTable, FontIcon, TableBody, TableColumn, TableHeader, TableRow } from 'react-md';
import Select from 'react-select';

import { openSubmission } from '../admin/AdminUtils';

import { Assignment, AssignmentType } from '../../infrastructure/assignment';
import { Course, CourseType, RosterType } from '../../infrastructure/course';
import { SubmissionType } from '../../infrastructure/submission';

import { IOptionNumber } from '../../types/common';

import * as moment from 'moment';

interface IProps {
  currentCourse: CourseType;
  currentAssignment: AssignmentType;
}
interface IState {
  graders: string[];
  submissions: SubmissionType[];
  selectedGraders: string[];
}

class ViewAllPanel extends React.Component<IProps, IState> {
  public state: Readonly<IState> = {
    graders: [],
    submissions: [],
    selectedGraders: [],
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

  public handleSelect = (input: IOptionNumber[]) => {
    const selectedGraders = input.map((i: IOptionNumber) => {
      return i.label.toLowerCase();
    });
    this.setState({ selectedGraders });
  };

  public render() {
    const { graders, submissions, selectedGraders } = this.state;
    let tableBody;
    if (graders.length === 0 || submissions.length === 0) {
      tableBody = <CircularProgress id="progress" className="progress-circle" />;
    } else {
      tableBody = submissions.map((submission) => {
        // If select bar is populated, filter by submissions who meet search conditions
        if (
          selectedGraders.length > 0 &&
          (!submission.grader || selectedGraders.indexOf(submission.grader.toLowerCase()) === -1)
        ) {
          return <div />;
        }
        const grade = submission.isFinalized ? String(submission.grade) : 'Not graded';
        return (
          <TableRow key={submission.id} onClick={openSubmission.bind(this.props, submission.id)}>
            <TableColumn>{submission.students.toString()}</TableColumn>
            <TableColumn>{grade}</TableColumn>
            <TableColumn>{submission.grader}</TableColumn>
            <TableColumn>{submission.isFinalized ? <FontIcon>done</FontIcon> : null}</TableColumn>
            <TableColumn>{moment(submission.dateEdited).format('llll')}</TableColumn>
          </TableRow>
        );
      });
    }

    const menuItems = graders.map((grader) => {
      return { value: grader, label: grader };
    });

    return (
      <div className="grader__viewAll">
        <Select
          classNamePrefix="multiselect--ViewAll"
          closeMenuOnSelect={false}
          isMulti={true}
          options={menuItems}
          onChange={this.handleSelect}
          placeholder="Select Graders..."
        />
        <DataTable className="DataTable--ViewAll" plain={true}>
          <TableHeader>
            <TableRow>
              <TableColumn key={'Student'}>Student Name</TableColumn>
              <TableColumn key={'Grade'}>Grade</TableColumn>
              <TableColumn key={'Grader'}>Grader</TableColumn>
              <TableColumn key={'Finalized'}>Finalized</TableColumn>
              <TableColumn key={'Last Edited'}>Last Edited</TableColumn>
            </TableRow>
          </TableHeader>
          <TableBody>{tableBody}</TableBody>
        </DataTable>
      </div>
    );
  }
}

export default ViewAllPanel;
