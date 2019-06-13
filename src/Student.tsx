import * as React from 'react';
import { Redirect } from 'react-router-dom';

import themeVars from './styles/abstracts/_theme.js';

import Grade from './Grade';

import StandardConsoleHeader from './components/core/layouts/StandardConsoleHeader';
import StandardConsoleLayout, { ConsoleType } from './components/core/layouts/StandardConsoleLayout';

import { SubheaderInfo, SubheaderStatistic, SubheaderTitle } from './components/code-review/Subheader';

import { StudentCode } from './components/code-review/code-panel/CodeContent';

import { StudentComments } from './components/code-review/code-panel/Comments';

import Loading from './components/core/Loading';

import FileMenu from './components/code-review/FileMenu';

import CPFlex from './components/core/CPFlex';

import CodePanelLayout from './components/code-review/code-panel/CodePanelLayout';

import SelectorSider from './components/core/SelectorSider';

import { Drawer } from 'antd';
import { ClickParam } from 'antd/lib/menu';

import { ICommentToRubricCommentMap, ICourseToAssignmentMap, IFileToCommentsMap } from './types/common';

import { Assignment, AssignmentType, sortAssignments } from './infrastructure/assignment';
import { CourseType } from './infrastructure/course';
import { FileType } from './infrastructure/file';
import { loadIDList } from './infrastructure/generics';
import { RubricCategory, RubricCategoryType } from './infrastructure/rubricCategory';
import { StudentSubmissionType, Submission } from './infrastructure/submission';

interface IStudentState {
  assignments: ICourseToAssignmentMap;
  files: FileType[];
  comments: IFileToCommentsMap;
  commentRubricComments: ICommentToRubricCommentMap;
  rubricCategories: RubricCategoryType[];

  currentCourse?: CourseType;
  currentAssignment?: AssignmentType;
  currentSubmission?: StudentSubmissionType;
  currentFile?: FileType;

  isLoggedIn: boolean;
  redirect: boolean;

  // Loading variables
  isLoadingAssignments: boolean;
  isLoadingSubmission: boolean;

  // URL variables
  toLoadCourse: boolean;
  toLoadAssignment: boolean;
}

export interface IStudentProps {
  initialCourses: CourseType[];
  email: string;
  match: any;
  history: any;

  // handleLogout
  handleLogout: () => void;
}

export enum STATUS {
  SelectCourse,
  NoAssignments,
  SelectAssignment,
  NoSubmission,
  SubmissionLoading,
  NotGraded,
  ShowSubmission,
}

class Student extends React.Component<IStudentProps, IStudentState> {
  public state: Readonly<IStudentState> = {
    assignments: {},
    comments: {},
    currentAssignment: undefined,
    currentCourse: undefined,
    currentSubmission: undefined,
    currentFile: undefined,
    files: [],
    isLoadingAssignments: true,
    isLoadingSubmission: false,
    isLoggedIn: localStorage.getItem('token') ? true : false,
    redirect: false,
    rubricCategories: [],
    commentRubricComments: {},
    toLoadCourse: false,
    toLoadAssignment: false,
  };

  public async componentDidMount() {
    document.title = 'codePost - Student';
    const assignments = await this.loadAssignments(this.props.initialCourses);
    this.setState({ assignments, isLoadingAssignments: false });

    await this.setStateFromURL();
  }

