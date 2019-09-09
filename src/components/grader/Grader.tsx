/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* antd imports */
import { Button, Icon, Menu } from 'antd';
import { ClickParam } from 'antd/lib/menu';

/* other library imports */
import { Link } from 'react-router-dom';

import CPLayoutAdmin from '../admin/other/CPLayoutAdmin';

import CPDropdown from '../core/CPDropdown';

import CPFlex from '../core/CPFlex';
import CPTooltip from '../core/CPTooltip';
import { tooltips } from '../core/tooltips';

import _ from 'lodash';

/* codePost imports */
import MySubmissionsPanel from './MySubmissionsPanel';
import SectionPanel from './SectionPanel';
import ViewAllPanel from './ViewAllPanel';

import { ICourseToAssignmentMap, USER_TYPE } from '../../types/common';

import { Assignment, AssignmentType } from '../../infrastructure/assignment';
import { CourseType } from '../../infrastructure/course';
import { loadIDList } from '../../infrastructure/generics';
import { SectionType } from '../../infrastructure/section';
import { UserType } from '../../infrastructure/user';

import GraderNav from './GraderNav';

import RegradesPanel from './RegradesPanel';

import RoleMenu from '../core/RoleMenu';

/**********************************************************************************************************************/

export enum PANELS {
  MY_SUBMISSIONS,
  MY_SECTIONS,
  VIEW_ALL,
  REGRADES,
}

const panelStrings = ['my_submissions', 'my_sections', 'view_all', 'regrades'];

const panels = {
  [PANELS.MY_SUBMISSIONS]: panelStrings[PANELS.MY_SUBMISSIONS],
  [PANELS.MY_SECTIONS]: panelStrings[PANELS.MY_SECTIONS],
  [PANELS.VIEW_ALL]: panelStrings[PANELS.VIEW_ALL],
  [PANELS.REGRADES]: panelStrings[PANELS.REGRADES],
};

interface IGraderState {
  /* UI control */
  currentPanel: PANELS;

  /* course data */
  assignments: ICourseToAssignmentMap;
  currentAssignment?: AssignmentType;
  currentCourse?: CourseType;

  // Loading variables
  isLoadingAssignments: boolean;

  /* tab data */
  isSuperGrader: boolean;
  sectionsLed: SectionType[];
}

export interface IGraderProps {
  courses: CourseType[];
  match: any;
  history: any;
  superGraderCourses: CourseType[];
  sectionsLed: SectionType[];
  user: UserType;
  handleLogout: () => void;
}

class Grader extends React.Component<IGraderProps, IGraderState> {
  public constructor(props: IGraderProps) {
    super(props);
    document.title = 'codePost - Grader Console';

    this.state = {
      currentPanel: PANELS.MY_SUBMISSIONS,
      assignments: {},
      currentAssignment: undefined,
      currentCourse: undefined,
      isLoadingAssignments: true,
      isSuperGrader: false,
      sectionsLed: [],
    };
  }

  /***********************************************************************************
  /* Lifecycle methods
  /**********************************************************************************/

  public componentDidMount() {
    this.loadAssignments(this.props.courses).then((assignments) => {
      this.setState({ assignments, isLoadingAssignments: false }, () => {
        const { course, assignment, panel } = this.setStateFromURL(this.props.courses, assignments);
        if (course) {
          this.setTabs(course);
          this.changeURL(course, assignment, panel);
          this.setState({ currentCourse: course, currentAssignment: assignment, currentPanel: panel });
        }
      });
    });
  }

  /***********************************************************************************
  /* URL + UI handling methods
  /**********************************************************************************/

  public setTabs = (currentCourse: CourseType) => {
    const isSuperGrader = this.isSuperGrader(this.props.superGraderCourses, currentCourse);
    const sectionsLed = this.sectionsLedInThisCourse(this.props.sectionsLed, currentCourse);
    this.setState({ isSuperGrader, sectionsLed });
  };

  public isSuperGrader = (superGraderCourses: CourseType[], currentCourse: CourseType): boolean => {
    return superGraderCourses.some((course: CourseType) => {
      return course.id === currentCourse.id;
    });
  };

  public sectionsLedInThisCourse = (sectionsLed: SectionType[], currentCourse: CourseType) => {
    const sections = sectionsLed.slice();
    return sections.filter((section) => {
      return currentCourse.sections.indexOf(section.id) !== -1;
    });
  };

