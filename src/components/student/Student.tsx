/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* antd imports */
import { Drawer, Empty } from 'antd';
import { ClickParam } from 'antd/lib/menu';

/* codePost imports */
import themeVars from '../../styles/abstracts/_theme.js';

import Grade from '../grade/Grade';

import StandardConsoleHeader from '../core/layouts/StandardConsoleHeader';
import StandardConsoleLayout, { ConsoleType } from '../core/layouts/StandardConsoleLayout';

import { SubheaderInfo, SubheaderStatistic, SubheaderTitle } from '../code-review/Subheader';

import { StudentCode } from '../code-review/code-panel/CodeContent';

import { StudentComments } from '../code-review/code-panel/Comments';

import Loading from '../core/Loading';

import FileMenu from '../code-review/FileMenu';

import CPFlex from '../core/CPFlex';

import CodePanelLayout from '../code-review/code-panel/CodePanelLayout';

import SelectorSider from '../core/SelectorSider';

import { ICommentToRubricCommentMap, ICourseToAssignmentMap, IFileToCommentsMap, USER_TYPE } from '../../types/common';

import { Assignment, AssignmentType } from '../../infrastructure/assignment';
import { CourseType } from '../../infrastructure/course';
import { FileType } from '../../infrastructure/file';
import { loadIDList } from '../../infrastructure/generics';
import { RubricCategory, RubricCategoryType } from '../../infrastructure/rubricCategory';
import { StudentSubmissionType, Submission } from '../../infrastructure/submission';

import { UserType } from '../../infrastructure/user';

/**********************************************************************************************************************/

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

  // Loading variables
  isLoadingAssignments: boolean;
  isLoadingSubmission: boolean;
}

export interface IStudentProps {
  initialCourses: CourseType[];
  user: UserType;
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
  ShowSubmission,
}

class Student extends React.Component<IStudentProps, IStudentState> {
  public constructor(props: IStudentProps) {
    super(props);
    document.title = 'codePost - Student Console';
    this.state = {
      assignments: {},
      comments: {},
      currentAssignment: undefined,
      currentCourse: undefined,
      currentSubmission: undefined,
      currentFile: undefined,
      files: [],
      isLoadingAssignments: true,
      isLoadingSubmission: false,
      rubricCategories: [],
      commentRubricComments: {},
    };
  }

  /***********************************************************************************
  /* Lifecycle methods
  /**********************************************************************************/

  public componentDidMount() {
    this.loadAssignments(this.props.initialCourses).then((assignments) => {
      this.setState({ assignments, isLoadingAssignments: false }, () => {
        const { course, assignment } = this.setStateFromURL(this.props.initialCourses, assignments);
        if (course) {
          this.changeURL(course, assignment);
          this.setState({ currentCourse: course }, () => {
            this.handleAssignmentChange(assignment ? assignment.id : undefined);
          });
        }
      });
    });
  }

  /***********************************************************************************
  /* URL + UI handling methods
  /**********************************************************************************/

  public setStateFromURL = (courses: CourseType[], assignments: ICourseToAssignmentMap) => {
    const { courseName, period, assignmentName } = this.props.match.params;
    if (courses.length === 0) {
      return { course: undefined, assignment: undefined };
    } else {
      // is the URL trying to set the course?
      const tryingToSetCourse = courseName && period;
      let currentCourse: CourseType | undefined;
      let currentAssignment: AssignmentType | undefined;
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
        }
      }

      // By default open first course in course list
      if (!currentCourse && courses.length > 0) {
        currentCourse = courses[0];
      }