  public componentDidUpdate(prevProps: IStudentProps, prevState: IStudentState) {
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
      currentCourse = this.props.initialCourses.find((course: CourseType) => {
        return course.name === courseName.replace(/_/g, ' ') && course.period === period.replace(/_/g, ' ');
      });

      if (currentCourse && assignmentName) {
        currentAssignment = this.state.assignments[currentCourse.id].find((assignment: AssignmentType) => {
          return assignment.name === assignmentName.replace(/_/g, ' ');
        });

        if (currentAssignment) {
          this.setState({ isLoadingSubmission: true });
          const rubricCategories = await this.loadRubricCategories(currentAssignment);
          const currentSubmission = await this.loadSubmission(currentAssignment);

          if (currentSubmission) {
            const [files, comments, commentRubricComments] = await Submission.loadData(currentSubmission);
            let currentFile;
            if (files.length > 0) {
              currentFile = files[0];
            }
            // @ts-ignore
            this.setState({ files, comments, commentRubricComments, currentFile });
          }
          this.setState({
            currentCourse,
            currentAssignment,
            currentSubmission,
            rubricCategories,
            isLoadingSubmission: false,
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

  public loadSubmission = async (assignment: AssignmentType) => {
    if (!assignment.isReleased) {
      return undefined;
    }
    return (await Assignment.readSubmissionsStudent(assignment.id, { student: this.props.email }))[0];
  };

  public loadRubricCategories = async (assignment: AssignmentType) => {
    return await loadIDList(assignment.rubricCategories, RubricCategory);
  };

  ///////////////////////////////////////
  // Handlers
  ///////////////////////////////////////
  public markViewed = async (submission: StudentSubmissionType) => {
    // Get the history
    const history = await Submission.readHistory(submission.id, { student: this.props.email });
    // If it has a history object, and has not been viewed, mark it as viewed
    if (history && history[0] && !history[0].hasViewed) {
      return await Submission.updateHistory({ id: submission.id, hasViewed: true }, { student: this.props.email });
    }
    // If empty, this submission does not have a history object. It was created before tracking was implemented
    return;
  };

  public handleAssignmentChange = (newAssignment?: ClickParam) => {
    const { assignments, currentCourse } = this.state;

    if (!currentCourse) {
      return;
    }

    if (newAssignment === undefined) {
      this.setState({
        currentAssignment: undefined,
        currentSubmission: undefined,
        files: [],
        comments: {},
        rubricCategories: [],
        commentRubricComments: {},
        currentFile: undefined,
      });
      return;
    }

    const currentAssignment = assignments[currentCourse.id].filter((assignment: AssignmentType) => {
      return assignment.id === +newAssignment.key;
    })[0];

    if (currentAssignment) {
      this.setState({ currentAssignment });
      this.setState({ isLoadingSubmission: true, currentSubmission: undefined }, async () => {
        const rubricCategories = await this.loadRubricCategories(currentAssignment);
        const currentSubmission = await this.loadSubmission(currentAssignment);

        if (currentSubmission) {
          const [files, comments, commentRubricComments] = await Submission.loadData(currentSubmission);
          let currentFile;
          if (files.length > 0) {
            currentFile = files[0];
          }
          // Mark submission as viewed
          this.markViewed(currentSubmission);
          // @ts-ignore
          this.setState({
            files,
            comments,
            commentRubricComments,
            currentSubmission,
            rubricCategories,
            currentFile,
            isLoadingSubmission: false,
            toLoadAssignment: true,
          });
        } else {
          this.setState({ currentSubmission, isLoadingSubmission: false, toLoadAssignment: true });
        }
      });
    }
  };

  public handleCourseChange = (e: ClickParam) => {
    const courseID = +e.key;
    const currentCourses = this.props.initialCourses.filter((course: CourseType) => {
      return course.id === courseID;
    });

    if (currentCourses.length > 0) {
      const currentCourse = currentCourses[0];
      this.setState({
        currentAssignment: undefined,
        currentCourse,
        currentSubmission: undefined,
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

  public getStatus = (
    currentCourse: CourseType | undefined,
    isLoadingAssignments: boolean,
    hasAssignments: boolean,
    currentAssignment: AssignmentType | undefined,
    isLoadingSubmission: boolean,
    currentSubmission: StudentSubmissionType | undefined,
  ) => {
    if (!currentCourse) return STATUS.SelectCourse;
    if (!hasAssignments) return STATUS.NoAssignments;
    if (!currentAssignment) return STATUS.SelectAssignment;
    if (isLoadingSubmission) return STATUS.SubmissionLoading;
    if (!currentSubmission) return STATUS.NoSubmission;
    if (!currentSubmission.isFinalized) return STATUS.NotGraded;
    else return STATUS.ShowSubmission;
  };

  public getContent = (status: STATUS) => {
    switch (status) {
      case STATUS.SelectCourse:
        return <div style={{ padding: '40px', fontSize: 28 }}>Select a course to get started</div>;

      case STATUS.NoAssignments:
        return <div style={{ padding: '40px', fontSize: 28 }}>No assignments available</div>;
      case STATUS.SelectAssignment:
        return (
          <div style={{ padding: '40px', fontSize: 28 }}>
            <div>Select an assignment</div>
          </div>
        );
      case STATUS.SubmissionLoading:
        return <Loading />;
      case STATUS.NoSubmission:
        if (this.state.currentAssignment) {
          return (
            <div style={{ padding: '40px', fontSize: 28 }}>
              Your instructor has not yet uploaded your {this.state.currentAssignment.name} submission
            </div>
          );
        }
        return null;
      case STATUS.NotGraded:
        if (this.state.currentAssignment) {
          return (
            <div style={{ padding: '40px', fontSize: 28 }}>
              Your {this.state.currentAssignment.name} has not yet been graded
            </div>
          );
        }
        return null;
      case STATUS.ShowSubmission:
        if (this.state.currentSubmission !== undefined && this.state.currentFile !== undefined) {
          const comments = (
            <StudentComments
              comments={this.state.comments[this.state.currentFile.id]}
              rubricComments={this.state.commentRubricComments}
              file={this.state.currentFile}
            />
          );
          const code = (codeStyle: React.CSSProperties) => (
            <StudentCode
              file={this.state.currentFile!}
              comments={this.state.comments[this.state.currentFile!.id]}
              readOnly={this.state.currentSubmission!.isFinalized}
              user={this.props.email}
              codeStyle={codeStyle}
            />
          );
          return <CodePanelLayout comments={comments} code={code} file={this.state.currentFile} />;
        } else {
          return null;
        }
    }
  };

  public goBackToAssignments = () => {
    this.handleAssignmentChange(undefined);
  };

  public getPointsInFile = (file: FileType): number[] => {
    return Grade.pointsInFile(file, this.state.comments[file.id], this.state.commentRubricComments);
  };

  public changeCurrentFile = (fileID: number): void => {
    const currentFile = this.state.files.find((file: FileType) => {
      return file.id === fileID;
    });

    this.setState({ currentFile });
  };

  ///////////////////////////////////////
  // Main
  ///////////////////////////////////////

  public render() {
    const { currentAssignment, currentCourse, currentSubmission } = this.state;

    if (this.state.toLoadCourse || this.state.toLoadAssignment) {
      if (currentCourse) {
        const formattedCourseName = currentCourse.name.replace(/ /g, '_');
        const formattedPeriod = currentCourse.period.replace(/ /g, '_');
        if (this.state.toLoadAssignment && currentAssignment) {
          const formattedAssignmentName = currentAssignment.name.replace(/ /g, '_');
          return <Redirect to={`/student/${formattedCourseName}/${formattedPeriod}/${formattedAssignmentName}`} />;
        } else {
          return <Redirect to={`/student/${formattedCourseName}/${formattedPeriod}/`} />;
        }
      } else {
        return <Redirect to={'/student'} />;
      }
    }

    const hasAssignments = currentCourse && this.state.assignments[currentCourse.id] ? true : false;
    const status = this.getStatus(
      currentCourse,
      this.state.isLoadingAssignments,
      hasAssignments,
      currentAssignment,
      this.state.isLoadingSubmission,
      currentSubmission,
    );

    const content = this.getContent(status);

    const siderTitle = this.state.currentCourse ? 'Select an assignment' : 'Select a course';
    const sider = (
      <SelectorSider
        title={siderTitle}
        activeSelector={this.selectorCurrentFormatter(currentCourse)}
        selectorItems={this.selectorItemsFormatter(this.props.initialCourses)}
        onSelectorClick={this.handleCourseChange}
        activeMenuItem={currentAssignment ? currentAssignment.id : undefined}
        menuItems={this.tabItemsFormatter(currentCourse)}
        onMenuClick={this.handleAssignmentChange}
      />
    );

    const header = <StandardConsoleHeader email={this.props.email} handleLogout={this.props.handleLogout} />;

    let subheader;
    let consoleTypes: ConsoleType[] = [];
    if (status === STATUS.ShowSubmission) {
      consoleTypes = ['subheader'];
      let subheaderTitle;
      let subheaderInfo;
      if (this.state.currentAssignment !== undefined && this.state.currentSubmission !== undefined) {
        subheaderTitle = <SubheaderTitle key="subheader-title" assignment={this.state.currentAssignment} />;
        subheaderInfo = (
          <SubheaderInfo
            assignment={this.state.currentAssignment}
            submission={this.state.currentSubmission}
            rubricCategories={this.state.rubricCategories}
            comments={this.state.comments}
            commentRubricComments={this.state.commentRubricComments}
          />
        );
      }
      const subheaderLeft = [
        subheaderTitle,
        <SubheaderStatistic
          key="grade"
          name="Grade"
          course={this.state.currentCourse}
          assignment={this.state.currentAssignment}
          submission={this.state.currentSubmission}
        />,
        <SubheaderStatistic
          key="mean"
          name="Mean"
          course={this.state.currentCourse}
          assignment={this.state.currentAssignment}
          submission={this.state.currentSubmission}
        />,
        <SubheaderStatistic
          key="median"
          name="Median"
          course={this.state.currentCourse}
          assignment={this.state.currentAssignment}
          submission={this.state.currentSubmission}
        />,
        subheaderInfo,
      ];

      subheader = <CPFlex left={subheaderLeft} right={[]} gutterSize={14} />;
    }

    let fileMenu;
    if (this.state.currentFile !== undefined) {
      fileMenu = (
        <FileMenu
          key={'file-menu'}
          files={this.state.files}
          selectedFile={this.state.currentFile}
          getPointsInFile={this.getPointsInFile}
          changeSelectedFile={this.changeCurrentFile}
          canChange={true}
        />
      );
    }

    return (
      <StandardConsoleLayout
        consoleTypes={consoleTypes}
        header={header}
        subheader={subheader}
        sider={[sider]}
        content={content}
      >
        <FileDrawer visible={status === STATUS.ShowSubmission} onClose={this.goBackToAssignments} fileMenu={fileMenu} />
      </StandardConsoleLayout>
    );
  }
}

const FileDrawer = (props: any) => {
  return (
    <Drawer
      title="Files"
      placement={'left'}
      closable={true}
      mask={false}
      width={300}
      onClose={props.onClose}
      visible={props.visible}
      style={{ top: `${themeVars.theme.headerHeight}px` }}
      bodyStyle={{ padding: '0px' }}
      destroyOnClose={false}
      className="file-drawer"
    >
      {props.fileMenu}
    </Drawer>
  );
};

export default Student;
