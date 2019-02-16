import * as React from 'react';
import { Redirect } from 'react-router-dom';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';

import GraderAssignmentPanel from './components/grader/GraderAssignmentPanel';
import SectionPanel from './components/grader/SectionPanel';
import ViewAllPanel from './components/grader/ViewAllPanel';

import VerticalPane from './components/VerticalPane';

import { ICourseToAssignmentMap, IOption } from './types/common';

import { Assignment, AssignmentType, sortAssignments } from './infrastructure/assignment';
import { CourseType } from './infrastructure/course';
import { Section, SectionType } from './infrastructure/section';
import { Submission, SubmissionType } from './infrastructure/submission';

interface IGraderState {
  courses: CourseType[];
  assignments: ICourseToAssignmentMap;
  currentAssignment?: AssignmentType;
  currentCourse?: CourseType;
  currentSections: SectionType[];
  currentSubmissions: SubmissionType[];

  isLoggedIn: boolean;
  redirect: boolean;

  // Loading variables
  isLoadingAssignments: boolean;
  isLoadingSubmissions: boolean;

  // URL variables
  toLoadCourse: boolean;
  toLoadAssignment: boolean;
}

interface IGraderProps {
  initialCourses: CourseType[];
  email: string;
  match: any;
  history: any;
  superGraderCourses: CourseType[];
  sectionsLed: SectionType[];
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

  public componentDidMount() {
    this.loadAllAssignments().then(() => {
      const sortedAssignmentMap = {};
      Object.keys(this.state.assignments).forEach((courseID) => {
        const sortedAssignments = sortAssignments(this.state.assignments[courseID]);
        sortedAssignmentMap[courseID] = sortedAssignments;
      });
      this.setState({ assignments: sortedAssignmentMap });
    });
  }

  // Used to fire this.setStateFromURL, which can only be done when courses and assignments are done loading
  public componentDidUpdate(prevProps: IGraderProps, prevState: IGraderState) {
    const { isLoadingAssignments, assignments, courses } = this.state;

    // Determine if assignments are done loading
    if (courses && assignments && prevState.assignments !== assignments) {
      const targetEntries = courses.reduce((acc, course) => acc + course.assignments.length, 0);
      const currEntries = Object.keys(assignments).reduce((acc, key) => acc + assignments[key].length, 0);
      if (targetEntries === currEntries) {
        this.setState({ isLoadingAssignments: false });
      }
    }

    // After loading necessary resources, set state from URL
    if (prevState.isLoadingAssignments && !isLoadingAssignments) {
      this.setStateFromURL();
    }

    if (this.state.toLoadCourse || this.state.toLoadAssignment) {
      this.setState({ toLoadCourse: false, toLoadAssignment: false });
    }
  }

  ///////////////////////////////////////
  // URL handler methods
  ///////////////////////////////////////

  public setStateFromURL = () => {
    const { courseName, period, assignmentName } = this.props.match.params;
    const { courses, assignments } = this.state;

    // Test whether (courseName, period) corresponds to loaded course
    let currentCourse: any;
    let currentAssignment: any;
    if (courseName && period) {
      const formattedCourseName = courseName.replace(/_/g, ' ');
      const formattedPeriod = period.replace(/_/g, ' ');
      currentCourse = courses.find((obj: CourseType) => {
        return obj.name === formattedCourseName && obj.period === formattedPeriod;
      });

      if (currentCourse) {
        this.loadSections(currentCourse);
      }

      // Given (courseName, period), test whether assignmentName corresponds to loaded assignment
      if (currentCourse && assignmentName) {
        const formattedAssignmentName = assignmentName.replace(/_/g, ' ');
        currentAssignment = assignments[currentCourse.id].find((obj: AssignmentType) => {
          return obj.name === formattedAssignmentName;
        });

        this.setState({ isLoadingSubmissions: true });
        this.loadSubmissions(currentAssignment).then(() => {
          this.setState({ currentCourse, currentAssignment, isLoadingSubmissions: false });
        });
      }
    }

    this.setState({ currentCourse, currentAssignment });
  };

