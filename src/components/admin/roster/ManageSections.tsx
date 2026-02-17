/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';
import { useCallback, useMemo, useState } from 'react';

import { DeleteOutlined, EditOutlined } from '@ant-design/icons';

/* style imports */
import { Breadcrumb, Button, Checkbox, Drawer, Empty, message, Modal, Select, Table, Tooltip } from 'antd';

/* other library imports */
import Highlighter from 'react-highlight-words';
import ReactSelect from 'react-select';

/* codePost imports */
import { tooltips } from '../../../components/core/tooltips';
import { Course, Section } from '../../../api-client';
import { USER_APP } from '../../../types/common';
import { ITableDetailColumn, TableDetail } from '../other/TableDetail';
import AddSectionDialog from './sections/AddSectionDialog';

const { confirm } = Modal;

/**********************************************************************************************************************/

export interface IManageSectionsProps {
  /* students data */
  students: string[];
  graders: string[];
  admins: string[];
  sections: Section[];
  currentCourse: Course;
  sectionsByStudent: { [studentEmail: string]: Section };

  /* loading state */
  loadComplete: boolean;
  sectionsLoadComplete: boolean;

  /* object-level REST operations */
  updateRoster: (adds: string[], deletes: string[], userType: USER_APP) => Promise<void>;
  deleteSection: (sectionID: number) => Promise<void>;
  createSection: (sectionName: string) => Promise<Section>;
  updateSection: (section: Section) => Promise<void>;
  updateStudentSection: (student: string, section: number) => Promise<void>;
}

/**********************************************************************************************************************/

