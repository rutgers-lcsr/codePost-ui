/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

import { LoadingOutlined } from '@ant-design/icons';

/* ant imports */
import { Breadcrumb, Button, Divider, Select, Spin, Switch, Tabs, message } from 'antd';

/* codePost imports */
import { AssignmentType } from '../../infrastructure/assignment';
import { CourseType } from '../../infrastructure/course';
import { Section, SectionType } from '../../infrastructure/section';
import { Submission, SubmissionType } from '../../infrastructure/submission';
import { SubmissionHistoryType } from '../../infrastructure/submissionHistory';

import { tooltips } from '../core/tooltips';

import CPAdminDetail from '../admin/other/CPAdminDetail';

import { TestingSummary } from '../admin/assignments/tests/results/TestingSummary';
import SectionSubmissionsTable from './SectionSubmissionsTable';

import { AutograderInfoModal, SubmissionInfoModal } from './InfoModals';

const { Option } = Select;

type alignType = 'left' | 'right' | 'center';

/**********************************************************************************************************************/

interface IProps {
  course: CourseType;
  assignment: AssignmentType;
  sections: SectionType[];
  breadcrumbs: Array<{ title: React.ReactNode }>;
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
  viewsLoading: boolean;

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
      viewsLoading: false,
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

  public componentDidUpdate(_oldProps: IProps) {
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
      let mapValue: any = {};
      const submissions = await Section.readSubmissions(section.id, {
        assignment: this.props.assignment.id.toString(),
      });
      this.loadHistories(submissions);

      for (const student of section.students) {
        mapValue[student] = submissions.find((el) => el.students.indexOf(student) > -1);
      }

      submissionMap[section.id] = mapValue;
    }

    return submissionMap;
  };

  public loadHistories = async (submissions: SubmissionType[]) => {
    this.setState({ viewsLoading: true });
    const toRet: any = {};
    const promises = submissions.map((submission) => {
      toRet[submission.id] = {};
      return Submission.readHistory(submission.id).then((histories: SubmissionHistoryType[]) => {
        for (const history of histories) {
          if (history.hasViewed && history.dateViewed) {
            toRet[submission.id][history.student] = history.dateViewed;
          }
        }
      });
    });

    Promise.all(promises).then(() => {
      this.setState({ viewsBySubmission: toRet, viewsLoading: false });
    });

    return toRet;
  };

  public claimSubmissions = async (toHandle: number[], unclaim: boolean | undefined) => {
    const promises = toHandle.map((id) => {
      return Submission.update({ id: id, isFinalized: false, grader: unclaim ? '' : this.props.email });
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
        message.success(`Submission${submissions.length > 1 ? 's' : ''} ${unclaim ? 'un' : ''}claimed!`);
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
      return <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />;
    }

    let selectContent;
    if (this.props.sections.length > 1) {
      const menuItems = this.props.sections.map((section) => {
        return (
          <Option key={section.id} value={section.id}>
            {section.name}{' '}
          </Option>
        );
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
      <Button
        type="primary"
        disabled={this.state.selectedSubmissions.length === 0}
        onClick={() => {
          this.claimSubmissions(this.state.selectedSubmissions, false);
        }}
      >
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
        viewsLoading={this.state.viewsLoading}
        claimSubmissions={this.claimSubmissions}
        me={this.props.email}
      />
    );

    const submissions: (SubmissionType | null)[] = this.state.submissionsBySection[this.state.activeSection.id]
      ? Object.values(this.state.submissionsBySection[this.state.activeSection.id])
      : [];
    const filteredSubmissions: SubmissionType[] = submissions.filter(
      (s): s is SubmissionType => s !== null && s !== undefined,
    );

    let content;
    if (!this.props.assignment.environment) {
      content = submissionsTable;
    } else {
      content = (
        <Tabs defaultActiveKey="1">
          <Tabs.TabPane tab="Overview" key="1">
            {this.props.assignment.allowStudentUpload && (
              <div style={{ width: '100%', height: 35 }}>
                <div style={{ float: 'right' }}>
                  <SubmissionInfoModal />
                </div>
              </div>
            )}
            {submissionsTable}
          </Tabs.TabPane>
          <Tabs.TabPane tab="Test results" key="2">
            <div style={{ width: '100%', height: 35 }}>
              <div style={{ float: 'right' }}>
                <AutograderInfoModal />
              </div>
            </div>
            <TestingSummary
              currentAssignment={this.props.assignment}
              submissions={filteredSubmissions}
              fullSubmissionsLoadComplete={!this.state.isLoading}
              isAdmin={false}
              tableOnly={true}
            />
          </Tabs.TabPane>
        </Tabs>
      );
    }

    return (
      <CPAdminDetail
        goBack={null}
        breadcrumbs={<Breadcrumb items={[...this.props.breadcrumbs, { title: this.props.assignment.name }]} />}
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
