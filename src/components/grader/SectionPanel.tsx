/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* react-md imports */
import {
  CircularProgress,
  DataTable,
  FontIcon,
  SelectionControl,
  TableBody,
  TableColumn,
  TableHeader,
  TableRow,
} from 'react-md';

/* other library imports */
import Select from 'react-select';
import * as moment from 'moment';

/* codePost imports */
import { openSubmission } from '../admin/AdminUtils';

import { Assignment, AssignmentType } from '../../infrastructure/assignment';
import { CourseType } from '../../infrastructure/course';
import { SectionType } from '../../infrastructure/section';
import { sortSubmissions, StudentSubmissionType, SubmissionType } from '../../infrastructure/submission';

import { IOptionNumber } from '../../types/common';
import { compare, getSortIndex } from '../Utils/SortUtils';

/**********************************************************************************************************************/

interface ISectionPanelProps {
  currentCourse: CourseType;
  currentAssignment: AssignmentType;
  sectionsLed: SectionType[];
}
interface ISectionPanelState {
  submissionsBySection: { [sectionID: number]: { [student: string]: SubmissionType | undefined } };
  activeSection: SectionType | undefined;
  sortedIndex: Array<boolean | undefined>;
  // Beacuse we want to include students without submissions in our list, we need a student, submission|undefined array
  // It makes sense to leave this in state because it's slow to make copies and sort on every render
  sortedSubmissions: Array<[string, SubmissionType | undefined]>;
  showStudentEmails: boolean;
}

class SectionPanel extends React.Component<ISectionPanelProps, ISectionPanelState> {
  public state: Readonly<ISectionPanelState> = {
    submissionsBySection: {},
    activeSection: undefined,
    // SortedIndex index corresponds to columns: index 0 is email. Ignoring the 'students' column
    sortedIndex: [true, undefined, undefined, undefined, undefined],
    sortedSubmissions: [],
    showStudentEmails: false,
  };

