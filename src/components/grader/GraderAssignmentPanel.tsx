import * as React from 'react';
import {
  Button,
  CircularProgress,
  DataTable,
  DialogContainer,
  FontIcon,
  TableBody,
  TableColumn,
  TableHeader,
  TableRow,
} from 'react-md';
import { BUTTON_STATE } from '../../types/common';
import { GetAnotherSubmissionButton, StartGradingButton } from '../Buttons';

import { AssignmentType } from '../../infrastructure/assignment';
import { SectionType } from '../../infrastructure/section';
import { SUBMISSION_SORT_TYPE, submissionSort, SubmissionType } from '../../infrastructure/submission';
import { getSortIndex } from '../Utils/SortUtils';

import Select from 'react-select';

import * as moment from 'moment';

interface IProps {
  assignment?: AssignmentType;
  sections: SectionType[];
  submissions: SubmissionType[];
  isLoadingSubmissions: boolean;
  claimSubmission: (assignment: AssignmentType, section: SectionType | undefined) => Promise<SubmissionType>;
  releaseSubmission: (submission: SubmissionType) => Promise<SubmissionType>;
}

interface IState {
  buttonState: BUTTON_STATE;
  currentSection?: SectionType;

  ascending?: boolean;
  sortedSubmissions: SubmissionType[];

  releasedSubmission?: SubmissionType;
  sortedIndex: Array<boolean | undefined>;
}

class GraderAssignmentPanel extends React.Component<IProps, IState> {
  public constructor(props: any) {
    super(props);
    this.state = {
      buttonState: BUTTON_STATE.Active,
      currentSection: undefined,

      ascending: undefined,
      sortedSubmissions: this.props.submissions,
      releasedSubmission: undefined,
      sortedIndex: [undefined, undefined, undefined, undefined],
    };
  }

  public componentDidUpdate(prevProps: IProps, prevState: IState) {
    // if submissions change, re-sort
    if (this.props.submissions !== prevProps.submissions) {
      // make a copy
      const sortedSubmissions = JSON.parse(JSON.stringify(this.props.submissions));
      // sort by sortedIndex
      sortedSubmissions.sort(this.sort.bind(this));
      // update state
      this.setState({ sortedSubmissions });
    }
  }

  public sort = (a: SubmissionType, b: SubmissionType) => {
    const { sortedIndex } = this.state;

    const sortAttribute = sortedIndex.findIndex((elem) => {
      return typeof elem !== 'undefined';
    });

    if (sortAttribute === -1) {
      return 0;
    }

    const ascending = sortedIndex[sortAttribute] ? true : false;

    const sortAttributeMap = {
      0: SUBMISSION_SORT_TYPE.students,
      1: SUBMISSION_SORT_TYPE.grade,
      2: SUBMISSION_SORT_TYPE.isFinalized,
      3: SUBMISSION_SORT_TYPE.dateEdited,
    };
    return submissionSort(sortAttributeMap[sortAttribute], ascending, a, b);
  };

  public openGradePage = (submission: SubmissionType) => {
    window.open(`/grade/${submission.id}`);
    // window.open("/grade/" + subid, 'test',
    // 'width=' + screen.availWidth * 0.9 + ',
    // height=' + screen.availHeight * 0.9).resizeTo(screen.availWidth, screen.availHeight);
  };

  public getAnotherSubmission = () => {
    const { assignment } = this.props;
    if (!assignment) {
      return;
    }

    this.setState({ buttonState: BUTTON_STATE.Loading });
    this.props.claimSubmission(assignment, this.state.currentSection).then((claimedSubmission: SubmissionType) => {
      // undefined if no more submissions
      if (!claimedSubmission) {
        this.setState({ buttonState: BUTTON_STATE.Inactive });
      } else {
        this.setState({ buttonState: BUTTON_STATE.Active });
      }
    });
  };

  public toggleReleaseDialog = (submission: SubmissionType | undefined) => {
    this.setState({ releasedSubmission: submission });
  };

  public releaseSubmission = (submission: SubmissionType) => {
    this.props.releaseSubmission(submission).then((releasedSubmission: SubmissionType) => {
      this.setState({ buttonState: BUTTON_STATE.Active, releasedSubmission: undefined });
    });
  };

  public handleSectionChange = (option: any) => {
    const currentSection = this.props.sections.find((obj: SectionType) => {
      return obj.id === option.value;
    });

    this.setState({ currentSection });
  };

