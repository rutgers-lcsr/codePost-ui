import * as React from 'react';
import { CircularProgress, DataTable, FontIcon, TableBody, TableColumn, TableHeader, TableRow } from 'react-md';
import Select from 'react-select';

import { openSubmission } from '../admin/AdminUtils';

import { Assignment, AssignmentType } from '../../infrastructure/assignment';
import { Course, CourseType, RosterType } from '../../infrastructure/course';
import { submissionSort, SubmissionType } from '../../infrastructure/submission';

import { IOptionNumber } from '../../types/common';
import { getSortIndex } from '../Utils/SortUtils';

import * as moment from 'moment';

interface IProps {
  currentCourse: CourseType;
  currentAssignment: AssignmentType;
}
interface IState {
  graders: string[];
  submissions: SubmissionType[];
  selectedGraders: string[];
  loadSubmissionsComplete: boolean;
  loadGradersComplete: boolean;
  sortedIndex: Array<boolean | undefined>;
}

class ViewAllPanel extends React.Component<IProps, IState> {
  public state: Readonly<IState> = {
    graders: [],
    submissions: [],
    selectedGraders: [],
    loadSubmissionsComplete: false,
    loadGradersComplete: false,
    // SortedIndex index corresponds to columns: index 0 is email
    sortedIndex: [true, undefined, undefined, undefined, undefined],
  };

  public constructor(props: any) {
    super(props);
    this.loadSubmissions();
    this.loadRoster();
  }
  public loadSubmissions = () => {
    Assignment.readSubmissions(this.props.currentAssignment.id, {}).then((submissions: SubmissionType[]) => {
      this.setState({ submissions, loadSubmissionsComplete: true });
    });
  };

  public loadRoster = () => {
    Course.readRoster(this.props.currentCourse.id, {}).then((roster: RosterType) => {
      this.setState({ graders: roster.graders, loadGradersComplete: true });
    });
  };

  public handleSelect = (input: IOptionNumber[]) => {
    const selectedGraders = input.map((i: IOptionNumber) => {
      return i.label.toLowerCase();
    });
    this.setState({ selectedGraders });
  };

  public toggleSort = (columnIndex: number) => {
    const { sortedIndex } = this.state;
    const newSortedIndex = getSortIndex(sortedIndex, columnIndex);
    // set new sortedIndex to state
    this.setState({ sortedIndex: newSortedIndex });
  };

  public sort(a: SubmissionType, b: SubmissionType) {
    const { sortedIndex } = this.state;

    const sortAttribute = sortedIndex.findIndex((elem) => {
      return typeof elem !== 'undefined';
    });

    if (sortAttribute === -1) {
      return 0;
    }

    const ascending = sortedIndex[sortAttribute] ? true : false;
    return submissionSort(sortAttribute, ascending, a, b);
  }

  public render() {
    const {
      graders,
      submissions,
      selectedGraders,
      loadSubmissionsComplete,
      loadGradersComplete,
      sortedIndex,
    } = this.state;
    let tableBody;
    if (!loadSubmissionsComplete || !loadGradersComplete) {
      tableBody = <CircularProgress id="progress" className="progress-circle" />;
    } else {
      submissions.sort(this.sort.bind(this));
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
              <TableColumn key={'Student'} sorted={sortedIndex[0]} onClick={this.toggleSort.bind(this.props, 0)}>
                Student Name
              </TableColumn>
              <TableColumn key={'Grade'} sorted={sortedIndex[1]} onClick={this.toggleSort.bind(this.props, 1)}>
                Grade
              </TableColumn>
              <TableColumn key={'Grader'} sorted={sortedIndex[2]} onClick={this.toggleSort.bind(this.props, 2)}>
                Grader
              </TableColumn>
              <TableColumn key={'Finalized'} sorted={sortedIndex[3]} onClick={this.toggleSort.bind(this.props, 3)}>
                Finalized
              </TableColumn>
              <TableColumn key={'Last Edited'} sorted={sortedIndex[4]} onClick={this.toggleSort.bind(this.props, 4)}>
                Last Edited
              </TableColumn>
            </TableRow>
          </TableHeader>
          <TableBody>{tableBody}</TableBody>
        </DataTable>
      </div>
    );
  }
}

export default ViewAllPanel;
