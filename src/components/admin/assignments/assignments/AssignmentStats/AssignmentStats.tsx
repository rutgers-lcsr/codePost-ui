// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import React, { FC, useState, useMemo, useCallback, useEffect, CSSProperties } from 'react';
import { RedoOutlined } from '@ant-design/icons';
import {
  Breadcrumb,
  Card,
  Col,
  Empty,
  Progress,
  Row,
  Segmented,
  Skeleton,
  Spin,
  Statistic,
  Table,
  Typography,
} from 'antd';
import { useQuery } from '@tanstack/react-query';
import { colors } from '../../../../../theme/colors';
import CPButton from '../../../../../components/core/CPButton';
import CPTooltip from '../../../../../components/core/CPTooltip';
import { tooltips } from '../../../../../components/core/tooltips';
import CPAdminDetail from '../../../other/CPAdminDetail';
import { Assignment, SubmissionInfoType } from '../../../../../types/common';
import { Course } from '../../../../../api-client';
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
import { Assignment as AssignmentService } from '../../../../../services/assignment';
import GradeDistributionChart from './charts/GradeDistributionChart';
import GraderWorkloadChart from './charts/GraderWorkloadChart';
import GradingTimelineChart from './charts/GradingTimelineChart';
import TestResultsChart from './charts/TestResultsChart';
import { assignmentKeys } from '../../../../../lib/queryKeys';

const { Title } = Typography;

export interface IProps {
  course: Course;
  assignment: Assignment;
  submissions: SubmissionInfoType[] | null;
  students: string[];
  submissionsByStudent: IStudentSubmissionsDataTable;
  viewsBySubmission: { [submissionID: number]: { [student: string]: string } };
  refreshCourseData: () => void | undefined;
  myEmail: string;
  breadcrumbs: Array<{ title: React.ReactNode }>;
}