      return { course: currentCourse, assignment: currentAssignment };
    }
  };

  public changeURL = (course: CourseType, assignment?: AssignmentType) => {
    const courseName = course.name.replace(/ /g, '_');
    const coursePeriod = course.period.replace(/ /g, '_');

    if (assignment === undefined) {
      this.props.history.push(`/student/${courseName}/${coursePeriod}`);
    } else {
      const assignmentName = assignment.name.replace(/ /g, '_');
      this.props.history.push(`/student/${courseName}/${coursePeriod}/${assignmentName}`);
    }
  };

  /***********************************************************************************
  /* Loading methods
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

  public loadSubmission = async (assignment: AssignmentType) => {
    if (!assignment.isReleased) {
      return undefined;
    }
    return (await Assignment.readSubmissionsStudent(assignment.id, { student: this.props.user.email }))[0];
  };

  public loadRubricCategories = async (assignment: AssignmentType) => {
    return await loadIDList(assignment.rubricCategories, RubricCategory);
  };

  /***********************************************************************************
  /* Handlers
  /**********************************************************************************/
  public markViewed = async (submission: StudentSubmissionType) => {
    // Get the history
    const history = await Submission.readHistory(submission.id, { student: this.props.user.email });
    // If it has a history object, and has not been viewed, mark it as viewed
    if (history && history[0] && !history[0].hasViewed) {
      return await Submission.updateHistory({ id: submission.id, hasViewed: true }, { student: this.props.user.email });
    }
    // If empty, this submission does not have a history object. It was created before tracking was implemented
    return;
  };

  public onAssignmentChange = (clicked: ClickParam) => {
    this.handleAssignmentChange(+clicked.key);
  };

  public handleAssignmentChange = (assignmentID?: number) => {
    const { assignments, currentCourse } = this.state;

    if (!currentCourse) {
      return;
    }

    if (assignmentID === undefined) {
      this.setState({
        currentAssignment: undefined,
        currentSubmission: undefined,
        files: [],
        comments: {},
        rubricCategories: [],
        commentRubricComments: {},
        currentFile: undefined,
      });
      this.changeURL(currentCourse, undefined);
    } else {
      const currentAssignment = assignments[currentCourse.id].find((assignment: AssignmentType) => {
        return assignment.id === assignmentID;
      });

      if (currentAssignment) {
        this.setState({ currentAssignment, isLoadingSubmission: true, currentSubmission: undefined }, async () => {
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
            this.setState({
              files,
              comments,
              commentRubricComments,
              currentSubmission,
              rubricCategories,
              currentFile,
              isLoadingSubmission: false,
            });
          } else {
            this.setState({ currentSubmission, isLoadingSubmission: false });
          }
        });
        this.changeURL(currentCourse, currentAssignment);
      }
    }
  };

  public handleCourseChange = (e: ClickParam) => {
    const courseID = +e.key;
    const currentCourse = this.props.initialCourses.find((course: CourseType) => {
      return course.id === courseID;
    });

    if (currentCourse) {
      this.setState(
        {
          currentAssignment: undefined,
          currentCourse,
          currentSubmission: undefined,
        },
        () => {
          this.changeURL(currentCourse, undefined);
        },
      );
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

  public getStatus = (
    currentCourse: CourseType | undefined,
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
    else return STATUS.ShowSubmission;
  };

  public getContent = (status: STATUS) => {
    const emptyStyle = { marginTop: '15%' };
    switch (status) {
      case STATUS.SelectCourse:
        return (
          <Empty
            imageStyle={{
              height: 60,
            }}
            description="Select a course to get started."
            style={emptyStyle}
          />
        );
      case STATUS.NoAssignments:
        return (
          <Empty
            imageStyle={{
              height: 60,
            }}
            description="No assignments yet. Check back soon!"
            style={emptyStyle}
          />
        );
      case STATUS.SelectAssignment:
        return (
          <Empty
            imageStyle={{
              height: 60,
            }}
            description="Select an assignment to get started."
            style={emptyStyle}
          />
        );
      case STATUS.SubmissionLoading:
        return <Loading />;
      case STATUS.NoSubmission:
        return (
          <Empty
            imageStyle={{
              height: 60,
            }}
            description="Your instructor hasn't published your submission yet."
            style={emptyStyle}
          />
        );
      case STATUS.ShowSubmission:
        if (this.state.currentSubmission !== undefined && this.state.currentFile !== undefined) {
          const comments = (verticalOffset: number) => (
            <StudentComments
              comments={this.state.comments[this.state.currentFile!.id]}
              rubricComments={this.state.commentRubricComments}
              file={this.state.currentFile!}
              verticalOffset={verticalOffset}
            />
          );
          const code = (codeStyle: React.CSSProperties, highlightHeight: string, onHighlightClick: any) => (
            <StudentCode
              key={this.state.currentFile!.id}
              file={this.state.currentFile!}
              comments={this.state.comments[this.state.currentFile!.id]}
              readOnly={this.state.currentSubmission!.isFinalized}
              user={this.props.user.email}
              codeStyle={codeStyle}
              highlightHeight={highlightHeight}
              onHighlightClick={onHighlightClick}
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

  /***********************************************************************************
  /* Render function
  /**********************************************************************************/

  public render() {
    const { assignments, currentAssignment, currentCourse, currentSubmission, isLoadingAssignments } = this.state;

    const hasAssignments =
      currentCourse !== undefined &&
      !isLoadingAssignments &&
      assignments[currentCourse.id] !== undefined &&
      assignments[currentCourse.id].length > 0;

    const status = this.getStatus(
      currentCourse,
      hasAssignments,
      currentAssignment,
      this.state.isLoadingSubmission,
      currentSubmission,
    );

    const canAlwaysChange = () => {
      return true;
    };

    let content;
    let subheader;
    let consoleTypes: ConsoleType[] = [];
    let fileMenu;
    if (this.state.isLoadingAssignments) {
      content = null;
    } else {
      content = this.getContent(status);
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

      if (this.state.currentFile !== undefined) {
        fileMenu = (
          <FileMenu
            key={'file-menu'}
            files={this.state.files}
            selectedFile={this.state.currentFile}
            getPointsInFile={this.getPointsInFile}
            changeSelectedFile={this.changeCurrentFile}
            canChange={canAlwaysChange}
          />
        );
      }
    }

    const header = (
      <StandardConsoleHeader
        user={this.props.user}
        handleLogout={this.props.handleLogout}
        thisApp={USER_TYPE.STUDENT}
      />
    );

    const sider = (
      <SelectorSider
        title="Assignments"
        theme="light"
        key="sider"
        activeSelector={this.selectorCurrentFormatter(currentCourse)}
        selectorItems={this.selectorItemsFormatter(this.props.initialCourses)}
        onSelectorClick={this.handleCourseChange}
        activeMenuItem={currentAssignment ? currentAssignment.id : undefined}
        assignments={
          this.state.currentCourse && !this.state.isLoadingAssignments
            ? this.state.assignments[this.state.currentCourse.id]
            : []
        }
        onMenuClick={this.onAssignmentChange}
        isLoadingMenu={this.state.isLoadingAssignments}
      />
    );

    return (
      <StandardConsoleLayout
        consoleTypes={consoleTypes}
        header={header}
        subheader={subheader}
        sider={[sider]}
        content={content}
      >
        <FileDrawer
          key="file-drawer"
          visible={status === STATUS.ShowSubmission}
          onClose={this.goBackToAssignments}
          fileMenu={fileMenu}
        />
      </StandardConsoleLayout>
    );
  }
}

/**********************************************************************************************************************/

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
