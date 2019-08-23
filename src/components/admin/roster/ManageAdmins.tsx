/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* style imports */
import { Breadcrumb, Dropdown, Icon, Menu, Modal } from 'antd';
const confirm = Modal.confirm;
import { ColumnProps } from 'antd/lib/table';

/* codePost imports */
import { USER_APP, USER_TYPE } from '../../../types/common';

import { CourseType } from '../../../infrastructure/course';
import { SectionType } from '../../../infrastructure/section';

import DownloadRoster from './other/DownloadRoster';
import RosterFileUpload from './other/RosterFileUpload';

import CPTooltip from '../../../components/core/CPTooltip';
import { tooltips } from '../../../components/core/tooltips';

import AddAdminDialog from './admins/AddAdminDialog';

import { TableDetail } from '../other/TableDetail';

/**********************************************************************************************************************/

interface IProps {
  /* students data */
  students: string[];
  graders: string[];
  admins: string[];
  sections: SectionType[];
  currentCourse: CourseType;
  sectionsByStudent: { [studentEmail: string]: SectionType };

  /* loading state */
  loadComplete: boolean;

  /* object-level REST operations */
  updateSection: (section: SectionType) => Promise<void>;
  updateRoster: (newRoster: string[], userType: USER_APP) => Promise<void>;
  createSection: (sectionName: string) => Promise<SectionType>;

  /* misc */
  me: string;
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

  public addAdmin = (email: string) => {
    const newRoster = [...this.props.admins, email];
    return this.props.updateRoster(newRoster, USER_APP.CourseAdmin);
  };

  public render() {
    let actions: React.ReactNode[] = [];
    let columns: Array<ColumnProps<any>> = [];
    let data: any[] = [];

    if (this.props.loadComplete) {
      actions = [
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
        },

        {
          title: 'Actions',
          dataIndex: 'actions',
          key: 'actions',
          align: aligner,
        },
      ];

      data = this.props.admins.map((admin) => {
        const menu =
          admin === this.props.me ? (
            <Menu>
              <Menu.Item key="1" disabled={true}>
                <CPTooltip title={tooltips.admin.adminRoster.removeSelf}>
                  <Icon type="user-delete" /> &nbsp; Unenroll
                </CPTooltip>
              </Menu.Item>
            </Menu>
          ) : (
            <Menu>
              <Menu.Item key="1" onClick={this.removeAdmin.bind(this, admin)}>
                <Icon type="user-delete" />
                Unenroll
              </Menu.Item>
            </Menu>
          );

        return {
          key: admin,
          admin,
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
