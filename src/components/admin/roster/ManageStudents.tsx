/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

import {
  DisconnectOutlined,
  EditOutlined,
  FolderOpenOutlined,
  MailOutlined,
  MenuOutlined,
  UserDeleteOutlined,
} from '@ant-design/icons';

/* style imports */
import { Breadcrumb, Dropdown, Empty, message, Modal, Select, Spin } from 'antd';

/* other library imports */
import memoizeOne from 'memoize-one';
import Highlighter from 'react-highlight-words';
import { RouteComponentProps } from 'react-router';
import { Link } from 'react-router-dom';

/* codePost imports */
import { USER_APP, USER_TYPE } from '../../../types/common';

import { CourseType } from '../../../infrastructure/course';
import { SectionType } from '../../../infrastructure/section';

import CPTooltip from '../../../components/core/CPTooltip';
import { tooltips } from '../../../components/core/tooltips';

import DownloadRoster from './other/DownloadRoster';
import RosterFileUpload from './other/RosterFileUpload';

import { ITableDetailColumn, TableDetail } from '../other/TableDetail';

import ShareInviteCode from './other/ShareInviteCode';

import { sendEmailToUser } from './other/RosterUtils';

import SendEmailModal from '../other/SendEmailModal';

const confirm = Modal.confirm;

/**********************************************************************************************************************/

export interface IManageStudentsProps {
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
  sectionsLoadComplete: boolean;

  /* object-level REST operations */
  updateStudentSection: (student: string, section: number) => Promise<void>;
  updateSection: (section: SectionType) => Promise<void>;
  createSection: (sectionName: string) => Promise<SectionType>;
  updateRoster: (adds: string[], deletes: string[], userType: USER_APP) => Promise<void>;

  /* misc */
  myEmail: string;
}

interface IState {
  activeStudent: string;
}

class ManageStudents extends React.Component<IManageStudentsProps & RouteComponentProps, IState> {
  public constructor(props: IManageStudentsProps & RouteComponentProps) {
    super(props);
    this.state = {
      activeStudent: '',
    };
  }

  public sendActivationEmail = (student: string) => {
    sendEmailToUser(student, 'add_student', this.props.currentCourse, true, undefined);
  };

  public removeStudent = (toRemove: string) => {
    confirm({
      title: `Are you sure you want to remove this student (${toRemove}) from your course?`,
      content: `All the student's work will be saved, but they won't be able to access the course.
        You can always add them back from this page.`,
      onOk: () => {
        return this.props.updateRoster([], [toRemove], USER_APP.Student);
      },
      okText: 'Remove',
    });
  };

  public addStudent = (email: string, section?: SectionType): Promise<void> => {
    return this.props.updateRoster([email], [], USER_APP.Student).then(() => {
      if (typeof section !== 'undefined') {
        return this.props.updateStudentSection(email, section.id);
      } else {
        return;
      }
    });
  };

  public setActiveStudent = (student: string) => {
    this.setState({ activeStudent: student });
  };

  public updateStudentSection = (student: string, section: number) => {
    this.props.updateStudentSection(student, section).then(() => {
      message.success(`Updated ${student}'s section.`);
    });
  };

  public toInvite = memoizeOne((students: string[], inactiveUsers: string[]) => {
    return students.filter((student) => {
      return inactiveUsers.indexOf(student) > -1;
    });
  });

