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
import { loadIDList } from './infrastructure/generics';
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

export interface IGraderProps {
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

  public async componentDidMount() {
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
          const currentSubmissions = await Assignment.readSubmissions(currentAssignment.id, {
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

  public handleAssignmentChange = async (option: IOption, event: any) => {
    const { assignments, currentCourse } = this.state;

    if (!currentCourse) {
      return;
    }

    const currentAssignment = assignments[currentCourse.id].filter((obj: AssignmentType) => {
      return obj.id === option.value;
    })[0];

    if (currentAssignment) {
      this.setState({ isLoadingSubmissions: true });
      const currentSubmissions = await Assignment.readSubmissions(currentAssignment.id, { grader: this.props.email });

      this.setState({
        currentAssignment,
        currentSubmissions,
        isLoadingSubmissions: false,
        toLoadAssignment: true,
      });
    }
  };

  public handleCourseChange = async (option: IOption) => {
    const currentCourse = this.state.courses.filter((obj: CourseType) => {
      return obj.id === option.value;
    })[0];

    const currentSections = await loadIDList(currentCourse.sections, Section);

    this.setState({
      currentSections,
      currentAssignment: undefined,
      currentCourse,
      currentSubmissions: [],
      toLoadCourse: true,
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
    } = this.state;

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
