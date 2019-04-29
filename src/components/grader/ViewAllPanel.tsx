import * as React from 'react';
import {
  CircularProgress,
  DataTable,
  FontIcon,
  TableBody,
  TableColumn,
  TableHeader,
  TableRow,
  Tooltipped,
} from 'react-md';
import Select from 'react-select';

import { openSubmission } from '../admin/AdminUtils';

import { Assignment, AssignmentType } from '../../infrastructure/assignment';
import { Course, CourseType } from '../../infrastructure/course';
import { sortSubmissions, SubmissionType } from '../../infrastructure/submission';
import { SubmissionHistoryType } from '../../infrastructure/submissionHistory';

import { IOptionNumber } from '../../types/common';
import { getSortIndex } from '../Utils/SortUtils';

import * as moment from 'moment';

interface IViewAllProps {
  currentCourse: CourseType;
  currentAssignment: AssignmentType;
}
interface IViewAllState {
  graders: string[];
  submissions: SubmissionType[];
  selectedGraders: string[];
  isLoading: boolean;
  viewsBySubmission: { [submissionID: number]: string[] };
  sortedIndex: Array<boolean | undefined>;
}

class ViewAllPanel extends React.Component<IViewAllProps, IViewAllState> {
  public state: Readonly<IViewAllState> = {
    graders: [],
    submissions: [],
    selectedGraders: [],
    viewsBySubmission: {},
    isLoading: true,

    // SortedIndex index corresponds to columns: index 0 is email. Length must equal number of columns
    sortedIndex: [true, undefined, undefined, undefined, undefined, undefined],
  };

  public async componentDidMount() {
    const [submissions, viewsBySubmission, roster] = await Promise.all([
      await Assignment.readSubmissions(this.props.currentAssignment.id),
      await this.loadSubmissionsViews(),
      await Course.readRoster(this.props.currentCourse.id),
    ]);

    submissions.sort(this.sort.bind(this));

    this.setState({ graders: roster.graders, viewsBySubmission, submissions, isLoading: false });
  }

  public loadSubmissionsViews = () => {
    return Assignment.readSubmissionHistories(this.props.currentAssignment.id).then(
      (histories: SubmissionHistoryType[]) => {
        const viewsBySubmission = {};
        histories.forEach((history: SubmissionHistoryType) => {
          const submissionID = history.submission;
          if (!(submissionID in viewsBySubmission)) {
            viewsBySubmission[submissionID] = [];
          }
          if (history.hasViewed) {
            viewsBySubmission[submissionID] = [...viewsBySubmission[submissionID], history.student];
          }
        });
        return viewsBySubmission;
      },
    );
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

  public getViewIcon = (submission: SubmissionType) => {
    if (!(submission.id in this.state.viewsBySubmission) || !submission.isFinalized) {
      return '--';
    } else {
      switch (this.state.viewsBySubmission[submission.id].length) {
        case 0:
          return <FontIcon secondary>visibility_off</FontIcon>;
        case submission.students.length:
          return <FontIcon>visibility</FontIcon>;
        default:
          return (
            <Tooltipped
              label={`Viewed by: ${this.state.viewsBySubmission[submission.id].toString()}`}
              position="left"
              setPosition={true}
              delay={500}
            >
              <div>
                <FontIcon style={{ color: '#999999' }}>visibility</FontIcon>
              </div>
            </Tooltipped>
          );
      }
    }
  };

  public render() {
    const { graders, submissions, selectedGraders, sortedIndex } = this.state;
    let tableBody;
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
            <TableColumn className="left-aligned">{submission.students.toString()}</TableColumn>
            <TableColumn className={`table-cell${cellType}`}>{grade}</TableColumn>
            <TableColumn>{submission.grader}</TableColumn>
            <TableColumn>{submission.isFinalized ? <FontIcon>done</FontIcon> : null}</TableColumn>
            <TableColumn>{moment(submission.dateEdited).format('llll')}</TableColumn>
            <TableColumn>{this.getViewIcon(submission)}</TableColumn>
          </TableRow>
        );
      });
    }

    const menuItems = graders.map((grader) => {
      return { value: grader, label: grader };
    });

    return (
      <div className="grader__view-all">
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
              <TableColumn
                key={'Student'}
                className="left-aligned"
                sorted={sortedIndex[0]}
                onClick={this.toggleSort.bind(this.props, 0)}
              >
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
              <TableColumn key={'hasViewed'} sorted={sortedIndex[5]} onClick={this.toggleSort.bind(this.props, 5)}>
                Viewed by Student(s)
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
