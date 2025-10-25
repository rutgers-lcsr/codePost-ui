/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* React imports */
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import {
  BarChartOutlined,
  CompassOutlined,
  DeleteOutlined,
  DiffOutlined,
  DownloadOutlined,
  EditOutlined,
  EyeInvisibleOutlined,
  FileDoneOutlined,
  FileOutlined,
  FolderOutlined,
  ImportOutlined,
  MailOutlined,
  MenuOutlined,
  MessageOutlined,
  OrderedListOutlined,
  QuestionCircleOutlined,
  SettingOutlined,
  UploadOutlined,
} from '@ant-design/icons';

/* ant imports */
import { Breadcrumb, Dropdown, Empty, message, Popconfirm, Spin, Switch, Tooltip, Typography } from 'antd';

import CPButton from '../../../components/core/CPButton';
import CPTooltip from '../../../components/core/CPTooltip';
import { tooltips } from '../../../components/core/tooltips';

import DraggableBodyRow from '../../../components/core/DraggableBodyRow';

import update from 'immutability-helper';

import { TableDetail } from '../other/TableDetail';

/* other library imports */
import { RouteComponentProps } from '../../../router/legacy';

import { Link } from 'react-router-dom';

/* codePost imports */
import { AssignmentPatchType, AssignmentType, sortAssignments } from '../../../infrastructure/assignment';
import { CourseType, FileType, SectionType, SubmissionInfoType } from '../../../infrastructure/types';
import { UserType } from '../../../infrastructure/user';

import { IAssignmentToSubmissionsMap, IStudentSubmissionsDataTable } from '../../../types/common';

import DeleteAssignmentDialog from './assignments/DeleteAssignmentDialog';

import BulkUpload from './assignments/SubmissionUpload/BulkUpload/BulkUpload';
import UploadSubmissionDialog from './assignments/SubmissionUpload/UploadSubmissionDialog';

import NewAssignmentDialog from './assignments/NewAssignmentDialog';

import AssignmentSettingsDialog from './assignments/AssignmentSettingsDialog';

import DownloadGrades from './assignments/DownloadGrades';

import { sendSlack } from '../../../components/core/slack';

import {
  calculateMultipleAssignmentProgressStats,
  DRAWER_TYPE,
  filterDataByStat,
  getDrawerTitle,
  IAssignmentProgressStatsMap,
  StatsDrawer,
} from './assignments/AssignmentStats/StatsUtils';

import SendEmailModal from '../other/SendEmailModal';

import { encodeForLink } from '../../core/URLutils';

import { openSubmission } from '../other/AdminUtils';
import BulkSubmissionEdit from './assignments/BulkSubmissionEdit';

import { AssignmentSetupDialog } from './assignments/AssignmentSetupDialog';

const { Text } = Typography;

type alignType = 'left' | 'right' | 'center';

/**********************************************************************************************************************/
/* Constants
/**********************************************************************************************************************/

const DEFAULT_PAGINATION_SIZE = 10;
const FINALIZED_THRESHOLD = 0.5;

/**********************************************************************************************************************/

export interface IManageAssignmentsProps {
  /* assignment data */
  assignments: AssignmentType[];
  submissions: IAssignmentToSubmissionsMap;
  students: string[]; // emails
  submissionsByStudent: IStudentSubmissionsDataTable;
  currentCourse: CourseType;
  viewsBySubmission: { [submissionID: number]: { [student: string]: string } };
  sections: SectionType[];
  courses: CourseType[];

  /* loading state */
  loadComplete: boolean;
  partialSubmissionsLoadComplete: boolean;
  fullSubmissionsLoadComplete: boolean;

  /* object-level REST operations */
  createAssignment: (
    assignmentName: string,
    assignmentPoints: number,
    upload: boolean,
    isVisible: boolean,
    dueDate?: string,
    sortKey?: number,
  ) => Promise<AssignmentType>;
  updateAssignment: (assignment: AssignmentPatchType) => Promise<void>;
  deleteAssignment: (assignment: AssignmentType) => Promise<void>;

