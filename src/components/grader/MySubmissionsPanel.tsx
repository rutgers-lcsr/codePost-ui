/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* antd imports */
import { Button, Divider, Dropdown, Empty, Icon, Menu, Popconfirm, Select, Switch, Table } from 'antd';
const { Option } = Select;

/* codePost imports */
import CPAdminDetail from '../admin/other/CPAdminDetail';

import { BUTTON_STATE } from '../../types/common';
import CPButton from '../core/CPButton';

import { formatSub, ISubDataBasic } from './GraderUtils';

import { Assignment, AssignmentType } from '../../infrastructure/assignment';
import { CourseType } from '../../infrastructure/course';
import { Section, SectionType } from '../../infrastructure/section';
import { AnonymousSubmissionType, Submission, SubmissionType } from '../../infrastructure/submission';
import { compare } from '../utils/SortUtils';

import { loadIDList } from '../../infrastructure/generics';

type alignType = 'left' | 'right' | 'center';

/**********************************************************************************************************************/

/* for type checking functions that operate on table rows */
interface ITableRow extends ISubDataBasic {
  key: number;
  student: string | number;
  releaseIcon?: React.ReactElement;
}

enum FILTER_TYPE {
  NONE,
  BY_SECTION,
}

interface IProps {
  assignment: AssignmentType;
  course: CourseType;
  graderEmail: string;
  isAnonymous: boolean;
}

interface IState {
  /* data */
  currentSections: SectionType[];
  sections: SectionType[];
  submissions: AnonymousSubmissionType[];

  /* UI control */
  buttonState: BUTTON_STATE;
  isLoadingSubmissions: boolean;
  filterType: FILTER_TYPE;

  /* Anonymous grading control */
  canViewSubmissionInfo: boolean;
  showStudentEmails: boolean;
}

class MySubmissionsPanel extends React.Component<IProps, IState> {
  public constructor(props: IProps) {
    super(props);
    this.state = {
      currentSections: [],
      sections: [],
      submissions: [],

      buttonState: BUTTON_STATE.Active,
      isLoadingSubmissions: true,
      filterType: FILTER_TYPE.NONE,

      showStudentEmails: false,
      canViewSubmissionInfo: false,
    };
  }

  /***********************************************************************************
  /* Lifecycle methods
  /**********************************************************************************/

  public componentDidMount() {
    this.changeAssignment(this.props.assignment);
  }

  public componentDidUpdate(oldProps: IProps) {
    if (oldProps.assignment !== this.props.assignment) {
      this.changeAssignment(this.props.assignment);
    }
  }

  public changeAssignment = (newAssignment: AssignmentType) => {
    this.setState({ isLoadingSubmissions: true }, () => {
      this.loadSubmissions(newAssignment, this.props.graderEmail).then((submissions) => {
        this.setState({
          submissions,
          canViewSubmissionInfo: submissions.length > 0 ? typeof submissions[0].students !== 'undefined' : false,
          isLoadingSubmissions: false,
        });
      });

      this.loadSections(this.props.course).then((sections) => {
        this.setState({ sections });
      });
    });
  };

  /***********************************************************************************
  /* API operations methods
  /**********************************************************************************/

  public loadSections = (course: CourseType) => {
    return loadIDList(course.sections, Section);
  };

  public loadSubmissions = (currentAssignment: AssignmentType, user: string) => {
    return Assignment.readSubmissionsAnonymous(currentAssignment.id, {
      grader: user,
    });
  };

  public fetchSubmission = async (
    assignment: AssignmentType,
    section?: SectionType,
  ): Promise<SubmissionType | undefined> => {
    const params = section ? `?section=${section.name}` : '';
    return await fetch(`${process.env.REACT_APP_API_URL}/assignments/${assignment.id}/drawUnassigned/${params}`, {
      headers: {
        Authorization: `JWT ${localStorage.getItem('token')}`,
      },
    })
      .then((res) => {
        if (res.status === 204) {
          return undefined;
        }
        return res.json();
      })
      .then((json) => {
        return json;
      });
  };

