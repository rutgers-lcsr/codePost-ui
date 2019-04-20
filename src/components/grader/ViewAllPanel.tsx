/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* react-md imports */
import {
  CircularProgress,
  DataTable,
  FontIcon,
  SelectionControl,
  TableBody,
  TableColumn,
  TableHeader,
  TableRow,
} from 'react-md';

/* other library imports */
import * as moment from 'moment';
import Select from 'react-select';

/* codePost imports */
import { openSubmission } from '../admin/AdminUtils';

import { Assignment, AssignmentType } from '../../infrastructure/assignment';
import { Course, CourseType } from '../../infrastructure/course';
import { sortSubmissions, SubmissionType } from '../../infrastructure/submission';

import { IOptionNumber } from '../../types/common';
import { getSortIndex } from '../Utils/SortUtils';

/**********************************************************************************************************************/

interface IViewAllProps {
  currentCourse: CourseType;
  currentAssignment: AssignmentType;
}
interface IViewAllState {
  graders: string[];
  submissions: SubmissionType[];
  selectedGraders: string[];
  isLoading: boolean;
  sortedIndex: Array<boolean | undefined>;
  showStudentEmails: boolean;
}

class ViewAllPanel extends React.Component<IViewAllProps, IViewAllState> {
  public state: Readonly<IViewAllState> = {
    graders: [],
    submissions: [],
    selectedGraders: [],
    isLoading: true,
    showStudentEmails: false,

    // SortedIndex index corresponds to columns: index 0 is email
    sortedIndex: [true, undefined, undefined, undefined, undefined],
  };

  public async componentDidMount() {
    const [submissions, roster] = await Promise.all([
      await Assignment.readSubmissions(this.props.currentAssignment.id),
      await Course.readRoster(this.props.currentCourse.id),
    ]);

    submissions.sort(this.sort.bind(this));

    this.setState({ graders: roster.graders, submissions, isLoading: false });
  }

  public toggleShowStudentEmails = () => {
    this.setState({
      showStudentEmails: !this.state.showStudentEmails,
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
    this.setState({ sortedIndex: newSortedIndex }, () => {
      // sort submissions
      const newSubmissions = this.state.submissions;
      newSubmissions.sort(this.sort.bind(this));
      this.setState({ submissions: newSubmissions });
    });
  };

  public sort(a: SubmissionType, b: SubmissionType) {
    const sortAttribute = this.state.sortedIndex.findIndex((elem) => {
      return elem !== undefined;
    });

    if (sortAttribute === -1) {
      return 0;
    }

    const ascending = this.state.sortedIndex[sortAttribute] ? true : false;
    return sortSubmissions(sortAttribute, ascending, a, b);
  }

  public render() {
    const { graders, submissions, selectedGraders, sortedIndex } = this.state;
    let tableBody;
    const showingEmails = !this.props.currentAssignment.anonymousGrading || this.state.showStudentEmails;

    if (this.state.isLoading) {
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
        const grade = submission.isFinalized ? String(submission.grade) : 'Unfinalized';
        const cellType = submission.isFinalized ? '--graded' : '--unfinalized';
        return (
          <TableRow key={submission.id} onClick={openSubmission.bind(this.props, submission.id)}>
            <TableColumn>{showingEmails ? submission.students.toString() : submission.id}</TableColumn>
            <TableColumn className={`table-cell${cellType}`}>{grade}</TableColumn>
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

    // If we're in anonymous grading mode, add a toggle to reveal student emails
    let anonymousToggle;
    if (this.props.currentAssignment.anonymousGrading) {
      anonymousToggle = (
        <div>
          Anonymous mode:
          <SelectionControl
            id="toggleShowStudents"
            name="toggleShowStudents"
            type="switch"
            className="toggleShowStudents"
            defaultChecked={showingEmails}
            onChange={this.toggleShowStudentEmails}
            aria-label={'Reveal student emails'}
          />
        </div>
      );
    }

    return (
      <div className="grader__view-all">
        {anonymousToggle}
        <Select
          classNamePrefix="multiselect--view-all"
          closeMenuOnSelect={false}
          isMulti={true}
          options={menuItems}
          onChange={this.handleSelect}
          placeholder="Select Graders..."
        />
        <DataTable className="data-table--view-all" plain={true}>
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
