import * as React from 'react';

import * as moment from 'moment';

import Loading from './components/core/Loading';

import {
  ICommentToRubricCommentMap,
  IdMapType,
  IFileToCommentsMap,
  IRubricCategoryToRubricCommentsMap,
} from './types/common';

import { Assignment, AssignmentType } from './infrastructure/assignment';
import { CommentIO, CommentType, UiComment } from './infrastructure/comment';
import { Course, CourseSettingsType, CourseType } from './infrastructure/course';

import { RubricCategory, RubricCategoryType } from './infrastructure/rubricCategory';
import { RubricComment, RubricCommentType } from './infrastructure/rubricComment';
import {
  AnonymousSubmissionType,
  StudentSubmissionType,
  Submission,
  SubmissionType,
} from './infrastructure/submission';

import { UserType } from './infrastructure/user';

import StandardConsoleHeader from './components/core/StandardConsoleHeader';
import StandardConsoleLayout from './components/core/StandardConsoleLayout';

import { Descriptions, Divider, Icon, Menu, message, Popconfirm, Popover, Skeleton, Tag, Tooltip } from 'antd';

import { SelectParam } from 'antd/lib/menu';

import CPButton from './components/core/CPButton';
import CPDropdown from './components/core/CPDropdown';

import CPFlex from './components/core/CPFlex';

import CodePanelLayout from './components/code-review/code-panel/CodePanelLayout';

import FileMenu from './components/code-review/FileMenu';

import RubricMenu from './components/code-review/RubricMenu';

import { FileType } from './infrastructure/file';

import { GradeCode } from './components/code-review/code-panel/Code';

import { GradeComments } from './components/code-review/code-panel/Comments';

import * as Immutable from './infrastructure/immutable';

interface IGradeState {
  isLoading: boolean;
  redirect: boolean;
  assignment?: AssignmentType;
  course?: CourseType;
  submission?: AnonymousSubmissionType;
  rubricCategories: RubricCategoryType[];
  rubricComments: IRubricCategoryToRubricCommentsMap;

  files: FileType[];
  graders: string[];
  comments: IFileToCommentsMap;
  commentRubricComments: ICommentToRubricCommentMap;
  allowGradersToEditRubric: boolean;

  activeCommentID?: number;
  unsavedComments: IdMapType;

  selectedFile: FileType | undefined;
}

export interface IGradeProps {
  match: any;
  history: any;
  user: UserType;
  addToast: any;
  addErrorToast: (text: string, action: string | undefined) => void;
}

class Grade extends React.Component<IGradeProps, IGradeState> {
  // -------------------------- Static Methods -------------------------- //

  // --- Comments
  public static addCommentToState = (comments: IFileToCommentsMap, comment: CommentType, file: FileType) => {
    const fileComments = Immutable.arrayAdd(comments[file.id], comment);
    return { ...comments, [file.id]: fileComments.sort(CommentIO.compare) };
  };

  public static removeCommentFromState = (comments: IFileToCommentsMap, comment: CommentType) => {
    const index = comments[comment.file].findIndex((c: CommentType) => c.id === comment.id);

    const fileComments = Immutable.arrayRemove(comments[comment.file], index);
    return { ...comments, [comment.file]: fileComments };
  };

  public static updateCommentsState = (comments: IFileToCommentsMap, commentID: number, newComment: CommentType) => {
    const index = comments[newComment.file].findIndex((comment: CommentType) => comment.id === commentID);
    const fileComments = Immutable.arrayUpdate(comments[newComment.file], newComment, index);

    return { ...comments, [newComment.file]: fileComments };
  };

  // --- Edits
  public static addIdToUnsavedState = (unsavedComments: IdMapType, commentID: number) => {
    return { ...unsavedComments, [commentID]: true };
  };

  public static removeIdFromUnsavedState = (unsavedComments: IdMapType, commentID: number) => {
    const { [commentID]: flag, ...restOfUnsavedComments } = unsavedComments;
    return restOfUnsavedComments;
  };

  // --- Linked Rubric Comments
  public static addToCommentRubricCommentsState = (
    commentRubricComments: ICommentToRubricCommentMap,
    commentID: number,
    rubricComment?: RubricCommentType,
  ) => {
    if (rubricComment) {
      return { ...commentRubricComments, [commentID]: rubricComment };
    }
    return commentRubricComments;
  };

