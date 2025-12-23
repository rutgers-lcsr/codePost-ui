/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

import {
  DisconnectOutlined,
  EditOutlined,
  MailOutlined,
  ProfileOutlined,
  UserDeleteOutlined,
} from '@ant-design/icons';

/* style imports */
import { Breadcrumb, Button, Empty, message, Modal, Space, Switch, Tooltip } from 'antd';

/* other library imports */
import memoizeOne from 'memoize-one';
import Highlighter from 'react-highlight-words';
import { RouteComponentProps } from '../../../router/legacy';
import { Link } from 'react-router-dom';

/* codePost imports */
import { USER_APP, USER_TYPE } from '../../../types/common';

import { CourseType } from '../../../infrastructure/course';
import { SectionType } from '../../../infrastructure/section';

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
  admins: string[];
  sections: SectionType[];
  currentCourse: CourseType;
  sectionsByStudent: { [studentEmail: string]: SectionType };
  notActivated: string[];

  /* loading state */
  loadComplete: boolean;

  /* object-level REST operations */
  updateSection: (section: SectionType) => Promise<void>;
  updateRoster: (adds: string[], deletes: string[], userType: USER_APP) => Promise<void>;
  createSection: (sectionName: string) => Promise<SectionType>;

  /* misc */
  myEmail: string;
}

interface IState {
  activeGrader: string;
}

class ManageGraders extends React.Component<IManageGradersProps & RouteComponentProps, IState> {
  public constructor(props: IManageGradersProps & RouteComponentProps) {
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
        return this.props.updateRoster([], [toRemove], USER_APP.Grader);
      },
      okText: 'Remove',
    });
  };

  public addGrader = (email: string) => {
    return this.props.updateRoster([email], [], USER_APP.Grader);
  };

  public setActiveGrader = (grader: string) => {
    this.setState({ activeGrader: grader });
  };

  public toggleSuperGrader = (grader: string, include: boolean) => {
    if (include) {
      this.props.updateRoster([grader], [], USER_APP.SuperGrader).then(() => {
        message.success(`${grader} is now a supergrader`);
      });
    } else {
      this.props.updateRoster([], [grader], USER_APP.SuperGrader).then(() => {
        message.success(`${grader} is no longer a supergrader`);
      });
    }
  };

  public toInvite = memoizeOne((graders: string[], inactiveUsers: string[]) => {
    return graders.filter((grader) => {
      return inactiveUsers.indexOf(grader) > -1;
    });
  });

  public render() {
    let actions: React.ReactNode[] = [];
    let columns: ITableDetailColumn[] = [];
    let data: any[] = [];

    const inactiveEmails = this.toInvite(this.props.graders, this.props.notActivated);

    if (this.props.loadComplete) {
      actions = [
        inactiveEmails.length > 0 ? (
          <SendEmailModal
            key="activation"
            buttonText="Send invites"
            title="Send activation emails to graders"
            template="add_grader"
            course={this.props.currentCourse}
            me={this.props.myEmail}
            emails={inactiveEmails}
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
          emailNewUsers={this.props.currentCourse ? this.props.currentCourse.emailNewUsers : false}
          createSection={this.props.createSection}
          course={this.props.currentCourse}
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
              const hasActivated = this.props.notActivated.indexOf(graderEmail) === -1;
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
          title: 'Actions',
          dataIndex: 'actions',
          key: 'actions',
          align: 'right' as const,
        },
      ];

      data = this.props.graders.map((graderEmail) => {
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
              <EditOutlined onClick={this.setActiveGrader.bind(this, '')} />
            </div>
          );
        } else {
          statusElement = (
            <div>
              <Switch checked={this.props.superGraders.includes(graderEmail)} disabled={true} />
              &nbsp;&nbsp;
              <EditOutlined onClick={this.setActiveGrader.bind(this, graderEmail)} />
            </div>
          );
        }
        return {
          key: graderEmail,
          grader: graderEmail,
          status: statusElement,
          superGrader: this.props.superGraders.includes(graderEmail),
          actions: (
            <Space>
              {!hasActivated && (
                <Tooltip title="Send activation email">
                  <Button
                    shape="circle"
                    icon={<MailOutlined />}
                    onClick={this.sendActivationEmail.bind(this, graderEmail)}
                  />
                </Tooltip>
              )}
              <Tooltip title="Open profile">
                <Link to={this.props.match.url.replace('roster/graders', `submissions/by_grader/${graderEmail}`)}>
                  <Button shape="circle" icon={<ProfileOutlined />} />
                </Link>
              </Tooltip>
              <Tooltip title="Unenroll">
                <Button
                  shape="circle"
                  icon={<UserDeleteOutlined />}
                  onClick={this.removeGrader.bind(this, graderEmail)}
                />
              </Tooltip>
            </Space>
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
              students={this.props.students}
              graders={this.props.graders}
              admins={this.props.admins}
              sections={this.props.sections}
              sectionsByStudent={this.props.sectionsByStudent}
              changeRoster={this.props.updateRoster}
              isDisabled={false}
              updateSection={this.props.updateSection}
              emailNewUsers={this.props.currentCourse ? this.props.currentCourse.emailNewUsers : false}
              createSection={this.props.createSection}
              course={this.props.currentCourse}
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
  }
}

export default ManageGraders;