const ManageSections: React.FC<IManageSectionsProps> = (props) => {
  const [activeSection, setActiveSection] = useState<string>('');
  const [openSection, setOpenSection] = useState<Section | undefined>(undefined);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [allowSectionReassignment, setAllowSectionReassignment] = useState<boolean>(false);

  const deleteSection = useCallback(
    (toRemove: number) => {
      confirm({
        title: 'Are you sure you want to delete this section?',
        onOk: async () => {
          await props.deleteSection(toRemove);
        },
        okText: 'Delete',
      });
    },
    [props],
  );

  const changeLeaders = useCallback(
    async (section: number, leaders: string[]) => {
      const sectionObj = props.sections.find((el) => el.id === section);
      if (sectionObj) {
        const updated = { ...sectionObj, leaders };
        await props.updateSection(updated);
        message.success('Leaders updated');
      }
    },
    [props],
  );

  const handleSetOpenSection = useCallback((section: Section | undefined) => {
    if (section === undefined) {
      setDrawerOpen(false);
      setTimeout(() => {
        setOpenSection(undefined);
      }, 500);
    } else {
      setOpenSection(section);
      setDrawerOpen(true);
    }
  }, []);

  const renderLeadersCell = useCallback(
    (searchText: string) => {
      return (_: string, record: any) => {
        if (record.section === activeSection) {
          return (
            <div>
              <Select
                mode="multiple"
                value={record.leaderData}
                onChange={(value) => changeLeaders(record.key, value)}
                style={{ width: 400 }}
              >
                {props.graders.map((grader) => (
                  <Select.Option key={grader} value={grader}>
                    {grader}
                  </Select.Option>
                ))}
              </Select>
              &nbsp;&nbsp;
              <EditOutlined onClick={() => setActiveSection('')} />
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
              <EditOutlined onClick={() => setActiveSection(record.section)} />
            </div>
          );
        }
      };
    },
    [activeSection, changeLeaders, props.graders],
  );

  const columns: ITableDetailColumn[] = useMemo(
    () => [
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
        align: 'center' as const,
      },
      {
        title: 'Leaders',
        dataIndex: 'leaders',
        key: 'leaders',
        align: 'center' as const,
        renderForSearch: renderLeadersCell,
      },
      {
        title: 'Actions',
        dataIndex: 'actions',
        key: 'actions',
        align: 'right' as const,
      },
    ],
    [renderLeadersCell],
  );

  const data = useMemo(() => {
    return props.sections.map((section) => {
      return {
        key: section.id,
        section: section.name,
        students: (
          <span onClick={() => handleSetOpenSection(section)} className="text-link" style={{ cursor: 'pointer' }}>
            {section.students.length}
          </span>
        ),
        leaderData: section.leaders,
        leadersForSearch: section.leaders.join(', '),
        actions: (
          <Tooltip title="Delete section">
            <Button shape="circle" icon={<DeleteOutlined />} onClick={() => deleteSection(section.id)} />
          </Tooltip>
        ),
      };
    });
  }, [props.sections, deleteSection, handleSetOpenSection]);

  const actions = useMemo(() => {
    return [<AddSectionDialog key="add-section" sections={props.sections} addSection={props.createSection} />];
  }, [props.sections, props.createSection]);

  const handleRemoveStudent = useCallback(
    async (studentEmail: string) => {
      if (openSection) {
        await props.updateStudentSection(studentEmail, -1);
        setOpenSection({
          ...openSection,
          students: openSection.students.filter((stu) => stu !== studentEmail),
        });
      }
    },
    [openSection, props],
  );

  const drawerColumns = useMemo(
    () => [
      {
        title: 'Student',
        dataIndex: 'student',
        key: 'student',
        align: 'left' as const,
      },
      {
        title: 'Remove',
        dataIndex: 'remove',
        key: 'remove',
        align: 'center' as const,
      },
    ],
    [],
  );

  const drawerData = useMemo(() => {
    if (!openSection) return [];

    return openSection.students
      .filter((s): s is string => s !== null && s !== undefined)
      .map((studentEmail) => ({
        key: studentEmail,
        student: studentEmail,
        remove: <Button onClick={() => handleRemoveStudent(studentEmail)}>Remove</Button>,
      }));
  }, [openSection, handleRemoveStudent]);

  const studentOptions = useMemo(() => {
    if (!openSection) return [];

    const options: any[] = [{ label: 'Students without a section', options: [] }];

    const studentsInSections = props.sections.flatMap((section) => section.students);

    props.students.forEach((student) => {
      if (!studentsInSections.includes(student)) {
        options[0].options.push({ label: student, value: student, isDisabled: false });
      }
    });

    props.sections
      .filter((section) => section.id !== openSection.id)
      .forEach((section) => {
        options.push({
          label: section.name,
          options: section.students.map((student) => ({
            value: student,
            label: student,
            isDisabled: !allowSectionReassignment,
          })),
        });
      });

    return options;
  }, [openSection, props.students, props.sections, allowSectionReassignment]);

  const assignToSection = useCallback(
    async (option: any) => {
      if (openSection) {
        await props.updateStudentSection(option.value, openSection.id);
        setOpenSection({
          ...openSection,
          students: [...openSection.students, option.value],
        });
      }
    },
    [openSection, props],
  );

  const drawerComponent = (
    <Drawer
      title={openSection ? `${openSection.name}: students` : ''}
      placement="right"
      closable={true}
      onClose={() => handleSetOpenSection(undefined)}
      open={drawerOpen}
      width={600}
    >
      Allow section reassignment{' '}
      <Checkbox checked={allowSectionReassignment} onChange={(e) => setAllowSectionReassignment(e.target.checked)} />
      <ReactSelect
        placeholder="Select students to add to section"
        options={studentOptions}
        onChange={assignToSection}
      />
      <br />
      <br />
      {drawerData.length === 0 ? (
        <span>
          <br />
          <br />
          <Empty description={<span>No students in this section yet</span>} />
        </span>
      ) : (
        <Table columns={drawerColumns} dataSource={drawerData} pagination={false} />
      )}
    </Drawer>
  );

  return (
    <TableDetail
      title="Sections"
      drawer={drawerComponent}
      loadComplete={props.loadComplete && props.sectionsLoadComplete}
      isEmpty={props.sections.length === 0}
      emptyNode={
        <Empty
          styles={{
            image: {
              height: 60,
            },
          }}
          description={<span>No sections yet</span>}
        >
          <AddSectionDialog addSection={props.createSection} sections={props.sections} />
        </Empty>
      }
      columns={columns}
      data={data}
      actions={actions}
      breadcrumbs={<Breadcrumb items={[{ title: 'Roster' }, { title: 'Sections' }]} />}
      titleInfo={tooltips.admin.sectionRoster.title}
    />
  );
};

export default ManageSections;
