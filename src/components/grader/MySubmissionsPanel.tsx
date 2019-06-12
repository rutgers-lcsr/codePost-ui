/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* ant imports */
import { Icon, Popconfirm, Select, Switch, Table } from 'antd';
const { Option } = Select;

/* codePost imports */

import { BUTTON_STATE } from '../../types/common';
import CPButton from '../core/CPButton';

import { formatSub, ISubDataBasic, openSubmissionRow } from './GraderUtils';

import { AssignmentType } from '../../infrastructure/assignment';
import { SectionType } from '../../infrastructure/section';
import { AnonymousSubmissionType, SubmissionType } from '../../infrastructure/submission';
import { compare } from '../Utils/SortUtils';

type alignType = 'left' | 'right' | 'center';

/**********************************************************************************************************************/

interface IGraderAssignmentPanelProps {
  assignment: AssignmentType;
  canViewSubmissionInfo: boolean;
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

interface ITableRow extends ISubDataBasic {
  key: number;
  student: string | number;
  releaseIcon?: React.ReactElement;
}

interface IGraderAssignmentPanelState {
  buttonState: BUTTON_STATE;
  currentSections: SectionType[];
  ascending?: boolean;
  showStudentEmails: boolean;
}

class MySubmissionsPanel extends React.Component<IGraderAssignmentPanelProps, IGraderAssignmentPanelState> {
  public state: Readonly<IGraderAssignmentPanelState> = {
    buttonState: BUTTON_STATE.Active,
    currentSections: [],
    ascending: undefined,
    showStudentEmails: false,
  };

  public openGradePage = (submission: AnonymousSubmissionType) => {
    window.open(`/grade/${submission.id}`);
  };

  public getAnotherSubmission = async () => {
    const { assignment } = this.props;

    this.setState({ buttonState: BUTTON_STATE.Loading });

    const claimedSubmission = await this.props.claimSubmission(assignment, this.state.currentSections);

    if (!claimedSubmission) {
      this.setState({ buttonState: BUTTON_STATE.Inactive });
    } else {
      this.setState({ buttonState: BUTTON_STATE.Active });
    }
  };
  public handleSelect = (sectionID: string) => {
    const match = this.props.sections.find((obj: SectionType) => {
      return obj.id === Number(sectionID);
    });
    if (match) {
      // If selected sections change, we want to offer the grader another chance to claim
      // One exception is if currentSections goes from [] --> [x1, ..., xn], since if no submissions
      // are available without section filtering, none will be available with section filtering
      if (this.state.currentSections.length === 0) {
        this.setState({ currentSections: [match] });
      } else {
        this.setState({ currentSections: [...this.state.currentSections, match], buttonState: BUTTON_STATE.Active });
      }
    }
  };

  public handleDeselect = (sectionID: string) => {
    const newSections = this.state.currentSections.filter((obj) => {
      return obj.id !== Number(sectionID);
    });
    this.setState({ currentSections: newSections, buttonState: BUTTON_STATE.Active });
  };

  public getAnotherSubmissionButton = (buttonState: BUTTON_STATE, handleClick: any) => {
    let claimButton;

    switch (buttonState) {
      case BUTTON_STATE.Inactive:
        claimButton = (
          <CPButton cpType="disabled" key={2} icon="inbox">
            Queue empty
          </CPButton>
        );
        break;
      case BUTTON_STATE.Loading:
        claimButton = (
          <CPButton cpType="primary" key={2} loading={true}>
            Claim
          </CPButton>
        );
        break;
      default:
        claimButton = (
          <CPButton cpType="primary" key={2} icon="plus-circle" onClick={handleClick}>
            Claim
          </CPButton>
        );
    }

    return (
      <div className="grader__get-another" style={{ display: 'inline-block' }}>
        {claimButton}
        <SelectSection
          sections={this.props.sections}
          currentSections={this.state.currentSections}
          onSelect={this.handleSelect}
          onDeselect={this.handleDeselect}
        />
      </div>
    );
  };

