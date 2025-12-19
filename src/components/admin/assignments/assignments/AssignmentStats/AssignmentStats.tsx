/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* React imports */
import * as React from 'react';

/* ant imports */
import { RedoOutlined } from '@ant-design/icons';
import { Breadcrumb, Card, Col, Progress, Row, Spin, Statistic, Table, Typography } from 'antd';

import { colors } from '../../../../../theme/colors';
import CPButton from '../../../../../components/core/CPButton';
import CPTooltip from '../../../../../components/core/CPTooltip';
import { tooltips } from '../../../../../components/core/tooltips';

import CPAdminDetail from '../../../other/CPAdminDetail';

/* other library imports */
import memoizeOne from 'memoize-one';

/* codePost imports */
import { AssignmentType } from '../../../../../infrastructure/assignment';
import { CourseType } from '../../../../../infrastructure/course';
import { SubmissionInfoType } from '../../../../../infrastructure/submission';

import { IStudentSubmissionsDataTable } from '../../../../../types/common';

import {
  calculateFullStats,
  DRAWER_TYPE,
  filterDataByStat,
  getDrawerTitle,
  IFullStats,
  StatsDrawer,
} from './StatsUtils';

import SendEmailModal from '../../../other/SendEmailModal';

const { Title } = Typography;

/**********************************************************************************************************************/

export interface IProps {
  /* assignment data */
  course: CourseType;
  assignment: AssignmentType;
  submissions: SubmissionInfoType[] | null;
  students: string[]; // emails
  submissionsByStudent: IStudentSubmissionsDataTable;

  /* object-level REST operations */
  viewsBySubmission: { [submissionID: number]: { [student: string]: string } };

  /* Refresh Course data */
  refreshCourseData: () => void | undefined;

  /* misc */
  myEmail: string;

  breadcrumbs: Array<{ title: React.ReactNode }>;
}

interface IState {
  drawerType?: DRAWER_TYPE;
  drawerContent: {
    title: string;
    subtitle: React.ReactNode;
    content: Array<{ email: string; subID: number | null }> | null;
  };
  isLoading: boolean;
  drawerOpen: boolean;
}

/**********************************************************************************************************************/

class AssignmentStats extends React.Component<IProps, IState> {
  public state: Readonly<IState> = {
    drawerContent: { title: '', subtitle: '', content: [] },
    isLoading: false,
    drawerOpen: false,
  };

  public calculateStats = memoizeOne(calculateFullStats);

  public componentDidUpdate(prevProps: IProps) {
    if (prevProps !== this.props) {
      this.setState({ isLoading: false });
    }
  }

  /******************************************************************************
   * UI Control
   ******************************************************************************/

  // This function is called when a an assignment drawer is opened
  // Depending on the type of data (DRAWER_TYPE), different sets of data will
  // be stored in state. We need to store the data in state of on render because
  // the drawer sliding takes time and looks bad if the data changes while it's sliding
  public openDrawer = (assignment: AssignmentType, type: DRAWER_TYPE) => {
    if (this.props.submissions === null) {
      const title = getDrawerTitle(type, null);

      this.setState({
        drawerContent: {
          title: assignment.name,
          subtitle: title,
          content: null,
        },
        drawerType: type,
        drawerOpen: true,
      });
    } else {
      const newContent: Array<{
        email: string;
        subID: number | null;
      }> = filterDataByStat(
        assignment,
        this.props.submissionsByStudent,
        type,
        this.props.submissions,
        this.props.viewsBySubmission,
        this.props.students,
      );

      const title = getDrawerTitle(type, newContent.length);

      this.setState({
        drawerContent: {
          title: assignment.name,
          subtitle: title,
          content: newContent,
        },
        drawerType: type,
        drawerOpen: true,
      });
    }
  };

  public closeDrawer = () => {
    this.setState({ drawerOpen: false });
  };

  /* This is called to reload all course data and update statistics*/
  public refreshData = () => {
    this.setState({ isLoading: true }, () => {
      this.props.refreshCourseData();
    });
  };

  public sendReminders = memoizeOne((submissions: SubmissionInfoType[]) => {
    const toEmail = new Set();
    for (const submission of submissions) {
      if (submission.grader !== null && !submission.isFinalized) {
        toEmail.add(submission.grader);
      }
    }

    return Array.from(toEmail) as string[];
  });

  /******************************************************************************
   * Render
   ******************************************************************************/