  public static removeFromCommentRubricCommentsState = (
    commentRubricComments: ICommentToRubricCommentMap,
    commentID: number,
  ): [RubricCommentType, ICommentToRubricCommentMap] => {
    const { [commentID]: rubricComment, ...restOfCommentRubricComments } = commentRubricComments;
    return [rubricComment, restOfCommentRubricComments];
  };

  public static linkRubricComment = (
    comments: IFileToCommentsMap,
    rubricComment: RubricCommentType,
    activeCommentID: number,
  ) => {
    for (const fileID of Object.keys(comments)) {
      const index = comments[+fileID].findIndex((comment: CommentType) => comment.id === activeCommentID);
      if (index !== -1) {
        const comment = { ...comments[+fileID][index], rubricComment: rubricComment.id, pointDelta: null };
        const fileComments = Immutable.arrayUpdate(comments[+fileID], comment, index);

        return { ...comments, [+fileID]: fileComments };
      }
    }

    return undefined;
  };

  public static unlinkRubricComment = (
    comments: IFileToCommentsMap,
    comment: CommentType,
    rubricComment: RubricCommentType,
  ) => {
    const index = comments[comment.file].findIndex((c: CommentType) => c.id === comment.id);
    const editedComment = {
      ...comments[comment.file][index],
      rubricComment: null,
      pointDelta: rubricComment.pointDelta,
    };
    const fileComments = Immutable.arrayUpdate(comments[comment.file], editedComment, index);
    return { ...comments, [comment.file]: fileComments };
  };

  // --- Grading

  // return [deductions, bonuses]
  public static pointsInFile = (
    file: FileType,
    comments: CommentType[],
    rubricComments: ICommentToRubricCommentMap,
  ): number[] => {
    return comments.reduce(
      (accumulator: number[], comment: CommentType) => {
        if (!UiComment.isNew(comment)) {
          const points = UiComment.points(comment, rubricComments[comment.id]);
          if (points > 0) {
            // Deductions
            return [accumulator[0] + points, accumulator[1]];
          } else {
            // Bonuses
            return [accumulator[0], accumulator[1] - points];
          }
        } else {
          return accumulator;
        }
      },
      [0, 0],
    );
  };

  // Points from generic comments
  public static genericCommentPoints = (comments: IFileToCommentsMap): number => {
    return Object.keys(comments)
      .map((fileID) => {
        return comments[fileID].reduce((accumulator: number, comment: CommentType) => {
          if (!UiComment.isNew(comment) && comment.pointDelta) {
            return accumulator + comment.pointDelta;
          } else {
            return accumulator;
          }
        }, 0);
      })
      .reduce((accumulator: number, fileGrade: number) => {
        return accumulator + fileGrade;
      }, 0);
  };

  // Points from RubricComments, ignoring category caps
  public static pointsPerCategory = (
    commentRubricComments: ICommentToRubricCommentMap,
  ): { [categoryID: number]: number } => {
    const pointsPerCategory = {};
    for (const commentID in commentRubricComments) {
      // Don't count unsaved comments
      if (+commentID > 0 && commentRubricComments.hasOwnProperty(commentID)) {
        if (!pointsPerCategory[commentRubricComments[commentID].category]) {
          pointsPerCategory[commentRubricComments[commentID].category] = commentRubricComments[commentID].pointDelta;
        } else {
          pointsPerCategory[commentRubricComments[commentID].category] =
            pointsPerCategory[commentRubricComments[commentID].category] + commentRubricComments[commentID].pointDelta;
        }
      }
    }

    return pointsPerCategory;
  };

  public static pointsPerCategoryWithCaps = (
    pointsPerCategory: { [categoryID: number]: number },
    rubricCategories: RubricCategoryType[],
  ): { [categoryID: number]: number } => {
    const pointsPerCategoryWithCaps = {};
    for (const category in pointsPerCategory) {
      if (pointsPerCategory.hasOwnProperty(category)) {
        const thisCategory = rubricCategories.find((rubricCategory: RubricCategoryType) => {
          return rubricCategory.id === +category;
        });
        const pointLimit = thisCategory ? (thisCategory.pointLimit ? thisCategory.pointLimit : 99999) : 99999;
        pointsPerCategoryWithCaps[+category] = Math.min(pointsPerCategory[category], pointLimit);
      }
    }
    return pointsPerCategoryWithCaps;
  };

