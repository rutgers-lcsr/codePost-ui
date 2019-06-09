/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* ant imports */
import { Icon, Select, Spin, Switch, Table, Typography } from 'antd';
const { Title } = Typography;
const { Option } = Select;

/* codePost imports */
import { formatSub, getViewIcon, ISubDataBasic, openSubmissionRow } from './graderUtils';

import { Assignment, AssignmentType } from '../../infrastructure/assignment';
import { CourseType } from '../../infrastructure/course';
import { SectionType } from '../../infrastructure/section';
import { StudentSubmissionType, Submission, SubmissionType } from '../../infrastructure/submission';

import { compare } from '../Utils/SortUtils';
type alignType = 'left' | 'right' | 'center';

/**********************************************************************************************************************/

interface ISectionPanelProps {
  currentCourse: CourseType;
  currentAssignment: AssignmentType;
  sectionsLed: SectionType[];
}

interface ITableRow extends ISubDataBasic {
  key: string;
  student: string;
  viewIcon: string | React.ReactElement;
  partners: string;
}

interface ISectionPanelState {
  submissionsBySection: { [sectionID: number]: { [student: string]: SubmissionType | undefined } };
  activeSection: SectionType | undefined;
  submissions: Array<[string, SubmissionType | undefined]>;
  // Map of submission id to an array of student emails who have viewed the submission
  viewsBySubmission: { [submissionID: number]: { [student: string]: string } };
  showStudentEmails: boolean;
  isLoading: boolean;
}

class SectionPanel extends React.Component<ISectionPanelProps, ISectionPanelState> {
  public state: Readonly<ISectionPanelState> = {
    submissionsBySection: {},
    activeSection: undefined,
    viewsBySubmission: {},
    showStudentEmails: false,
    submissions: [],
    isLoading: false,
  };

  public async componentDidMount() {
    this.setState({ isLoading: true });
    const [submissionsBySection, viewsBySubmission] = await this.loadSubmissionsForSection();
    this.setState({ submissionsBySection, viewsBySubmission, isLoading: false });

    if (this.props.sectionsLed.length === 1) {
      this.handleSelect(String(this.props.sectionsLed[0].id));
    }
  }

  public toggleShowStudentEmails = () => {
    this.setState({
      showStudentEmails: !this.state.showStudentEmails,
    });
  };

  // load all the sections (in order to get the name and students), and for each
  // student, load that student's submissions for the active assignment
  public loadSubmissionsForSection = async () => {
    const submissionsBySection = {};
    const viewsBySubmission = {};
    await Promise.all(
      this.props.sectionsLed.map((section: SectionType) => {
        return Promise.all(
          section.students.map((student) => {
            return Assignment.readSubmissionsStudent(this.props.currentAssignment.id, { student }).then(
              (subs: StudentSubmissionType[]) => {
                if (subs.length === 0) {
                  return { student, submission: null };
                } else {
                  return { student, submission: subs[0] };
                }
              },
            );
          }),
        ).then((studentToSubMap: any) => {
          const subsBySection = {};
          return Promise.all(
            studentToSubMap.map(async (sub: { student: string; submission: SubmissionType | null }) => {
              subsBySection[sub.student] = sub.submission;
              if (sub.submission) {
                // Get the submission history object
                return Submission.readHistory(sub.submission.id, { student: sub.student }).then((history: any) => {
                  // If there is no history object, there will be an empty array returned.
                  // If there is a history object it will be [{submission: int, student: string, hasViewed: boolean}]
                  if (history && history[0]) {
                    const { submission, student, hasViewed, dateViewed } = history[0];
                    if (!(submission in viewsBySubmission)) {
                      viewsBySubmission[submission] = {};
                    }
                    if (hasViewed) {
                      // If there are partners, there will be multiple histories for the same submission
                      viewsBySubmission[submission][student] = dateViewed;
                    }
                  }
                });
              }
            }),
          ).then(() => {
            submissionsBySection[section.id] = subsBySection;
            return section;
          });
        });
      }),
    );

    return [submissionsBySection, viewsBySubmission];
  };

  public handleSelect = (sectionID: string) => {
    const activeSection = this.props.sectionsLed.find((section) => {
      return section.id === Number(sectionID);
    });

    const thisSectionSubmissions = this.state.submissionsBySection[Number(sectionID)];

    // return a new array for (1) sorting purposes (2) create new data so sort doesn't affect state;
    const newSubmissions = Object.keys(thisSectionSubmissions).map((student) => {
      const x: [string, SubmissionType | undefined] = [student, thisSectionSubmissions[student]];
      return x;
    });
    this.setState({ activeSection, submissions: newSubmissions });
  };