  public toggleShowStudentEmails = () => {
    this.setState({
      showStudentEmails: !this.state.showStudentEmails,
    });
  };

  public releaseSubmission = (sub: SubmissionType) => {
    this.props.releaseSubmission(sub).then(() => {
      this.setState({ buttonState: BUTTON_STATE.Active });
    });
  };

  public render() {
    const { isLoadingSubmissions } = this.props;

    const getAnotherSubmissionButton = this.getAnotherSubmissionButton(
      this.state.buttonState,
      this.getAnotherSubmission,
    );

    // If we're in anonymous grading mode, add a toggle to reveal student emails
    let anonymousToggle;
    if (this.props.isAnonymous && this.props.canViewSubmissionInfo) {
      anonymousToggle = (
        <div style={{ display: 'inline-block', padding: '0px 20px' }}>
          Reveal students:
          <Switch
            defaultChecked={this.state.showStudentEmails}
            onChange={this.toggleShowStudentEmails}
            key="toggleShowStudents"
            style={{ display: 'inline-block' }}
          />
        </div>
      );
    }

    const centerAlign: alignType = 'center';
    const columns = [
      {
        title: 'Student',
        dataIndex: 'student',
        sorter: (a: ITableRow, b: ITableRow) => compare(true, a.student, b.student),
        onCell: openSubmissionRow,
      },
      {
        title: 'Grade',
        dataIndex: 'grade',
        sorter: (a: ITableRow, b: ITableRow) => {
          return compare(true, a.grade, b.grade);
        },
        align: centerAlign,
        onCell: openSubmissionRow,
      },
      {
        title: 'Finalized',
        dataIndex: 'finalizeIcon',
        sorter: (a: ITableRow, b: ITableRow) => compare(true, a.isFinalized, b.isFinalized),
        align: centerAlign,
        onCell: openSubmissionRow,
      },
      {
        title: 'Last Edited',
        dataIndex: 'dateEditedString',
        sorter: (a: ITableRow, b: ITableRow) => compare(true, a.dateEdited, b.dateEdited),
        align: centerAlign,
        onCell: openSubmissionRow,
      },
      {
        title: 'Released',
        dataIndex: 'releaseIcon',
        sorter: (a: ITableRow, b: ITableRow) => compare(true, a.releaseIcon, b.releaseIcon),
        align: centerAlign,
      },
    ];

    const showingEmails = !this.props.isAnonymous || this.state.showStudentEmails;

    const data = this.props.submissions.map((sub) => {
      const students = showingEmails && sub.students ? sub.students.join(', ') : sub.id;
      return {
        ...formatSub(sub),
        key: sub.id,
        student: students,
        releaseIcon: (
          <div>
            <Popconfirm
              title="Are you sure you want to release this submission??"
              onConfirm={this.releaseSubmission.bind(this, sub)}
              okText="Yes"
              cancelText="No"
            >
              <Icon type="minus-circle" theme="twoTone" twoToneColor="#eb2f96" />
            </Popconfirm>
          </div>
        ),
      };
    });

    return (
      <div>
        {getAnotherSubmissionButton}
        {anonymousToggle}
        <Table columns={columns} dataSource={data} pagination={false} loading={isLoadingSubmissions} />
      </div>
    );
  }
}

interface ISelectSectionProps {
  sections: SectionType[];
  currentSections: SectionType[];
  onSelect: any;
  onDeselect: any;
}

export const SelectSection = (props: ISelectSectionProps) => {
  const { sections, onSelect, onDeselect } = props;

  const selectorItemsFormatter = (items: SectionType[]) => {
    return items.map((section, i) => <Option key={section.id}>{section.name}</Option>);
  };

  if (sections.length === 0) {
    return null;
  } else {
    return (
      <Select
        placeholder="(Optional) Filter by section..."
        mode="multiple"
        onSelect={onSelect}
        onDeselect={onDeselect}
        style={{ width: 500, marginBottom: 20, marginLeft: 10 }}
      >
        {selectorItemsFormatter(sections)}
      </Select>
    );
  }
};

export default MySubmissionsPanel;
