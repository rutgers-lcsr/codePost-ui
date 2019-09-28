/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* style imports */
import { Breadcrumb, Dropdown, Icon, Menu, Modal } from 'antd';

/* other library imports */
import Highlighter from 'react-highlight-words';

/* codePost imports */
import { USER_APP, USER_TYPE } from '../../../types/common';

import { CourseType } from '../../../infrastructure/course';
import { SectionType } from '../../../infrastructure/section';

import DownloadRoster from './other/DownloadRoster';
import RosterFileUpload from './other/RosterFileUpload';

import CPTooltip from '../../../components/core/CPTooltip';
import { tooltips } from '../../../components/core/tooltips';

import AddAdminDialog from './admins/AddAdminDialog';

import { ITableDetailColumn, TableDetail } from '../other/TableDetail';

import { sendEmailToUser } from './other/RosterUtils';

import SendEmailModal from '../other/SendEmailModal';

const confirm = Modal.confirm;

/**********************************************************************************************************************/

interface IProps {
  /* students data */
  students: string[];
  graders: string[];
  admins: string[];
  sections: SectionType[];
  currentCourse: CourseType;
  sectionsByStudent: { [studentEmail: string]: SectionType };
  notActivated: string[];

  /* loading state */
  loadComplete: boolean;

  /* object-level REST operations */
  updateSection: (section: SectionType) => Promise<void>;
  updateRoster: (newRoster: string[], userType: USER_APP) => Promise<void>;
  createSection: (sectionName: string) => Promise<SectionType>;

  /* misc */
  myEmail: string;
}

interface IState {
  searchText: string;
}

class ManageAdmins extends React.Component<IProps, IState> {
  public removeAdmin = (toRemove: string) => {
    confirm({
      title: `Are you sure you want to remove this admin ${toRemove} from your course?`,
      content: `Once removed, they won't be able to access the course.
        You can always add them back from this page.`,
      onOk: () => {
        const newRoster = this.props.admins.filter((admin) => {
          return admin !== toRemove;
        });
        return this.props.updateRoster(newRoster, USER_APP.CourseAdmin);
      },
      okText: 'Remove',
    });
  };

  public sendActivationEmail = (admin: string) => {
    sendEmailToUser(admin, 'add_admin', this.props.currentCourse, true, undefined);
  };

  public addAdmin = (email: string) => {
    const newRoster = [...this.props.admins, email];
    return this.props.updateRoster(newRoster, USER_APP.CourseAdmin);
  };

  public toInvite = () => {
    return this.props.admins.filter((admin) => {
      return this.props.notActivated.indexOf(admin) > -1;
    });
  };

  public render() {
    let actions: React.ReactNode[] = [];
    let columns: ITableDetailColumn[] = [];
    let data: any[] = [];

    const hasInactives = this.props.notActivated.some((el) => {
      return this.props.admins.indexOf(el) > -1;
    });

    if (this.props.loadComplete) {
      actions = [
        hasInactives ? (
          <SendEmailModal
            key="activation"
            buttonText="Send invites"
            title="Send activation emails to admins"
            template="add_admin"
            course={this.props.currentCourse}
            me={this.props.myEmail}
            filterFunction={this.toInvite}
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
          sectionsByStudent={this.props.sectionsByStudent}
          key={0}
          startingPage={USER_TYPE.ADMIN}
          students={this.props.students}
          graders={this.props.graders}
          admins={this.props.admins}
          course={this.props.currentCourse}
          isDisabled={false}
        />,
        <RosterFileUpload
          key={1}
          roleType="admin"
          students={this.props.students}
          graders={this.props.graders}
          admins={this.props.admins}
          sections={this.props.sections}
          sectionsByStudent={this.props.sectionsByStudent}
          changeRoster={this.props.updateRoster}
          isDisabled={false}
          updateSection={this.props.updateSection}
          emailUsers={this.props.currentCourse ? this.props.currentCourse.emailNewUsers : false}
          createSection={this.props.createSection}
          course={this.props.currentCourse}
        />,
        <AddAdminDialog
          key={3}
          admins={this.props.admins}
          addAdmin={this.addAdmin}
          willEmailUser={this.props.currentCourse.emailNewUsers}
        />,
      ];

      const aligner: 'left' | 'center' | 'right' = 'center';
      columns = [
        {
          title: 'Admin',
          dataIndex: 'admin',
          key: 'primary',
          sorter: (a: any, b: any) => a.key.localeCompare(b.key),
          renderForSearch: (searchText: string) => {
            return (text: string, record: any, index: number) => {
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
              const hasActivated = this.props.notActivated.indexOf(adminEmail) === -1;
              return hasActivated ? (
                highlightedEmail
              ) : (
                <span style={{ color: '#80808082' }}>
                  <CPTooltip title="This user has not yet signed up for codePost.">
                    {highlightedEmail} &nbsp; <Icon type="disconnect" />
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
          align: aligner,
        },
      ];

      data = this.props.admins.map((adminEmail) => {
        const hasActivated = this.props.notActivated.indexOf(adminEmail) === -1;
        const menu =
          adminEmail === this.props.myEmail ? (
            <Menu>
              <Menu.Item key="1" disabled={true}>
                <CPTooltip title={tooltips.admin.adminRoster.removeSelf}>
                  <Icon type="user-delete" /> &nbsp; Unenroll
                </CPTooltip>
              </Menu.Item>
            </Menu>
          ) : (
            <Menu>
              {hasActivated ? null : (
                <Menu.Item key="activation" onClick={this.sendActivationEmail.bind(this, adminEmail)}>
                  <Icon type="mail" />
                  Send activation email
                </Menu.Item>
              )}
              <Menu.Item key="1" onClick={this.removeAdmin.bind(this, adminEmail)}>
                <Icon type="user-delete" />
                Unenroll
              </Menu.Item>
            </Menu>
          );

        return {
          key: adminEmail,
          admin: adminEmail,
          actions: (
            <Dropdown overlay={menu} trigger={['click']}>
              <Icon type="menu" />
            </Dropdown>
          ),
        };
      });
    }

    return (
      <TableDetail
        title={'Admins'}
        loadComplete={this.props.loadComplete}
        isEmpty={this.props.admins.length === 0}
        emptyNode={null}
        columns={columns}
        data={data}
        actions={actions}
        breadcrumbs={
          <Breadcrumb>
            <Breadcrumb.Item>Roster</Breadcrumb.Item>
            <Breadcrumb.Item>
              <a>Admins</a>
            </Breadcrumb.Item>
          </Breadcrumb>
        }
        titleInfo={tooltips.admin.adminRoster.title}
      />
    );
  }
}

export default ManageAdmins;
