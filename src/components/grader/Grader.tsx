/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* antd imports */
import { Button, Icon, Layout } from 'antd';

/* other library imports */
import { Route, Link, Switch } from 'react-router-dom';

import CPLayoutAdmin from '../admin/other/CPLayoutAdmin';

import CPFlex from '../core/CPFlex';
import CPTooltip from '../core/CPTooltip';
import { tooltips } from '../core/tooltips';

/* codePost imports */
import MySubmissionsPanel from './MySubmissionsPanel';
import SectionPanel from './SectionPanel';
import ViewAllPanel from './ViewAllPanel';

import { USER_TYPE } from '../../types/common';

import { Assignment, AssignmentType } from '../../infrastructure/assignment';
import { CourseType } from '../../infrastructure/course';
import { SectionType } from '../../infrastructure/section';
import { loadIDList } from '../../infrastructure/generics';

import GraderNav from './GraderNav';

import RegradesPanel from './RegradesPanel';

import RoleMenu from '../core/RoleMenu';
import Referral from '../core/Referral';

import CourseMenu from '../core/CourseMenu';
import AssignmentMenu from '../core/AssignmentMenu';

import { IComponentProps } from '../core/ComponentManager';

/**********************************************************************************************************************/

interface IGraderState {
  /* tab data */
  isSuperGrader: boolean;
  sectionsLed: SectionType[];
  assignments: AssignmentType[];
  isLoading: boolean;
  showBanner: boolean;
}

class Grader extends React.Component<IComponentProps, IGraderState> {
  private timer: any;
  private times: any = [];

  public constructor(props: IComponentProps) {
    super(props);
    this.timer = Date.now();
    document.title = 'codePost - Grader Console';
    const { currentCourse, superGraderCourses, sectionsLed } = props;

    if (currentCourse !== undefined) {
      this.loadAssignments(currentCourse).then((assignments) => {
        this.setState({ assignments, isLoading: false });
      });
    }

    this.state = {
      isLoading: true,
      assignments: [],
      isSuperGrader: currentCourse
        ? superGraderCourses.some((course) => {
            return course.id === currentCourse.id;
          })
        : false,
      sectionsLed: currentCourse
        ? sectionsLed.slice().filter((section) => {
            return currentCourse.sections.indexOf(section.id) !== -1;
          })
        : [],
      showBanner: false,
    };
  }

  // ADD THIS BACK TO TURN ON THE SURVEY AGAIN
  // public componentDidMount() {
  //   setTimeout(() => {
  //     this.setState({ showBanner: true });
  //   }, 1000);
  // }

  public componentDidUpdate = (prevProps: any, prevState: any) => {
    if (!prevState.assignments && this.state.assignments) {
      const current = Date.now() - this.timer;

      this.times = [...this.times, current];
      // console.log('ASSIGNMENTS COMPLETE: ', current);
      // console.log(this.times.join('|'));
    }

    // if (!prevState.sectionsLed && this.state.sectionsLed) {
    //   const current = Date.now() - this.timer;
    //   this.times = [...this.times, current];
    //   console.log('SECTIONS COMPLETE: ', current);
    //   console.log(this.times.join('|'));
    // }
  };

  public loadAssignments = async (course: CourseType) => {
    return loadIDList(course.assignments, Assignment);
  };

  /***********************************************************************************
  /* Render
  /**********************************************************************************/