  public static calculateGrade = (
    assignment: AssignmentType,
    comments: IFileToCommentsMap,
    commentRubricComments: ICommentToRubricCommentMap,
    rubricCategories: RubricCategoryType[],
  ): number => {
    const commentPoints = Grade.genericCommentPoints(comments);
    const pointsPerCategory = Grade.pointsPerCategory(commentRubricComments);
    const pointsPerCategoryWithCaps = Grade.pointsPerCategoryWithCaps(pointsPerCategory, rubricCategories);

    const categoryPoints = Object.values(pointsPerCategoryWithCaps).reduce((accumulator: number, current: number) => {
      return accumulator + current;
    }, 0);

    return assignment.points - commentPoints - categoryPoints;
  };

  // -------------------------- Initialization / Lifecycles -------------------------- //

  public state: Readonly<IGradeState> = {
    activeCommentID: undefined,
    assignment: undefined,
    commentRubricComments: {},
    comments: {},
    files: [],
    graders: [],
    isLoading: true,
    redirect: false,
    rubricCategories: [],
    rubricComments: {},
    submission: undefined,
    allowGradersToEditRubric: false,

    selectedFile: undefined,
    unsavedComments: {},
  };

  public async componentDidMount() {
    this.setState({ isLoading: true });

    const submissionID: number = +this.props.match.params.submissionId.valueOf();
    const submission = await Submission.readAnonymous(submissionID);
    if (submission) {
      const [
        assignment,
        [files, comments, commentRubricComments],
        [rubricCategories, rubricComments],
      ] = await Promise.all([
        Assignment.read(submission.assignment),
        Submission.loadData(submission),
        this.loadRubric(submission.assignment),
      ]);

      const course = await Course.read(assignment.course);
      const settings = await this.loadSettings(assignment);
      const allowGradersToEditRubric = settings.allowGradersToEditRubric;
      const graders = this.isCourseAdmin(assignment)
        ? (await Course.readRoster(assignment.course))['graders'].sort()
        : [];

      if (assignment && !submission.isFinalized) {
        // @ts-ignore
        submission.grade = Grade.calculateGrade(assignment, comments, commentRubricComments, rubricCategories);
      }

      let selectedFile;
      if (files.length > 0) {
        selectedFile = files[0];
      }

      // @ts-ignore
      this.setState({
        assignment,
        course,
        submission,
        files,
        comments,
        commentRubricComments,
        rubricCategories,
        rubricComments,
        graders,
        allowGradersToEditRubric,
        isLoading: false,
        selectedFile,
      });
    }
  }

  // -------------------------- Loading -------------------------- //

  public loadSettings = async (assignment: AssignmentType) => {
    const courseID = assignment.course;
    const settings: CourseSettingsType = await Course.readSettings(courseID);
    return settings;
  };

  public loadRubric = async (assignmentID: number) => {
    const rubric = await Assignment.readRubric(assignmentID);

    const rubricCategories = rubric.rubricCategories.sort(RubricCategory.compare);
    const rubricComments = {};

    rubricCategories.forEach((rubricCategory: RubricCategoryType) => {
      rubricComments[rubricCategory.id] = rubric.rubricComments
        .filter((rubricComment) => {
          return rubricComment.category === rubricCategory.id;
        })
        .sort(RubricComment.compare);
    });

    return [rubricCategories, rubricComments];
  };

  // -------------------------- Handlers -------------------------- //

  public changeActiveComment = (id: number | undefined): void => {
    this.setState({ activeCommentID: id });
  };

  public changeSelectedFile = (fileID: number): void => {
    const selectedFile = this.state.files.find((file: FileType) => {
      return file.id === fileID;
    });

    this.setState({ selectedFile, unsavedComments: {} });
  };

  // Usually adds a blank comment to the submission state
  public addComment = (comment: CommentType, file: FileType) => {
    const comments = Grade.addCommentToState(this.state.comments, comment, file);
    const unsavedComments = Grade.addIdToUnsavedState(this.state.unsavedComments, comment.id);
    this.setState({ comments, unsavedComments, activeCommentID: comment.id });
  };