  public changeURL = (course: CourseType, assignment?: AssignmentType, panel?: number) => {
    const courseName = course.name.replace(/ /g, '_');
    const coursePeriod = course.period.replace(/ /g, '_');

    if (assignment === undefined || panel === undefined) {
      this.props.history.push(`/grader/${courseName}/${coursePeriod}`);
    } else {
      const assignmentName = assignment.name.replace(/ /g, '_');
      this.props.history.push(`/grader/${courseName}/${coursePeriod}/${assignmentName}/${panels[panel]}`);
    }
  };

  public panelFromString(name: string) {
    const toRet = panelStrings.indexOf(name);
    return toRet >= 0 ? toRet : 0;
  }

  public changePanel = (panelNum: number) => {
    this.setState({ currentPanel: panelNum });
    if (this.state.currentCourse) {
      this.changeURL(this.state.currentCourse, this.state.currentAssignment, panelNum);
    }
  };

  public handleTabClick = (e: ClickParam) => {
    this.changePanel(parseInt(e.key, 10));
  };

  public setStateFromURL = (courses: CourseType[], assignments: ICourseToAssignmentMap) => {
    const { courseName, period, assignmentName, panelName1 } = this.props.match.params;
    if (courses.length === 0) {
      return { course: undefined, panel: 0 };
    } else {
      // is the URL trying to set the course?
      const tryingToSetCourse = courseName && period;
      let currentCourse: CourseType | undefined;
      let currentAssignment: AssignmentType | undefined;
      let currentPanel = PANELS.MY_SUBMISSIONS;
      if (tryingToSetCourse) {
        const formattedCourseName = courseName.replace(/_/g, ' ');
        const formattedPeriod = period.replace(/_/g, ' ');
        currentCourse = courses.find((obj: CourseType) => {
          return obj.name === formattedCourseName && obj.period === formattedPeriod;
        });
      }

      if (currentCourse) {
        // is the URL trying to set the assignment?
        if (assignmentName) {
          const formattedAssignmentName = assignmentName.replace(/_/g, ' ');
          const assignmentList = assignments[currentCourse.id];
          currentAssignment = assignmentList.find((assignment) => {
            return assignment.name === formattedAssignmentName;
          });

          if (currentAssignment) {
            // is the URL trying to set the panel?
            currentPanel = this.panelFromString(panelName1);
          }
        }
      }

      // By default open first course in course list
      if (!currentCourse && courses.length > 0) {
        currentCourse = courses.sort((a, b) => {
          return b.id - a.id;
        })[0];
      }

      return { course: currentCourse, assignment: currentAssignment, panel: currentPanel };
    }
  };

  /***********************************************************************************
  /* Data loading methods
  /**********************************************************************************/

  public loadAssignments = async (courses: CourseType[]) => {
    return Promise.all(
      courses.map((course: CourseType) => {
        return loadIDList(course.assignments, Assignment);
      }),
    ).then((assignments) => {
      const toRet = {};
      courses.forEach((course, i) => {
        toRet[course.id] = assignments[i];
      });
      return toRet;
    });
  };

  /***********************************************************************************
  /* Utility functions
  /**********************************************************************************/

  public handleAssignmentChange = (newAssignment: ClickParam) => {
    const { assignments, currentCourse } = this.state;

    if (!currentCourse) {
      return;
    }

    const currentAssignment = assignments[currentCourse.id].find((obj: AssignmentType) => {
      return obj.id === Number(newAssignment.key);
    });

    this.setState({ currentAssignment }, () => {
      this.changeURL(currentCourse, currentAssignment, this.state.currentPanel);
    });
  };

  public handleCourseChange = async (e: ClickParam) => {
    const courseID = +e.key;
    const thisCourse = this.props.courses.find((course: CourseType) => {
      return course.id === courseID;
    });

    if (thisCourse !== undefined) {
      this.setState({
        currentAssignment: undefined,
        currentCourse: thisCourse,
        isSuperGrader: this.isSuperGrader(this.props.superGraderCourses, thisCourse),
        sectionsLed: this.sectionsLedInThisCourse(this.props.sectionsLed, thisCourse),
      });
    }
  };

  public selectorItemsFormatter = (assignments: AssignmentType[]) => {
    return assignments.map((assignment, i) => ({ value: assignment.id, label: assignment.name }));
  };

  public selectorCurrentFormatter = (assignment: AssignmentType | undefined) => {
    if (assignment === undefined) {
      return undefined;
    }
    return { value: assignment.id, label: assignment.name };
  };

  public getViewAllComponent = () => {
    if (!this.state.currentCourse || !this.state.currentAssignment || !this.state.isSuperGrader) {
      return null;
    }

    return <ViewAllPanel currentCourse={this.state.currentCourse} currentAssignment={this.state.currentAssignment} />;
  };