  public claimSubmission = async (
    assignment: AssignmentType,
    sections: SectionType[],
  ): Promise<SubmissionType | undefined> => {
    let submission;
    const sectionParameters = this.getSectionParameters(sections);

    // Note that calling fetchSubmission with section=undefined performs
    // the fetchSubmission operation without a section filter
    for (const section of sectionParameters) {
      submission = await this.fetchSubmission(assignment, section);
      if (submission) {
        break;
      }
    }

    if (submission) {
      this.setState({
        submissions: [...this.state.submissions, submission],
      });
    }

    return submission;
  };

  public releaseSubmission = async (submission: SubmissionType): Promise<SubmissionType> => {
    const payload = {
      id: submission.id,
      grader: '',
      isFinalized: false,
    };

    const releasedSubmission = await Submission.update(payload);

    this.setState({
      submissions: this.state.submissions.filter((sub) => {
        return sub.id !== releasedSubmission.id;
      }),
    });

    return releasedSubmission;
  };

  public getAnotherSubmission = async () => {
    const { assignment } = this.props;

    this.setState({ buttonState: BUTTON_STATE.Loading });
    const claimedSubmission = await this.claimSubmission(assignment, this.state.currentSections);
    if (!claimedSubmission) {
      this.setState({ buttonState: BUTTON_STATE.Inactive });
    } else {
      this.setState({ buttonState: BUTTON_STATE.Active });
    }
  };

  /***********************************************************************************
  /* Utility functions
  /**********************************************************************************/

  public openGradePage = (submission: AnonymousSubmissionType) => {
    window.open(`/grade/${submission.id}`);
  };

  public getSectionParameters = (sections: SectionType[]) => {
    return sections.length === 0 ? [undefined] : sections;
  };

