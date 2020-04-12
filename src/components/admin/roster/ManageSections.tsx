/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* style imports */
import { Breadcrumb, Drawer, Dropdown, Empty, Icon, Menu, message, Modal, Select, Table } from 'antd';

/* other library imports */
import Highlighter from 'react-highlight-words';

/* codePost imports */
import { USER_APP } from '../../../types/common';

import { CourseType } from '../../../infrastructure/course';
import { SectionType } from '../../../infrastructure/section';

import AddSectionDialog from './sections/AddSectionDialog';

import { tooltips } from '../../../components/core/tooltips';

import { ITableDetailColumn, TableDetail } from '../other/TableDetail';

const confirm = Modal.confirm;

/**********************************************************************************************************************/

export interface IManageSectionsProps {
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
  updateRoster: (adds: string[], deletes: string[], userType: USER_APP) => Promise<void>;
  deleteSection: (sectionID: number) => Promise<void>;
  createSection: (sectionName: string) => Promise<SectionType>;
  updateSection: (section: SectionType) => Promise<void>;
}

interface IState {
  activeSection: string;
  openSection?: SectionType;
  drawerOpen: boolean;
}

class ManageSections extends React.Component<IManageSectionsProps, IState> {
  public constructor(props: IManageSectionsProps) {
    super(props);
    this.state = {
      activeSection: '',
      drawerOpen: false,
    };
  }

  public setActiveSection = (section: string) => {
    this.setState({ activeSection: section });
  };

  public deleteSection = (toRemove: number) => {
    confirm({
      title: 'Are you sure you want to delete this section?',
      onOk: () => {
        return this.props.deleteSection(toRemove);
      },
      okText: 'Delete',
    });
  };

  public changeLeaders = (section: number, leaders: string[]) => {
    const sectionObj = this.props.sections.find((el) => {
      return el.id === section;
    });
    if (sectionObj) {
      const updated = { ...sectionObj };
      updated.leaders = leaders;
      this.props.updateSection(updated).then(() => {
        message.success('Leaders updated');
      });
    }
  };

  public setOpenSection = (section: SectionType | undefined) => {
    if (section === undefined) {
      this.setState({ drawerOpen: false }, () => {
        // don't replace state.openSection until we've unmounted the drawer (otherwise, drawer state
        // changes during the unmounting slide)
        setTimeout(() => {
          this.setState({ openSection: undefined });
        }, 500);
      });
    } else {
      this.setState({ openSection: section, drawerOpen: true });
    }
  };

  public render() {
    let actions: React.ReactNode[] = [];
    let columns: ITableDetailColumn[] = [];
    let data: any[] = [];

    if (this.props.loadComplete) {
      actions = [<AddSectionDialog key={2} sections={this.props.sections} addSection={this.props.createSection} />];

      const aligner: 'left' | 'center' | 'right' = 'center';
      columns = [
        {
          title: 'Sections',
          dataIndex: 'section',
          key: 'primary',
          sorter: (a: any, b: any) => a.section.localeCompare(b.section),
        },
        {
          title: 'Students',
          dataIndex: 'students',
          key: 'students',
          align: aligner,
        },
        {
          title: 'Leaders',
          dataIndex: 'leaders',
          key: 'leaders',
          align: aligner,
          renderForSearch: (searchText: string) => {
            return (text: string, record: any, index: number) => {
              if (record.section === this.state.activeSection) {
                return (
                  <div>
                    <Select
                      mode="multiple"
                      value={record.leaderData}
                      onChange={this.changeLeaders.bind(this, record.key)}
                      style={{ width: 400 }}
                    >
                      {this.props.graders.map((grader) => {
                        return <Select.Option key={grader}>{grader}</Select.Option>;
                      })}
                    </Select>{' '}
                    &nbsp;&nbsp;
                    <Icon type="edit" onClick={this.setActiveSection.bind(this, '')} />
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
                      textToHighlight={record.leaderData.length === 0 ? 'No leaders' : record.leaderData.join(', ')}
                    />
                    &nbsp;&nbsp;
                    <Icon type="edit" onClick={this.setActiveSection.bind(this, record.section)} />
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

      const hoverStyle = { cursor: 'pointer' };
      data = this.props.sections.map((section, i) => {
        const menu = (
          <Menu>
            <Menu.Item key="1" onClick={this.deleteSection.bind(this, section.id)}>
              <Icon type="delete" />
              Delete
            </Menu.Item>
          </Menu>
        );

        return {
          key: section.id,
          section: section.name,
          students: (
            <span onClick={this.setOpenSection.bind(this, section)} className="text-link" style={hoverStyle}>
              {section.students.length}
            </span>
          ),
          leaderData: section.leaders, // for passing data to render function
          leadersForSearch: section.leaders.join(', '), // to make leaders searchable
          actions: (
            <Dropdown overlay={menu} trigger={['click']}>
              <Icon type="menu" />
            </Dropdown>
          ),
        };
      });
    }

    const drawerColumns = [
      {
        title: 'Student',
        dataIndex: 'student',
        key: 'student',
        align: 'left' as 'left' | 'center' | 'right' /* this is so ugly.. */,
      },
    ];

    // tslint:disable
    const drawerData =
      this.state.openSection === undefined
        ? []
        : this.state.openSection.students.map((el) => {
            return {
              student: el,
            };
          });
    // tslint:enable

    const drawerComponent = (
      <Drawer
        title={this.state.openSection ? `${this.state.openSection!.name}: students` : ''}
        placement="right"
        closable={true}
        onClose={this.setOpenSection.bind(this.props, undefined)}
        visible={this.state.drawerOpen}
        width={600}
      >
        <Table columns={drawerColumns} dataSource={drawerData} pagination={false} />
      </Drawer>
    );

    return (
      <TableDetail
        title={'Sections'}
        drawer={drawerComponent}
        loadComplete={this.props.loadComplete}
        isEmpty={this.props.sections.length === 0}
        emptyNode={
          <Empty
            imageStyle={{
              height: 60,
            }}
            description={<span>No sections yet</span>}
          >
            <AddSectionDialog key={0} addSection={this.props.createSection} sections={this.props.sections} />
          </Empty>
        }
        columns={columns}
        data={data}
        actions={actions}
        breadcrumbs={
          <Breadcrumb>
            <Breadcrumb.Item>Roster</Breadcrumb.Item>
            <Breadcrumb.Item>
              {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
              <a>Sections</a>
            </Breadcrumb.Item>
          </Breadcrumb>
        }
        titleInfo={tooltips.admin.sectionRoster.title}
      />
    );
  }
}

export default ManageSections;