  public getSectionsComponent = () => {
    if (!this.state.currentCourse || !this.state.currentAssignment || this.state.sectionsLed.length === 0) {
      return null;
    }

    return (
      <SectionPanel
        sectionsLed={this.state.sectionsLed}
        currentCourse={this.state.currentCourse}
        currentAssignment={this.state.currentAssignment}
      />
    );
  };

  public getRegradesComponent = () => {
    if (
      !this.state.currentCourse ||
      !this.state.currentAssignment ||
      !this.state.currentAssignment.allowRegradeRequests
    ) {
      return null;
    }
    return (
      <RegradesPanel
        assignment={this.state.currentAssignment}
        isAnonymous={this.state.currentAssignment.anonymousGrading}
        user={this.props.user}
        isAdmin={this.props.user.courseadminCourses.some((el) => {
          return el.id === this.state.currentCourse!.id;
        })}
        isSuperGrader={this.state.isSuperGrader}
      />
    );
  };

  /***********************************************************************************
  /* Render
  /**********************************************************************************/

  public render() {
    const { currentAssignment, currentCourse } = this.state;

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
      switch (this.state.currentPanel) {
        case PANELS.MY_SUBMISSIONS:
          graderPanelContent = (
            <MySubmissionsPanel
              assignment={currentAssignment}
              course={currentCourse}
              isAnonymous={currentAssignment.anonymousGrading}
              graderEmail={this.props.user.email}
              isAdmin={this.props.user.courseadminCourses.some((el) => {
                return el.id === currentCourse.id;
              })}
            />
          );
          break;
        case PANELS.MY_SECTIONS:
          graderPanelContent = this.getSectionsComponent();
          break;
        case PANELS.VIEW_ALL:
          graderPanelContent = this.getViewAllComponent();
          break;
        case PANELS.REGRADES:
          graderPanelContent = this.getRegradesComponent();
      }
    }

    /* Build header */
    let courseSelectorText = 'Select a course';
    if (this.state.currentCourse) {
      courseSelectorText = `${this.state.currentCourse.name} | ${this.state.currentCourse.period}`;
    }
    const courseMenu = (
      <Menu onClick={this.handleCourseChange}>
        {this.props.courses.map((course, i) => {
          return <Menu.Item key={course.id}>{`${course.name} | ${course.period}`}</Menu.Item>;
        })}
      </Menu>
    );
    const courseDropdown = <CPDropdown value={courseSelectorText} overlay={courseMenu} />;

    let assignmentSelectorText = 'Select an assignment';
    if (this.state.currentAssignment) {
      assignmentSelectorText = this.state.currentAssignment.name;
    }
    const assignmentMenu =
      this.state.currentCourse && this.state.assignments[this.state.currentCourse.id] ? (
        <Menu onClick={this.handleAssignmentChange}>
          {this.state.assignments[this.state.currentCourse.id].map((assignment, i) => {
            return <Menu.Item key={assignment.id}>{assignment.name}</Menu.Item>;
          })}
        </Menu>
      ) : (
        <Menu />
      );
    const assignmentDropdown = (
      <CPDropdown
        value={assignmentSelectorText}
        overlay={assignmentMenu}
        disabled={this.state.currentCourse === undefined}
      />
    );

    const headerLeft = [courseDropdown, assignmentDropdown];

    const headerRight = [
      <span key="header-user" className="cp-label cp-label--bold">
        {this.props.user.email}
      </span>,
      <RoleMenu key="header-roles" user={this.props.user} thisApp={USER_TYPE.GRADER} theme="light" />,
      <CPTooltip key="settings" title={tooltips.management.header.settings} hideThisOnHideTips={true}>
        <Link className="internal-link" to="/settings">
          <Icon type="setting" />
        </Link>
      </CPTooltip>,
      <Button key="header-logout" size="small" onClick={this.props.handleLogout}>
        Logout
      </Button>,
    ];

    const header = <CPFlex left={headerLeft} right={headerRight} gutterSize={10} />;
    const navigation = (collapsed: boolean) => (
      <GraderNav
        selectedPanel={this.state.currentPanel}
        collapsed={collapsed}
        onClick={this.handleTabClick}
        isSuperGrader={this.state.isSuperGrader}
        isSectionLeader={this.state.sectionsLed.length > 0}
        regradesAllowed={
          this.state.currentAssignment !== undefined && this.state.currentAssignment.allowRegradeRequests
        }
      />
    );

    return (
      <CPLayoutAdmin
        header={header}
        detail={graderPanelContent}
        navigation={navigation}
        collapsible={true}
        role={USER_TYPE.GRADER}
      />
    );
  }
}

export default Grader;