  public render() {
    let actions: React.ReactNode[] = [];
    let columns: ITableDetailColumn[] = [];
    let data: any[] = [];

    const inactiveEmails = this.toInvite(this.props.students, this.props.notActivated);

    if (this.props.students.length > 0) {
      actions = [
        inactiveEmails.length > 0 ? (
          <SendEmailModal
            key="activation"
            buttonText="Send invites"
            title="Send activation emails to students"
            template="add_student"
            course={this.props.currentCourse}
            me={this.props.myEmail}
            emails={inactiveEmails}
            body={
              <div>
                Send activation emails to all students who have not yet joined codePost. Users who have signed up won't
                be emailed.
              </div>
            }
          />
        ) : null,
        <ShareInviteCode course={this.props.currentCourse} />,
        <DownloadRoster
          key={0}
          downloadType={USER_TYPE.STUDENT}
          sectionsByStudent={this.props.sectionsByStudent}
          startingPage={USER_TYPE.STUDENT}
          students={this.props.students}
          graders={this.props.graders}
          admins={this.props.admins}
          course={this.props.currentCourse}
          isDisabled={false}
        />,
        <RosterFileUpload
          key={1}
          roleType="student"
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
      const sections = this.props.sectionsByStudent;
      columns = [
        {
          title: 'Student',
          dataIndex: 'student',
          key: 'primary',
          sorter: (a: any, b: any) => a.key.localeCompare(b.key),
          renderForSearch: (searchText: string) => {
            return (text: string, record: any, index: number) => {
              const studentEmail = record.student;
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
              const hasActivated = this.props.notActivated.indexOf(studentEmail) === -1;
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
          title: 'Section',
          dataIndex: 'section',
          key: 'section',
          align: aligner,
          sorter: (a: any, b: any) => {
            if (a === b) {
              return 0;
            } else if (a.section === 'No section') {
              return 1;
            } else if (b.section === 'No section') {
              return -1;
            } else {
              // save most expensive operation for last
              return a.section.localeCompare(b.section);
            }
          },
          renderForSearch: (searchText: string) => {
            return (text: string, record: any, index: number) => {
              const student = record.key;
              if (!this.props.sectionsLoadComplete) {
                return <Spin />;
              }
              if (student === this.state.activeStudent) {
                return (
                  <div>
                    <Select
                      style={{ width: 150 }}
                      onChange={this.updateStudentSection.bind(this, student)}
                      defaultValue={sections[student] ? sections[student].id : 0}
                    >
                      {[
                        ...this.props.sections
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map((section) => {
                            return (
                              <Select.Option key={section.name} value={section.id}>
                                {section.name}
                              </Select.Option>
                            );
                          }),
                        <Select.Option key={0} value={0}>
                          No section
                        </Select.Option>,
                      ]}
                    </Select>
                    &nbsp;
                    <CPTooltip title={tooltips.admin.studentRoster.lockSection} hideThisOnHideTips={true}>
                      <EditOutlined onClick={this.setActiveStudent.bind(this, '')} />
                    </CPTooltip>
                  </div>
                );
              } else {
                return (
                  <div>
                    <Highlighter
                      highlightStyle={{
                        backgroundColor: '#5CBB8B',
                        padding: 0,
                      }}
                      searchWords={[searchText]}
                      autoEscape
                      textToHighlight={sections[student] ? sections[student].name : 'No section'}
                    />{' '}
                    &nbsp;
                    <CPTooltip title={tooltips.admin.studentRoster.editSection} hideThisOnHideTips={true}>
                      <EditOutlined onClick={this.setActiveStudent.bind(this, student)} />
                    </CPTooltip>
                  </div>
                );
              }
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

      data = this.props.students.map((studentEmail, i) => {
        const hasActivated = this.props.notActivated.indexOf(studentEmail) === -1;

        const menuItems = [
          ...(hasActivated
            ? []
            : [
                {
                  key: 'activation',
                  label: (
                    <>
                      <MailOutlined /> Send activation email
                    </>
                  ),
                  onClick: this.sendActivationEmail.bind(this, studentEmail),
                },
              ]),
          {
            key: 'profile',
            label: (
              <Link to={this.props.match.url.replace('roster/students', `submissions/by_student/${studentEmail}`)}>
                <FolderOpenOutlined /> &nbsp; Open profile
              </Link>
            ),
          },
          {
            key: '1',
            label: (
              <>
                <UserDeleteOutlined /> Unenroll
              </>
            ),
            onClick: this.removeStudent.bind(this, studentEmail),
          },
        ];

        return {
          key: studentEmail,
          student: studentEmail,
          section: sections[studentEmail] ? sections[studentEmail].name : 'No section',
          actions: (
            <Dropdown menu={{ items: menuItems }} trigger={['click']}>
              <MenuOutlined />
            </Dropdown>
          ),
        };
      });
    }

    return (
      <TableDetail
        loadComplete={this.props.loadComplete}
        title={'Students'}
        isEmpty={this.props.students.length === 0}
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
                key={1}
                roleType="student"
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
                buttonText="Add students by email"
              />
              <br />
              OR <br /> <br />
              <ShareInviteCode course={this.props.currentCourse} />
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
                title: (
                  // eslint-disable-next-line jsx-a11y/anchor-is-valid
                  <a>Students</a>
                ),
              },
            ]}
          />
        }
        titleInfo={tooltips.admin.studentRoster.title}
      />
    );
  }
}

export default ManageStudents;
