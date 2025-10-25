/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */

import { SettingOutlined } from '@ant-design/icons';

/* antd imports */
import { Button, Layout } from 'antd';

/* other library imports */
import { Link, Route, Routes } from 'react-router-dom';
import { RouteComponentProps, LegacyRouteRenderer } from '../../router/legacy';

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
import { loadIDList } from '../../infrastructure/generics';
import { SectionType } from '../../infrastructure/section';

import GraderNav from './GraderNav';

import RegradesPanel from './RegradesPanel';

import Referral from '../core/Referral';
import RoleMenu from '../core/RoleMenu';

import AssignmentMenu from '../core/AssignmentMenu';
import CourseMenu from '../core/CourseMenu';

import { IComponentProps } from '../core/ComponentManager';

import { CIPGraderModal } from '../cip/components';

import { Component } from 'react';
import VideoModal from '../landing/VideoModal';

/**********************************************************************************************************************/

interface IGraderState {
  /* tab data */
  isSuperGrader: boolean;
  sectionsLed: SectionType[];
  assignments: AssignmentType[];
  isLoading: boolean;
  showBanner: boolean;
  showConversionModal: boolean;
}

class Grader extends Component<IComponentProps, IGraderState> {
  private timer: number;
  private times: number[] = [];

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
      showConversionModal: false,
    };
  }

  // ADD THIS BACK TO TURN ON THE SURVEY AGAIN
  // public componentDidMount() {
  //   setTimeout(() => {
  //     this.setState({ showBanner: true });
  //   }, 1000);
  // }

  public componentDidUpdate = (_prevProps: IComponentProps, prevState: IGraderState) => {
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

  public loadAssignments = async (course: CourseType): Promise<AssignmentType[]> => {
    return loadIDList<AssignmentType>(course.assignments, Assignment);
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
        <Routes>
          <Route index element={<div>Select a panel from the navigation</div>} />
          {this.props.currentCourse && this.props.currentCourse.activateQueue && (
            <Route
              key="my_submissions"
              path="my_submissions/*"
              element={
                <LegacyRouteRenderer
                  path={`${this.props.match.url}/my_submissions/*`}
                  render={(_props: RouteComponentProps) => (
                    <MySubmissionsPanel
                      {..._props}
                      course={currentCourse}
                      assignments={this.state.assignments}
                      graderEmail={this.props.user.email}
                      isAdmin={this.props.user.courseadminCourses.some((el) => {
                        return el.id === currentCourse.id;
                      })}
                    />
                  )}
                />
              }
            />
          )}
          {this.state.sectionsLed.length > 0 ? (
            <Route
              key="my_sections"
              path="my_sections/*"
              element={
                <LegacyRouteRenderer
                  path={`${this.props.match.url}/my_sections/*`}
                  render={(_props: RouteComponentProps) => (
                    <SectionPanel
                      {..._props}
                      course={currentCourse}
                      assignments={this.state.assignments}
                      graderEmail={this.props.user.email}
                      sections={this.state.sectionsLed}
                      isAdmin={this.props.user.courseadminCourses.some((el) => {
                        return el.id === currentCourse.id;
                      })}
                    />
                  )}
                />
              }
            />
          ) : undefined}
          {this.state.isSuperGrader ? (
            <Route
              key="all_submissions"
              path="all_submissions/*"
              element={
                <LegacyRouteRenderer
                  path={`${this.props.match.url}/all_submissions/*`}
                  render={(_props: RouteComponentProps) => (
                    <ViewAllPanel {..._props} course={currentCourse} assignments={this.state.assignments} />
                  )}
                />
              }
            />
          ) : undefined}
          {someRegrades && currentCourse ? (
            <Route
              path="regrades/*"
              key="regrades"
              element={
                <LegacyRouteRenderer
                  path={`${this.props.match.url}/regrades/*`}
                  render={(_props: RouteComponentProps) => (
                    <RegradesPanel
                      {..._props}
                      course={currentCourse}
                      assignments={this.state.assignments}
                      user={this.props.user}
                      isAnonymous={false}
                      isAdmin={this.props.user.courseadminCourses.some((el) => {
                        return el.id === currentCourse.id;
                      })}
                      isSuperGrader={this.state.isSuperGrader}
                    />
                  )}
                />
              }
            />
          ) : undefined}{' '}
          <Route
            path="video"
            key="video"
            element={
              <LegacyRouteRenderer
                path={`${this.props.match.url}/video`}
                render={(_props: RouteComponentProps) => (
                  <VideoModal open={true} onCancel={() => this.props.history.push('/grader')} />
                )}
              />
            }
          />
        </Routes>
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
        <Routes>
          <Route
            path=":panel/:assignment"
            element={
              <LegacyRouteRenderer
                path={`${this.props.match.url}/:panel/:assignment`}
                render={(_props: RouteComponentProps<{ panel: string; assignment: string }>) => (
                  <AssignmentMenu
                    {..._props}
                    currentCourse={currentCourse}
                    assignments={this.state.assignments}
                    baseURL={this.props.match.url}
                  />
                )}
              />
            }
          />
        </Routes>
      );
    }

    const headerLeft = [courseDropdown, assignmentDropdown];

    const showNewCourseBtn = !this.props.user.hasCredentials;
    const logout = (
      <Button key="header-logout" onClick={this.props.handleLogout}>
        Log Out
      </Button>
    );

    const headerRight = [
      showNewCourseBtn && (
        <Button onClick={() => this.setState({ showConversionModal: true })}>Create your own course</Button>
      ),
      <span key="header-user" className="cp-label cp-label--bold">
        {this.props.user.email}
      </span>,
      <Referral key="referral" user={this.props.user} theme="light" />,
      <RoleMenu key="header-roles" user={this.props.user} thisApp={USER_TYPE.GRADER} theme="light" />,
      <CPTooltip key="settings" title={tooltips.management.header.settings} hideThisOnHideTips={true}>
        <Link className="internal-link" to="/settings">
          <SettingOutlined />
        </Link>
      </CPTooltip>,
      logout,
    ];

    const header = <CPFlex left={headerLeft} right={headerRight} gutterSize={10} />;

    const navigation = (collapsed: boolean) => {
      // Extract the panel from the current location
      const locationParts = this.props.location.pathname.split('/');
      const baseUrlParts = this.props.match.url.split('/');
      const panelIndex = baseUrlParts.length;
      const panel = locationParts[panelIndex];

      return (
        <GraderNav
          {...this.props}
          match={{
            ...this.props.match,
            params: { panel: panel || '' },
          }}
          baseURL={this.props.match.url}
          collapsed={collapsed}
          isSuperGrader={this.state.isSuperGrader}
          isSectionLeader={this.state.sectionsLed.length > 0}
          regradesAllowed={someRegrades}
          activateQueue={!!(this.props.currentCourse && this.props.currentCourse.activateQueue)}
        />
      );
    };

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
            <CIPGraderModal
              open={this.state.showConversionModal}
              onClose={() => this.setState({ showConversionModal: false })}
              email={this.props.user.email}
            />
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
