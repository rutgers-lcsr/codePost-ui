/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* style imports */
import { Breadcrumb, Dropdown, Empty, Icon, Menu, message, Modal, Switch, Tooltip } from 'antd';
const confirm = Modal.confirm;

/* codePost imports */
import { USER_APP, USER_TYPE } from '../../../types/common';

import { CourseType } from '../../../infrastructure/course';
import { SectionType } from '../../../infrastructure/section';

import DownloadRoster from './other/DownloadRoster';
import RosterFileUpload from './other/RosterFileUpload';

import AddGraderDialog from './graders/AddGraderDialog';

import { ITableDetailColumn, TableDetail } from '../other/TableDetail';

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

  /* loading state */
  loadComplete: boolean;

  /* object-level REST operations */
  updateSection: (section: SectionType) => Promise<void>;
  updateRoster: (newRoster: string[], userType: USER_APP) => Promise<void>;
  createSection: (sectionName: string) => Promise<SectionType>;
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

  public render() {
    let actions: React.ReactNode[] = [];
    let columns: ITableDetailColumn[] = [];
    let data: any[] = [];

    if (this.props.loadComplete) {
      actions = [
        <DownloadRoster
          sectionsByStudent={this.props.sectionsByStudent}
          key={0}
          startingPage={USER_TYPE.GRADER}
          students={this.props.students}
          graders={this.props.graders}
          admins={this.props.admins}
          course={this.props.currentCourse}
          isDisabled={false}
        />,
        <RosterFileUpload
          key={1}
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
        <AddGraderDialog key={3} graders={this.props.graders} addGrader={this.addGrader} />,
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
              <Tooltip
                title={
                  <div>
                    Supergraders have elevated privileges. Read more abuot them in <a>our docs</a>.
                  </div>
                }
              >
                <Icon type="question-circle" />
              </Tooltip>
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

      data = this.props.graders.map((grader, i) => {
        let statusElement;
        if (grader === this.state.activeGrader) {
          statusElement = (
            <div>
              <Switch
                checked={this.props.superGraders.includes(grader)}
                onChange={this.toggleSuperGrader.bind(this, grader)}
              />
              &nbsp;&nbsp;
              <Icon type="edit" onClick={this.setActiveGrader.bind(this, '')} />
            </div>
          );
        } else {
          statusElement = (
            <div>
              <Switch checked={this.props.superGraders.includes(grader)} disabled={true} />
              &nbsp;&nbsp;
              <Icon type="edit" onClick={this.setActiveGrader.bind(this, grader)} />
            </div>
          );
        }

        const menu = (
          <Menu>
            <Menu.Item key="1" onClick={this.removeGrader.bind(this, grader)}>
              <Icon type="user-delete" />
              Unenroll
            </Menu.Item>
          </Menu>
        );

        return {
          key: grader,
          grader,
          status: statusElement,
          superGrader: this.props.superGraders.includes(grader),
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
            <AddGraderDialog key={0} addGrader={this.addGrader} graders={this.props.graders} />
            <br />
            <RosterFileUpload
              key={1}
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
      />
    );
  }
}

export default ManageGraders;
