/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* style imports */
import { Breadcrumb, Dropdown, Empty, Icon, Menu, message, Modal, Switch } from 'antd';
const confirm = Modal.confirm;

/* codePost imports */
import { USER_APP, USER_TYPE } from '../../../types/common';

import { CourseType } from '../../../infrastructure/course';
import { SectionType } from '../../../infrastructure/section';

import DownloadRoster from './other/DownloadRoster';
import RosterFileUpload from './other/RosterFileUpload';

import CPTooltip from '../../../components/core/CPTooltip';
import { tooltips } from '../../../components/core/tooltips';

import AddGraderDialog from './graders/AddGraderDialog';

import { ITableDetailColumn, TableDetail } from '../other/TableDetail';

import { sendEmailToUser } from './other/RosterUtils';

import SendEmailModal from '../other/SendEmailModal';

/**********************************************************************************************************************/

interface IProps {
  /* students data */
  students: string[];
  graders: string[];
  superGraders: string[];
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
  activeGrader: string;
}

class ManageGraders extends React.Component<IProps, IState> {
  public constructor(props: any) {
    super(props);
    this.state = {
      activeGrader: '',
    };
  }

  public sendActivationEmail = (grader: string) => {
    sendEmailToUser(grader, 'add_grader', this.props.currentCourse, true, undefined);
  };

  public removeGrader = (toRemove: string) => {
    confirm({
      title: `Are you sure you want to remove this grader (${toRemove}) from your course?`,
      content: `All of their work (graded submissions) won't be impacted, but the
      grader won't be able to access this course any longer. You can always add them back from this page.`,
      onOk: () => {
        const newRoster = this.props.graders.filter((student) => {
          return student !== toRemove;
        });
        return this.props.updateRoster(newRoster, USER_APP.Grader);
      },
      okText: 'Remove',
    });
  };

  public addGrader = (email: string) => {
    const newRoster = [...this.props.graders, email];
    return this.props.updateRoster(newRoster, USER_APP.Grader);
  };

  public setActiveGrader = (grader: string) => {
    this.setState({ activeGrader: grader });
  };

  public toggleSuperGrader = (grader: string, include: boolean) => {
    if (include) {
      this.props.updateRoster([...this.props.superGraders, grader], USER_APP.SuperGrader).then(() => {
        message.success(`${grader} is now a supergrader`);
      });
    } else {
      this.props
        .updateRoster(
          this.props.superGraders.filter((el) => {
            return el !== grader;
          }),
          USER_APP.SuperGrader,
        )
        .then(() => {
          message.success(`${grader} is no longer a supergrader`);
        });
    }
  };

  public toInvite = () => {
    return this.props.graders.filter((grader) => {
      return this.props.notActivated.indexOf(grader) > -1;
    });
  };

  public render() {
    let actions: React.ReactNode[] = [];
    let columns: ITableDetailColumn[] = [];
    let data: any[] = [];

    const hasInactives = this.props.notActivated.some((el) => {
      return this.props.graders.indexOf(el) > -1;
    });

    if (this.props.loadComplete) {
      actions = [
        hasInactives ? (
          <SendEmailModal
            key="activation"
            buttonText="Send invites"
            title="Send activation emails to graders"
            template="add_graders"
            course={this.props.currentCourse}
            me={this.props.myEmail}
            filterFunction={this.toInvite}
            body={
              <div>
                Send activation emails to all graders who have not yet joined codePost. Users who have signed up won't
                be emailed.
              </div>
            }
          />
        ) : null,
        <DownloadRoster
          sectionsByStudent={this.props.sectionsByStudent}
          key={0}
          startingPage={USER_TYPE.GRADER}
          students={this.props.students}
          graders={this.props.graders}
          admins={this.props.admins}
          course={this.props.currentCourse}
          isDisabled={false}
          downloadType={USER_TYPE.GRADER}
        />,
        <RosterFileUpload
          key={1}
          roleType="grader"
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
        <AddGraderDialog
          key={3}
          graders={this.props.graders}
          addGrader={this.addGrader}
          willEmailUser={this.props.currentCourse.emailNewUsers}
        />,
      ];

      const aligner: 'left' | 'center' | 'right' = 'center';
      columns = [
        {
          title: 'Grader',
          dataIndex: 'grader',
          key: 'primary',
          sorter: (a: any, b: any) => a.key.localeCompare(b.key),
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
          title: 'Actions',
          dataIndex: 'actions',
          key: 'actions',
          align: aligner,
        },
      ];

      data = this.props.graders.map((graderEmail, i) => {
        const hasActivated = this.props.notActivated.indexOf(graderEmail) === -1;
        let statusElement;
        if (graderEmail === this.state.activeGrader) {
          statusElement = (
            <div>
              <Switch
                checked={this.props.superGraders.includes(graderEmail)}
                onChange={this.toggleSuperGrader.bind(this, graderEmail)}
              />
              &nbsp;&nbsp;
              <Icon type="edit" onClick={this.setActiveGrader.bind(this, '')} />
            </div>
          );
        } else {
          statusElement = (
            <div>
              <Switch checked={this.props.superGraders.includes(graderEmail)} disabled={true} />
              &nbsp;&nbsp;
              <Icon type="edit" onClick={this.setActiveGrader.bind(this, graderEmail)} />
            </div>
          );
        }

        const menu = (
          <Menu>
            {hasActivated ? null : (
              <Menu.Item key="activation" onClick={this.sendActivationEmail.bind(this, graderEmail)}>
                <Icon type="mail" />
                Send activation email
              </Menu.Item>
            )}
            <Menu.Item key="1" onClick={this.removeGrader.bind(this, graderEmail)}>
              <Icon type="user-delete" />
              Unenroll
            </Menu.Item>
          </Menu>
        );

        return {
          key: graderEmail,
          grader: hasActivated ? (
            graderEmail
          ) : (
            <span style={{ color: '#80808082' }}>
              <CPTooltip title="This user has not yet signed up for codePost.">
                {graderEmail} &nbsp; <Icon type="disconnect" />
              </CPTooltip>
            </span>
          ),
          status: statusElement,
          superGrader: this.props.superGraders.includes(graderEmail),
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
        title={'Graders'}
        loadComplete={this.props.loadComplete}
        isEmpty={this.props.graders.length === 0}
        emptyNode={
          <Empty
            imageStyle={{
              height: 60,
            }}
            description={<span>No graders yet</span>}
          >
            <AddGraderDialog
              key={0}
              addGrader={this.addGrader}
              graders={this.props.graders}
              willEmailUser={this.props.currentCourse.emailNewUsers}
            />
            <br />
            <RosterFileUpload
              key={1}
              roleType="grader"
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
            />
            ,
          </Empty>
        }
        columns={columns}
        data={data}
        actions={actions}
        breadcrumbs={
          <Breadcrumb>
            <Breadcrumb.Item>Roster</Breadcrumb.Item>
            <Breadcrumb.Item>
              <a>Graders</a>
            </Breadcrumb.Item>
          </Breadcrumb>
        }
        titleInfo={tooltips.admin.graderRoster.title}
      />
    );
  }
}

export default ManageGraders;