  ///////////////////////////////////////
  // Loading methods
  ///////////////////////////////////////

  public loadAllAssignments = () => {
    const courses = this.state.courses;
    return Promise.all(
      courses.map((course: CourseType) => {
        return this.loadAssignments(course);
      }),
    );
  };

  public loadAssignments = (course: CourseType) => {
    return Promise.all(
      course.assignments.map((assignmentId: number) => {
        return Assignment.read(assignmentId).then((assignment) => {
          let assignments = [assignment];
          if (this.state.assignments[course.id]) {
            assignments = [...this.state.assignments[course.id], assignment];
          }
          this.setState({
            assignments: {
              ...this.state.assignments,
              [course.id]: assignments,
            },
          });
        });
      }),
    );
  };

  public loadSubmissions = (assignment: AssignmentType) => {
    return Assignment.readSubmissions(assignment.id, { grader: this.props.email }).then(
      (currentSubmissions: SubmissionType[]) => {
        this.setState({ currentSubmissions });
      },
    );
  };

  public loadSections = (course: CourseType) => {
    return Promise.all(
      course.sections.map((sectionID: number) => {
        return Section.read(sectionID);
      }),
    ).then((currentSections) => {
      this.setState({ currentSections });
    });
  };

  ///////////////////////////////////////
  // Handlers
  ///////////////////////////////////////

  public handleAssignmentChange = (option: IOption, event: any) => {
    const { assignments, currentCourse } = this.state;

    if (!currentCourse) {
      return;
    }

    const currentAssignment = assignments[currentCourse.id].filter((obj: AssignmentType) => {
      return obj.id === option.value;
    })[0];

    if (currentAssignment) {
      this.setState({ isLoadingSubmissions: true }, () => {
        this.loadSubmissions(currentAssignment).then(() => {
          this.setState({ currentAssignment, isLoadingSubmissions: false, toLoadAssignment: true });
        });
      });
    }
  };

