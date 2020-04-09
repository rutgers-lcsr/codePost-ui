/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* ant imports */
import { Button, Breadcrumb, Divider, Icon, Select, Spin, Switch, Tabs } from 'antd';

/* codePost imports */
import { Assignment, AssignmentType } from '../../infrastructure/assignment';
import { CourseType } from '../../infrastructure/course';
import { SectionType } from '../../infrastructure/section';
import { Submission, SubmissionType } from '../../infrastructure/submission';

import { tooltips } from '../core/tooltips';

import { compare } from '../utils/SortUtils';

import CPAdminDetail from '../admin/other/CPAdminDetail';

import { TestingSummary } from '../admin/assignments/tests/results/TestingSummary';
import SectionSubmissionsTable from './SectionSubmissionsTable';

const { Option } = Select;

type alignType = 'left' | 'right' | 'center';

/**********************************************************************************************************************/

interface IProps {
  course: CourseType;
  assignment: AssignmentType;
  sections: SectionType[];
  breadcrumbs: React.ReactElement[];
  email: string;
}

interface IState {
  /* data */
  activeSection: SectionType;
  submissionsBySection: {
    [sectionID: number]: { [student: string]: SubmissionType | null };
  };
  // Map: key = id, value = array of student emails who have viewed the submission
  viewsBySubmission: { [submissionID: number]: { [student: string]: string } };

  /* UI control */
  isLoading: boolean;

  /* Anonymous grading contorl */
  showStudentEmails: boolean;

  selectedSubmissions: number[];
}

class SectionDetailPanel extends React.Component<IProps, IState> {
  /***********************************************************************************
  /* Lifecycle methods
  /**********************************************************************************/
  public constructor(props: IProps) {
    super(props);
    this.state = {
      submissionsBySection: {},
      activeSection: this.props.sections[0],
      viewsBySubmission: {},
      showStudentEmails: false,
      isLoading: false,
      selectedSubmissions: [],
    };
  }

  public async initialLoad() {
    this.setState({ isLoading: true });
    const submissionsBySection = await this.loadSubmissionsForSection();
    this.setState({ submissionsBySection, isLoading: false });
    if (this.props.sections.length === 1) {
      this.handleSelect(String(this.props.sections[0].id));
    }
  }

  public componentDidMount() {
    this.initialLoad();
  }

  public componentDidUpdate(oldProps: IProps) {
    if (oldProps.assignment !== this.props.assignment) {
      this.initialLoad();
    }
  }

  public toggleShowStudentEmails = () => {
    this.setState({
      showStudentEmails: !this.state.showStudentEmails,
    });
  };

  /***********************************************************************************
  /* Loading methods
  /**********************************************************************************/

  // load all the sections (in order to get the name and students), and for each
  // student, load that student's submissions for the active assignment
  public loadSubmissionsForSection = async () => {
    const submissionMap: any = {};
    for (const section of this.props.sections) {
      const mapValue: any = {};
      for (const student of section.students) {
        /* eslint-disable no-useless-computed-key */
        mapValue[student] = await Assignment.readSubmissions(this.props.assignment.id, {
          student,
          ['compact']: '1',
        }).then((submissions) => {
          if (submissions.length === 0) {
            return null;
          } else {
            return submissions[0];
          }
        });
        /* eslint-enable no-useless-computed-key */
      }

      submissionMap[section.id] = mapValue;
    }

    return submissionMap;
  };

  public claimSubmissions = async () => {
    const promises = this.state.selectedSubmissions.map((id) => {
      return Submission.update({ id: id, isFinalized: false, grader: this.props.email });
    });

    const submissions = await Promise.all(promises);

    this.setState((prevState) => {
      const newSubmissions = { ...prevState.submissionsBySection };
      // Map each student to the new submission
      // We need to go through all sections because of partner submissions
      const sections = Object.keys(newSubmissions);
      submissions.map((sub) => {
        sub.students.forEach((student) => {
          for (const section of sections) {
            const sectionID = parseInt(section, 10);
            if (student in newSubmissions[sectionID]) {
              newSubmissions[sectionID][student] = sub;
              break;
            }
          }
        });
        return null;
      });
      return {
        submissionsBySection: newSubmissions,
        selectedSubmissions: [],
      };
    });
  };

  /***********************************************************************************
  /* Utility functions
  /**********************************************************************************/

