/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* other library imports */
import { Redirect } from 'react-router-dom';

import CPLayoutAdmin from './components/admin/other/CPLayoutAdmin';

import StandardManagementHeader from './components/core/layouts/StandardManagementHeader';

import SelectorSider from './components/core/SelectorSider';

import { Tabs } from 'antd';
import { ClickParam } from 'antd/lib/menu';

/* codePost imports */
import MySubmissionsPanel from './components/grader/MySubmissionsPanel';
import SectionPanel from './components/grader/SectionPanel';
import ViewAllPanel from './components/grader/ViewAllPanel';

import { ICourseToAssignmentMap } from './types/common';

import { Assignment, AssignmentType, sortAssignments } from './infrastructure/assignment';
import { CourseType } from './infrastructure/course';
import { loadIDList } from './infrastructure/generics';
import { Section, SectionType } from './infrastructure/section';
import { AnonymousSubmissionType, Submission, SubmissionType } from './infrastructure/submission';

const { TabPane } = Tabs;

/**********************************************************************************************************************/

interface IGraderState {
  courses: CourseType[];
  assignments: ICourseToAssignmentMap;
  currentAssignment?: AssignmentType;
  currentCourse?: CourseType;
  currentSections: SectionType[];
  currentSubmissions: AnonymousSubmissionType[];

  isLoggedIn: boolean;
  redirect: boolean;

  // Loading variables
  isLoadingAssignments: boolean;
  isLoadingSubmissions: boolean;

  // URL variables
  toLoadCourse: boolean;
  toLoadAssignment: boolean;
}

export interface IGraderProps {
  initialCourses: CourseType[];
  email: string;
  match: any;
  history: any;
  superGraderCourses: CourseType[];
  sectionsLed: SectionType[];

  // handleLogout
  handleLogout: () => void;
}

class Grader extends React.Component<IGraderProps, IGraderState> {
  public state: Readonly<IGraderState> = {
    assignments: {},
    courses: this.props.initialCourses,
    currentAssignment: undefined,
    currentCourse: undefined,
    currentSections: [],
    currentSubmissions: [],
    isLoggedIn: localStorage.getItem('token') ? true : false,
    redirect: false,
    isLoadingAssignments: true,
    isLoadingSubmissions: false,
    toLoadCourse: false,
    toLoadAssignment: false,
  };

  public async componentDidMount() {
    document.title = 'codePost - Grader';
    const assignments = await this.loadAssignments(this.state.courses);
    this.setState({ assignments });

    await this.setStateFromURL();
  }

  public componentDidUpdate(prevProps: IGraderProps, prevState: IGraderState) {
    if (this.state.toLoadCourse || this.state.toLoadAssignment) {
      this.setState({ toLoadCourse: false, toLoadAssignment: false });
    }
  }

  ///////////////////////////////////////
  // URL handler methods
  ///////////////////////////////////////

  public setStateFromURL = async () => {
    const { courseName, period, assignmentName } = this.props.match.params;

    let currentCourse: CourseType | undefined;
    let currentAssignment: AssignmentType | undefined;

    if (courseName && period) {
      currentCourse = this.state.courses.find((course: CourseType) => {
        return course.name === courseName.replace(/_/g, ' ') && course.period === period.replace(/_/g, ' ');
      });

      if (currentCourse) {
        const currentSections = await loadIDList(currentCourse.sections, Section);
        this.setState({ currentSections });
      }

      if (currentCourse && assignmentName) {
        currentAssignment = this.state.assignments[currentCourse.id].find((assignment: AssignmentType) => {
          return assignment.name === assignmentName.replace(/_/g, ' ');
        });

        if (currentAssignment) {
          this.setState({ isLoadingSubmissions: true });
          const currentSubmissions = await Assignment.readSubmissionsAnonymous(currentAssignment.id, {
            grader: this.props.email,
          });

          this.setState({
            currentCourse,
            currentAssignment,
            currentSubmissions,
            isLoadingSubmissions: false,
          });
        }
      } else {
        this.setState({ currentCourse });
      }
    }
  };

  ///////////////////////////////////////
  // Loading methods
  ///////////////////////////////////////

  public loadAssignments = async (courses: CourseType[]) => {
    const assignments = {};

    await Promise.all(
      courses.map(async (course: CourseType) => {
        assignments[course.id] = sortAssignments(await loadIDList(course.assignments, Assignment));
        return;
      }),
    );

    return assignments;
  };