  public handleCourseChange = (option: IOption) => {
    const currentCourse = this.state.courses.filter((obj: CourseType) => {
      return obj.id === option.value;
    })[0];

    this.loadSections(currentCourse).then(() => {
      this.setState({
        currentAssignment: undefined,
        currentCourse,
        currentSubmissions: [],
        toLoadCourse: true,
      });
    });
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

  public tabCurrentFormatter = (currentAssignment: AssignmentType | undefined) => {
    if (!currentAssignment) {
      return undefined;
    }
    return { value: currentAssignment.id, label: currentAssignment.name };
  };

  public claimSubmission = (assignment: AssignmentType, section: SectionType | undefined): any => {
    const params = section ? `?section=${section.name}` : '';
    return fetch(`${process.env.REACT_APP_API_URL}/assignments/${assignment.id}/drawUnassigned/${params}`, {
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
        if (json) {
          this.setState({
            currentSubmissions: [...this.state.currentSubmissions, json],
          });
        }
        return json;
      });
  };

  public releaseSubmission = (submission: SubmissionType): Promise<SubmissionType> => {
    const payload = {
      id: submission.id,
      grader: '',
      isFinalized: false,
    };

    return Submission.update(payload).then((json: any) => {
      this.setState({
        currentSubmissions: this.state.currentSubmissions.filter((sub) => {
          return sub.id !== submission.id;
        }),
      });
      return json;
    });
  };

  ///////////////////////////////////////
  // Main
  ///////////////////////////////////////

  public render() {
    const {
      courses,
      currentAssignment,
      currentCourse,
      currentSections,
      currentSubmissions,
      isLoadingSubmissions,
      toLoadCourse,
      toLoadAssignment,
    } = this.state;
    if (toLoadCourse || toLoadAssignment) {
      if (currentCourse) {
        const formattedCourseName = currentCourse.name.replace(/ /g, '_');
        const formattedPeriod = currentCourse.period.replace(/ /g, '_');
        if (toLoadAssignment && currentAssignment) {
          const formattedAssignmentName = currentAssignment.name.replace(/ /g, '_');
          return <Redirect to={`/grader/${formattedCourseName}/${formattedPeriod}/${formattedAssignmentName}`} />;
        } else {
          return <Redirect to={`/grader/${formattedCourseName}/${formattedPeriod}/`} />;
        }
      } else {
        return <Redirect to={'/grader'} />;
      }
    }

    // If grader is a superGrader, return tabbed content, with viewAll data
    const isSuperGrader =
      currentCourse &&
      typeof this.props.superGraderCourses.find((course) => {
        return course.id === currentCourse.id;
      }) !== 'undefined'
        ? true
        : false;

    let graderPanelContent;

    // if not loaded yet, render a get started div
    if (!currentCourse) {
      graderPanelContent = (
        <div className="grader__getStarted">
          <img className="grader__getStarted__arrow" src={require('./img/get-started-arrow-left.png')} />
          <div className="grader__getStarted__text">Select a course to get started.</div>
        </div>
      );
    } else if (!currentAssignment) {
      graderPanelContent = (
        <div className="grader__getStarted--assignment">
          <img className="grader__getStarted__arrow" src={require('./img/get-started-arrow-left-2.png')} />
          <div className="grader__getStarted__text">Select an assignment.</div>
        </div>
      );
    } else {
      // if superGrader show a course
      const sections = this.props.sectionsLed.slice();
      const sectionsInThisCourse = sections.filter((section) => {
        return currentCourse.sections.indexOf(section.id) !== -1;
      });

      // Pass the IDs to sectionPanel. SectionPanel will do another read to get the
      // most up to date section roster and leaders
      const sectionsIDsInThisCourse = sectionsInThisCourse.map((section) => {
        return section.id;
      });
      const hasSections = sectionsInThisCourse.length > 0;

      const viewAllPanel = isSuperGrader ? (
        <TabPanel>
          {/* padding under the tab required because tab is position:fixed*/}
          <div className="tabList--Grader__panelPadding" />
          <ViewAllPanel currentCourse={currentCourse} currentAssignment={currentAssignment} />
        </TabPanel>
      ) : (
        ''
      );
      const viewAllTab = isSuperGrader ? <Tab className="tabList--Grader__tab">View All</Tab> : '';
      const sectionPanel = hasSections ? (
        <TabPanel>
          {/* padding under the tab required because tab is position:fixed*/}
          <div className="tabList--Grader__panelPadding" />
          <SectionPanel
            sectionsLed={sectionsIDsInThisCourse}
            currentCourse={currentCourse}
            currentAssignment={currentAssignment}
          />
        </TabPanel>
      ) : (
        ''
      );
      const sectionTab = hasSections ? <Tab className="tabList--Grader__tab">Sections</Tab> : '';

      graderPanelContent = (
        <Tabs defaultIndex={0}>
          <TabList className="tabList--Grader">
            <Tab className="tabList--Grader__tab">My Submissions</Tab>
            {viewAllTab}
            {sectionTab}
          </TabList>
          <TabPanel>
            {/* padding under the tab required because tab is position:fixed*/}
            <div className="tabList--Grader__panelPadding" />
            <GraderAssignmentPanel
              claimSubmission={this.claimSubmission}
              releaseSubmission={this.releaseSubmission}
              assignment={currentAssignment}
              submissions={currentSubmissions}
              isLoadingSubmissions={isLoadingSubmissions}
              sections={currentSections}
            />
          </TabPanel>
          {viewAllPanel}
          {sectionPanel}
        </Tabs>
      );
    }

    return (
      <div className="grader">
        <div className="grader__left-panel">
          <VerticalPane
            currentTab={this.tabCurrentFormatter(currentAssignment)}
            currentSelector={this.selectorCurrentFormatter(currentCourse)}
            selectorItems={this.selectorItemsFormatter(courses)}
            tabItems={this.tabItemsFormatter(currentCourse)}
            handleTabChange={this.handleAssignmentChange}
            handleSelectorChange={this.handleCourseChange}
          />
        </div>
        <div className="grader__right-panel">{graderPanelContent}</div>
      </div>
    );
  }
}

export default Grader;
