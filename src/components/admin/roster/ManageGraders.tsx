/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';
import { useMemo, useCallback } from 'react';

import { DisconnectOutlined, MailOutlined, ProfileOutlined, UserDeleteOutlined } from '@ant-design/icons';

/* style imports */
import { Breadcrumb, Button, Empty, message, Modal, Space, Popconfirm, Tooltip } from 'antd';

/* other library imports */
import Highlighter from 'react-highlight-words';
import { Link, useLocation } from 'react-router-dom';

/* codePost imports */
import { USER_APP, USER_TYPE } from '../../../types/common';

import { Course, Section } from '../../../api-client';

import DownloadRoster from './other/DownloadRoster';
import RosterFileUpload from './other/RosterFileUpload';

import CPTooltip from '../../../components/core/CPTooltip';
import { tooltips } from '../../../components/core/tooltips';

import { ITableDetailColumn, TableDetail } from '../other/TableDetail';

import { sendEmailToUser } from './other/RosterUtils';

import SendEmailModal from '../other/SendEmailModal';

const confirm = Modal.confirm;

/**********************************************************************************************************************/

export interface IManageGradersProps {
  /* students data */
  students: string[];
  graders: string[];
  superGraders: string[];
  rubricEditors: string[];
  admins: string[];
  sections: Section[];
  currentCourse: Course;
  sectionsByStudent: { [studentEmail: string]: Section };
  notActivated: string[];

  /* loading state */
  loadComplete: boolean;

  /* object-level REST operations */
  updateSection: (section: Section) => Promise<void>;
  updateRoster: (adds: string[], deletes: string[], userType: USER_APP) => Promise<void>;
  createSection: (sectionName: string) => Promise<Section>;

  /* misc */
  myEmail: string;
}