  public render() {
    const { currentCourse } = this.props;
    const someRegrades = this.state.assignments.some((assn) => assn.allowRegradeRequests);

    let graderPanelContent;
    // if not loaded yet, render a get started div
    if (!currentCourse) {
      graderPanelContent = (
        <div style={{ padding: '40px', fontSize: 28 }}>
          <div>Select course</div>
        </div>
      );
    } else {
      graderPanelContent = (
        <Switch>
          <Route
            key="my_submissions"
            path={`${this.props.match.url}/my_submissions`}
            render={(props: any) => (
              <MySubmissionsPanel
                {...props}
                course={currentCourse}
                assignments={this.state.assignments}
                graderEmail={this.props.user.email}
                isAdmin={this.props.user.courseadminCourses.some((el) => {
                  return el.id === currentCourse.id;
                })}
              />
            )}
          />
          {this.state.sectionsLed.length > 0 ? (
            <Route
              key="my_sections"
              path={`${this.props.match.url}/my_sections`}
              render={(props: any) => (
                <SectionPanel
                  {...props}
                  course={currentCourse}
                  assignments={this.state.assignments}
                  graderEmail={this.props.user.email}
                  sections={this.state.sectionsLed}
                />
              )}
            />
          ) : (
            undefined
          )}
          {this.state.isSuperGrader ? (
            <Route
              key="all_submissions"
              path={`${this.props.match.url}/all_submissions`}
              render={(props: any) => (
                <ViewAllPanel {...props} course={currentCourse} assignments={this.state.assignments} />
              )}
            />
          ) : (
            undefined
          )}
          {someRegrades ? (
            <Route
              path={`${this.props.match.url}/regrades`}
              key="regrades"
              render={(props: any) => (
                <RegradesPanel
                  {...props}
                  course={this.props.currentCourse}
                  assignments={this.state.assignments}
                  user={this.props.user}
                  isAdmin={this.props.user.courseadminCourses.some((el) => {
                    return el.id === currentCourse.id;
                  })}
                  isSuperGrader={this.state.isSuperGrader}
                />
              )}
            />
          ) : (
            undefined
          )}{' '}
        </Switch>
      );
    }

    /* Build header */
    const courseDropdown = (
      <CourseMenu
        courses={this.props.initialCourses}
        currentCourse={this.props.currentCourse}
        panel="my_submissions"
        base="grader"
      />
    );

    let assignmentDropdown;
    if (currentCourse) {
      assignmentDropdown = (
        <Route
          path={`${this.props.match.url}/:panel?/:assignment?`}
          render={(props: any) => (
            <AssignmentMenu
              {...props}
              currentCourse={currentCourse}
              assignments={this.state.assignments}
              baseURL={this.props.match.url}
            />
          )}
        />
      );
    }

    const headerLeft = [courseDropdown, assignmentDropdown];

    const headerRight = [
      <span key="header-user" className="cp-label cp-label--bold">
        {this.props.user.email}
      </span>,
      <Referral key="referral" user={this.props.user} theme="light" />,
      <RoleMenu key="header-roles" user={this.props.user} thisApp={USER_TYPE.GRADER} theme="light" />,
      <CPTooltip key="settings" title={tooltips.management.header.settings} hideThisOnHideTips={true}>
        <Link className="internal-link" to="/settings">
          <Icon type="setting" />
        </Link>
      </CPTooltip>,
      <Button key="header-logout" onClick={this.props.handleLogout}>
        Logout
      </Button>,
    ];

    const header = <CPFlex left={headerLeft} right={headerRight} gutterSize={10} />;

    const navigation = (collapsed: boolean) => (
      <Switch>
        <Route
          path={`${this.props.match.url}/:panel?`}
          render={(props: any) => (
            <GraderNav
              {...props}
              baseURL={this.props.match.url}
              collapsed={collapsed}
              isSuperGrader={this.state.isSuperGrader}
              isSectionLeader={this.state.sectionsLed.length > 0}
              regradesAllowed={someRegrades}
            />
          )}
        />
      </Switch>
    );

    return (
      <CPLayoutAdmin
        header={header}
        detail={
          <span>
            {this.state.showBanner ? (
              <Layout.Footer
                style={{ background: 'rgba(36, 190, 132, 0.13)', margin: '10px 60px 0 60px', padding: '18px 30px' }}
              >
                <b>Hi there!</b> Please take{' '}
                <a href="https://forms.gle/DB8Up1EWjpyNoTHA7" target="_blank" rel="noopener noreferrer">
                  our end-of-semester survey
                </a>
                . Your feedback helps make codePost possible and keeps us improving.{' '}
              </Layout.Footer>
            ) : null}

            {graderPanelContent}
          </span>
        }
        navigation={navigation}
        collapsible={true}
        role={USER_TYPE.GRADER}
      />
    );
  }
}

export default Grader;