const AssignmentStats: FC<IProps> = (props) => {
  const {
    course,
    assignment,
    submissions,
    students,
    submissionsByStudent,
    viewsBySubmission,
    refreshCourseData,
    myEmail,
    breadcrumbs,
  } = props;

  const [drawerType, setDrawerType] = useState<DRAWER_TYPE | undefined>(undefined);
  const [drawerContent, setDrawerContent] = useState<{
    title: string;
    subtitle: React.ReactNode;
    content: Array<{ email: string; subID: number | null }> | null;
  }>({ title: '', subtitle: '', content: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [buckets, setBuckets] = useState<number>(10);

  const analyticsQuery = useQuery({
    queryKey: assignmentKeys.analytics(assignment.id, buckets),
    queryFn: () => AssignmentService.readAnalytics(assignment.id, buckets),
  });

  const analytics = analyticsQuery.data ?? null;
  const analyticsLoading = analyticsQuery.isPending;
  const gradeDistribution = analyticsQuery.data?.gradeDistribution ?? null;
  const gradeDistLoading = analyticsQuery.isPending;

  useEffect(() => {
    // resets loading state when props refresh
    setIsLoading(false);
  }, [props]);

  const openDrawer = useCallback(
    (targetAssignment: Assignment, type: DRAWER_TYPE) => {
      if (submissions === null) {
        const title = getDrawerTitle(type, null);
        setDrawerContent({
          title: targetAssignment.name,
          subtitle: title,
          content: null,
        });
        setDrawerType(type);
        setDrawerOpen(true);
      } else {
        const newContent = filterDataByStat(
          targetAssignment,
          submissionsByStudent,
          type,
          submissions,
          viewsBySubmission,
          students,
        );
        const title = getDrawerTitle(type, newContent.length);
        setDrawerContent({
          title: targetAssignment.name,
          subtitle: title,
          content: newContent,
        });
        setDrawerType(type);
        setDrawerOpen(true);
      }
    },
    [submissions, submissionsByStudent, viewsBySubmission, students],
  );

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  const refreshData = useCallback(() => {
    setIsLoading(true);
    refreshCourseData();
  }, [refreshCourseData]);

  const statsForRow: IFullStats = useMemo(() => {
    return calculateFullStats(assignment, submissions, submissionsByStudent, viewsBySubmission, students);
  }, [assignment, submissions, submissionsByStudent, viewsBySubmission, students]);

  const reminderEmails = useMemo(() => {
    if (submissions === null) return [];
    const toEmail = new Set<string>();
    for (const submission of submissions) {
      if (submission.grader && !submission.isFinalized) {
        toEmail.add(submission.grader);
      }
    }
    return Array.from(toEmail);
  }, [submissions]);

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

  const summaryData = (
    <Card
      style={{
        backgroundColor: colors.neutralBackground,
        boxShadow: '0 2px 15px 0 rgba(0, 0, 0, 0.1)',
        borderRadius: 8,
        borderLeft: `3px solid ${colors.brandPrimary}`,
      }}
      role="region"
      aria-label="Grade summary statistics"
    >
      <Row gutter={16} style={{ textAlign: 'center' }}>
        <Col xs={12} sm={6}>
          <Statistic title="Mean" value={mean ? mean : '--'} suffix={`/ ${assignment.points}`} />
        </Col>
        <Col xs={12} sm={6}>
          <Statistic title="Median" value={median ? median : '...'} suffix={`/ ${assignment.points}`} />
        </Col>
        <Col xs={12} sm={6}>
          <Statistic title="Max" value={max ? max : '--'} suffix={`/ ${assignment.points}`} />
        </Col>
        <Col xs={12} sm={6}>
          <Statistic title="Min" value={min ? min : '--'} suffix={`/ ${assignment.points}`} />
        </Col>
      </Row>
    </Card>
  );

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
        <span onClick={() => openDrawer(assignment, DRAWER_TYPE.Submitted)} className="text-link">
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
            <span onClick={() => openDrawer(assignment, DRAWER_TYPE.Graded)} className="text-link">
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
                <span onClick={() => openDrawer(assignment, DRAWER_TYPE.Unviewed)} className="text-link">
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
                <span onClick={() => openDrawer(assignment, DRAWER_TYPE.Viewed)} className="text-link">
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
            <span onClick={() => openDrawer(assignment, DRAWER_TYPE.InProgress)} className="text-link">
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
            <span onClick={() => openDrawer(assignment, DRAWER_TYPE.Unclaimed)} className="text-link">
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
        <span onClick={() => openDrawer(assignment, DRAWER_TYPE.Missing)} className="text-link">
          {numMissing}
        </span>
      ),
    },
  ];

  const columns = [
    {
      title: 'category',
      dataIndex: 'category',
      key: 'category',
      align: 'left' as const,
      width: 180,
    },
    {
      title: 'tooltip',
      dataIndex: 'tooltip',
      key: 'tooltip',
      align: 'left' as const,
      width: 100,
    },
    {
      title: 'data',
      dataIndex: 'data',
      key: 'data',
      align: 'center' as const,
    },
  ];

  const cardStyle: CSSProperties = {
    boxShadow: '0 2px 15px 0 rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
    transition: 'box-shadow 0.2s ease',
  };

  const sectionTitleStyle: CSSProperties = {
    color: colors.neutralSecondaryText,
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  };

  const sectionLineStyle: CSSProperties = {
    flex: 1,
    height: 1,
    background: `linear-gradient(to right, ${colors.neutralBorder}, transparent)`,
  };

  const fadeInStyle = (isLoaded: boolean): CSSProperties => ({
    opacity: isLoaded ? 1 : 0,
    transform: isLoaded ? 'translateY(0)' : 'translateY(8px)',
    transition: 'opacity 0.4s ease, transform 0.4s ease',
  });

  const chartLoadingState = (
    <div style={{ padding: '20px 0' }}>
      <Skeleton active paragraph={{ rows: 6 }} />
    </div>
  );

  const content = (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 20px 50px' }}>
      {/* ── Grade Summary ── */}
      <div style={{ marginBottom: 32 }}>{summaryData}</div>

      {/* ── Grading Overview: Progress + Timeline side-by-side ── */}
      <div style={sectionTitleStyle}>
        <span>Grading Overview</span>
        <div style={sectionLineStyle} />
      </div>
      <Row gutter={[20, 20]} style={{ marginBottom: 32 }}>
        <Col xs={24} lg={12}>
          <Card
            style={cardStyle}
            styles={{ body: { padding: '20px 24px' } }}
            role="region"
            aria-label="Grading progress"
          >
            <div className="display-flex justify-content-space-between align-items-center" style={{ marginBottom: 12 }}>
              <Title level={4} style={{ color: colors.brandPrimary, margin: 0 }}>
                Grading Progress
              </Title>
              <div style={{ display: 'flex', gap: 8 }}>
                <CPButton
                  onClick={refreshData}
                  cpType="primary"
                  icon={<RedoOutlined />}
                  loading={isLoading}
                  size="small"
                >
                  Refresh
                </CPButton>
                {reminderEmails.length > 0 ? (
                  <SendEmailModal
                    buttonText={'Remind'}
                    title="Send reminder emails"
                    template="grader_reminder"
                    course={course}
                    assignment={assignment}
                    me={myEmail}
                    emails={reminderEmails}
                    body={
                      <div>
                        Send a reminder email to graders with pending submissions for {assignment.name} asking them to
                        complete or unclaim these submissions. Graders without pending submissions won't be emailed
                      </div>
                    }
                  />
                ) : null}
              </div>
            </div>
            <div className="display-flex flex-direction-column align-items-center" style={{ padding: '8px 0' }}>
              <Progress
                percent={Math.floor(
                  ((statsForRow.numGraded + statsForRow.numInProgress) / statsForRow.numSubmissions) * 100,
                )}
                success={{ percent: Math.floor((statsForRow.numGraded / statsForRow.numSubmissions) * 100) }}
                type="dashboard"
                size={140}
              />
              <Typography.Text style={{ paddingTop: 4, paddingBottom: 8 }}>
                {`${statsForRow.numGraded} done / ${statsForRow.numInProgress} drafts / ${statsForRow.numUnclaimed} unclaimed`}
              </Typography.Text>
            </div>
            <Table
              pagination={false}
              columns={columns}
              showHeader={false}
              dataSource={submissionData}
              size={'small'}
              defaultExpandAllRows={true}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            style={cardStyle}
            styles={{ body: { padding: '20px 24px' } }}
            role="region"
            aria-label="Grading timeline chart"
          >
            <Title level={4} style={{ color: colors.brandPrimary, marginBottom: 16 }}>
              Grading Timeline
            </Title>
            {analyticsLoading ? (
              chartLoadingState
            ) : (
              <div style={fadeInStyle(!analyticsLoading)}>
                {analytics && analytics.gradingTimeline.length > 0 ? (
                  <GradingTimelineChart data={analytics.gradingTimeline} />
                ) : (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No finalized submissions yet" />
                )}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* ── Grade Analysis: Distribution + Workload side-by-side ── */}
      <div style={sectionTitleStyle}>
        <span>Grade Analysis</span>
        <div style={sectionLineStyle} />
      </div>
      <Row gutter={[20, 20]} style={{ marginBottom: 32 }}>
        <Col xs={24} lg={14}>
          <Card
            style={cardStyle}
            styles={{ body: { padding: '20px 24px' } }}
            role="region"
            aria-label="Grade distribution chart"
          >
            <div className="display-flex justify-content-space-between align-items-center" style={{ marginBottom: 16 }}>
              <Title level={4} style={{ color: colors.brandPrimary, margin: 0 }}>
                Grade Distribution
              </Title>
              <div className="display-flex align-items-center" style={{ gap: 8 }}>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  Buckets
                </Typography.Text>
                <Segmented
                  options={[5, 10, 20, 50].map((n) => ({ label: `${n}`, value: n }))}
                  value={buckets}
                  onChange={(val) => setBuckets(val as number)}
                  size="small"
                />
              </div>
            </div>
            {gradeDistLoading ? (
              chartLoadingState
            ) : (
              <div style={fadeInStyle(!gradeDistLoading)}>
                {gradeDistribution && gradeDistribution.length > 0 ? (
                  <GradeDistributionChart data={gradeDistribution} />
                ) : (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No finalized submissions yet" />
                )}
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card
            style={cardStyle}
            styles={{ body: { padding: '20px 24px' } }}
            role="region"
            aria-label="Grader workload chart"
          >
            <Title level={4} style={{ color: colors.brandPrimary, marginBottom: 16 }}>
              Grader Workload
            </Title>
            {analyticsLoading ? (
              chartLoadingState
            ) : (
              <div style={fadeInStyle(!analyticsLoading)}>
                {analytics && analytics.graderWorkload.length > 0 ? (
                  <GraderWorkloadChart data={analytics.graderWorkload} />
                ) : (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No submissions claimed by graders yet" />
                )}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* ── Test Results (only if tests exist) ── */}
      {analyticsLoading ? (
        <>
          <div style={sectionTitleStyle}>
            <span>Test Results</span>
            <div style={sectionLineStyle} />
          </div>
          <Card
            style={{ ...cardStyle, marginBottom: 32 }}
            styles={{ body: { padding: '20px 24px' } }}
            role="region"
            aria-label="Test results summary"
          >
            <Title level={4} style={{ color: colors.brandPrimary, marginBottom: 16 }}>
              Test Results Summary
            </Title>
            {chartLoadingState}
          </Card>
        </>
      ) : analytics && analytics.testResults.length > 0 ? (
        <>
          <div style={sectionTitleStyle}>
            <span>Test Results</span>
            <div style={sectionLineStyle} />
          </div>
          <Card
            style={{ ...cardStyle, marginBottom: 32 }}
            styles={{ body: { padding: '20px 24px' } }}
            role="region"
            aria-label="Test results summary"
          >
            <Title level={4} style={{ color: colors.brandPrimary, marginBottom: 16 }}>
              Test Results Summary
            </Title>
            <div style={fadeInStyle(!analyticsLoading)}>
              <TestResultsChart data={analytics.testResults} />
            </div>
          </Card>
        </>
      ) : null}

      {drawerType !== undefined && (
        <StatsDrawer
          type={drawerType}
          content={drawerContent}
          onClose={closeDrawer}
          isVisible={drawerOpen}
          loadComplete={true}
        />
      )}
    </div>
  );

  return (
    <CPAdminDetail
      breadcrumbs={<Breadcrumb items={[...breadcrumbs, { title: assignment.name }, { title: 'Stats' }]} />}
      goBack={null}
      title={`${assignment.name} | Stats`}
      actions={[]}
      content={content}
    />
  );
};

export default AssignmentStats;