  uploadSubmission: (assignment: AssignmentType, partners: string[], files: FileType[]) => Promise<any>;
  deleteSubmission: (submission: SubmissionInfoType) => Promise<void>;
  updateSubmission: (submission: SubmissionInfoType) => Promise<void>;

  bulkUpdateSubmissions: (assignmentID: number, getPayload: (sub: SubmissionInfoType) => any) => Promise<void>;

  /* Refresh course */
  refreshCourseData: () => void;

  /* misc */
  myEmail: string;

  /* user data */
  user: UserType;

  activeAssignment?: AssignmentType; // which assignment has been clicked
  detailType?: DETAIL_TYPE; // what detail view are we showing
  baseURL: string;

  breadcrumbs?: Array<{ title: React.ReactNode }>;
}

export enum DETAIL_TYPE {
  Upload_Single,
  Upload_Multiple,
  Upload_Import,
  Settings,
  Delete,
  Drawer,
  DownloadGrades,
  BulkSubmissionEdit,
  Onboarding,
}

interface DrawerContentState {
  title: string;
  subtitle: React.ReactNode;
  content: Array<{ email: string; subID: number | null }> | null;
}

/**********************************************************************************************************************/

const AssignmentsTable: React.FC<IManageAssignmentsProps & RouteComponentProps> = (props) => {
  const {
    assignments,
    submissions,
    submissionsByStudent,
    viewsBySubmission,
    students,
    fullSubmissionsLoadComplete,
    currentCourse,
    sections,
    myEmail,
    activeAssignment,
    detailType,
    baseURL,
    createAssignment: createAssignmentProp,
    updateAssignment: updateAssignmentProp,
    deleteAssignment: deleteAssignmentProp,
    uploadSubmission,
    deleteSubmission,
    updateSubmission,
    bulkUpdateSubmissions,
    history,
    loadComplete,
    breadcrumbs,
  } = props;

  // State management with hooks
  const [drawerType, setDrawerType] = useState<DRAWER_TYPE | undefined>(undefined);
  const [drawerContent, setDrawerContent] = useState<DrawerContentState>({
    title: '',
    subtitle: '',
    content: null,
  });
  const [activeStudent, setActiveStudent] = useState<string | undefined>(undefined);
  const [sortedOrder, setSortedOrder] = useState<number[]>(() => sortAssignments(props.assignments).map((el) => el.id));

  // Update sortedOrder when assignments change
  useEffect(() => {
    setSortedOrder(sortAssignments(props.assignments).map((el) => el.id));
  }, [props.assignments]);

  // Handle drawer refresh when submissions load
  useEffect(() => {
    if (drawerType === undefined) return;

    const thisAssignment = assignments.find((assignment: AssignmentType) => {
      return assignment.name === drawerContent.title;
    });

    if (thisAssignment !== undefined && submissions[thisAssignment.id]) {
      const newContent: Array<{
        email: string;
        subID: number | null;
      }> = filterDataByStat(
        thisAssignment,
        submissionsByStudent,
        drawerType,
        submissions[thisAssignment.id],
        viewsBySubmission,
        students,
      );

      const title = getDrawerTitle(drawerType, newContent.length, !fullSubmissionsLoadComplete);

      setDrawerContent({
        title: thisAssignment.name,
        subtitle: title,
        content: newContent,
      });
    }
  }, [
    fullSubmissionsLoadComplete,
    submissions,
    assignments,
    submissionsByStudent,
    viewsBySubmission,
    students,
    drawerType,
    drawerContent.title,
  ]);

  // Memoize stats calculation
  const assignmentStats: IAssignmentProgressStatsMap = useMemo(
    () =>
      calculateMultipleAssignmentProgressStats(
        assignments,
        submissions,
        submissionsByStudent,
        viewsBySubmission,
        students,
        !fullSubmissionsLoadComplete,
      ),
    [assignments, submissions, submissionsByStudent, viewsBySubmission, students, fullSubmissionsLoadComplete],
  );

  /******************************************************************************
   * UI Control
   ******************************************************************************/

  // This function is called when an assignment drawer is opened
  const openDrawer = useCallback(
    (assignment: AssignmentType, type: DRAWER_TYPE) => {
      if (!Object.prototype.hasOwnProperty.call(submissions, assignment.id)) {
        const title = getDrawerTitle(type, null, !fullSubmissionsLoadComplete);

        setDrawerContent({
          title: assignment.name,
          subtitle: title,
          content: null,
        });
        setDrawerType(type);
      } else {
        const newContent: Array<{
          email: string;
          subID: number | null;
        }> = filterDataByStat(
          assignment,
          submissionsByStudent,
          type,
          submissions[assignment.id],
          viewsBySubmission,
          students,
        );

        const title = getDrawerTitle(type, newContent.length, !fullSubmissionsLoadComplete);

        setDrawerContent({
          title: assignment.name,
          subtitle: title,
          content: newContent,
        });
        setDrawerType(type);
      }
    },
    [submissions, fullSubmissionsLoadComplete, submissionsByStudent, viewsBySubmission, students],
  );

  const closeDrawer = useCallback(() => {
    setDrawerType(undefined);
  }, []);

  /******************************************************************************
   * Detail callbacks
   ******************************************************************************/

  const saveSettings = useCallback(
    (assignment: AssignmentPatchType) => {
      return updateAssignmentProp(assignment);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [updateAssignmentProp],
  );

  const deleteAssignment = useCallback(() => {
    const deletingAssignment = activeAssignment;
    if (deletingAssignment) {
      deleteAssignmentProp(deletingAssignment).then(() => {
        message.success('Assignment successfully deleted!');
        history.push(`${baseURL}/overview`);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeAssignment, deleteAssignmentProp, history, baseURL]);

  const uploadForStudent = useCallback(
    (assignmentName: string, student: string) => {
      setActiveStudent(student);
      history.push(`${baseURL}/${encodeForLink(assignmentName)}/upload/single`);
    },
    [history, baseURL],
  );

  const closeSingleSubmissionUpload = useCallback(() => {
    history.push(`${baseURL}/overview`);
    setActiveStudent(undefined);
  }, [history, baseURL]);

  const createAssignment = useCallback(
    (name: string, points: number, upload: boolean, isVisible: boolean, dueDate?: string) => {
      // Place assignment at the end of the assignment list
      let sortKey;
      if (sortedOrder.length > 0) {
        sortKey = sortedOrder[sortedOrder.length - 1] + 1;
      } else {
        sortKey = 0;
      }

      return createAssignmentProp(name, points, upload, isVisible, dueDate, sortKey);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sortedOrder, createAssignmentProp],
  );

  // Helper to get publish confirmation text based on assignment state
  const getPublishConfirmText = useCallback(
    (assignment: AssignmentType): React.ReactElement | string => {
      if (assignment.isReleased) {
        return 'Are you sure you want to un-publish this assignment?';
      }

      const stats = assignmentStats[assignment.id];
      const finalizedRatio = stats.numSubmissions !== 0 ? stats.numGraded / stats.numSubmissions : 1;

      if (!assignment.liveFeedbackMode && finalizedRatio < FINALIZED_THRESHOLD) {
        return (
          <div>
            <div style={{ paddingBottom: '4px', maxWidth: '260px' }}>
              Are you sure you want to publish this assignment?
            </div>
            <div style={{ paddingBottom: '4px', maxWidth: '260px' }}>
              The majority of your submissions are still unfinalized, so students will not be able to view them.
            </div>
          </div>
        );
      }

      return 'Are you sure you want to publish this assignment?';
    },
    [assignmentStats],
  );

  // Helper to toggle assignment visibility
  const toggleAssignmentVisibility = useCallback(
    (assignment: AssignmentType) => {
      const oldVal = assignment.isVisible;

      updateAssignmentProp({
        id: assignment.id,
        isVisible: !assignment.isVisible,
      }).then(() => {
        message.success(`Assignment made ${oldVal ? 'in' : ''}visible.`);
      });
    },
    [updateAssignmentProp],
  );

  // Helper to handle assignment publish toggle
  const toggleAssignmentPublish = useCallback(
    (assignment: AssignmentType) => {
      if (!assignment.isReleased) {
        sendSlack(
          'Assignment published',
          `${assignment.name} | ${currentCourse ? currentCourse.name : ''} ${
            currentCourse ? currentCourse.period : ''
          }`,
          '#24be85',
          '#user_notifications_everything',
          currentCourse ? currentCourse.id : 0,
        );
      }

      updateAssignmentProp({
        id: assignment.id,
        isReleased: !assignment.isReleased,
      });
    },
    [currentCourse, updateAssignmentProp],
  );

  // Helper to get section names from IDs
  const getSectionNames = useCallback(
    (sectionIDs: number[]): string => {
      return sectionIDs
        .map((sectionID) => {
          const thisSection = sections.find((s) => s.id === sectionID);
          return thisSection ? thisSection.name : '';
        })
        .join(', ');
    },
    [sections],
  );

  /******************************************************************************
   * Render
   ******************************************************************************/

  const aligner: alignType = 'center';
  const columns = [
    {
      title: 'Assignment',
      dataIndex: 'assignment',
      key: 'assignment',
      className: 'draggable',
    },
    {
      title: (
        <div>
          Visible
          <CPTooltip
            title={'If visible, students can see the assignment in the Student Console.'}
            infoIcon={true}
            hideThisOnHideTips={true}
            iconStyle={{ paddingLeft: 5 }}
          />
        </div>
      ),
      dataIndex: 'visible',
      key: 'visible',
      align: aligner,
    },
    {
      title: (
        <div>
          Published
          <CPTooltip
            title={tooltips.admin.assignments.published}
            infoIcon={true}
            hideThisOnHideTips={true}
            iconStyle={{ paddingLeft: 5 }}
          />
        </div>
      ),
      dataIndex: 'published',
      key: 'published',
      align: aligner,
    },
    {
      title: (
        <div>
          Submissions
          <CPTooltip
            title={tooltips.admin.assignments.submissions}
            infoIcon={true}
            hideThisOnHideTips={true}
            iconStyle={{ paddingLeft: 5 }}
          />
        </div>
      ),
      dataIndex: 'submissions',
      key: 'submissions',
      align: aligner,
    },
    {
      title: (
        <div>
          Finalized
          <CPTooltip
            title={tooltips.admin.assignments.finalized}
            infoIcon={true}
            hideThisOnHideTips={true}
            iconStyle={{ paddingLeft: 5 }}
          />
        </div>
      ),
      dataIndex: 'finalized',
      key: 'finalized',
      align: aligner,
    },
    {
      title: (
        <div>
          Missing
          <CPTooltip
            title={tooltips.admin.assignments.missing}
            infoIcon={true}
            hideThisOnHideTips={true}
            iconStyle={{ paddingLeft: 5 }}
          />
        </div>
      ),
      dataIndex: 'missing',
      key: 'missing',
      align: aligner,
    },
    {
      title: 'Actions',
      dataIndex: 'actions',
      key: 'actions',
      align: aligner,
    },
  ];

  const actions: React.ReactNode[] = [
    <NewAssignmentDialog
      key={1}
      {...props}
      assignments={assignments}
      createAssignment={createAssignment}
      timezone={currentCourse.timezone}
    />,
    <Link to={`${baseURL}/download/grades`}>
      <CPButton cpType="secondary" key={2} icon={<DownloadOutlined />} disabled={Object.keys(submissions).length === 0}>
        Download grades
      </CPButton>
    </Link>,
  ];

  const data = sortedOrder.map((id: number) => {
    const assignment = assignments.find((el) => el.id === id);
    if (assignment === undefined) {
      return null;
    }
    const statsForRow = assignmentStats[assignment.id];
    const encodedName = encodeForLink(assignment.name);
    const menuItems = [
      {
        key: '1',
        label: (
          <Link to={`${baseURL}/rubrics/${encodedName}`}>
            <OrderedListOutlined /> &nbsp; Edit rubric
          </Link>
        ),
      },
      {
        key: 'tests',
        label: (
          <Link to={`${baseURL}/tests/${encodedName}/edit`}>
            <FileDoneOutlined /> &nbsp; Edit tests
          </Link>
        ),
      },
      {
        key: 'plagiarism',
        label: (
          <Link to={`${baseURL}/plagiarism/${encodedName}`}>
            <DiffOutlined /> &nbsp; Check for plagiarism
          </Link>
        ),
      },
      {
        key: '2',
        label: (
          <Link to={`${baseURL}/${encodedName}/download/grades`}>
            {!fullSubmissionsLoadComplete ? <Spin size="small" /> : <DownloadOutlined />} &nbsp; Download grades
          </Link>
        ),
      },
      {
        key: '3',
        label: (
          <Link to={`${baseURL}/${encodedName}/stats`}>
            <BarChartOutlined /> &nbsp; View stats
          </Link>
        ),
      },
      ...(assignment.allowRegradeRequests
        ? [
            {
              key: '3.1',
              label: (
                <Link to={`${baseURL}/${encodedName}/regrades`}>
                  <MessageOutlined /> &nbsp; View Regrades
                </Link>
              ),
            },
          ]
        : []),
      {
        key: '4',
        label: (
          <span>
            <UploadOutlined /> &nbsp; Upload submissions
          </span>
        ),
        children: [
          {
            key: '0.1',
            label: (
              <Link to={`${baseURL}/${encodedName}/upload/single`}>
                <FileOutlined /> &nbsp; Single submission
              </Link>
            ),
          },
          {
            key: '0.2',
            label: (
              <Link to={`${baseURL}/${encodedName}/upload/multiple`}>
                <FolderOutlined /> &nbsp; Multiple submissions
              </Link>
            ),
          },
          {
            key: '0.3',
            label: (
              <Link to={`${baseURL}/${encodedName}/upload/import`}>
                <ImportOutlined /> &nbsp; Import
              </Link>
            ),
          },
        ],
      },
      {
        key: '5',
        label: (
          <Link to={`${baseURL}/${encodedName}/bulk-edit`}>
            <EditOutlined /> &nbsp; Bulk edit
          </Link>
        ),
      },
      {
        key: 'onboarding',
        label: (
          <Link to={`${baseURL}/${encodedName}/onboarding`}>
            <CompassOutlined /> &nbsp; Get started
          </Link>
        ),
      },
      {
        key: '6',
        label: (
          <Link to={`${baseURL}/${encodedName}/settings`}>
            <SettingOutlined /> &nbsp; Settings
          </Link>
        ),
      },
      {
        type: 'divider' as const,
      },
      {
        key: '7',
        label: (
          <Link to={`${baseURL}/${encodedName}/delete`}>
            <DeleteOutlined /> &nbsp; Delete assignment
          </Link>
        ),
        danger: true,
      },
    ];

    const publishToggleText = getPublishConfirmText(assignment);

    const notifyButton = (toggleDialog: () => void) => {
      return (
        <CPTooltip title="Notify students via email. ">
          <MailOutlined onClick={toggleDialog} style={{ cursor: 'pointer' }} />
        </CPTooltip>
      );
    };

    const onConfirm = () => toggleAssignmentPublish(assignment);
    const toggleVisible = () => toggleAssignmentVisibility(assignment);

    return {
      key: assignment.id,
      assignment: (
        <Text strong>
          {assignment.name}
          {assignment.hideFrom.length > 0 && (
            <Tooltip title={`Assignment hidden from the following sections: ${getSectionNames(assignment.hideFrom)}`}>
              <EyeInvisibleOutlined style={{ marginLeft: 5 }} />
            </Tooltip>
          )}
        </Text>
      ),
      visible: <Switch checked={assignment.isVisible} onChange={toggleVisible} />,
      published: (
        <span className="display-flex align-items-center justify-content-center">
          {!assignment.isVisible && !assignment.isReleased ? (
            <Tooltip title={'Your assignment cannot be published unless it is made visible to students.'}>
              <Switch disabled={true} checked={assignment.isReleased} />
            </Tooltip>
          ) : (
            <Popconfirm onConfirm={onConfirm} title={publishToggleText} icon={<QuestionCircleOutlined />}>
              <Switch checked={assignment.isReleased} />
            </Popconfirm>
          )}
          {assignment.isReleased ? (
            <span>
              &nbsp; &nbsp;
              <SendEmailModal
                buttonText={'Notify students'}
                title="Notify students via email"
                template="publish_assignment"
                course={currentCourse!}
                assignment={assignment}
                me={myEmail}
                emails={students}
                body={<div>Notify students via email that {assignment.name} has been published.</div>}
                button={notifyButton}
              />
            </span>
          ) : null}
        </span>
      ),
      submissions:
        statsForRow.numSubmissions === 0 ? (
          <CPButton cpType="secondary">
            <Link to={`${baseURL}/${encodeURIComponent(assignment.name)}/upload/multiple`}>
              <UploadOutlined /> &nbsp; Upload
            </Link>
          </CPButton>
        ) : (
          <span onClick={() => openDrawer(assignment, DRAWER_TYPE.Submitted)} className="text-link">
            {statsForRow.numSubmissions}
          </span>
        ),
      finalized: (
        <span onClick={() => openDrawer(assignment, DRAWER_TYPE.Graded)} className="text-link">
          {statsForRow.numGraded}
        </span>
      ),
      missing: (
        <span onClick={() => openDrawer(assignment, DRAWER_TYPE.Missing)} className="text-link">
          {statsForRow.numMissing}
        </span>
      ),
      actions: (
        <Dropdown menu={{ items: menuItems }} trigger={['click']}>
          <MenuOutlined />
        </Dropdown>
      ),
    };
  });

  const cancel = () => {
    history.push(`${baseURL}/overview`);
  };

  const drawerComponent =
    drawerType === undefined ? (
      <div />
    ) : (
      <StatsDrawer
        type={drawerType}
        content={drawerContent}
        isVisible={true}
        onClose={closeDrawer}
        uploadSubmission={uploadForStudent}
        loadComplete={fullSubmissionsLoadComplete}
      />
    );

  let detailComponent;
  if (activeAssignment !== undefined && detailType !== undefined) {
    switch (detailType) {
      case DETAIL_TYPE.Settings:
        detailComponent = (
          <AssignmentSettingsDialog
            isVisible={true}
            onCancel={cancel}
            onSave={saveSettings}
            currentAssignment={activeAssignment!}
            assignments={assignments}
            timezone={currentCourse.timezone}
            sections={sections}
          />
        );
        break;
      case DETAIL_TYPE.Upload_Single:
        detailComponent = (
          <UploadSubmissionDialog
            isVisible={true}
            onCancel={closeSingleSubmissionUpload}
            assignments={[activeAssignment]}
            selectedAssignment={activeAssignment}
            students={students}
            selectedStudents={activeStudent !== undefined ? [activeStudent] : []}
            submissions={submissionsByStudent}
            uploadSubmission={(assignment: AssignmentType, partners: string[], files: FileType[]) =>
              uploadSubmission(assignment, partners, files)
            }
            course={currentCourse}
            onSuccess={openSubmission}
          />
        );
        break;
      case DETAIL_TYPE.Upload_Multiple:
        detailComponent = (
          <BulkUpload
            isVisible={true}
            onCancel={cancel}
            assignment={activeAssignment}
            submissions={submissions[activeAssignment.id]}
            students={students}
            uploadSubmission={(assignment: AssignmentType, partners: string[], files: FileType[]) =>
              uploadSubmission(assignment, partners, files)
            }
            updateSubmission={updateSubmission}
            deleteSubmission={deleteSubmission}
            showImportOptions={false}
            course={currentCourse}
          />
        );
        break;
      case DETAIL_TYPE.Upload_Import:
        detailComponent = (
          <BulkUpload
            isVisible={true}
            onCancel={cancel}
            assignment={activeAssignment}
            submissions={submissions[activeAssignment.id]}
            students={students}
            uploadSubmission={(assignment, partners, files) => uploadSubmission(assignment, partners, files)}
            updateSubmission={updateSubmission}
            deleteSubmission={deleteSubmission}
            showImportOptions={true}
            course={currentCourse}
          />
        );
        break;
      case DETAIL_TYPE.Delete:
        detailComponent = (
          <DeleteAssignmentDialog
            isVisible={true}
            assignmentName={activeAssignment.name}
            onCancel={cancel}
            onDelete={deleteAssignment}
          />
        );
        break;
      case DETAIL_TYPE.DownloadGrades:
        detailComponent = (
          <DownloadGrades
            activeAssignment={activeAssignment}
            assignments={assignments}
            submissionsByStudent={submissionsByStudent}
            students={students}
            currentCourse={currentCourse!}
            onCancel={cancel}
          />
        );
        break;
      case DETAIL_TYPE.BulkSubmissionEdit:
        detailComponent = (
          <BulkSubmissionEdit
            activeAssignment={activeAssignment}
            submissions={submissions[activeAssignment.id]}
            bulkUpdateSubmissions={bulkUpdateSubmissions}
            currentCourse={currentCourse!}
            onCancel={cancel}
            myEmail={myEmail}
          />
        );
        break;
      case DETAIL_TYPE.Onboarding:
        detailComponent = (
          <AssignmentSetupDialog
            course={currentCourse}
            hasStudents={students.length > 0}
            onClose={cancel}
            assignment={activeAssignment}
          />
        );
        break;
    }
  } else if (detailType) {
    switch (detailType) {
      case DETAIL_TYPE.DownloadGrades:
        detailComponent = (
          <DownloadGrades
            activeAssignment={activeAssignment}
            assignments={assignments}
            submissionsByStudent={submissionsByStudent}
            students={students}
            currentCourse={currentCourse!}
            onCancel={cancel}
          />
        );
        break;
    }
  }

  const components = {
    body: {
      row: DraggableBodyRow,
    },
  };

  const moveRow = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      const dragRow = sortedOrder[dragIndex];

      const newSortedOrder = update(sortedOrder, {
        $splice: [
          [dragIndex, 1],
          [hoverIndex, 0, dragRow],
        ],
      });

      setSortedOrder(newSortedOrder);

      // Update assignment sort keys
      assignments.forEach((assignment) => {
        const newKey = newSortedOrder.indexOf(assignment.id);
        if (newKey !== assignment.sortKey) {
          assignment.sortKey = newKey;
          updateAssignmentProp(assignment);
        }
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sortedOrder, assignments, updateAssignmentProp],
  );

  return (
    <TableDetail
      title={'Assignments'}
      isEmpty={assignments.length === 0}
      loadComplete={loadComplete}
      emptyNode={
        <Empty
          styles={{
            image: {
              height: 60,
            },
          }}
          description={<span>No assignments yet</span>}
        >
          <NewAssignmentDialog
            key={1}
            {...props}
            timezone={currentCourse.timezone}
            assignments={assignments}
            createAssignment={createAssignmentProp}
            baseURL={baseURL}
          />
        </Empty>
      }
      columns={columns}
      data={data}
      actions={actions}
      breadcrumbs={<Breadcrumb items={[...(breadcrumbs || []), { title: 'Overview' }]} />}
      titleInfo={'Use this space to add assignments to your course, and edit existing ones.'}
      drawer={drawerComponent}
      hideSearch={true}
      detail={detailComponent}
      components={components}
      onRow={(_record: { key: number }, index: number) => ({
        index,
        moveRow: moveRow,
      })}
      pagination={assignments.length < DEFAULT_PAGINATION_SIZE ? false : undefined}
    />
  );
};

export default AssignmentsTable;
