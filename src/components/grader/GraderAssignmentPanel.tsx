/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* react-md imports */
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

/* other library imports */
import * as moment from 'moment';
import Select from 'react-select';

/* codePost imports */
import { BUTTON_STATE } from '../../types/common';

import { AssignmentType } from '../../infrastructure/assignment';
import { SectionType } from '../../infrastructure/section';
import {
  AnonymousSubmissionType,
  sortSubmissions,
  SUBMISSION_SORT_TYPE,
  SubmissionType,
} from '../../infrastructure/submission';
import { getSortIndex } from '../Utils/SortUtils';

/**********************************************************************************************************************/

interface IGraderAssignmentPanelProps {
  assignment?: AssignmentType;
  sections: SectionType[];
  submissions: AnonymousSubmissionType[];
  isAnonymous: boolean;
  isLoadingSubmissions: boolean;
  claimSubmission: (
    assignment: AssignmentType,
    sections: SectionType[],
  ) => Promise<AnonymousSubmissionType | undefined>;
  releaseSubmission: (submission: SubmissionType) => Promise<AnonymousSubmissionType>;
}

interface IGraderAssignmentPanelState {
  buttonState: BUTTON_STATE;
  currentSections: SectionType[];

  ascending?: boolean;
  sortedSubmissions: AnonymousSubmissionType[];

  releasedSubmission?: AnonymousSubmissionType;
  sortedIndex: Array<boolean | undefined>;
}

class GraderAssignmentPanel extends React.Component<IGraderAssignmentPanelProps, IGraderAssignmentPanelState> {
  public state: Readonly<IGraderAssignmentPanelState> = {
    buttonState: BUTTON_STATE.Active,
    currentSections: [],

    ascending: undefined,
    sortedSubmissions: this.props.submissions,
    releasedSubmission: undefined,
    sortedIndex: [undefined, undefined, undefined, undefined],
  };

  public componentDidUpdate(prevProps: IGraderAssignmentPanelProps, prevState: IGraderAssignmentPanelState) {
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
      return elem !== undefined;
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
    return sortSubmissions(sortAttributeMap[sortAttribute], ascending, a, b);
  };

  public openGradePage = (submission: AnonymousSubmissionType) => {
    window.open(`/grade/${submission.id}`);
  };

  public getAnotherSubmission = async () => {
    const { assignment } = this.props;
    if (!assignment) {
      return;
    }

    this.setState({ buttonState: BUTTON_STATE.Loading });

    const claimedSubmission = await this.props.claimSubmission(assignment, this.state.currentSections);

    if (!claimedSubmission) {
      this.setState({ buttonState: BUTTON_STATE.Inactive });
    } else {
      this.setState({ buttonState: BUTTON_STATE.Active });
    }
  };

  public toggleReleaseDialog = (submission: SubmissionType | undefined) => {
    this.setState({ releasedSubmission: submission });
  };

  public releaseSubmission = (submission: SubmissionType) => {
    this.props.releaseSubmission(submission).then((releasedSubmission: SubmissionType) => {
      this.setState({ buttonState: BUTTON_STATE.Active, releasedSubmission: undefined });
    });
  };

  public handleSectionChange = (options: any[]) => {
    const sectionObjects = [];
    for (const option of options) {
      const match = this.props.sections.find((obj: SectionType) => {
        return obj.id === option.value;
      });
      if (match) {
        sectionObjects.push(match);
      }
    }

    // If selected sections change, we want to offer the grader another chance to claim
    // One exception is if currentSections goes from [] --> [x1, ..., xn], since if no submissions
    // are available without section filtering, none will be available with section filtering
    if (this.state.currentSections.length === 0) {
      this.setState({ currentSections: sectionObjects });
    } else {
      this.setState({ currentSections: sectionObjects, buttonState: BUTTON_STATE.Active });
    }
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

  public getAnotherSubmissionButton = (buttonState: BUTTON_STATE, handleClick: any) => {
    let claimButton;

    switch (buttonState) {
      case BUTTON_STATE.Inactive:
        claimButton = <div className="button--get-another button--get-another--disabled">Queue empty</div>;
        break;
      case BUTTON_STATE.Loading:
        claimButton = <div className="button--get-another button--get-another--disabled">...</div>;
        break;
      default:
        claimButton = (
          <div className="button--get-another " onClick={handleClick}>
            Claim +
          </div>
        );
    }

    return (
      <div className="grader__get-another">
        {claimButton}
        <SelectSection
          sections={this.props.sections}
          currentSections={this.state.currentSections}
          onChange={this.handleSectionChange}
        />
      </div>
    );
  };

  public render() {
    const { assignment, isLoadingSubmissions, isAnonymous } = this.props;
    const { sortedIndex } = this.state;

    let headers = ['Student(s)', 'Grade', 'Finalized', 'Date Edited', 'Release'];
    if (isAnonymous) {
      headers = ['ID <anonymized>', 'Grade', 'Finalized', 'Date Edited', 'Release'];
    }

    const style = {
      cursor: 'pointer',
    };

    const getAnotherSubmissionButton = this.getAnotherSubmissionButton(
      this.state.buttonState,
      this.getAnotherSubmission,
    );

    if (isLoadingSubmissions) {
      return <CircularProgress id="progress" className="progress-circle" />;
    }

    if (assignment) {
      return (
        <div>
          {getAnotherSubmissionButton}
          <DataTable className="data-table--grader" plain={true}>
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
                      {typeof submission.students !== 'undefined' && !this.props.isAnonymous
                        ? submission.students.join(', ')
                        : submission.id}
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
              {this.state.releasedSubmission && this.state.releasedSubmission.students && !this.props.isAnonymous
                ? ` (${this.state.releasedSubmission.students.join('/')})`
                : ''}
              <br />.
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
    return <div>Select an assignment on the left</div>;
  }
}

interface ISelectSectionProps {
  sections: SectionType[];
  currentSections: SectionType[];
  onChange: any;
}

export const SelectSection = (props: ISelectSectionProps) => {
  const { sections, currentSections, onChange } = props;

  const selectorItemsFormatter = (items: SectionType[]) => {
    return items.map((section, i) => ({ value: section.id, label: `${section.name}` }));
  };

  if (sections.length === 0) {
    return null;
  } else {
    return (
      <Select
        options={selectorItemsFormatter(sections)}
        value={selectorItemsFormatter(currentSections)}
        isSearchable={false}
        onChange={onChange}
        placeholder={'Filter by section (leave blank for all)'}
        className={'button--select grader__get-another__select'}
        isMulti={true}
      />
    );
  }
};

export default GraderAssignmentPanel;
