// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import React, { FC, useState, useMemo, useCallback, useEffect } from 'react';
import { RedoOutlined } from '@ant-design/icons';
import { Breadcrumb, Card, Col, Progress, Row, Spin, Statistic, Table, Typography } from 'antd';
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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resets loading state when props refresh
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
        backgroundColor: '#F9F9F9',
        boxShadow: '0 2px 15px 0 rgba(0, 0, 0, 0.1)',
      }}
    >
      <Row gutter={0} style={{ width: 600, textAlign: 'center' }}>
        <Col span={6}>
          <Statistic title="Mean" value={mean ? mean : '--'} suffix={`/ ${assignment.points}`} />
        </Col>
        <Col span={6}>
          <Statistic title="Median" value={median ? median : '...'} suffix={`/ ${assignment.points}`} />
        </Col>
        <Col span={6}>
          <Statistic title="Max" value={max ? max : '--'} suffix={`/ ${assignment.points}`} />
        </Col>
        <Col span={6}>
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
            <CPButton onClick={refreshData} cpType="primary" icon={<RedoOutlined />} loading={isLoading}>
              Refresh data
            </CPButton>
            {reminderEmails.length > 0 ? (
              <SendEmailModal
                buttonText={'Remind graders'}
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