  public updateComment = (commentID: number, newComment: CommentType, newRubricComment?: RubricCommentType) => {
    const comments = Grade.updateCommentsState(this.state.comments, commentID, newComment);

    const [rubricComment, restOfCommentRubricComments] = Grade.removeFromCommentRubricCommentsState(
      this.state.commentRubricComments,
      commentID,
    );

    const commentRubricComments = Grade.addToCommentRubricCommentsState(
      restOfCommentRubricComments,
      newComment.id,
      newRubricComment ? newRubricComment : rubricComment,
    );

    this.setState({ comments, commentRubricComments });
  };

  public saveComment = async (comment: CommentType) => {
    let savedComment;

    if (comment.id < 0) {
      savedComment = await CommentIO.create(comment);
    } else {
      savedComment = await CommentIO.update(comment);
    }

    let unsavedComments = Grade.removeIdFromUnsavedState(this.state.unsavedComments, comment.id);
    unsavedComments = Grade.removeIdFromUnsavedState(unsavedComments, savedComment.id);

    this.updateComment(comment.id, savedComment);

    this.setState({ unsavedComments, activeCommentID: undefined });
  };

  public deleteComment = async (comment: CommentType) => {
    if (comment.id > 0) {
      await CommentIO.delete(comment.id).then(() => this.updateSubmissionGrade());
    }

    const comments = Grade.removeCommentFromState(this.state.comments, comment);
    const [, commentRubricComments] = Grade.removeFromCommentRubricCommentsState(
      this.state.commentRubricComments,
      comment.id,
    );
    const unsavedComments = Grade.removeIdFromUnsavedState(this.state.unsavedComments, comment.id);

    this.setState({ comments, unsavedComments, commentRubricComments });
  };

  public addUnsaved = (commentID: number) => {
    const unsavedComments = Grade.addIdToUnsavedState(this.state.unsavedComments, commentID);
    this.setState({ unsavedComments });
  };

  public removeUnsaved = (commentID: number) => {
    const unsavedComments = Grade.removeIdFromUnsavedState(this.state.unsavedComments, commentID);
    this.setState({ unsavedComments });
  };

  public removeRubricComment = (comment: CommentType, rubricComment: RubricCommentType) => {
    const comments = Grade.unlinkRubricComment(this.state.comments, comment, rubricComment);
    const [, commentRubricComments] = Grade.removeFromCommentRubricCommentsState(
      this.state.commentRubricComments,
      comment.id,
    );
    const unsavedComments = Grade.addIdToUnsavedState(this.state.unsavedComments, comment.id);

    this.setState({ comments, commentRubricComments, unsavedComments });
  };

  public onRubricCommentClick = (rubricComment: RubricCommentType): void => {
    if (!this.state.activeCommentID) {
      return;
    }

    const comments = Grade.linkRubricComment(this.state.comments, rubricComment, this.state.activeCommentID);

    if (comments === undefined) {
      return;
    }

    const commentRubricComments = Grade.addToCommentRubricCommentsState(
      this.state.commentRubricComments,
      this.state.activeCommentID,
      rubricComment,
    );
    const unsavedComments = Grade.addIdToUnsavedState(this.state.unsavedComments, this.state.activeCommentID);

    this.setState({ comments, commentRubricComments, unsavedComments });
  };

  public calculateGradeFromState = (): number | undefined => {
    if (!this.state.submission || !this.state.assignment) {
      return undefined;
    }

    return Grade.calculateGrade(
      this.state.assignment,
      this.state.comments,
      this.state.commentRubricComments,
      this.state.rubricCategories,
    );
  };

  public getPointsInFile = (file: FileType): number[] => {
    return Grade.pointsInFile(file, this.state.comments[file.id], this.state.commentRubricComments);
  };

  public updateSubmissionGrade = () => {
    if (this.state.submission) {
      const grade = this.calculateGradeFromState();
      if (grade) {
        const submission = { ...this.state.submission, grade };
        this.setState({
          submission,
        });
      }
    }
  };

