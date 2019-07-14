/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* React imports */
import * as React from 'react';

/* ant imports */
import { Breadcrumb, Card, Col, Progress, Row, Statistic, Table, Typography } from 'antd';
const { Title } = Typography;

import CPButton from '../../../../../components/core/CPButton';
import CPTooltip from '../../../../../components/core/CPTooltip';
import { tooltips } from '../../../../../components/core/tooltips';

import CPAdminDetail from '../../../other/CPAdminDetail';

/* other library imports */
import memoizeOne from 'memoize-one';

/* codePost imports */
import { AssignmentType } from '../../../../../infrastructure/assignment';
import { SubmissionType } from '../../../../../infrastructure/submission';

import { IStudentSubmissionsDataTable } from '../../../../../types/common';

import {
  calculateFullStats,
  DRAWER_TYPE,
  filterDataByStat,
  getDrawerTitle,
  IFullStats,
  StatsDrawer,
} from './StatsUtils';

/**********************************************************************************************************************/

export interface IProps {
  /* assignment data */
  assignment: AssignmentType;
  submissions: SubmissionType[];
  students: string[]; // emails
  submissionsByStudent: IStudentSubmissionsDataTable;

  /* object-level REST operations */
  viewsBySubmission: { [submissionID: number]: { [student: string]: string } };

  /* Refresh Course data */
  refreshCourseData: () => void | undefined;

  onCancel: () => void;
}

interface IState {
  drawerType?: DRAWER_TYPE;
  drawerContent: { title: string; subtitle: string; content: Array<{ email: string; subID: number | null }> };
  isLoading: boolean;
  drawerOpen: boolean;
}

/**********************************************************************************************************************/

class ManageAssignments extends React.Component<IProps, IState> {
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
    const newContent: Array<{ email: string; subID: number | null }> = filterDataByStat(
      assignment,
      this.props.submissionsByStudent,
      type,
      this.props.submissions,
      this.props.viewsBySubmission,
    );

    const title = getDrawerTitle(type, newContent.length);

    this.setState({
      drawerContent: { title: assignment.name, subtitle: title, content: newContent },
      drawerType: type,
      drawerOpen: true,
    });
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

  /******************************************************************************
   * Render
   ******************************************************************************/

  public render() {
    let content;

    const hoverStyle = { cursor: 'pointer' };
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
          <span onClick={this.openDrawer.bind(this, this.props.assignment, DRAWER_TYPE.Submitted)} style={hoverStyle}>
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
              <span onClick={this.openDrawer.bind(this, this.props.assignment, DRAWER_TYPE.Graded)} style={hoverStyle}>
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
                    style={hoverStyle}
                  >
                    {numUnviewed}
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
                    style={hoverStyle}
                  >
                    {numViewed}
                  </span>
                ),
              },
            ],
          },
          {
            key: 12,
            category: 'In Progress',
            tooltip: (
              <CPTooltip
                title={tooltips.admin.assignments.inProgress}
                infoIcon={true}
                hideThisOnHideTips={true}
                iconStyle={{ paddingLeft: 5 }}
              />
            ),
            data: (
              <span onClick={this.openDrawer.bind(this, this.props.assignment, DRAWER_TYPE.Missing)} style={hoverStyle}>
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
                style={hoverStyle}
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
          <span onClick={this.openDrawer.bind(this, this.props.assignment, DRAWER_TYPE.Missing)} style={hoverStyle}>
            {numMissing}
          </span>
        ),
      },
    ];
    const summaryData = (
      <Card style={{ backgroundColor: '#F9F9F9', boxShadow: '0 2px 15px 0 rgba(0, 0, 0, 0.1)' }}>
        <Row gutter={0} style={{ width: 600, textAlign: 'center' }}>
          <Col span={6}>
            <Statistic title="Mean" value={mean ? mean : '--'} suffix={`/ ${this.props.assignment.points}`} />
          </Col>
          <Col span={6}>
            <Statistic title="Median" value={median ? median : '--'} suffix={`/ ${this.props.assignment.points}`} />
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
        />
      );

    const divStyle = { padding: '20px 40px' };
    content = (
      <div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: 50 }}>
          <div style={{ ...divStyle, paddingBottom: 50 }}>{summaryData}</div>
          <div style={{ boxShadow: '0 2px 15px 0 rgba(0, 0, 0, 0.1)' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                ...divStyle,
                paddingBottom: 10,
                padddingTop: 30,
              }}
            >
              <Title level={3} style={{ color: '#24be85' }}>
                Grading Progress Summary
              </Title>
              <CPButton onClick={this.refreshData} cpType="primary" icon="redo" loading={this.state.isLoading}>
                Refresh Data
              </CPButton>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', ...divStyle }}>
              <Table
                pagination={false}
                columns={columns}
                showHeader={false}
                dataSource={submissionData}
                size={'small'}
                style={{ width: 450, paddingRight: 50 }}
                defaultExpandAllRows={true}
              />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Progress
                  percent={Math.floor(
                    ((statsForRow.numGraded + statsForRow.numInProgress) / statsForRow.numSubmissions) * 100,
                  )}
                  successPercent={Math.floor((statsForRow.numGraded / statsForRow.numSubmissions) * 100)}
                  type="dashboard"
                />
                <Typography.Text style={{ paddingBottom: 10 }}>
                  {`${statsForRow.numGraded} done / ${statsForRow.numInProgress} in progress / ${
                    statsForRow.numUnclaimed
                  } left to grade`}
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
          <Breadcrumb>
            <Breadcrumb.Item onClick={this.props.onCancel}>
              <a>Assignments</a>
            </Breadcrumb.Item>
            <Breadcrumb.Item>{this.props.assignment.name}</Breadcrumb.Item>
            <Breadcrumb.Item>Stats</Breadcrumb.Item>
          </Breadcrumb>
        }
        goBack={null}
        title={`${this.props.assignment.name} | Stats`}
        actions={[]}
        content={content}
      />
    );
  }
}

export default ManageAssignments;
