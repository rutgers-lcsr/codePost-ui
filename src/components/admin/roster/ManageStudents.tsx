// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';
import { useCallback, useMemo, useState } from 'react';

import { DisconnectOutlined, EditOutlined, MailOutlined, ProfileOutlined, UserDeleteOutlined } from '@ant-design/icons';

/* style imports */
import { Breadcrumb, Button, Checkbox, Empty, Flex, message, Modal, Select, Space, Spin, Tooltip } from 'antd';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import { coursesApi } from '../../../api-client/clients';

/* other library imports */
import Highlighter from 'react-highlight-words';
import { Link, useLocation } from 'react-router';

/* codePost imports */
import { USER_APP, USER_TYPE } from '../../../types/common';

import { Course, Section } from '../../../api-client';
import { useCourseCapabilities } from '../../../stores/usePermissionsStore';

import CPTooltip from '../../../components/core/CPTooltip';
import { tooltips } from '../../../components/core/tooltips';

import DownloadRoster from './other/DownloadRoster';
import RosterFileUpload from './other/RosterFileUpload';

import { ITableDetailColumn, TableDetail } from '../other/TableDetail';

import ShareInviteCode from './other/ShareInviteCode';

import { sendEmailToUser } from './other/RosterUtils';

import SendEmailModal from '../other/SendEmailModal';

const { confirm } = Modal;

/**********************************************************************************************************************/

export interface IManageStudentsProps {
  /* students data */
  students: string[];
  graders: string[];
  admins: string[];
  sections: Section[];
  currentCourse: Course;
  sectionsByStudent: { [studentEmail: string]: Section };
  notActivated: string[];

  /* loading state */
  loadComplete: boolean;
  sectionsLoadComplete: boolean;

  /* object-level REST operations */
  updateStudentSection: (student: string, section: number) => Promise<void>;
  updateSection: (section: Section) => Promise<void>;
  createSection: (sectionName: string) => Promise<Section>;
  updateRoster: (adds: string[], deletes: string[], userType: USER_APP) => Promise<void>;

  /* misc */
  myEmail: string;
}

// Extra-time options matching how accommodation letters are usually written.
const TIME_MULTIPLIER_OPTIONS = [1, 1.25, 1.5, 2, 3].map((m) => ({
  value: m,
  label: m === 1 ? 'None' : `${m}×`,
}));