  ///////////////////////////////////////
  // Handlers
  ///////////////////////////////////////

  public handleAssignmentChange = async (newAssignment: ClickParam) => {
    const { assignments, currentCourse } = this.state;

    if (!currentCourse) {
      return;
    }

    const currentAssignment = assignments[currentCourse.id].filter((obj: AssignmentType) => {
      return obj.id === Number(newAssignment.key);
    })[0];

    if (currentAssignment) {
      this.setState({ isLoadingSubmissions: true, currentSubmissions: [] });
      const currentSubmissions = await Assignment.readSubmissionsAnonymous(currentAssignment.id, {
        grader: this.props.email,
      });

      this.setState({
        currentAssignment,
        currentSubmissions,
        isLoadingSubmissions: false,
        toLoadAssignment: true,
      });
    }
  };

  public handleCourseChange = async (e: ClickParam) => {
    const courseID = +e.key;
    const currentCourses = this.state.courses.filter((course: CourseType) => {
      return course.id === courseID;
    });

    if (currentCourses.length > 0) {
      const currentCourse = currentCourses[0];

      const currentSections = await loadIDList(currentCourse.sections, Section);
      this.setState({
        currentSections,
        currentAssignment: undefined,
        currentCourse,
        currentSubmissions: [],
        toLoadCourse: true,
      });
    }
  };

  public selectorItemsFormatter = (courses: CourseType[]) => {
    return courses.map((course, i) => ({ value: course.id, label: `${course.name} | ${course.period}` }));
  };

  public selectorCurrentFormatter = (currentCourse: CourseType | undefined) => {
    if (!currentCourse) {
      return undefined;
    }
    return { value: currentCourse.id, label: `${currentCourse.name} | ${currentCourse.period}` };
  };

  public tabItemsFormatter = (currentCourse: CourseType | undefined) => {
    const { assignments } = this.state;
    if (!currentCourse || !currentCourse.assignments || !assignments[currentCourse.id]) {
      return [];
    }

    return assignments[currentCourse.id].map((assignment, i) => ({
      label: assignment.name,
      value: assignment.id,
    }));
  };

  public getSectionParameters = (sections: SectionType[]) => {
    return sections.length === 0 ? [undefined] : sections;
  };

  public claimSubmission = async (
    assignment: AssignmentType,
    sections: SectionType[],
  ): Promise<SubmissionType | undefined> => {
    let submission;
    const sectionParameters = this.getSectionParameters(sections);

    // Note that calling fetchSubmission with section=undefined performs
    // the fetchSubmission operation without a section filter
    for (const section of sectionParameters) {
      submission = await this.fetchSubmission(assignment, section);
      if (submission) {
        break;
      }
    }

    if (submission) {
      this.setState({
        currentSubmissions: [...this.state.currentSubmissions, submission],
      });
    }

    return submission;
  };

  public fetchSubmission = async (
    assignment: AssignmentType,
    section?: SectionType,
  ): Promise<SubmissionType | undefined> => {
    const params = section ? `?section=${section.name}` : '';
    return await fetch(`${process.env.REACT_APP_API_URL}/assignments/${assignment.id}/drawUnassigned/${params}`, {
      headers: {
        Authorization: `JWT ${localStorage.getItem('token')}`,
      },
    })
      .then((res) => {
        if (res.status === 204) {
          return undefined;
        }
        return res.json();
      })
      .then((json) => {
        return json;
      });
  };

  public releaseSubmission = async (submission: SubmissionType): Promise<SubmissionType> => {
    const payload = {
      id: submission.id,
      grader: '',
      isFinalized: false,
    };

    const releasedSubmission = await Submission.update(payload);

    this.setState({
      currentSubmissions: this.state.currentSubmissions.filter((sub) => {
        return sub.id !== releasedSubmission.id;
      }),
    });

    return releasedSubmission;
  };

  public isSuperGrader = (superGraderCourses: CourseType[], currentCourse: CourseType): boolean => {
    return superGraderCourses.find((course: CourseType) => {
      return course.id === currentCourse.id;
    })
      ? true
      : false;
  };

  public isCourseAdmin = (courseAdminCourses: CourseType[], currentCourse: CourseType): boolean => {
    return courseAdminCourses.find((course: CourseType) => {
      return course.id === currentCourse.id;
    })
      ? true
      : false;
  };

