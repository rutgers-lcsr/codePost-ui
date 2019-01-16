import * as React from 'react';
import { Button, DataTable, TableBody, TableColumn, TableHeader, TableRow, TextField } from 'react-md';

import { IGraderSubmissionsDataTable } from '../../../types/common';

import { AssignmentType } from '../../../infrastructure/assignment';
import { SubmissionType } from '../../../infrastructure/submission';

interface IPropsGraderOverview {
  assignments: AssignmentType[];
  submissionsByGrader: IGraderSubmissionsDataTable;
  activeGrader: string | undefined;
  changeActiveGrader: (grader: string | undefined) => void;
  openSubmission: (submissionID: number | string) => void;
  submissionsbyUserLoadComplete: boolean;
  assignmentsLoadComplete: boolean;
}

interface IState {
  sortedIndex: { [index: string]: boolean | undefined };
  searchTerm: string;
}

class GraderData extends React.Component<IPropsGraderOverview, {}> {
  public state: Readonly<IState> = {
    sortedIndex: {},
    searchTerm: '',
  };

  public graderHeader = 'grader';

  public constructor(props: any) {
    super(props);
    const sortedIndex = {};
    this.props.assignments.forEach((assn) => {
      sortedIndex[assn.name] = false;
    });
    sortedIndex[this.graderHeader] = true;
    this.state = { sortedIndex, searchTerm: '' };
  }

  public toggleSort = (assignmentName: string) => {
    const { sortedIndex } = this.state;
    Object.keys(sortedIndex).map((key) => {
      if (key === assignmentName) {
        if (typeof sortedIndex[key] === 'undefined') {
          sortedIndex[key] = true;
        } else {
          sortedIndex[key] = !sortedIndex[key];
        }
      } else {
        sortedIndex[key] = undefined;
      }
    });
    this.setState({ sortedIndex });
  };

  public sortFunction = (a: string, b: string) => {
    const { sortedIndex } = this.state;
    const { submissionsByGrader } = this.props;
    if (typeof sortedIndex[this.graderHeader] !== 'undefined') {
      if (sortedIndex[this.graderHeader] === true) {
        if (a < b) return -1;
        if (a > b) return 1;
        return 0;
      } else {
        if (a < b) return 1;
        if (a > b) return -1;
        return 0;
      }
    } else {
      const assignmentName = Object.keys(sortedIndex).filter((key) => {
        return typeof sortedIndex[key] !== 'undefined';
      })[0];
      const assignmentIndex = this.props.assignments
        .map((i) => {
          return i.name;
        })
        .indexOf(assignmentName);
      if (assignmentIndex === -1) return 0;
      const assignmentID = this.props.assignments[assignmentIndex].id;
      const graderASubs = submissionsByGrader[a][assignmentID];
      const graderBSubs = submissionsByGrader[b][assignmentID];
      if (sortedIndex[assignmentName]) {
        if (!graderASubs && graderBSubs) return -1;
        if (graderASubs && !graderBSubs) return 1;
        if (!graderASubs && !graderBSubs) return 0;
        if (graderASubs.length > graderBSubs.length) return 1;
        if (graderASubs.length < graderBSubs.length) return -1;
        return 0;
      } else {
        if (!graderASubs && graderBSubs) return 1;
        if (graderASubs && !graderBSubs) return -1;
        if (!graderASubs && !graderBSubs) return 0;
        if (graderASubs.length > graderBSubs.length) return -1;
        if (graderASubs.length < graderBSubs.length) return 1;
        return 0;
      }
    }
  };

  public renderSubmissionRow(submission: SubmissionType, assignmentName: string) {
    const { openSubmission } = this.props;
    let grade = 'Not submitted';
    if (submission && submission.isFinalized) {
      grade = String(submission.grade);
    } else if (submission) {
      grade = 'Not graded';
    }

    return (
      <TableRow key={submission.id} onClick={openSubmission.bind(this.props, submission.id)}>
        <TableColumn key={`${submission.id}-assignment`}>{assignmentName}</TableColumn>
        <TableColumn key={`${submission.id}-students`}>{submission.students.toString()}</TableColumn>
        <TableColumn key={`${submission.id}-grade`}>{grade}</TableColumn>
      </TableRow>
    );
  }