  public toggleFinalized = async () => {
    if (!this.state.submission) {
      return;
    }

    const payload = {
      id: this.state.submission.id,
      isFinalized: !this.state.submission.isFinalized,
    };

    try {
      const submission = await Submission.update(payload);
      this.setState({ submission });
    } catch (error) {
      message.error(`Error updating submission: ${JSON.stringify(error)}`);
    }
  };

  public updateGrader = (sub: AnonymousSubmissionType, graderUsername: string | undefined) => {
    const payload = {
      id: sub.id,
      isFinalized: false,
      grader: graderUsername,
    };

    return Submission.update(payload).then((submission) => {
      this.setState({ submission });
      return submission;
    });
  };

  public isCourseAdmin = (assignment: AssignmentType | undefined) => {
    if (!assignment || !assignment.course) {
      return false;
    }

    return this.props.user.courseadminCourses
      .map((course) => {
        return course.id;
      })
      .includes(assignment.course);
  };

  public onEscKeyPress = () => {
    this.changeActiveComment(undefined);
  };

  //////////////////////////////////////
  // Main
  //////////////////////////////////////

  public render() {
    const isCourseAdmin = this.isCourseAdmin(this.state.assignment);

    if (this.state.isLoading) {
      return <Loading />;
    }

    if (!this.state.submission || !this.state.assignment) {
      return <div>No Submission Found</div>;
    }

    const header = <StandardConsoleHeader email={this.props.user.email} handleLogout={this.onEscKeyPress} />;

    const subHeaderLeftTop = [
      <SubheaderTitle key="subheader-title" assignment={this.state.assignment} />,
      <SubheaderGrade
        key="subheader-grade"
        assignment={this.state.assignment}
        submission={this.state.submission}
        calculateGrade={this.calculateGradeFromState}
      />,
      <SubheaderInfo
        key="subheader-info"
        submission={this.state.submission}
        assignment={this.state.assignment}
        rubricCategories={this.state.rubricCategories}
        comments={this.state.comments}
        commentRubricComments={this.state.commentRubricComments}
      />,
    ];

    const subHeaderRightTop = [
      <SubheaderGrader
        key="subheader-grader"
        submission={this.state.submission}
        graders={this.state.graders}
        isCourseAdmin={isCourseAdmin}
        updateGrader={this.updateGrader}
      />,
      <FinalizeButton
        key="subheader-finalize"
        submission={this.state.submission}
        canToggle={Object.keys(this.state.unsavedComments).length === 0}
        toggleFinalized={this.toggleFinalized}
      />,
    ];

    const subHeaderLeftBottom = [
      <StatusTags key="subheader-status-tags" assignment={this.state.assignment} submission={this.state.submission} />,
      <Divider key="subheader-divider" type="vertical" />,
      <Students
        key="subheader-students"
        submission={this.state.submission}
        isAnonymous={this.state.assignment.anonymousGrading}
      />,
    ];

    const subHeaderRightBottom = [<LastEdited key="subheader-last-edited" submission={this.state.submission} />];

    const subheader = (
      <div>
        <CPFlex left={subHeaderLeftTop} right={subHeaderRightTop} gutterSize={6} />
        <CPFlex left={subHeaderLeftBottom} right={subHeaderRightBottom} gutterSize={6} />
      </div>
    );

    let content;
    if (this.state.selectedFile) {
      const code = (
        <GradeCode
          file={this.state.selectedFile}
          comments={this.state.comments[this.state.selectedFile.id]}
          readOnly={this.state.submission.isFinalized}
          addComment={this.addComment}
          user={this.props.user.email}
        />
      );

      const comments = (
        <GradeComments
          comments={this.state.comments[this.state.selectedFile.id]}
          rubricComments={this.state.commentRubricComments}
          readOnly={this.state.submission.isFinalized}
          file={this.state.selectedFile}
          activeCommentID={this.state.activeCommentID}
          changeActive={this.changeActiveComment}
          deleteComment={this.deleteComment}
          saveComment={this.saveComment}
          addUnsaved={this.addUnsaved}
          removeUnsaved={this.removeUnsaved}
          removeRubricComment={this.removeRubricComment}
        />
      );

      content = <CodePanelLayout comments={comments} code={code} file={this.state.selectedFile} />;
    }

    return (
      <StandardConsoleLayout
        consoleTypes={['grade', 'subheader']}
        header={header}
        subheader={subheader}
        sider={[
          <FileMenu
            key={'file-menu'}
            title="Files"
            files={this.state.files}
            selectedFile={this.state.selectedFile}
            getPointsInFile={this.getPointsInFile}
            changeSelectedFile={this.changeSelectedFile}
            canChange={Object.keys(this.state.unsavedComments).length === 0}
          />,
          <RubricMenu
            key={'rubric-menu'}
            rubricCategories={this.state.rubricCategories}
            rubricComments={this.state.rubricComments}
            handleRubricCommentClick={this.onRubricCommentClick}
          />,
        ]}
        content={content}
      />
    );
  }
}