const ManageStudents: React.FC<IManageStudentsProps> = (props) => {
  const location = useLocation();
  const [activeStudent, setActiveStudent] = useState<string>('');
  const courseCaps = useCourseCapabilities(props.currentCourse?.id);
  const canManageRoster = courseCaps.manage_roster !== false;
  const queryClient = useQueryClient();

  // Per-student quiz extra-time multipliers (admin-only endpoint; 403 hides the column).
  const accommodationsKey = ['courses', 'quizAccommodations', props.currentCourse?.id ?? -1];
  const { data: quizAccommodations, isError: accommodationsUnavailable } = useQuery({
    queryKey: accommodationsKey,
    queryFn: () => coursesApi.quizAccommodationsList({ id: props.currentCourse.id! }),
    enabled: !!props.currentCourse?.id && canManageRoster,
    retry: false,
  });
  const multiplierByStudent = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of quizAccommodations ?? []) map.set(row.student, Number(row.timeMultiplier));
    return map;
  }, [quizAccommodations]);
  const sebExemptByStudent = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const row of quizAccommodations ?? []) map.set(row.student, !!row.sebExempt);
    return map;
  }, [quizAccommodations]);

  const setTimeMultiplier = useCallback(
    async (student: string, multiplier: number) => {
      try {
        await coursesApi.setQuizAccommodationPartialUpdate({
          id: props.currentCourse.id!,
          patchedQuizAccommodationRow: { student, timeMultiplier: multiplier },
        });
        message.success(
          multiplier === 1
            ? `Removed ${student}'s quiz time accommodation.`
            : `${student} now gets ${multiplier}× time on timed quizzes.`,
        );
        queryClient.invalidateQueries({ queryKey: accommodationsKey });
      } catch {
        message.error('Failed to update the quiz time accommodation.');
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props.currentCourse?.id, queryClient],
  );

  const setSebExempt = useCallback(
    async (student: string, exempt: boolean) => {
      try {
        await coursesApi.setQuizAccommodationPartialUpdate({
          id: props.currentCourse.id!,
          patchedQuizAccommodationRow: {
            student,
            // The endpoint requires the multiplier; resend the student's current one.
            timeMultiplier: multiplierByStudent.get(student) ?? 1,
            sebExempt: exempt,
          },
        });
        message.success(
          exempt
            ? `${student} is exempt from Safe Exam Browser requirements.`
            : `${student} must use Safe Exam Browser on SEB-required quizzes again.`,
        );
        queryClient.invalidateQueries({ queryKey: accommodationsKey });
      } catch {
        message.error('Failed to update the Safe Exam Browser exemption.');
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props.currentCourse?.id, queryClient, multiplierByStudent],
  );

  const sendActivationEmail = useCallback(
    (student: string) => {
      sendEmailToUser(student, 'add_student', props.currentCourse, true, undefined);
    },
    [props.currentCourse],
  );

  const removeStudent = useCallback(
    (toRemove: string) => {
      confirm({
        title: `Are you sure you want to remove this student (${toRemove}) from your course?`,
        content: `All the student's work will be saved, but they won't be able to access the course. You can always add them back from this page.`,
        onOk: async () => {
          await props.updateRoster([], [toRemove], USER_APP.Student);
        },
        okText: 'Remove',
      });
    },
    [props],
  );

  const updateStudentSection = useCallback(
    async (student: string, section: number) => {
      await props.updateStudentSection(student, section);
      message.success(`Updated ${student}'s section.`);
    },
    [props],
  );

  const inactiveEmails = useMemo(() => {
    return props.students.filter((student) => props.notActivated.includes(student));
  }, [props.students, props.notActivated]);

  const renderStudentCell = useCallback(
    (searchText: string) => {
      return (_: string, record: Record<string, unknown>) => {
        const studentEmail = record.student as string;
        const highlightedEmail = (
          <Highlighter
            highlightStyle={{
              backgroundColor: '#5CBB8B',
              padding: 0,
            }}
            searchWords={[searchText]}
            autoEscape
            textToHighlight={studentEmail}
          />
        );
        const hasActivated = !props.notActivated.includes(studentEmail);
        return hasActivated ? (
          highlightedEmail
        ) : (
          <span style={{ color: '#80808082' }}>
            <CPTooltip title="This user has not yet signed up for codePost.">
              <div>
                {highlightedEmail} &nbsp; <DisconnectOutlined />
              </div>
            </CPTooltip>
          </span>
        );
      };
    },
    [props.notActivated],
  );

  const renderSectionCell = useCallback(
    (searchText: string) => {
      return (_: string, record: Record<string, unknown>) => {
        const student = record.key as string;
        if (!props.sectionsLoadComplete) {
          return <Spin />;
        }
        if (student === activeStudent) {
          return (
            <div>
              <Select
                style={{ width: 150 }}
                onChange={(value) => updateStudentSection(student, value)}
                defaultValue={props.sectionsByStudent[student]?.id ?? 0}
              >
                {props.sections
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((section) => (
                    <Select.Option key={section.id} value={section.id}>
                      {section.name}
                    </Select.Option>
                  ))}
                <Select.Option key={0} value={0}>
                  No section
                </Select.Option>
              </Select>
              &nbsp;
              <CPTooltip title={tooltips.admin.studentRoster.lockSection} hideThisOnHideTips={true}>
                <EditOutlined onClick={() => setActiveStudent('')} />
              </CPTooltip>
            </div>
          );
        }
        return (
          <div>
            <Highlighter
              highlightStyle={{
                backgroundColor: '#5CBB8B',
                padding: 0,
              }}
              searchWords={[searchText]}
              autoEscape
              textToHighlight={props.sectionsByStudent[student]?.name ?? 'No section'}
            />{' '}
            &nbsp;
            <CPTooltip title={tooltips.admin.studentRoster.editSection} hideThisOnHideTips={true}>
              <EditOutlined onClick={() => setActiveStudent(student)} />
            </CPTooltip>
          </div>
        );
      };
    },
    [activeStudent, props.sectionsLoadComplete, props.sections, props.sectionsByStudent, updateStudentSection],
  );

  const columns: ITableDetailColumn[] = useMemo(
    () => [
      {
        title: 'Student',
        dataIndex: 'student',
        key: 'primary',
        defaultSortOrder: 'ascend' as const,
        sorter: (a: { key: string }, b: { key: string }) => a.key.localeCompare(b.key),
        renderForSearch: renderStudentCell,
      },
      {
        title: 'Section',
        dataIndex: 'section',
        key: 'section',
        align: 'center' as const,
        sorter: (a: { section: string }, b: { section: string }) => {
          if (a.section === b.section) return 0;
          if (a.section === 'No section') return 1;
          if (b.section === 'No section') return -1;
          return a.section.localeCompare(b.section);
        },
        renderForSearch: renderSectionCell,
      },
      ...(canManageRoster && !accommodationsUnavailable
        ? [
            {
              title: (
                <Tooltip title="Extra time on timed quizzes (e.g. 1.5× turns 40 minutes into 60), and exemption from Safe Exam Browser requirements (for students on platforms SEB doesn't support, like Linux or ChromeOS).">
                  <span>Quiz accommodations</span>
                </Tooltip>
              ),
              dataIndex: 'quizTime',
              key: 'quizTime',
              align: 'center' as const,
            },
          ]
        : []),
      {
        title: 'Actions',
        dataIndex: 'actions',
        key: 'actions',
        align: 'right' as const,
      },
    ],
    [renderStudentCell, renderSectionCell, canManageRoster, accommodationsUnavailable],
  );

  const data = useMemo(() => {
    return props.students.map((studentEmail) => {
      const hasActivated = !props.notActivated.includes(studentEmail);

      return {
        key: studentEmail,
        student: studentEmail,
        section: props.sectionsByStudent[studentEmail]?.name ?? 'No section',
        quizTime: (
          <Flex vertical gap={4} align="center">
            <Select
              size="small"
              style={{ width: 90 }}
              value={multiplierByStudent.get(studentEmail) ?? 1}
              options={TIME_MULTIPLIER_OPTIONS}
              onChange={(m) => setTimeMultiplier(studentEmail, m)}
              data-testid="quiz-time-multiplier"
            />
            <Checkbox
              checked={sebExemptByStudent.get(studentEmail) ?? false}
              onChange={(e) => setSebExempt(studentEmail, e.target.checked)}
              data-testid="quiz-seb-exempt"
            >
              <span style={{ fontSize: 12 }}>SEB exempt</span>
            </Checkbox>
          </Flex>
        ),
        actions: (
          <Space>
            {!hasActivated && (
              <Tooltip title="Send activation email">
                <Button shape="circle" icon={<MailOutlined />} onClick={() => sendActivationEmail(studentEmail)} />
              </Tooltip>
            )}
            <Tooltip title="Open profile">
              <Link to={location.pathname.replace('roster/students', `submissions/by_student/${studentEmail}`) || ''}>
                <Button shape="circle" icon={<ProfileOutlined />} />
              </Link>
            </Tooltip>
            {canManageRoster && (
              <Tooltip title="Unenroll">
                <Button shape="circle" icon={<UserDeleteOutlined />} onClick={() => removeStudent(studentEmail)} />
              </Tooltip>
            )}
          </Space>
        ),
      };
    });
  }, [
    props.students,
    props.notActivated,
    props.sectionsByStudent,
    location.pathname,
    sendActivationEmail,
    removeStudent,
    multiplierByStudent,
    setTimeMultiplier,
    sebExemptByStudent,
    setSebExempt,
  ]);
  const actions = useMemo(() => {
    if (props.students.length === 0) return [];

    return [
      inactiveEmails.length > 0 && (
        <SendEmailModal
          key="activation"
          buttonText="Send invites"
          title="Send activation emails to students"
          template="add_student"
          course={props.currentCourse}
          me={props.myEmail}
          emails={inactiveEmails}
          body={
            <div>
              Send activation emails to all students who have not yet joined codePost. Users who have signed up won't be
              emailed.
            </div>
          }
        />
      ),
      <ShareInviteCode key="invite" course={props.currentCourse} />,
      <DownloadRoster
        key="download"
        downloadType={USER_TYPE.STUDENT}
        sectionsByStudent={props.sectionsByStudent}
        startingPage={USER_TYPE.STUDENT}
        students={props.students}
        graders={props.graders}
        admins={props.admins}
        course={props.currentCourse}
        isDisabled={false}
      />,
      canManageRoster ? (
        <RosterFileUpload
          key="upload"
          roleType="student"
          students={props.students}
          graders={props.graders}
          admins={props.admins}
          sections={props.sections}
          sectionsByStudent={props.sectionsByStudent}
          changeRoster={props.updateRoster}
          isDisabled={false}
          updateSection={props.updateSection}
          emailNewUsers={props.currentCourse?.emailNewUsers ?? false}
          createSection={props.createSection}
          course={props.currentCourse}
        />
      ) : null,
    ].filter(Boolean);
  }, [props, inactiveEmails]);

  return (
    <TableDetail
      loadComplete={props.loadComplete}
      title="Students"
      isEmpty={props.students.length === 0}
      emptyNode={
        <Empty
          styles={{
            image: {
              height: 60,
            },
          }}
          description={<span>You can add students to your course in two ways</span>}
        >
          <span>
            <RosterFileUpload
              roleType="student"
              students={props.students}
              graders={props.graders}
              admins={props.admins}
              sections={props.sections}
              sectionsByStudent={props.sectionsByStudent}
              changeRoster={props.updateRoster}
              isDisabled={false}
              updateSection={props.updateSection}
              emailNewUsers={props.currentCourse?.emailNewUsers ?? false}
              createSection={props.createSection}
              course={props.currentCourse}
              buttonText="Add students by email"
            />
            <br />
            OR <br /> <br />
            <ShareInviteCode course={props.currentCourse} />
          </span>
        </Empty>
      }
      columns={columns}
      data={data}
      actions={actions}
      breadcrumbs={
        <Breadcrumb
          items={[
            { title: 'Roster' },
            {
              title: <a>Students</a>,
            },
          ]}
        />
      }
      titleInfo={tooltips.admin.studentRoster.title}
    />
  );
};

export default ManageStudents;