  public render() {
    const { activeSection, submissions } = this.state;
    const showingEmails = !this.props.currentAssignment.anonymousGrading || this.state.showStudentEmails;

    const centerAlign: alignType = 'center';
    const columns = [
      {
        title: 'Student',
        dataIndex: 'student',
        sorter: (a: ITableRow, b: ITableRow) => compare(true, a.student, b.student),
      },
      {
        title: 'Partner(s)',
        dataIndex: 'partners',
        sorter: (a: ITableRow, b: ITableRow) => compare(true, a.partners, b.partners),
        align: centerAlign,
      },
      {
        title: 'Grade',
        dataIndex: 'gradeString',
        sorter: (a: ITableRow, b: ITableRow) => {
          if (a.isFinalized && !b.isFinalized) return 1;
          else if (!a.isFinalized && b.isFinalized) return -1;
          else return compare(true, a.grade, b.grade);
        },
        align: centerAlign,
      },
      { title: 'Grader', dataIndex: 'grader', sorter: (a: any, b: any) => compare(true, a.grader, b.grader) },
      {
        title: 'Finalized',
        dataIndex: 'finalizeIcon',
        sorter: (a: ITableRow, b: ITableRow) => compare(true, a.isFinalized, b.isFinalized),
        align: centerAlign,
      },
      {
        title: 'Last Edited',
        dataIndex: 'dateEditedString',
        sorter: (a: ITableRow, b: ITableRow) => compare(true, a.dateEdited, b.dateEdited),
        align: centerAlign,
      },
      {
        title: 'Viewed by Student',
        dataIndex: 'viewIcon',
        sorter: (a: ITableRow, b: ITableRow) => compare(true, a.viewIcon, b.viewIcon),
        align: centerAlign,
      },
    ];

    if (this.props.sectionsLed.length === 0) {
      // Sections haven't been loaded yet
      return <Spin indicator={<Icon type="loading" style={{ fontSize: 24 }} spin />} />;
    }

    let selectContent;
    if (this.props.sectionsLed.length > 1) {
      const menuItems = this.props.sectionsLed.map((section) => {
        return <Option key={section.id}>{section.name} </Option>;
      });
      selectContent = (
        <div style={{ display: 'inline-block', width: '20%' }}>
          <Select
            placeholder="Select Section..."
            onSelect={this.handleSelect}
            value={this.state.activeSection ? this.state.activeSection.name : undefined}
            loading={this.state.isLoading}
            disabled={this.state.isLoading}
            style={{ width: 500, marginBottom: 20 }}
          >
            {menuItems}
          </Select>
        </div>
      );
    }

    if (this.props.sectionsLed.length !== 1 && !activeSection) {
      return <div>{selectContent}</div>;
    }

    const title = (
      <Title level={4} style={{ marginBottom: 20 }}>{`Submissions for ${
        activeSection ? activeSection.name : ''
      }`}</Title>
    );

    const data = submissions.map(
      ([student, sub]): ITableRow => {
        const partnerStudents =
          sub && sub.students.length > 1
            ? sub.students
                .filter((obj) => {
                  return obj !== student;
                })
                .toString()
            : '--';
        return {
          ...formatSub(sub),
          key: student,
          student,
          partners: partnerStudents,
          viewIcon: <div>{sub ? getViewIcon(sub, this.state.viewsBySubmission, student) : ''}</div>,
        };
      },
    );

    // If we're in anonymous grading mode, add a toggle to reveal student emails
    let anonymousToggle;
    if (this.props.currentAssignment.anonymousGrading) {
      anonymousToggle = (
        <div style={{ display: 'inline-block', padding: '0px 20px' }}>
          Reveal students:
          <Switch
            defaultChecked={showingEmails}
            onChange={this.toggleShowStudentEmails}
            key="toggleShowStudents"
            style={{ display: 'inline-block' }}
          />
        </div>
      );
    }

    return (
      <div className="grader__section-panel">
        {anonymousToggle}
        {selectContent}
        <div className="grader__section-panel__title">{title}</div>
        <Table
          columns={columns}
          dataSource={data}
          pagination={false}
          loading={this.state.isLoading}
          onRow={openSubmissionRow}
        />
      </div>
    );
  }
}

export default SectionPanel;