interface ISubheaderTitleProps {
  assignment: AssignmentType;
}

const SubheaderTitle = (props: ISubheaderTitleProps) => {
  return <span className=" cp-label cp-label--very-bold cp-label--large cp-label--title">{props.assignment.name}</span>;
};

interface ISubheaderGradeProps {
  assignment: AssignmentType;
  submission: AnonymousSubmissionType;
  calculateGrade: () => number | undefined;
}

const SubheaderGrade = (props: ISubheaderGradeProps) => {
  const gradeString = props.submission.isFinalized
    ? `${props.submission.grade} / ${props.assignment.points}`
    : `${props.calculateGrade()} / ${props.assignment.points}`;

  return <span className="cp-label cp-label--very-bold cp-label--medium cp-label--subtitle">{gradeString}</span>;
};

interface ISubheaderInfoProps {
  assignment: AssignmentType;
  submission: AnonymousSubmissionType | StudentSubmissionType;
  rubricCategories: RubricCategoryType[];
  comments: IFileToCommentsMap;
  commentRubricComments: ICommentToRubricCommentMap;
}

// FIXME: Although the calculate methods that compose this component are modularized,
//         it will be prudent to find a way to rigorously test this presentation.
//         Possibly with Snapshot tests
//         Wrong values here will damage the accountability chain.
export const SubheaderInfo = (props: ISubheaderInfoProps) => {
  let content = <Skeleton active />;
  const title = 'How was this calculated?';

  const pointsPerCategory = Grade.pointsPerCategory(props.commentRubricComments);
  const pointsPerCategoryWithCaps = Grade.pointsPerCategoryWithCaps(pointsPerCategory, props.rubricCategories);
  const genericPoints = Grade.genericCommentPoints(props.comments);

  const categoryPoints = Object.values(pointsPerCategoryWithCaps).reduce((accumulator: number, current: number) => {
    return accumulator + current;
  }, 0);

  const styledLabel = (n: number, excluded?: boolean) => {
    let points = n;
    let style = {};
    let className = 'cp-label';
    let modifier = null;

    if (n > 0) {
      modifier = '-';
      className = 'cp-label cp-label--bold cp-label--error';
    } else if (n < 0) {
      modifier = '+';
      points = n * -1;
      className = 'cp-label cp-label--bold cp-label--success';
    } else {
      className = 'cp-label cp-label--bold cp-label--neutral';
    }

    if (excluded) {
      style = { ...style, textDecoration: 'line-through' };
      className = 'cp-label cp-label--neutral';
    }

    return (
      <span style={style} className={className}>
        {modifier}
        {points}
      </span>
    );
  };

  let categories = props.rubricCategories.map((rubricCategory: RubricCategoryType) => {
    const uncappedPoints = pointsPerCategory.hasOwnProperty(rubricCategory.id)
      ? pointsPerCategory[rubricCategory.id]
      : null;

    const cappedPoints = pointsPerCategoryWithCaps.hasOwnProperty(rubricCategory.id)
      ? pointsPerCategoryWithCaps[rubricCategory.id]
      : null;

    let exceededBy = null;
    if (uncappedPoints !== null && cappedPoints !== null && uncappedPoints !== cappedPoints) {
      const diff = uncappedPoints - cappedPoints;
      exceededBy = <span className="cp-label cp-label--italic cp-label--bold">(exceeded limit by {diff})</span>;
    }

    let points;
    if (exceededBy !== null && uncappedPoints !== null && cappedPoints !== null) {
      points = (
        <span className="cp-label">
          {styledLabel(uncappedPoints, true)} <Icon type="caret-right" /> {styledLabel(cappedPoints)}
        </span>
      );
    } else if (cappedPoints !== null) {
      points = <span className="cp-label">{styledLabel(cappedPoints)}</span>;
    }

    return {
      description: (
        <span className="cp-label cp-label--italic">
          {rubricCategory.name} {exceededBy}
        </span>
      ),
      value: <span className="cp-label">{points}</span>,
    };
  });

  categories = [
    ...categories,
    {
      description: <span className="cp-label cp-label--italic">other</span>,
      value: styledLabel(genericPoints),
    },
  ];

  const categoriesTable = (
    <Descriptions title="Category Breakdown" column={1} bordered>
      {categories.map((item: any, index: number) => {
        return (
          <Descriptions.Item key={index} label={item.description}>
            {item.value}
          </Descriptions.Item>
        );
      })}
    </Descriptions>
  );

  const summary = [
    {
      description: <span className="cp-label">Assignment Total</span>,
      value: <span>{props.assignment.points}</span>,
    },
    {
      description: <span className="cp-label">Net Point Delta</span>,
      value: <span>{styledLabel(categoryPoints + genericPoints)}</span>,
    },
    {
      description: <span className="cp-label cp-label--very-bold">Final Grade</span>,
      value: (
        <span className="cp-label cp-label--very-bold">{props.assignment.points - categoryPoints - genericPoints}</span>
      ),
    },
  ];

  const summaryTable = (
    <Descriptions title="Summary" column={1} bordered>
      {summary.map((item: any, index: number) => {
        return (
          <Descriptions.Item key={index} label={item.description}>
            {item.value}
          </Descriptions.Item>
        );
      })}
    </Descriptions>
  );

  content = (
    <div>
      {categoriesTable}
      <Divider />
      {summaryTable}
    </div>
  );

  return (
    <Popover content={content} title={title} placement="rightTop">
      <CPButton key="subheader-info" cpType="highlight" size="small" icon="question" style={{ cursor: 'help' }} />
    </Popover>
  );
};

