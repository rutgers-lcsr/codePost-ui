// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';
import { useCallback, useMemo } from 'react';

import { DisconnectOutlined, MailOutlined, UserDeleteOutlined } from '@ant-design/icons';

/* style imports */
import { Breadcrumb, Button, Modal, Space, Tooltip } from 'antd';

/* other library imports */
import Highlighter from 'react-highlight-words';

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

interface IAdminTableData {
  key: string;
  admin: string;
  actions: React.ReactNode;
}
/**********************************************************************************************************************/

export interface IManageAdminsProps {
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

  /* object-level REST operations */
  updateSection: (section: Section) => Promise<void>;
  updateRoster: (adds: string[], deletes: string[], userType: USER_APP) => Promise<void>;
  createSection: (sectionName: string) => Promise<Section>;

  /* misc */
  myEmail: string;
}

const ManageAdmins: React.FC<IManageAdminsProps> = (props) => {
  const removeAdmin = useCallback(
    (toRemove: string) => {
      confirm({
        title: `Are you sure you want to remove this admin ${toRemove} from your course?`,
        content: `Once removed, they won't be able to access the course.
        You can always add them back from this page.`,
        onOk: () => {
          return props.updateRoster([], [toRemove], USER_APP.CourseAdmin);
        },
        okText: 'Remove',
      });
    },
    [props.updateRoster],
  );

  const sendActivationEmail = useCallback(
    (admin: string) => {
      sendEmailToUser(admin, 'add_admin', props.currentCourse, true, undefined);
    },
    [props.currentCourse],
  );

  const inactiveEmails = useMemo(() => {
    return props.admins.filter((admin) => {
      return props.notActivated.indexOf(admin) > -1;
    });
  }, [props.admins, props.notActivated]);

  let actions: React.ReactNode[] = [];
  let columns: ITableDetailColumn[] = [];

  let data: IAdminTableData[] = [];

  if (props.loadComplete) {
    actions = [
      inactiveEmails.length > 0 ? (
        <SendEmailModal
          key="activation"
          buttonText="Send invites"
          title="Send activation emails to admins"
          template="add_admin"
          course={props.currentCourse}
          me={props.myEmail}
          emails={inactiveEmails}
          body={
            <div>
              Send activation emails to all admins who have not yet joined codePost. Users who have signed up won't be
              emailed.
            </div>
          }
        />
      ) : null,
      <DownloadRoster
        downloadType={USER_TYPE.ADMIN}
        sectionsByStudent={props.sectionsByStudent}
        key={0}
        startingPage={USER_TYPE.ADMIN}
        students={props.students}
        graders={props.graders}
        admins={props.admins}
        course={props.currentCourse}
        isDisabled={false}
      />,
      <RosterFileUpload
        key={1}
        roleType="admin"
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

    columns = [
      {
        title: 'Admin',
        dataIndex: 'admin',
        key: 'primary',
        sorter: (a: { key: string }, b: { key: string }) => a.key.localeCompare(b.key),
        renderForSearch: (searchText: string) => {
          return (_text: string, record: { admin: string; key: string }, _index: number) => {
            const adminEmail = record.admin;
            const highlightedEmail = (
              <Highlighter
                highlightStyle={{
                  backgroundColor: '#5CBB8B',
                  padding: 0,
                }}
                searchWords={[searchText]}
                autoEscape
                textToHighlight={adminEmail}
              />
            );
            const hasActivated = props.notActivated.indexOf(adminEmail) === -1;
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
        title: 'Actions',
        dataIndex: 'actions',
        key: 'actions',
        align: 'right' as const,
      },
    ];

    data = props.admins.map((adminEmail) => {
      const hasActivated = props.notActivated.indexOf(adminEmail) === -1;
      const isSelf = adminEmail === props.myEmail;

      return {
        key: adminEmail,
        admin: adminEmail,
        actions: (
          <Space>
            {!hasActivated && !isSelf && (
              <Tooltip title="Send activation email">
                <Button shape="circle" icon={<MailOutlined />} onClick={() => sendActivationEmail(adminEmail)} />
              </Tooltip>
            )}
            <Tooltip title={isSelf ? tooltips.admin.adminRoster.removeSelf : 'Unenroll'}>
              <Button
                shape="circle"
                icon={<UserDeleteOutlined />}
                disabled={isSelf}
                onClick={isSelf ? undefined : () => removeAdmin(adminEmail)}
              />
            </Tooltip>
          </Space>
        ),
      };
    });
  }

  return (
    <TableDetail
      title={'Admins'}
      loadComplete={props.loadComplete}
      isEmpty={props.admins.length === 0}
      emptyNode={null}
      columns={columns}
      data={data}
      actions={actions}
      breadcrumbs={
        <Breadcrumb
          items={[
            { title: 'Roster' },
            {
              title: <a>Admins</a>,
            },
          ]}
        />
      }
      titleInfo={tooltips.admin.adminRoster.title}
    />
  );
};

export default ManageAdmins;
