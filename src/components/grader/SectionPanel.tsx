import * as React from 'react';
import { CircularProgress, DataTable, FontIcon, TableBody, TableColumn, TableHeader, TableRow } from 'react-md';
import Select from 'react-select';

import { openSubmission } from '../admin/AdminUtils';

import { Assignment, AssignmentType } from '../../infrastructure/assignment';
import { CourseType } from '../../infrastructure/course';
import { Section, SectionType } from '../../infrastructure/section';
import { SubmissionType } from '../../infrastructure/submission';

import { IOptionNumber } from '../../types/common';

import * as moment from 'moment';

interface IProps {
  currentCourse: CourseType;
  currentAssignment: AssignmentType;
  sectionsLed: number[];
}
interface IState {
  submissionsBySection: { [sectionID: number]: { [student: string]: SubmissionType | undefined } };
  sections: SectionType[];
  activeSection: SectionType | undefined;
}

class SectionPanel extends React.Component<IProps, IState> {
  public state: Readonly<IState> = {
    submissionsBySection: {},
    sections: [],
    activeSection: undefined,
  };

  public constructor(props: any) {
    super(props);
    this.loadSubmissionsForSection();
  }

  // load all the sections (in order to get the name and students), and for each
  // student, load that student's submissions for the active assignment
  public loadSubmissionsForSection = () => {
    Promise.all(
      this.props.sectionsLed.map((sectionID) => {
        return Section.read(sectionID).then((section: SectionType) => {
          const students = section.students;
          return Promise.all(
            students.map((student) => {
              return Assignment.readSubmissionsStudent(this.props.currentAssignment.id, { student }).then(
                (subs: SubmissionType[]) => {
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
            const { submissionsBySection } = this.state;
            submissionsBySection[sectionID] = subsBySection;
            this.setState({ submissionsBySection });
            return section;
          });
        });
      }),
    ).then((sections: SectionType[]) => {
      this.setState({ sections });
    });
  };

  public handleSelect = (input: IOptionNumber) => {
    const activeSection = this.state.sections.find((section) => {
      return section.id === input.value;
    });
    this.setState({ activeSection });
  };

  public render() {
    const { activeSection, submissionsBySection, sections } = this.state;
    let tableBody;
    let title;
    if (sections.length === 0) {
      // Sections haven't been loaded yet
      tableBody = <CircularProgress id="progress" className="progress-circle" />;
    } else if (sections.length === 1 || activeSection) {
      // If only one section or a section is selected, render that section
      const thisSection = activeSection ? activeSection : sections[0];

      title = `Submissions for ${sections[0].name}`;
      tableBody = Object.keys(submissionsBySection[thisSection.id]).map((student) => {
        const sub = submissionsBySection[thisSection.id][student];
        if (sub) {
          return (
            <TableRow key={student} onClick={openSubmission.bind(this.props, sub.id)}>
              <TableColumn>{student}</TableColumn>
              <TableColumn>{sub.students.toString()}</TableColumn>
              <TableColumn>{sub.isFinalized ? String(sub.grade) : 'Not graded'}</TableColumn>
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
              <TableColumn>{'No submission uploaded'}</TableColumn>
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
    if (sections.length > 1) {
      const menuItems = sections.map((section) => {
        return { value: section.id, label: section.name };
      });
      selectContent = (
        <Select
          classNamePrefix="select--Grader-section"
          closeMenuOnSelect={true}
          options={menuItems}
          onChange={this.handleSelect}
          placeholder="Select Section..."
        />
      );
    }
    return (
      <div className="grader__Section">
        {selectContent}
        <div className="grader__Section__title">{title}</div>
        <DataTable className="DataTable--Section" plain={true}>
          <TableHeader>
            <TableRow>
              <TableColumn key={'Student'}>Student Name</TableColumn>
              <TableColumn key={'Submission Students'}>Submission Students</TableColumn>
              <TableColumn key={'Grade'}>Grade</TableColumn>
              <TableColumn key={'Grader'}>Grader</TableColumn>
              <TableColumn key={'Finalized'}>Finalized</TableColumn>
              <TableColumn key={'Last Edited'}>Last Edited</TableColumn>
            </TableRow>
          </TableHeader>
          <TableBody>{tableBody}</TableBody>
        </DataTable>
      </div>
    );
  }
}

export default SectionPanel;