interface ISubheaderGraderProps {
  submission: AnonymousSubmissionType;
  graders: string[];
  isCourseAdmin: boolean;
  updateGrader: (submission: AnonymousSubmissionType, graderUsername: string | undefined) => Promise<SubmissionType>;
}

const SubheaderGrader = (props: ISubheaderGraderProps) => {
  const menuItems = props.graders.map((grader: string, index: number) => {
    return <Menu.Item key={grader}>{grader}</Menu.Item>;
  });

  menuItems.unshift(<Menu.Item key={'unassign'}>** unassign **</Menu.Item>);

  const onClick = (param: SelectParam) => {
    const selectedGrader = param.key;
    if (selectedGrader === 'unassign') {
      props.updateGrader(props.submission, '');
    } else {
      props.updateGrader(props.submission, selectedGrader);
    }
  };

  const overlay = <Menu onClick={onClick}>{menuItems}</Menu>;

  const currentGrader = props.submission.grader ? props.submission.grader : 'unassigned';
  const currentGraderString = `grader: ${currentGrader}`;

  const dropdown = (
    <CPDropdown
      value={currentGraderString}
      overlay={overlay}
      overlayStyle={{ maxHeight: '300px', overflowY: 'scroll' }}
    />
  );

  if (props.isCourseAdmin) {
    return dropdown;
  } else {
    return <span className="cp-label cp-label--bold">{currentGraderString}</span>;
  }
  return dropdown;
};

interface IFinalizeButtonProps {
  submission: AnonymousSubmissionType;
  canToggle: boolean;
  toggleFinalized: () => void;
}

