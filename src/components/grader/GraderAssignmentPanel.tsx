import * as React from 'react';
import { Button, DataTable, FontIcon, TableBody, TableColumn, TableHeader, TableRow } from 'react-md';
import { BUTTON_STATE } from '../../types/common';
import { GetAnotherSubmissionButton, StartGradingButton } from '../Buttons';

import { AssignmentType } from '../../infrastructure/assignment';
import { SectionType } from '../../infrastructure/section';
import { SubmissionType } from '../../infrastructure/submission';

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
}

class GraderAssignmentPanel extends React.Component<IProps, {}> {
  public state: Readonly<IState> = {
    buttonState: BUTTON_STATE.Active,
    currentSection: undefined,

    ascending: undefined,
    sortedSubmissions: this.props.submissions,
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

  public releaseSubmission = (submission: SubmissionType) => {
    this.props.releaseSubmission(submission).then((releasedSubmission: SubmissionType) => {
      this.setState({ buttonState: BUTTON_STATE.Active });
    });
  };

  public handleSectionChange = (option: any) => {
    const currentSection = this.props.sections.find((obj: SectionType) => {
      return obj.id === option.value;
    });

    this.setState({ currentSection });
  };

  public sortSubmissions = () => {
    if (!this.state.ascending) {
      const ascending = true;
      const sortedSubmissions = this.state.sortedSubmissions.sort((a, b) => {
        return a.isFinalized === b.isFinalized ? 0 : a.isFinalized ? -1 : 1;
      });
      this.setState({ ascending, sortedSubmissions });
    } else {
      const ascending = !this.state.ascending;
      const sortedSubmissions = this.state.sortedSubmissions.slice();
      sortedSubmissions.reverse();
      this.setState({ ascending, sortedSubmissions });
    }
  };

  public render() {
    const { assignment, sections, submissions, isLoadingSubmissions } = this.props;
    const { buttonState } = this.state;

    const headers = ['Student(s)', 'Grade', 'Last Edited', 'Finalized', 'Release'];

    const style = {
      cursor: 'pointer',
    };

    if (isLoadingSubmissions) {
      return <div>Loading..</div>;
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
                {headers.map((header) => {
                  if (header === 'Finalized') {
                    return (
                      <TableColumn key={header} sorted={this.state.ascending} onClick={this.sortSubmissions}>
                        {header}
                      </TableColumn>
                    );
                  } else {
                    return <TableColumn key={header}>{header}</TableColumn>;
                  }
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
                      {moment(submission.dateEdited).format('llll')}
                    </TableColumn>
                    <TableColumn onClick={this.openGradePage.bind(this, submission)}>
                      {submission.isFinalized ? <FontIcon>done</FontIcon> : null}
                    </TableColumn>
                    <TableColumn onClick={this.releaseSubmission.bind(this, submission)}>
                      <Button key={`button--release-${submission.id}`} className="button--release" icon={true}>
                        remove_circle
                      </Button>
                    </TableColumn>
                  </TableRow>
                );
              })}
            </TableBody>
          </DataTable>
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