  public handleSelect = (sectionID: string) => {
    const match = this.state.sections.find((obj: SectionType) => {
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

  public setFilterType = (filterType: FILTER_TYPE) => {
    this.setState({ filterType, currentSections: [] });
  };

  public getAnotherSubmissionButton = (buttonState: BUTTON_STATE, handleClick: () => void) => {
    /* build claim button based on state of submission queue */
    let claimButton;
    let refreshButton;
    switch (buttonState) {
      case BUTTON_STATE.Active:
        claimButton = (
          <CPButton cpType="primary" key={2} icon="plus-circle" onClick={handleClick}>
            Claim
          </CPButton>
        );
        break;
      case BUTTON_STATE.Inactive:
        claimButton = (
          <CPButton cpType="disabled" key={2} icon="inbox">
            Queue empty
          </CPButton>
        );
        const refreshFunction = () => this.setState({ buttonState: BUTTON_STATE.Active });
        refreshButton = (
          <Button icon="redo" onClick={refreshFunction}>
            Refresh
          </Button>
        );
        break;
      case BUTTON_STATE.Loading:
        claimButton = (
          <CPButton cpType="primary" key={2} loading={true}>
            Claim
          </CPButton>
        );
        break;
    }

    /* build filter component */
    let filterComponent;
    switch (this.state.filterType) {
      case FILTER_TYPE.NONE:
        const filterMenu = (
          <Menu>
            <Menu.Item onClick={this.setFilterType.bind(this, FILTER_TYPE.BY_SECTION)} key="by-section">
              By section
            </Menu.Item>
          </Menu>
        );
        filterComponent = (
          <Dropdown overlay={filterMenu} trigger={['click']}>
            <Button icon="filter">Filter</Button>
          </Dropdown>
        );
        break;
      case FILTER_TYPE.BY_SECTION:
        filterComponent = (
          <div style={{ display: 'inline-block' }}>
            <SelectSection
              sections={this.state.sections}
              currentSections={this.state.currentSections}
              onSelect={this.handleSelect}
              onDeselect={this.handleDeselect}
              disabled={this.state.isLoadingSubmissions}
            />
            &nbsp;
            <Icon type="close-circle" onClick={this.setFilterType.bind(this, FILTER_TYPE.NONE)} />
          </div>
        );
        break;
    }

    return (
      <div>
        {claimButton} &nbsp; {refreshButton} &nbsp; {filterComponent}
      </div>
    );
  };

  public toggleShowStudentEmails = () => {
    this.setState({
      showStudentEmails: !this.state.showStudentEmails,
    });
  };

  public onSubmissionRelease = (sub: SubmissionType) => {
    this.releaseSubmission(sub).then(() => {
      this.setState({ buttonState: BUTTON_STATE.Active });
    });
  };

  /***********************************************************************************
  /* Utility functions
  /**********************************************************************************/

  public render() {
    let content;
    let actions: any[];
    const getAnotherSubmissionButton = this.getAnotherSubmissionButton(
      this.state.buttonState,
      this.getAnotherSubmission,
    );
    if (this.state.submissions.length > 0 || this.state.isLoadingSubmissions) {
      // If we're in anonymous grading mode, add a toggle to reveal student emails
      let anonymousToggle;
      if (this.props.isAnonymous && this.state.canViewSubmissionInfo) {
        anonymousToggle = (
          <div>
            <div style={{ display: 'inline-block' }}>
              Reveal students: &nbsp;
              <Switch
                defaultChecked={this.state.showStudentEmails}
                onChange={this.toggleShowStudentEmails}
                key="toggleShowStudents"
                style={{ display: 'inline-block' }}
              />
            </div>
            <Divider type="vertical" style={{ height: 25 }} />
          </div>
        );
      }

      const centerAlign: alignType = 'center';
      const columns = [
        {
          title: 'Open',
          dataIndex: 'open',
          align: centerAlign,
        },
        {
          title: 'Student',
          dataIndex: 'student',
          sorter: (a: ITableRow, b: ITableRow) => compare(true, a.student, b.student),
        },
        {
          title: 'Grade',
          dataIndex: 'grade',
          sorter: (a: ITableRow, b: ITableRow) => {
            return a.gradeToSort - b.gradeToSort;
          },
          align: centerAlign,
        },
        {
          title: 'Status',
          dataIndex: 'status',
          align: centerAlign,
        },
        {
          title: 'Last Edited',
          dataIndex: 'lastEdited',
          align: centerAlign,
        },
        {
          title: 'Release',
          dataIndex: 'release',
          align: centerAlign,
        },
      ];

      const showingEmails = !this.props.isAnonymous || this.state.showStudentEmails;

      const data = this.state.submissions.map((sub) => {
        const students = showingEmails && sub.students ? sub.students.join(', ') : sub.id;
        return {
          ...formatSub(sub, this.props.assignment),
          open: <Icon type="code" onClick={this.openGradePage.bind(this, sub)} />,
          key: sub.id,
          student: students,
          release: (
            <div>
              <Popconfirm
                title="Are you sure you want to release this submission?"
                onConfirm={this.releaseSubmission.bind(this, sub)}
                okText="Release"
                cancelText="Cancel"
                placement="left"
              >
                <Icon type="minus-circle" theme="twoTone" twoToneColor="#eb2f96" />
              </Popconfirm>
            </div>
          ),
        };
      });

      actions = [anonymousToggle, getAnotherSubmissionButton];
      content = (
        <Table columns={columns} dataSource={data} pagination={false} loading={this.state.isLoadingSubmissions} />
      );
    } else {
      actions = [];
      content = (
        <Empty
          imageStyle={{
            height: 60,
          }}
          description="No submissions yet. Click claim to start grading!"
        >
          {getAnotherSubmissionButton}
        </Empty>
      );
    }

    return (
      <CPAdminDetail
        goBack={null}
        title={`My submissions: ${this.props.assignment.name}`}
        actions={actions}
        content={content}
        gutterSize={0}
      />
    );
  }
}

interface ISelectSectionProps {
  sections: SectionType[];
  currentSections: SectionType[];
  onSelect: any;
  onDeselect: any;
  disabled: boolean;
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
        placeholder="Filter by section"
        mode="multiple"
        onSelect={onSelect}
        onDeselect={onDeselect}
        style={{ width: 250 }}
        disabled={props.disabled}
      >
        {selectorItemsFormatter(sections)}
      </Select>
    );
  }
};

export default MySubmissionsPanel;