const ManageGraders: React.FC<IManageGradersProps> = (props) => {
  const location = useLocation();

  const sendActivationEmail = useCallback(
    (grader: string) => {
      sendEmailToUser(grader, 'add_grader', props.currentCourse, true, undefined);
    },
    [props.currentCourse],
  );

  const removeGrader = useCallback(
    (toRemove: string) => {
      confirm({
        title: `Are you sure you want to remove this grader (${toRemove}) from your course?`,
        content: `All of their work (graded submissions) won't be impacted, but the
      grader won't be able to access this course any longer. You can always add them back from this page.`,
        onOk: () => {
          return props.updateRoster([], [toRemove], USER_APP.Grader);
        },
        okText: 'Remove',
      });
    },
    [props.updateRoster],
  );

  const toggleSuperGrader = useCallback(
    (grader: string, include: boolean) => {
      if (include) {
        props.updateRoster([grader], [], USER_APP.SuperGrader).then(() => {
          message.success(`${grader} is now a supergrader`);
        });
      } else {
        props.updateRoster([], [grader], USER_APP.SuperGrader).then(() => {
          message.success(`${grader} is no longer a supergrader`);
        });
      }
    },
    [props.updateRoster],
  );

  const toggleRubricEditor = useCallback(
    (grader: string, include: boolean) => {
      if (include) {
        props.updateRoster([grader], [], USER_APP.RubricEditor).then(() => {
          message.success(`${grader} is now a rubric editor`);
        });
      } else {
        props.updateRoster([], [grader], USER_APP.RubricEditor).then(() => {
          message.success(`${grader} is no longer a rubric editor`);
        });
      }
    },
    [props.updateRoster],
  );

  const inactiveEmails = useMemo(() => {
    return props.graders.filter((grader) => {
      return props.notActivated.indexOf(grader) > -1;
    });
  }, [props.graders, props.notActivated]);

  let actions: React.ReactNode[] = [];
  let columns: ITableDetailColumn[] = [];
  let data: any[] = [];

  if (props.loadComplete) {
    actions = [
      inactiveEmails.length > 0 ? (
        <SendEmailModal
          key="activation"
          buttonText="Send invites"
          title="Send activation emails to graders"
          template="add_grader"
          course={props.currentCourse}
          me={props.myEmail}
          emails={inactiveEmails}
          body={
            <div>
              Send activation emails to all graders who have not yet joined codePost. Users who have signed up won't be
              emailed.
            </div>
          }
        />
      ) : null,
      <DownloadRoster
        sectionsByStudent={props.sectionsByStudent}
        key={0}
        startingPage={USER_TYPE.GRADER}
        students={props.students}
        graders={props.graders}
        admins={props.admins}
        course={props.currentCourse}
        isDisabled={false}
        downloadType={USER_TYPE.GRADER}
      />,
      <RosterFileUpload
        key={1}
        roleType="grader"
        students={props.students}
        graders={props.graders}
        admins={props.admins}
        sections={props.sections}
        sectionsByStudent={props.sectionsByStudent}
        changeRoster={props.updateRoster}
        isDisabled={false}
        updateSection={props.updateSection}
        emailNewUsers={props.currentCourse.emailNewUsers ?? false}
        createSection={props.createSection}
        course={props.currentCourse}
      />,
    ];

    const aligner: 'left' | 'center' | 'right' = 'center';
    columns = [
      {
        title: 'Grader',
        dataIndex: 'grader',
        key: 'primary',
        sorter: (a: any, b: any) => a.key.localeCompare(b.key),
        renderForSearch: (searchText: string) => {
          return (_: string, record: any) => {
            const graderEmail = record.grader;
            const highlightedEmail = (
              <Highlighter
                highlightStyle={{
                  backgroundColor: '#5CBB8B',
                  padding: 0,
                }}
                searchWords={[searchText]}
                autoEscape
                textToHighlight={graderEmail}
              />
            );
            const hasActivated = props.notActivated.indexOf(graderEmail) === -1;
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
      },
      {
        title: (
          <div>
            Supergrader Status{' '}
            <CPTooltip title={tooltips.admin.graderRoster.supergrader} infoIcon={true} hideThisOnHideTips={true} />
          </div>
        ),
        dataIndex: 'status',
        key: 'status',
        align: aligner,
        sorter: (a: any, b: any) => (a.superGrader === b.superGrader ? 0 : a.superGrader ? -1 : 1),
      },
      {
        title: (
          <div>
            Rubric Editor{' '}
            <CPTooltip title="Rubric editors can edit the course rubric" infoIcon={true} hideThisOnHideTips={true} />
          </div>
        ),
        dataIndex: 'rubricEditorStatus',
        key: 'rubricEditorStatus',
        align: aligner,
        sorter: (a: any, b: any) => (a.isRubricEditor === b.isRubricEditor ? 0 : a.isRubricEditor ? -1 : 1),
      },
      {
        title: 'Actions',
        dataIndex: 'actions',
        key: 'actions',
        align: 'right' as const,
      },
    ];

    data = props.graders.map((graderEmail) => {
      const hasActivated = props.notActivated.indexOf(graderEmail) === -1;
      const isSuperGrader = props.superGraders.includes(graderEmail);

      const statusElement = isSuperGrader ? (
        <Popconfirm
          title="Demote from Supergrader?"
          onConfirm={() => toggleSuperGrader(graderEmail, false)}
          okText="Demote"
          cancelText="Cancel"
        >
          <Button danger size="small">
            Demote
          </Button>
        </Popconfirm>
      ) : (
        <Popconfirm
          title="Promote to Supergrader?"
          onConfirm={() => toggleSuperGrader(graderEmail, true)}
          okText="Promote"
          cancelText="Cancel"
        >
          <Button size="small">Promote</Button>
        </Popconfirm>
      );

      const isRubricEditor = props.rubricEditors.includes(graderEmail);
      const rubricEditorStatusElement = isRubricEditor ? (
        <Popconfirm
          title="Remove Rubric Editor access?"
          onConfirm={() => toggleRubricEditor(graderEmail, false)}
          okText="Remove"
          cancelText="Cancel"
        >
          <Button danger size="small">
            Remove
          </Button>
        </Popconfirm>
      ) : (
        <Popconfirm
          title="Grant Rubric Editor access?"
          onConfirm={() => toggleRubricEditor(graderEmail, true)}
          okText="Grant"
          cancelText="Cancel"
        >
          <Button size="small">Grant</Button>
        </Popconfirm>
      );

      return {
        key: graderEmail,
        grader: graderEmail,
        status: statusElement,
        superGrader: isSuperGrader,
        rubricEditorStatus: rubricEditorStatusElement,
        isRubricEditor: isRubricEditor,
        actions: (
          <Space>
            {!hasActivated && (
              <Tooltip title="Send activation email">
                <Button shape="circle" icon={<MailOutlined />} onClick={() => sendActivationEmail(graderEmail)} />
              </Tooltip>
            )}
            <Tooltip title="Open profile">
              <Link to={location.pathname.replace('roster/graders', `submissions/by_grader/${graderEmail}`)}>
                <Button shape="circle" icon={<ProfileOutlined />} />
              </Link>
            </Tooltip>
            <Tooltip title="Unenroll">
              <Button shape="circle" icon={<UserDeleteOutlined />} onClick={() => removeGrader(graderEmail)} />
            </Tooltip>
          </Space>
        ),
      };
    });
  }

  return (
    <TableDetail
      title={'Graders'}
      loadComplete={props.loadComplete}
      isEmpty={props.graders.length === 0}
      emptyNode={
        <Empty
          styles={{
            image: {
              height: 60,
            },
          }}
          description={<span>No graders yet</span>}
        >
          <RosterFileUpload
            key={1}
            roleType="grader"
            students={props.students}
            graders={props.graders}
            admins={props.admins}
            sections={props.sections}
            sectionsByStudent={props.sectionsByStudent}
            changeRoster={props.updateRoster}
            isDisabled={false}
            updateSection={props.updateSection}
            emailNewUsers={props.currentCourse.emailNewUsers ?? false}
            createSection={props.createSection}
            course={props.currentCourse}
          />
          ,
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
              title: (
                // eslint-disable-next-line jsx-a11y/anchor-is-valid
                <a>Graders</a>
              ),
            },
          ]}
        />
      }
      titleInfo={tooltips.admin.graderRoster.title}
    />
  );
};

export default ManageGraders;