const FinalizeButton = (props: IFinalizeButtonProps) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const [popconfirmVisible, setPopconfirmVisible] = React.useState(false);
  const [notice, setNotice] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  useOnClickOutside(ref, (e: any) => {
    const fileMenu = document.getElementById('file-menu');
    if (ref && ref.current && fileMenu !== null && !fileMenu.contains(e.target)) {
      setNotice(true);
      window.setTimeout(() => setNotice(false), 250);
    }
  });

  const onClick = async () => {
    setIsLoading(true);
    if (!props.submission.isFinalized && !props.canToggle) {
      setPopconfirmVisible(true);
    } else {
      await props.toggleFinalized();
      setIsLoading(false);
    }
  };

  const confirm = async () => {
    await props.toggleFinalized();
    setIsLoading(false);
    setPopconfirmVisible(false);
  };

  const cancel = () => {
    setIsLoading(false);
    setPopconfirmVisible(false);
  };

  if (props.submission.isFinalized) {
    return (
      <div ref={ref}>
        <CPButton cpType={notice ? 'primary' : 'secondary'} fallback="unlock" onClick={onClick} loading={isLoading}>
          Unfinalize
        </CPButton>
      </div>
    );
  } else {
    return (
      <CPButton cpType="primary" fallback="lock" onClick={onClick} loading={isLoading}>
        <Popconfirm
          title={
            <div>
              <p>You have draft comments that will not be saved.</p>{' '}
              <p>
                <b>Are you sure you want to continue?</b>
              </p>
            </div>
          }
          visible={popconfirmVisible}
          onConfirm={confirm}
          onCancel={cancel}
          okText="Yes"
          cancelText="No"
          placement="bottomRight"
        >
          Finalize
        </Popconfirm>
      </CPButton>
    );
  }
};

const useOnClickOutside = (ref: any, handler: any) => {
  React.useEffect(
    () => {
      const listener = (event: any) => {
        // Do nothing
        if (!ref.current || ref.current.contains(event.target)) {
          return;
        }

        handler(event);
      };

      document.addEventListener('mousedown', listener);
      document.addEventListener('touchstart', listener);

      return () => {
        document.removeEventListener('mousedown', listener);
        document.removeEventListener('touchstart', listener);
      };
    },

    [ref, handler],
  );
};

interface IStatusTagsProps {
  assignment: AssignmentType;
  submission: AnonymousSubmissionType;
}

type StatusTagType = 0 | 1 | 2 | 3;

const StatusTags = (props: IStatusTagsProps) => {
  const subStatus = (finalized: boolean, published: boolean): StatusTagType => {
    if (!finalized && !published) {
      return 0;
    }

    if (finalized && !published) {
      return 1;
    }

    if (!finalized && published) {
      return 2;
    }

    if (finalized && published) {
      return 3;
    }

    // should never hit
    return 0;
  };

  const statusTagType: StatusTagType = subStatus(props.submission.isFinalized, props.assignment.isReleased);

  let tagColor;
  let tagText;
  let tooltipText;
  switch (statusTagType) {
    case 0:
      tagColor = 'blue';
      tagText = 'not finalized and not published';
      tooltipText = 'student cannot view';
      break;
    case 1:
      tagColor = 'orange';
      tagText = 'finalized but not published';
      tooltipText = 'student cannot view';
      break;
    case 2:
      tagColor = 'red';
      tagText = 'published but not finalized';
      tooltipText = 'student cannot view';
      break;
    case 3:
      tagColor = 'gold';
      tagText = 'finalized and published';
      tooltipText = 'student can view';
      break;
  }

  return (
    <Tooltip title={tooltipText} placement="bottom">
      <Tag color={tagColor} style={{ marginRight: '0px', cursor: 'help' }}>
        {tagText}
      </Tag>
    </Tooltip>
  );
};

const LastEdited = (props: { submission: AnonymousSubmissionType }) => {
  return (
    <span className="cp-label cp-label--bold">
      Last Edited: {props.submission.dateEdited ? moment(props.submission.dateEdited).format('lll') : '--'}
    </span>
  );
};

const Students = (props: { submission: AnonymousSubmissionType; isAnonymous: boolean }) => {
  const [showStudents, setShowStudents] = React.useState(false);

  const reveal = () => {
    setShowStudents(true);
  };

  let studentString;
  let revealButton;

  if (props.submission.students === undefined || (props.isAnonymous && !showStudents)) {
    studentString = `${props.submission.id} <Anonymized>`;

    if (props.submission.students !== undefined && !showStudents) {
      revealButton = (
        <CPButton cpType="secondary" size="small" onClick={reveal} style={{ minWidth: '70px' }}>
          reveal
        </CPButton>
      );
    }
  } else {
    studentString = props.submission.students.join(', ');
  }
  return (
    <span>
      <span className="cp-label">{studentString} </span>
      {revealButton}
    </span>
  );
};

export default Grade;
