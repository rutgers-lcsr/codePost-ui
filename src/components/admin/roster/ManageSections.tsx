// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';
import { useCallback, useMemo, useRef, useState } from 'react';

import {
  DeleteOutlined,
  EditOutlined,
  InboxOutlined,
  SearchOutlined,
  UploadOutlined,
  UserAddOutlined,
} from '@ant-design/icons';

/* style imports */
import {
  Breadcrumb,
  Button,
  Checkbox,
  Drawer,
  Empty,
  Input,
  message,
  Modal,
  Progress,
  Select,
  Segmented,
  Table,
  Tag,
  Tooltip,
  Typography,
  Upload,
} from 'antd';

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
const { TextArea } = Input;

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

  // Bulk add state
  const [studentsToAdd, setStudentsToAdd] = useState<{ label: string; value: string }[]>([]);
  const [addingStudents, setAddingStudents] = useState(false);
  const [addProgress, setAddProgress] = useState<{ done: number; total: number } | null>(null);
  const [addMode, setAddMode] = useState<'select' | 'paste'>('select');
  const [pasteText, setPasteText] = useState('');
  const [drawerSearch, setDrawerSearch] = useState('');
  const cancelRef = useRef(false);

  // CSV import state
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [csvData, setCsvData] = useState<{ section: string; students: string[] }[]>([]);
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvProgress, setCsvProgress] = useState<{ done: number; total: number } | null>(null);
  const csvCancelRef = useRef(false);

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
        setStudentsToAdd([]);
        setPasteText('');
        setAddProgress(null);
        setDrawerSearch('');
        cancelRef.current = false;
      }, 500);
    } else {
      setOpenSection(section);
      setStudentsToAdd([]);
      setPasteText('');
      setAddProgress(null);
      setDrawerSearch('');
      cancelRef.current = false;
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
        defaultSortOrder: 'ascend' as const,
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

  // ─── CSV Import ──────────────────────────────────────────
  const parseCSV = (text: string) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) return;

    // Detect header
    const firstLine = lines[0].toLowerCase();
    const hasHeader = firstLine.includes('section') || firstLine.includes('student') || firstLine.includes('email');
    const dataLines = hasHeader ? lines.slice(1) : lines;

    // Determine delimiter
    const delimiter = lines[0].includes('\t') ? '\t' : ',';

    const sectionMap: Record<string, Set<string>> = {};

    for (const line of dataLines) {
      const parts = line.split(delimiter).map((p) => p.trim().replace(/^"|"$/g, ''));
      if (parts.length < 2) continue;
      const sectionName = parts[0];
      const email = parts[1].toLowerCase();
      if (!sectionName || !email || !email.includes('@')) continue;

      if (!sectionMap[sectionName]) sectionMap[sectionName] = new Set();
      sectionMap[sectionName].add(email);
    }

    const parsed = Object.entries(sectionMap).map(([section, students]) => ({
      section,
      students: [...students],
    }));

    if (parsed.length === 0) {
      message.error('No valid section/student rows found. Expected columns: section, student email');
      return;
    }

    setCsvData(parsed);
  };

  const handleCsvFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) parseCSV(text);
    };
    reader.readAsText(file);
    return false; // prevent antd auto-upload
  };

  const handleCsvImport = async () => {
    if (csvData.length === 0) return;
    setCsvImporting(true);
    csvCancelRef.current = false;

    // Calculate total operations
    const totalStudents = csvData.reduce((sum, s) => sum + s.students.length, 0);
    setCsvProgress({ done: 0, total: csvData.length + totalStudents });

    let sectionsCreated = 0;
    let studentsAssigned = 0;
    let stepsDone = 0;

    // Build a map of existing section names → ids
    const existingSections: Record<string, number> = {};
    props.sections.forEach((s) => {
      existingSections[s.name.toLowerCase()] = s.id;
    });

    const BATCH_SIZE = 10;

    for (const entry of csvData) {
      if (csvCancelRef.current) break;

      // Create section if it doesn't exist
      let sectionId = existingSections[entry.section.toLowerCase()];
      if (!sectionId) {
        try {
          const newSection = await props.createSection(entry.section);
          sectionId = newSection.id;
          existingSections[entry.section.toLowerCase()] = sectionId;
          sectionsCreated++;
        } catch {
          message.error(`Failed to create section "${entry.section}", skipping its students`);
          stepsDone += 1 + entry.students.length;
          setCsvProgress({ done: stepsDone, total: csvData.length + totalStudents });
          continue;
        }
      }
      stepsDone++;
      setCsvProgress({ done: stepsDone, total: csvData.length + totalStudents });

      // Assign students in batches
      for (let i = 0; i < entry.students.length; i += BATCH_SIZE) {
        if (csvCancelRef.current) break;
        const batch = entry.students.slice(i, i + BATCH_SIZE);
        const results = await Promise.allSettled(batch.map((email) => props.updateStudentSection(email, sectionId)));
        results.forEach((r) => {
          if (r.status === 'fulfilled') studentsAssigned++;
        });
        stepsDone += batch.length;
        setCsvProgress({ done: stepsDone, total: csvData.length + totalStudents });
      }
    }

    if (csvCancelRef.current) {
      message.info(`Import cancelled. Created ${sectionsCreated} sections, assigned ${studentsAssigned} students.`);
    } else {
      message.success(
        `Import complete: ${sectionsCreated} new section${sectionsCreated !== 1 ? 's' : ''} created, ${studentsAssigned} student${studentsAssigned !== 1 ? 's' : ''} assigned.`,
      );
    }

    setCsvImporting(false);
    setCsvProgress(null);
    setCsvData([]);
    setCsvModalOpen(false);
  };

  const csvTotalStudents = csvData.reduce((sum, s) => sum + s.students.length, 0);
  const csvNewSections = csvData.filter(
    (d) => !props.sections.some((s) => s.name.toLowerCase() === d.section.toLowerCase()),
  );

  const csvModal = (
    <Modal
      title="Import Sections from CSV"
      open={csvModalOpen}
      onCancel={() => {
        if (!csvImporting) {
          setCsvModalOpen(false);
          setCsvData([]);
          setCsvProgress(null);
        }
      }}
      width={640}
      footer={
        csvData.length > 0
          ? [
              <Button
                key="cancel"
                onClick={() => {
                  if (csvImporting) {
                    csvCancelRef.current = true;
                  } else {
                    setCsvData([]);
                  }
                }}
              >
                {csvImporting ? 'Cancel Import' : 'Clear'}
              </Button>,
              <Button key="import" type="primary" loading={csvImporting} onClick={handleCsvImport}>
                Import {csvTotalStudents} students into {csvData.length} sections
              </Button>,
            ]
          : null
      }
    >
      {csvProgress && (
        <Progress
          percent={Math.round((csvProgress.done / csvProgress.total) * 100)}
          format={() => `${csvProgress.done}/${csvProgress.total}`}
          status={csvCancelRef.current ? 'exception' : 'active'}
          style={{ marginBottom: 16 }}
        />
      )}

      {csvData.length === 0 ? (
        <div>
          <Upload.Dragger
            accept=".csv,.tsv,.txt"
            showUploadList={false}
            beforeUpload={handleCsvFileUpload}
            style={{ marginBottom: 16 }}
          >
            <p className="ant-upload-drag-icon">
              <UploadOutlined />
            </p>
            <p className="ant-upload-text">Click or drag a CSV file here</p>
            <p className="ant-upload-hint">File should have two columns: section name and student email</p>
          </Upload.Dragger>

          <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginTop: 12 }}>
            <strong>Expected format:</strong>
            <pre
              style={{
                background: '#f5f5f5',
                padding: 12,
                borderRadius: 6,
                fontSize: 11,
                marginTop: 4,
                lineHeight: 1.6,
              }}
            >
              {`section,student\nSection A,student1@university.edu\nSection A,student2@university.edu\nSection B,student3@university.edu`}
            </pre>
            Supports CSV, TSV, or tab-separated files. Headers are auto-detected and optional.
          </Typography.Paragraph>
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: 16, display: 'flex', gap: 16 }}>
            <div
              style={{
                background: '#f6ffed',
                border: '1px solid #b7eb8f',
                borderRadius: 6,
                padding: '8px 16px',
                flex: 1,
                textAlign: 'center',
              }}
            >
              <Typography.Text strong style={{ fontSize: 20 }}>
                {csvData.length}
              </Typography.Text>
              <br />
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Sections
              </Typography.Text>
              {csvNewSections.length > 0 && (
                <Tag color="green" style={{ marginLeft: 8 }}>
                  {csvNewSections.length} new
                </Tag>
              )}
            </div>
            <div
              style={{
                background: '#e6f7ff',
                border: '1px solid #91d5ff',
                borderRadius: 6,
                padding: '8px 16px',
                flex: 1,
                textAlign: 'center',
              }}
            >
              <Typography.Text strong style={{ fontSize: 20 }}>
                {csvTotalStudents}
              </Typography.Text>
              <br />
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Students
              </Typography.Text>
            </div>
          </div>

          <Table
            size="small"
            dataSource={csvData.map((d, i) => ({ key: i, ...d }))}
            pagination={csvData.length > 10 ? { pageSize: 10 } : false}
            columns={[
              {
                title: 'Section',
                dataIndex: 'section',
                key: 'section',
                render: (name: string) => {
                  const exists = props.sections.some((s) => s.name.toLowerCase() === name.toLowerCase());
                  return (
                    <span>
                      {name}{' '}
                      {exists ? (
                        <Tag style={{ fontSize: 10 }}>exists</Tag>
                      ) : (
                        <Tag color="green" style={{ fontSize: 10 }}>
                          new
                        </Tag>
                      )}
                    </span>
                  );
                },
              },
              {
                title: 'Students',
                dataIndex: 'students',
                key: 'students',
                render: (students: string[]) => students.length,
                align: 'center' as const,
              },
              {
                title: 'Preview',
                dataIndex: 'students',
                key: 'preview',
                render: (students: string[]) => (
                  <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                    {students.slice(0, 3).join(', ')}
                    {students.length > 3 ? ` +${students.length - 3} more` : ''}
                  </Typography.Text>
                ),
              },
            ]}
          />
        </div>
      )}
    </Modal>
  );

  const actions = useMemo(() => {
    return [
      <Button key="import-csv" icon={<UploadOutlined />} onClick={() => setCsvModalOpen(true)}>
        Import from CSV
      </Button>,
      <AddSectionDialog key="add-section" sections={props.sections} addSection={props.createSection} />,
    ];
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

  // ─── Unassigned students (computed once) ─────────────────
  const unassignedStudents = useMemo(() => {
    const assigned = new Set(props.sections.flatMap((s) => s.students));
    return props.students.filter((s) => !assigned.has(s));
  }, [props.students, props.sections]);

  // ─── Core bulk-add with batching ───────────────────────────
  const bulkAddStudents = useCallback(
    async (emails: string[]) => {
      if (!openSection || emails.length === 0) return;
      setAddingStudents(true);
      cancelRef.current = false;
      setAddProgress({ done: 0, total: emails.length });

      const BATCH_SIZE = 10;
      const addedEmails: string[] = [];
      const failedEmails: string[] = [];

      for (let i = 0; i < emails.length; i += BATCH_SIZE) {
        if (cancelRef.current) break;
        const batch = emails.slice(i, i + BATCH_SIZE);
        const results = await Promise.allSettled(
          batch.map((email) => props.updateStudentSection(email, openSection.id)),
        );
        results.forEach((r, idx) => {
          if (r.status === 'fulfilled') addedEmails.push(batch[idx]);
          else failedEmails.push(batch[idx]);
        });
        setAddProgress({ done: Math.min(i + BATCH_SIZE, emails.length), total: emails.length });
      }

      setOpenSection({
        ...openSection,
        students: [...openSection.students, ...addedEmails],
      });
      setStudentsToAdd([]);
      setPasteText('');

      if (cancelRef.current) {
        message.info(`Cancelled. Added ${addedEmails.length} of ${emails.length} students.`);
      } else if (failedEmails.length > 0) {
        message.warning(`Added ${addedEmails.length} students. ${failedEmails.length} failed.`);
      } else {
        message.success(`Added ${addedEmails.length} student${addedEmails.length !== 1 ? 's' : ''}`);
      }

      setAddingStudents(false);
      setAddProgress(null);
    },
    [openSection, props],
  );

  // Handler: add from select dropdown
  const handleAddFromSelect = () => {
    const emails = studentsToAdd.map((o) => o.value);
    bulkAddStudents(emails);
  };

  // Handler: add from pasted text
  const handleAddFromPaste = () => {
    const emails = pasteText
      .split(/[\s,;]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.length > 0 && e.includes('@'));

    if (emails.length === 0) {
      message.warning('No valid email addresses found in pasted text');
      return;
    }

    // Validate against known roster
    const knownSet = new Set(props.students);
    const alreadyInSection = new Set(openSection?.students || []);
    const validEmails = emails.filter((e) => {
      if (alreadyInSection.has(e)) return false;
      if (!knownSet.has(e)) return false;
      return true;
    });
    const unknownEmails = emails.filter((e) => !knownSet.has(e));
    const duplicateEmails = emails.filter((e) => alreadyInSection.has(e));

    if (unknownEmails.length > 0) {
      message.warning(
        `${unknownEmails.length} email${unknownEmails.length !== 1 ? 's' : ''} not found in the course roster and will be skipped`,
        5,
      );
    }
    if (duplicateEmails.length > 0) {
      message.info(`${duplicateEmails.length} already in this section, skipping`);
    }

    if (validEmails.length === 0) {
      message.error('No new valid students to add');
      return;
    }

    const unique = [...new Set(validEmails)];
    confirm({
      title: `Add ${unique.length} students to ${openSection?.name}?`,
      content:
        unique.length > 5 ? `${unique.slice(0, 5).join(', ')} and ${unique.length - 5} more...` : unique.join(', '),
      okText: 'Add All',
      onOk: () => bulkAddStudents(unique),
    });
  };

  // Handler: add all unassigned
  const handleAddAllUnassigned = () => {
    if (unassignedStudents.length === 0) {
      message.info('All students are already assigned to a section');
      return;
    }
    confirm({
      title: `Add all ${unassignedStudents.length} unassigned students to ${openSection?.name}?`,
      okText: 'Add All',
      onOk: () => bulkAddStudents(unassignedStudents),
    });
  };

  const drawerComponent = (
    <Drawer
      title={openSection ? `${openSection.name}: students` : ''}
      placement="right"
      closable={true}
      onClose={() => handleSetOpenSection(undefined)}
      open={drawerOpen}
      width={640}
    >
      {/* ─── Progress bar during bulk add ─── */}
      {addProgress && (
        <div style={{ marginBottom: 16 }}>
          <Progress
            percent={Math.round((addProgress.done / addProgress.total) * 100)}
            format={() => `${addProgress.done}/${addProgress.total}`}
            status={cancelRef.current ? 'exception' : 'active'}
          />
          <Button
            size="small"
            danger
            onClick={() => {
              cancelRef.current = true;
            }}
            style={{ marginTop: 4 }}
          >
            Cancel
          </Button>
        </div>
      )}

      {/* ─── Options row ─── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <Checkbox checked={allowSectionReassignment} onChange={(e) => setAllowSectionReassignment(e.target.checked)}>
          Allow section reassignment
        </Checkbox>
        <Tooltip title={`Add all ${unassignedStudents.length} students without a section`}>
          <Button
            size="small"
            icon={<UserAddOutlined />}
            disabled={unassignedStudents.length === 0 || addingStudents}
            onClick={handleAddAllUnassigned}
          >
            Add all unassigned ({unassignedStudents.length})
          </Button>
        </Tooltip>
      </div>

      {/* ─── Input mode toggle ─── */}
      <Segmented
        block
        value={addMode}
        onChange={(v) => setAddMode(v as 'select' | 'paste')}
        options={[
          { label: 'Search & Select', value: 'select', icon: <SearchOutlined /> },
          { label: 'Paste Emails', value: 'paste', icon: <InboxOutlined /> },
        ]}
        style={{ marginBottom: 12 }}
      />

      {addMode === 'select' ? (
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          <div style={{ flex: 1 }}>
            <ReactSelect
              isMulti
              placeholder="Search and select students..."
              options={studentOptions}
              value={studentsToAdd}
              onChange={(val) => setStudentsToAdd(val as { label: string; value: string }[])}
              menuPortalTarget={document.body}
              styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
              isDisabled={addingStudents}
            />
          </div>
          <Button
            type="primary"
            onClick={handleAddFromSelect}
            disabled={studentsToAdd.length === 0 || addingStudents}
            loading={addingStudents}
          >
            Add{studentsToAdd.length > 0 ? ` (${studentsToAdd.length})` : ''}
          </Button>
        </div>
      ) : (
        <div style={{ marginBottom: 24 }}>
          <TextArea
            rows={5}
            placeholder={
              'Paste student emails here, separated by commas, spaces, or new lines.\n\nExample:\nstudent1@university.edu, student2@university.edu\nstudent3@university.edu'
            }
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            disabled={addingStudents}
            style={{ marginBottom: 8, fontFamily: 'monospace', fontSize: 12 }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {pasteText.trim()
                ? `${pasteText.split(/[\s,;]+/).filter((e) => e.trim().length > 0 && e.includes('@')).length} emails detected`
                : 'Supports comma, space, semicolon, or newline separated emails'}
            </Typography.Text>
            <Button
              type="primary"
              onClick={handleAddFromPaste}
              disabled={!pasteText.trim() || addingStudents}
              loading={addingStudents}
            >
              Add from paste
            </Button>
          </div>
        </div>
      )}

      {/* ─── Current students table ─── */}
      {drawerData.length === 0 ? (
        <Empty description={<span>No students in this section yet</span>} />
      ) : (
        <>
          <div style={{ marginBottom: 8 }}>
            <Input
              prefix={<SearchOutlined style={{ color: '#bbb' }} />}
              placeholder="Filter students in this section..."
              value={drawerSearch}
              onChange={(e) => setDrawerSearch(e.target.value)}
              allowClear
              size="small"
            />
          </div>
          <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
            {drawerData.length} student{drawerData.length !== 1 ? 's' : ''} in this section
          </Typography.Text>
          <Table
            columns={drawerColumns}
            dataSource={
              drawerSearch
                ? drawerData.filter((d) => d.student.toLowerCase().includes(drawerSearch.toLowerCase()))
                : drawerData
            }
            pagination={
              drawerData.length > 50
                ? { pageSize: 50, showSizeChanger: true, showTotal: (total) => `${total} students` }
                : false
            }
            size="small"
          />
        </>
      )}
    </Drawer>
  );

  return (
    <>
      {csvModal}
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
    </>
  );
};

export default ManageSections;