  public async componentDidMount() {
    const submissionsBySection = await this.loadSubmissionsForSection();
    this.setState({ submissionsBySection });

    if (this.props.sectionsLed.length === 1) {
      this.handleSelect({ value: this.props.sectionsLed[0].id, label: this.props.sectionsLed[0].name });
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
          studentToSubMap.forEach((sub: { student: string; submission: SubmissionType | null }) => {
            subsBySection[sub.student] = sub.submission;
          });
          submissionsBySection[section.id] = subsBySection;
          return section;
        });
      }),
    );

    return submissionsBySection;
  };

  public handleSelect = (input: IOptionNumber) => {
    const activeSection = this.props.sectionsLed.find((section) => {
      return section.id === input.value;
    });

    const thisSectionSubmissions = this.state.submissionsBySection[input.value];

    // return a new array for (1) sorting purposes (2) create new data so sort doesn't affect state;
    const newSubmissions = Object.keys(thisSectionSubmissions).map((student) => {
      const x: [string, SubmissionType | undefined] = [student, thisSectionSubmissions[student]];
      return x;
    });
    newSubmissions.sort(this.sort.bind(this));
    this.setState({ activeSection, sortedSubmissions: newSubmissions });
  };

  public toggleSort = (columnIndex: number) => {
    const { sortedIndex } = this.state;
    const newSortedIndex = getSortIndex(sortedIndex, columnIndex);
    this.setState({ sortedIndex: newSortedIndex }, () => {
      const { sortedSubmissions } = this.state;
      sortedSubmissions.sort(this.sort.bind(this));
      this.setState({ sortedSubmissions });
    });
  };

  public sort(a: [string, SubmissionType | undefined], b: [string, SubmissionType | undefined]) {
    const { sortedIndex } = this.state;
    const sortAttribute = sortedIndex.findIndex((elem) => {
      return typeof elem !== 'undefined';
    });

    if (sortAttribute === -1) {
      return 0;
    }

    const ascending = sortedIndex[sortAttribute] ? true : false;
    if (sortAttribute === 0) {
      // sort by email
      return compare(ascending, a[0], b[0]);
    }
    // check if a submission exists
    if (!a[1] && !b[1]) return 0;
    if (!b[1]) return ascending ? -1 : 1;
    if (!a[1]) return ascending ? 1 : -1;
    // if submission exists, sort by submission. Pass in sortAttribute as SUBMISSION_SORT_TYPE enum index
    return sortSubmissions(sortAttribute, ascending, a[1], b[1]);
  }

  public render() {
    const { activeSection, sortedSubmissions, sortedIndex } = this.state;
    let tableBody;
    let title;
    const showingEmails = !this.props.currentAssignment.anonymousGrading || this.state.showStudentEmails;

    if (this.props.sectionsLed.length === 0) {
      // Sections haven't been loaded yet
      tableBody = <CircularProgress id="progress" className="progress-circle" />;
    } else if (this.props.sectionsLed.length === 1 || activeSection) {
      title = `Submissions for ${activeSection ? activeSection.name : ''}`;
      tableBody = sortedSubmissions.map(([student, sub]) => {
        if (sub) {
          return (
            <TableRow key={student} onClick={openSubmission.bind(this.props, sub.id)}>
              <TableColumn>{showingEmails ? student : '----'}</TableColumn>
              <TableColumn>{showingEmails ? sub.students.toString() : sub.id}</TableColumn>
              <TableColumn className={sub.isFinalized ? 'table-cell--graded' : 'table-cell--unfinalized'}>
                {sub.isFinalized ? String(sub.grade) : 'Unfinalized'}
              </TableColumn>
              <TableColumn>{sub.grader}</TableColumn>
              <TableColumn>{sub.isFinalized ? <FontIcon>done</FontIcon> : null}</TableColumn>
              <TableColumn>{moment(sub.dateEdited).format('llll')}</TableColumn>
            </TableRow>
          );
        } else {
          return (
            <TableRow key={student}>
              <TableColumn>{student}</TableColumn>
              <TableColumn>{'---'}</TableColumn>
              <TableColumn className="table-cell--unsubmitted">{'--'}</TableColumn>
              <TableColumn>{'---'}</TableColumn>
              <TableColumn>{'---'}</TableColumn>
              <TableColumn>{'---'}</TableColumn>
            </TableRow>
          );
        }
      });
    } else {
      // Section hasn't been selected yet
      tableBody = <div />;
    }

    let selectContent;
    if (this.props.sectionsLed.length > 1) {
      const menuItems = this.props.sectionsLed.map((section) => {
        return { value: section.id, label: section.name };
      });
      selectContent = (
        <Select
          classNamePrefix="select--grader-section"
          closeMenuOnSelect={true}
          options={menuItems}
          onChange={this.handleSelect}
          placeholder="Select Section..."
        />
      );
    }

    // If we're in anonymous grading mode, add a toggle to reveal student emails
    let anonymousToggle;
    if (this.props.currentAssignment.anonymousGrading) {
      anonymousToggle = (
        <div>
          Anonymous mode:
          <SelectionControl
            id="toggleShowStudents"
            name="toggleShowStudents"
            type="switch"
            className="toggleShowStudents"
            defaultChecked={showingEmails}
            onChange={this.toggleShowStudentEmails}
            aria-label={'Reveal student emails'}
          />
        </div>
      );
    }

    return (
      <div className="grader__section-panel">
        {selectContent}
        {anonymousToggle}
        <div className="grader__section-panel__title">{title}</div>
        <DataTable className="table--section" plain={true}>
          <TableHeader>
            <TableRow>
              <TableColumn key={'Student'} sorted={sortedIndex[0]} onClick={this.toggleSort.bind(this.props, 0)}>
                Student Name
              </TableColumn>
              <TableColumn key={'Submission Students'}>Submission Students</TableColumn>
              <TableColumn key={'Grade'} sorted={sortedIndex[1]} onClick={this.toggleSort.bind(this.props, 1)}>
                Grade
              </TableColumn>
              <TableColumn key={'Grader'} sorted={sortedIndex[2]} onClick={this.toggleSort.bind(this.props, 2)}>
                Grader
              </TableColumn>
              <TableColumn key={'Finalized'} sorted={sortedIndex[3]} onClick={this.toggleSort.bind(this.props, 3)}>
                Finalized
              </TableColumn>
              <TableColumn key={'Last Edited'} sorted={sortedIndex[4]} onClick={this.toggleSort.bind(this.props, 4)}>
                Last Edited
              </TableColumn>
            </TableRow>
          </TableHeader>
          <TableBody>{tableBody}</TableBody>
        </DataTable>
      </div>
    );
  }
}

export default SectionPanel;