  public getViewAllComponent = () => {
    if (!this.state.currentCourse || !this.state.currentAssignment) {
      return null;
    }

    const isSuperGrader = this.isSuperGrader(this.props.superGraderCourses, this.state.currentCourse);

    if (!isSuperGrader) {
      return null;
    }

    const viewAllPanel = (
      <TabPane key="2" tab="View All">
        <ViewAllPanel currentCourse={this.state.currentCourse} currentAssignment={this.state.currentAssignment} />
      </TabPane>
    );

    return viewAllPanel;
  };

  public getSectionsComponent = () => {
    if (!this.state.currentCourse || !this.state.currentAssignment) {
      return null;
    }

    const sections = this.props.sectionsLed.slice();
    const sectionsInThisCourse = sections.filter((section) => {
      return this.state.currentCourse!.sections.indexOf(section.id) !== -1;
    });
    const hasSections = sectionsInThisCourse.length > 0;

    if (!hasSections) {
      return null;
    }

    const sectionsPanel = (
      <TabPane key="3" tab="Sections">
        <SectionPanel
          sectionsLed={sectionsInThisCourse}
          currentCourse={this.state.currentCourse}
          currentAssignment={this.state.currentAssignment}
        />
      </TabPane>
    );

    return sectionsPanel;
  };

  ///////////////////////////////////////
  // Main
  ///////////////////////////////////////

  public render() {
    const { currentAssignment, currentCourse, currentSections, currentSubmissions, isLoadingSubmissions } = this.state;

    if (this.state.toLoadCourse || this.state.toLoadAssignment) {
      if (currentCourse) {
        const formattedCourseName = currentCourse.name.replace(/ /g, '_');
        const formattedPeriod = currentCourse.period.replace(/ /g, '_');
        if (this.state.toLoadAssignment && currentAssignment) {
          const formattedAssignmentName = currentAssignment.name.replace(/ /g, '_');
          return <Redirect to={`/grader/${formattedCourseName}/${formattedPeriod}/${formattedAssignmentName}`} />;
        } else {
          return <Redirect to={`/grader/${formattedCourseName}/${formattedPeriod}/`} />;
        }
      } else {
        return <Redirect to={'/grader'} />;
      }
    }

    let graderPanelContent;

    // if not loaded yet, render a get started div
    if (!currentCourse) {
      graderPanelContent = (
        <div style={{ padding: '40px', fontSize: 28 }}>
          <div>Select course</div>
        </div>
      );
    } else if (!currentAssignment) {
      graderPanelContent = (
        <div style={{ padding: '40px', fontSize: 28 }}>
          <div>Select an assignment</div>
        </div>
      );
    } else {
      const viewAllPanel = this.getViewAllComponent();
      const sectionPanel = this.getSectionsComponent();

      graderPanelContent = (
        <div
          style={{ margin: '20px 61px 0 61px', backgroundColor: '#fff', borderRadius: ' 5px', padding: '20px 35px' }}
        >
          <Tabs defaultActiveKey="1" animated={false}>
            <TabPane key="1" tab="My Submissions" style={{ overflow: 'scroll' }}>
              <MySubmissionsPanel
                claimSubmission={this.claimSubmission}
                releaseSubmission={this.releaseSubmission}
                assignment={currentAssignment}
                submissions={currentSubmissions}
                isAnonymous={this.state.currentAssignment ? this.state.currentAssignment.anonymousGrading : false}
                isLoadingSubmissions={isLoadingSubmissions}
                sections={currentSections}
                canViewSubmissionInfo={
                  currentSubmissions.length > 0 ? typeof currentSubmissions[0].students !== 'undefined' : false
                }
              />
            </TabPane>
            {viewAllPanel}
            {sectionPanel}
          </Tabs>
        </div>
      );
    }

    const sider = () => (
      <SelectorSider
        activeSelector={this.selectorCurrentFormatter(currentCourse)}
        selectorItems={this.selectorItemsFormatter(this.props.initialCourses)}
        onSelectorClick={this.handleCourseChange}
        activeMenuItem={currentAssignment ? currentAssignment.id : undefined}
        menuItems={this.tabItemsFormatter(currentCourse)}
        onMenuClick={this.handleAssignmentChange}
        theme="dark"
      />
    );

    const header = <StandardManagementHeader email={this.props.email} handleLogout={this.props.handleLogout} />;

    return <CPLayoutAdmin header={header} detail={graderPanelContent} navigation={sider} />;
  }
}

export default Grader;
