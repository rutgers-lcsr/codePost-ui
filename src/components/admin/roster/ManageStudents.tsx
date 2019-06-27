/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* style imports */
import { Breadcrumb, Dropdown, Empty, Icon, Menu, message, Modal, Select } from 'antd';
const confirm = Modal.confirm;

/* other library imports */
import Highlighter from 'react-highlight-words';

/* codePost imports */
import { USER_APP, USER_TYPE } from '../../../types/common';

import { CourseType } from '../../../infrastructure/course';
import { SectionType } from '../../../infrastructure/section';

import AddStudentDialog from './students/AddStudentDialog';

import DownloadRoster from './other/DownloadRoster';
import RosterFileUpload from './other/RosterFileUpload';

import { ITableDetailColumn, TableDetail } from '../other/TableDetail';

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
  updateStudentSection: (student: string, section: number) => Promise<void>;
  updateSection: (section: SectionType) => Promise<void>;
  createSection: (sectionName: string) => Promise<SectionType>;
  updateRoster: (newRoster: string[], userType: USER_APP) => Promise<void>;
}

interface IState {
  activeStudent: string;
}

class ManageStudents extends React.Component<IProps, IState> {
  public constructor(props: IProps) {
    super(props);
    this.state = {
      activeStudent: '',
    };
  }

  public removeStudent = (toRemove: string) => {
    confirm({
      title: `Are you sure you want to remove this student (${toRemove}) from your course?`,
      content: `All the student's work will be saved, but they won't be able to access the course.
        You can always add them back from this page.`,
      onOk: () => {
        const newRoster = this.props.students.filter((student) => {
          return student !== toRemove;
        });
        return this.props.updateRoster(newRoster, USER_APP.Student);
      },
      okText: 'Remove',
    });
  };

  public addStudent = (email: string, section?: SectionType): Promise<void> => {
    const newRoster = [...this.props.students, email];
    return this.props.updateRoster(newRoster, USER_APP.Student).then(() => {
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

  public render() {
    let actions: React.ReactNode[] = [];
    let columns: ITableDetailColumn[] = [];
    let data: any[] = [];

    if (this.props.students.length > 0) {
      actions = [
        <DownloadRoster
          key={0}
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
        <AddStudentDialog
          key={2}
          willEmailUser={this.props.currentCourse.emailNewUsers}
          sections={this.props.sections}
          addStudent={this.addStudent}
          students={this.props.students}
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
              const student = record.student;
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
                    &nbsp; <Icon type="edit" onClick={this.setActiveStudent.bind(this, '')} />
                  </div>
                );
              } else {
                return (
                  <div>
                    <Highlighter
                      highlightStyle={{ backgroundColor: '#5CBB8B', padding: 0 }}
                      searchWords={[searchText]}
                      autoEscape
                      textToHighlight={sections[student] ? sections[student].name : 'No section'}
                    />{' '}
                    &nbsp;
                    <Icon type="edit" onClick={this.setActiveStudent.bind(this, student)} />
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

      data = this.props.students.map((student, i) => {
        const menu = (
          <Menu>
            <Menu.Item key="1" onClick={this.removeStudent.bind(this, student)}>
              <Icon type="user-delete" />
              Unenroll
            </Menu.Item>
          </Menu>
        );

        return {
          key: student,
          student,
          section: sections[student] ? sections[student].name : 'No section',
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
        loadComplete={this.props.loadComplete}
        title={'Students'}
        isEmpty={this.props.students.length === 0}
        emptyNode={
          <Empty
            imageStyle={{
              height: 60,
            }}
            description={<span>No students yet</span>}
          >
            <AddStudentDialog
              key={0}
              willEmailUser={this.props.currentCourse.emailNewUsers}
              sections={this.props.sections}
              addStudent={this.addStudent}
              students={this.props.students}
            />
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
          </Empty>
        }
        columns={columns}
        data={data}
        actions={actions}
        breadcrumbs={
          <Breadcrumb>
            <Breadcrumb.Item>Roster</Breadcrumb.Item>
            <Breadcrumb.Item>
              <a>Students</a>
            </Breadcrumb.Item>
          </Breadcrumb>
        }
      />
    );
  }
}

export default ManageStudents;