  public toggleSort = (columnIndex: number) => {
    const { sortedIndex } = this.state;
    const newSortedIndex = getSortIndex(sortedIndex, columnIndex);
    this.setState({ sortedIndex: newSortedIndex }, () => {
      const { sortedSubmissions } = this.state;
      sortedSubmissions.sort(this.sort.bind(this));
      this.setState({ sortedSubmissions });
    });
  };

  public render() {
    const { assignment, sections, submissions, isLoadingSubmissions } = this.props;
    const { buttonState, sortedIndex } = this.state;

    const headers = ['Student(s)', 'Grade', 'Finalized', 'Date Edited', 'Release'];

    const style = {
      cursor: 'pointer',
    };

    if (isLoadingSubmissions) {
      return <CircularProgress id="progress" className="progress-circle" />;
    }

    if (assignment && submissions.length > 0) {
      return (
        <div>
          <GetAnotherSubmissionButton handleClick={this.getAnotherSubmission} buttonState={buttonState}>
            <SelectSection
              sections={sections}
              currentSection={this.state.currentSection}
              onChange={this.handleSectionChange}
            />
          </GetAnotherSubmissionButton>
          <DataTable className="DataTable--Grader" plain={true}>
            <TableHeader>
              <TableRow>
                {headers.map((header, index) => {
                  return (
                    <TableColumn
                      key={header}
                      sorted={sortedIndex[index]}
                      onClick={this.toggleSort.bind(this.props, index)}
                    >
                      {header}
                    </TableColumn>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {this.state.sortedSubmissions.map((submission) => {
                return (
                  <TableRow key={submission.id} style={style}>
                    {/****** consider making each column its own component to prevent binds */}
                    <TableColumn onClick={this.openGradePage.bind(this, submission)}>
                      {submission.students.join(',')}
                    </TableColumn>
                    <TableColumn onClick={this.openGradePage.bind(this, submission)}>{submission.grade}</TableColumn>
                    <TableColumn onClick={this.openGradePage.bind(this, submission)}>
                      {submission.isFinalized ? <FontIcon>done</FontIcon> : null}
                    </TableColumn>
                    <TableColumn onClick={this.openGradePage.bind(this, submission)}>
                      {moment(submission.dateEdited).format('llll')}
                    </TableColumn>
                    <TableColumn onClick={this.toggleReleaseDialog.bind(this, submission)}>
                      <Button key={`button--release-${submission.id}`} className="button--release" icon={true}>
                        remove_circle
                      </Button>
                    </TableColumn>
                  </TableRow>
                );
              })}
            </TableBody>
          </DataTable>
          <DialogContainer
            id="release-dialog"
            visible={this.state.releasedSubmission !== undefined}
            onHide={this.toggleReleaseDialog.bind(this, undefined)}
            title="Are you sure?"
          >
            <div>
              Are you sure that you want to release this submission?
              {this.state.releasedSubmission ? ` (${this.state.releasedSubmission.students.join('/')})` : ''}.
            </div>
            <Button onClick={this.toggleReleaseDialog.bind(this.props, undefined)} primary={false} flat={true}>
              Cancel
            </Button>
            <Button
              onClick={this.releaseSubmission.bind(this, this.state.releasedSubmission)}
              primary={true}
              flat={true}
            >
              Confirm
            </Button>
          </DialogContainer>
        </div>
      );
    }
    if (assignment) {
      return (
        <div>
          <StartGradingButton handleClick={this.getAnotherSubmission} buttonState={buttonState}>
            <SelectSection
              sections={sections}
              currentSection={this.state.currentSection}
              onChange={this.handleSectionChange}
            />
          </StartGradingButton>
        </div>
      );
    }
    return <div>Select an assignment on the left</div>;
  }
}

interface ISelectSectionProps {
  sections: SectionType[];
  currentSection?: SectionType;
  onChange: any;
}

export const SelectSection = (props: ISelectSectionProps) => {
  const { sections, currentSection, onChange } = props;

  const selectorItemsFormatter = (items: SectionType[]) => {
    return items.map((section, i) => ({ value: section.id, label: `${section.name}` }));
  };

  const selectorCurrentFormatter = (currentItem: SectionType | undefined) => {
    if (!currentItem) {
      return undefined;
    }
    return { value: currentItem.id, label: `${currentItem.name}` };
  };
  return (
    <Select
      options={selectorItemsFormatter(sections)}
      value={selectorCurrentFormatter(currentSection)}
      isSearchable={false}
      onChange={onChange}
      placeholder={'All'}
      className={'button--select'}
    />
  );
};

export default GraderAssignmentPanel;