  public handleSelect = (sectionID: string) => {
    const activeSection = this.props.sections.find((section) => {
      return section.id === Number(sectionID);
    });

    if (activeSection) {
      this.setState({ activeSection, selectedSubmissions: [] });
    }
  };

  public openGradePage = (submission: SubmissionType) => {
    window.open(`/code/${submission.id}`);
  };

  public onRowSelect = (selectedRowKeys: any[]) => {
    this.setState({ selectedSubmissions: selectedRowKeys });
  };

  /***********************************************************************************
  /* Render
  /**********************************************************************************/

  public render() {
    const { activeSection, isLoading } = this.state;
    const showingEmails = !this.props.assignment.anonymousGrading || this.state.showStudentEmails;

    if (this.props.sections.length === 0) {
      // Sections haven't been loaded yet
      return <Spin indicator={<Icon type="loading" style={{ fontSize: 24 }} spin />} />;
    }

    let selectContent;
    if (this.props.sections.length > 1) {
      const menuItems = this.props.sections.map((section) => {
        return <Option key={section.id}>{section.name} </Option>;
      });
      selectContent = (
        <div>
          <Select
            placeholder="Select section"
            onSelect={this.handleSelect}
            value={this.state.activeSection ? this.state.activeSection.name : undefined}
            loading={this.state.isLoading}
            style={{ width: 200 }}
          >
            {menuItems}
          </Select>
        </div>
      );
    }

    if (this.props.sections.length !== 1 && !activeSection) {
      return <div>{selectContent}</div>;
    }

    // If we're in anonymous grading mode, add a toggle to reveal student emails
    let anonymousToggle;
    if (this.props.assignment.anonymousGrading) {
      anonymousToggle = (
        <div>
          <div style={{ display: 'inline-block' }}>
            Reveal students: &nbsp;
            <Switch
              defaultChecked={showingEmails}
              onChange={this.toggleShowStudentEmails}
              key="toggleShowStudents"
              style={{ display: 'inline-block' }}
            />
          </div>
          <Divider type="vertical" style={{ height: 25 }} />
        </div>
      );
    }

    const claimButton = (
      <Button type="primary" disabled={this.state.selectedSubmissions.length === 0} onClick={this.claimSubmissions}>
        Claim Selected
      </Button>
    );

    const submissionsTable = (
      <SectionSubmissionsTable
        isLoading={this.state.isLoading}
        submissions={this.state.submissionsBySection[this.state.activeSection.id]}
        selectedSubmissions={this.state.selectedSubmissions}
        onRowSelect={this.onRowSelect}
        showEmails={showingEmails}
        assignment={this.props.assignment}
        viewsBySubmission={this.state.viewsBySubmission}
      />
    );

    if (this.state.submissionsBySection[this.state.activeSection.id]) {
      console.log(Object.values(this.state.submissionsBySection[this.state.activeSection.id]));
    }

    const submissions: (SubmissionType | null)[] = this.state.submissionsBySection[this.state.activeSection.id]
      ? Object.values(this.state.submissionsBySection[this.state.activeSection.id])
      : [];
    const filteredSubmissions: SubmissionType[] = submissions.filter((s): s is SubmissionType => s !== null);

    let content;
    if (!this.props.assignment.environment) {
      content = submissionsTable;
    } else {
      content = (
        <Tabs defaultActiveKey="1">
          <Tabs.TabPane tab="Overview" key="1">
            {submissionsTable}
          </Tabs.TabPane>
          <Tabs.TabPane tab="Test results" key="2">
            <TestingSummary
              currentAssignment={this.props.assignment}
              submissions={filteredSubmissions}
              isAdmin={false}
            />
          </Tabs.TabPane>
        </Tabs>
      );
    }

    return (
      <CPAdminDetail
        goBack={null}
        breadcrumbs={
          <Breadcrumb>
            {this.props.breadcrumbs}
            <Breadcrumb.Item>{this.props.assignment.name}</Breadcrumb.Item>
          </Breadcrumb>
        }
        title={`Section: ${this.state.activeSection.name}`}
        actions={[anonymousToggle, selectContent, claimButton]}
        content={content}
        gutterSize={0}
        titleInfo={tooltips.grader.section.title}
      />
    );
  }
}

export default SectionDetailPanel;