  public changeSearch = (value: string) => {
    this.setState({ searchTerm: value });
  };

  public render() {
    const {
      submissionsByGrader,
      assignments,
      activeGrader,
      changeActiveGrader,
      submissionsbyUserLoadComplete,
      assignmentsLoadComplete,
    } = this.props;
    const { searchTerm, sortedIndex } = this.state;

    const headers = this.props.assignments.map((assignment: AssignmentType) => {
      return assignment.name;
    });
    headers.unshift(this.graderHeader);

    const graders = Object.keys(submissionsByGrader);
    graders.sort(this.sortFunction);

    const tableBody =
      submissionsbyUserLoadComplete && assignmentsLoadComplete ? (
        graders.map((graderEmail) => {
          if (graderEmail.toLowerCase().indexOf(searchTerm.toLowerCase()) === -1) {
            return <div />;
          }
          return (
            <TableRow key={graderEmail} onClick={changeActiveGrader.bind(this.props, graderEmail)}>
              <TableColumn key={graderEmail}>{graderEmail}</TableColumn>
              {assignments.map((assignment) => {
                const submissions = submissionsByGrader[graderEmail][assignment.id];
                const assignmentName = assignment.name;
                if (submissions) {
                  return <TableColumn key={`${graderEmail}-${assignmentName}`}>{submissions.length}</TableColumn>;
                } else {
                  return <TableColumn key={`${graderEmail}-${assignmentName}`}> - </TableColumn>;
                }
              })}
            </TableRow>
          );
        })
      ) : (
        <TableRow>
          <TableColumn>Loading...</TableColumn>
          <TableColumn />
          <TableColumn />
        </TableRow>
      );

    if (!activeGrader) {
      return (
        <div>
          <TextField
            id="search-graderData"
            label="Search"
            lineDirection="center"
            className="md-cell md-cell--bottom"
            onChange={this.changeSearch}
          />
          <DataTable plain={true}>
            <TableHeader>
              <TableRow>
                {headers.map((header) => {
                  return (
                    <TableColumn
                      sorted={sortedIndex[header]}
                      onClick={this.toggleSort.bind(this.props, header)}
                      key={header}
                    >
                      {header}
                    </TableColumn>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>{tableBody}</TableBody>
          </DataTable>
        </div>
      );
    } else {
      const tablemap: any = [];
      Object.keys(submissionsByGrader[activeGrader]).forEach((assignmentID) => {
        const submissions = submissionsByGrader[activeGrader][assignmentID];
        submissions.forEach((submission: SubmissionType) => {
          const assnName = assignments.filter((assignment) => {
            return assignment.id === parseInt(assignmentID, 10);
          })[0].name;
          tablemap.push(this.renderSubmissionRow(submission, assnName));
        });
      });
      return (
        <div>
          <hr />
          <Button
            key="Back"
            className="Btn"
            flat={true}
            icon={true}
            onClick={changeActiveGrader.bind(this.props, undefined)}
          >
            arrow_back
          </Button>
          <hr />
          <div>{activeGrader}</div>
          <hr />
          <DataTable plain={true}>
            <TableHeader>
              <TableRow>
                <TableColumn key={'Assignment'}>{'Assignment'}</TableColumn>
                <TableColumn key={'Student'}>{'Student'}</TableColumn>
                <TableColumn key={'Grade'}>{'Grade'}</TableColumn>
              </TableRow>
            </TableHeader>
            <TableBody>{tablemap}</TableBody>
          </DataTable>
        </div>
      );
    }
  }
}

export default GraderData;