  public render() {
    // let content;

    const statsForRow: IFullStats = this.calculateStats(
      this.props.assignment,
      this.props.submissions,
      this.props.submissionsByStudent,
      this.props.viewsBySubmission,
      this.props.students,
    );

    type alignType = 'left' | 'right' | 'center';
    const alignCenter: alignType = 'center';
    const alignLeft = 'left' as 'left' | 'right' | 'center';

    const columns = [
      {
        title: 'category',
        dataIndex: 'category',
        key: 'category',
        align: alignLeft,
        width: 180,
      },
      {
        title: 'tooltip',
        dataIndex: 'tooltip',
        key: 'tooltip',
        align: alignLeft,
        width: 100,
      },
      {
        title: 'data',
        dataIndex: 'data',
        key: 'data',
        align: alignCenter,
      },
    ];

    const {
      mean,
      median,
      max,
      min,
      numSubmissions,
      numGraded,
      numInProgress,
      numUnclaimed,
      numMissing,
      numViewed,
      numUnviewed,
    } = statsForRow;

    const submissionData = [
      {
        key: 1,
        category: 'Total Submissions',
        tooltip: (
          <CPTooltip
            title={tooltips.admin.assignments.submissions}
            infoIcon={true}
            hideThisOnHideTips={true}
            iconStyle={{ paddingLeft: 5 }}
          />
        ),
        data: (
          <span
            onClick={this.openDrawer.bind(this, this.props.assignment, DRAWER_TYPE.Submitted)}
            className="text-link"
          >
            {numSubmissions}
          </span>
        ),
        children: [
          {
            key: 11,
            category: 'Finalized',
            tooltip: (
              <CPTooltip
                title={tooltips.admin.assignments.finalized}
                infoIcon={true}
                hideThisOnHideTips={true}
                iconStyle={{ paddingLeft: 5 }}
              />
            ),
            data: (
              <span
                onClick={this.openDrawer.bind(this, this.props.assignment, DRAWER_TYPE.Graded)}
                className="text-link"
              >
                {numGraded}
              </span>
            ),
            children: [
              {
                key: 111,
                category: 'Unviewed',
                tooltip: (
                  <CPTooltip
                    title={tooltips.admin.assignments.unviewed}
                    infoIcon={true}
                    hideThisOnHideTips={true}
                    iconStyle={{ paddingLeft: 5 }}
                  />
                ),
                data: (
                  <span
                    onClick={this.openDrawer.bind(this, this.props.assignment, DRAWER_TYPE.Unviewed)}
                    className="text-link"
                  >
                    {numUnviewed !== null ? numUnviewed : <Spin size="small" />}
                  </span>
                ),
              },
              {
                key: 112,
                category: 'Viewed',
                tooltip: (
                  <CPTooltip
                    title={tooltips.admin.assignments.viewed}
                    infoIcon={true}
                    hideThisOnHideTips={true}
                    iconStyle={{ paddingLeft: 5 }}
                  />
                ),
                data: (
                  <span
                    onClick={this.openDrawer.bind(this, this.props.assignment, DRAWER_TYPE.Viewed)}
                    className="text-link"
                  >
                    {numViewed !== null ? numViewed : <Spin size="small" />}
                  </span>
                ),
              },
            ],
          },
          {
            key: 12,
            category: 'Unfinalized',
            tooltip: (
              <CPTooltip
                title={tooltips.admin.assignments.inProgress}
                infoIcon={true}
                hideThisOnHideTips={true}
                iconStyle={{ paddingLeft: 5 }}
              />
            ),
            data: (
              <span
                onClick={this.openDrawer.bind(this, this.props.assignment, DRAWER_TYPE.InProgress)}
                className="text-link"
              >
                {numInProgress}
              </span>
            ),
          },
          {
            key: 13,
            category: 'Unclaimed',
            tooltip: (
              <CPTooltip
                title={tooltips.admin.assignments.unclaimed}
                infoIcon={true}
                hideThisOnHideTips={true}
                iconStyle={{ paddingLeft: 5 }}
              />
            ),
            data: (
              <span
                onClick={this.openDrawer.bind(this, this.props.assignment, DRAWER_TYPE.Unclaimed)}
                className="text-link"
              >
                {numUnclaimed}
              </span>
            ),
          },
        ],
      },
      {
        key: 2,
        category: 'Missing',
        tooltip: (
          <CPTooltip
            title={tooltips.admin.assignments.missing}
            infoIcon={true}
            hideThisOnHideTips={true}
            iconStyle={{ paddingLeft: 5 }}
          />
        ),
        data: (
          <span onClick={this.openDrawer.bind(this, this.props.assignment, DRAWER_TYPE.Missing)} className="text-link">
            {numMissing}
          </span>
        ),
      },
    ];
    const summaryData = (
      <Card
        style={{
          backgroundColor: '#F9F9F9',
          boxShadow: '0 2px 15px 0 rgba(0, 0, 0, 0.1)',
        }}
      >
        <Row gutter={0} style={{ width: 600, textAlign: 'center' }}>
          <Col span={6}>
            <Statistic title="Mean" value={mean ? mean : '--'} suffix={`/ ${this.props.assignment.points}`} />
          </Col>
          <Col span={6}>
            <Statistic title="Median" value={median ? median : '...'} suffix={`/ ${this.props.assignment.points}`} />
          </Col>
          <Col span={6}>
            <Statistic title="Max" value={max ? max : '--'} suffix={`/ ${this.props.assignment.points}`} />
          </Col>
          <Col span={6}>
            <Statistic title="Min" value={min ? min : '--'} suffix={`/ ${this.props.assignment.points}`} />
          </Col>
        </Row>
      </Card>
    );

    const drawerComponent =
      this.state.drawerType === undefined ? (
        <div />
      ) : (
        <StatsDrawer
          type={this.state.drawerType}
          content={this.state.drawerContent}
          onClose={this.closeDrawer}
          isVisible={this.state.drawerOpen}
          loadComplete={true}
        />
      );

    const reminderEmails = this.props.submissions !== null ? this.sendReminders(this.props.submissions) : [];

    const divStyle = { padding: '20px 40px' };
    const content = (
      <div>
        <div className="display-flex flex-direction-column align-items-center" style={{ paddingBottom: 50 }}>
          <div style={{ ...divStyle, paddingBottom: 50 }}>{summaryData}</div>
          <div style={{ boxShadow: '0 2px 15px 0 rgba(0, 0, 0, 0.1)' }}>
            <div
              className="display-flex justify-content-space-between align-items-center"
              style={{
                ...divStyle,
                paddingBottom: 10,
                paddingTop: 30,
              }}
            >
              <Title level={3} style={{ color: colors.brandPrimary }}>
                Grading Progress Summary
              </Title>
              <CPButton
                onClick={this.refreshData}
                cpType="primary"
                icon={<RedoOutlined />}
                loading={this.state.isLoading}
              >
                Refresh data
              </CPButton>
              {reminderEmails.length > 0 ? (
                <SendEmailModal
                  buttonText={'Remind graders'}
                  title="Send reminder emails"
                  template="grader_reminder"
                  course={this.props.course}
                  assignment={this.props.assignment}
                  me={this.props.myEmail}
                  emails={reminderEmails}
                  body={
                    <div>
                      Send a reminder email to graders with pending submissions for {this.props.assignment.name} asking
                      them to complete or unclaim these submissions. Graders without pending submissions won't be
                      emailed
                    </div>
                  }
                />
              ) : null}
            </div>
            <div className="display-flex align-items-center" style={{ ...divStyle }}>
              <Table
                pagination={false}
                columns={columns}
                showHeader={false}
                dataSource={submissionData}
                size={'small'}
                style={{ width: 450, paddingRight: 50 }}
                defaultExpandAllRows={true}
              />
              <div className="display-flex flex-direction-column align-items-center">
                <Progress
                  percent={Math.floor(
                    ((statsForRow.numGraded + statsForRow.numInProgress) / statsForRow.numSubmissions) * 100,
                  )}
                  success={{ percent: Math.floor((statsForRow.numGraded / statsForRow.numSubmissions) * 100) }}
                  type="dashboard"
                />
                <Typography.Text style={{ paddingBottom: 10 }}>
                  {`${statsForRow.numGraded} done / ${statsForRow.numInProgress} drafts / ${statsForRow.numUnclaimed} unclaimed`}
                </Typography.Text>
              </div>
            </div>
          </div>
        </div>
        {drawerComponent}
      </div>
    );

    return (
      <CPAdminDetail
        breadcrumbs={
          <Breadcrumb items={[...this.props.breadcrumbs, { title: this.props.assignment.name }, { title: 'Stats' }]} />
        }
        goBack={null}
        title={`${this.props.assignment.name} | Stats`}
        actions={[]}
        content={content}
      />
    );
  }
}

export default AssignmentStats;
