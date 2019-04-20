/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* react-md imports */
import { Button, DialogContainer, FileUpload, LinearProgress } from 'react-md';

/* other library imports */
import ReactMarkdown from 'react-markdown';

/* codePost imports */
import { IRubricCategoryToRubricCommentsMap } from '../../../types/common';

import { AssignmentType } from '../../../infrastructure/assignment';
import { RubricCategoryType } from '../../../infrastructure/rubricCategory';
import { RubricCommentType } from '../../../infrastructure/rubricComment';

/**********************************************************************************************************************/

interface IProps {
  /* data */
  assignment: AssignmentType;
  rubricCategories: RubricCategoryType[];
  rubricComments: IRubricCategoryToRubricCommentsMap;

  /* change data functions */
  onRubricUpload: (categories: RubricCategoryType[], comments: IRubricCategoryToRubricCommentsMap) => void;

  /* UI controllers */
  isDisabled: boolean;
  addErrorToast: (text: string, action: string | undefined) => void;
  addToast: (text: string, action: string | undefined) => void;
}

interface IDownloadCategory {
  name: string;
  pointLimit: number;
  rubricComments: IDownloadComment[];
}

interface IDownloadComment {
  text: string;
  pointDelta: number;
}

enum STATUS {
  CLOSED,
  OPEN,
  FILE_UPLOADED,
  LOADING,
  UPLOAD_ERRORS,
}

interface IState {
  /* data */
  newCategories: RubricCategoryType[];
  newComments: IRubricCategoryToRubricCommentsMap;
  uploadErrors: string[];
  jsonUpload: IDownloadCategory[];
  uploadFileName: string;

  /* UI control */
  status: STATUS;
  displayDeleteLinked: boolean;
  updatingRubric: boolean;
}

/**********************************************************************************************************************/

class RubricFileDialog extends React.Component<IProps, IState> {
  public state: Readonly<IState> = {
    newCategories: [],
    newComments: {},
    status: STATUS.CLOSED,

    displayDeleteLinked: false,
    uploadErrors: [],
    updatingRubric: false,

    jsonUpload: [],
    uploadFileName: '',
  };

  public toggleStatus = () => {
    const { status } = this.state;
    if (status === STATUS.CLOSED) {
      this.setState({ status: STATUS.OPEN });
    } else {
      this.setState({ status: STATUS.CLOSED });
    }
  };

  // create a nested rubric object from existing rubric for download purposes
  public getNestedRubricForDownload = (
    rubricCategories: RubricCategoryType[],
    rubricComments: IRubricCategoryToRubricCommentsMap,
  ) => {
    return rubricCategories.map((cat) => {
      return {
        name: cat.name,
        pointLimit: cat.pointLimit,
        rubricComments: rubricComments[cat.id].map((comment) => {
          return {
            text: comment.text,
            pointDelta: comment.pointDelta,
          };
        }),
      };
    });
  };

  // Function called upon downloading
  public downloadRubric = () => {
    const { rubricCategories, rubricComments } = this.props;
    const rubric = this.getNestedRubricForDownload(rubricCategories, rubricComments);

    // Execute download
    const a = document.createElement('a');
    // pretty-print JSON so download is more human-readable
    a.href = `data:text/json;charset=utf-8, ${encodeURIComponent(JSON.stringify(rubric, null, 2))}`;
    a.download = `${this.props.assignment.name}-rubric.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    this.props.addToast('Rubric downloaded succesfully', undefined);
  };

  // Turn nested rubric into standard structure
  public parseRubric = (rubric: IDownloadCategory[]) => {
    const categories: RubricCategoryType[] = [];
    const comments = {};

    let categoryID = -1;
    let commentID = -1;
    rubric.forEach((newCategory: IDownloadCategory, index: number) => {
      const commentList: RubricCommentType[] = [];
      const categoryPayload: RubricCategoryType = {
        id: categoryID,
        name: newCategory.name,
        rubricComments: [],
        assignment: this.props.assignment.id,
        pointLimit: newCategory.pointLimit,
        sortKey: index,
      };

      newCategory.rubricComments.forEach((newComment: IDownloadComment) => {
        commentList.push({
          id: commentID,
          text: newComment.text,
          pointDelta: newComment.pointDelta,
          category: categoryPayload.id,
          comments: [],
        });
        commentID = commentID - 1;
      });

      comments[categoryPayload.id] = commentList;
      categories.push(categoryPayload);

      categoryID = categoryID - 1;
    });

    return {
      rubricCategories: categories,
      rubricComments: comments,
    };
  };

  // Function called upon upload of a file; check to make sure it's a valid json Object
  // Then check to make sure it's a valid rubric Object
  // If any errors in the checking, append
  public onRubricUpload = (file: File, result: string) => {
    this.setState({ status: STATUS.LOADING }, () => {
      try {
        const rubric = JSON.parse(result);
        const uploadErrors = this.isRubric(rubric);

        if (uploadErrors.length === 0) {
          // rubric is valid, so parse it for future use
          const formatted = this.parseRubric(rubric);

          this.setState({
            newCategories: formatted.rubricCategories,
            newComments: formatted.rubricComments,
            status: STATUS.FILE_UPLOADED,
          });
        } else {
          this.setState({ uploadErrors, status: STATUS.UPLOAD_ERRORS });
        }
      } catch (error) {
        this.setState({
          uploadErrors: ["The rubric you uploaded isn't a valid JSON object."],
          status: STATUS.UPLOAD_ERRORS,
        });
        return;
      }
    });
  };

  // Check to make sure the uploaded file is a valid Rubric
  public isRubric = (rubric: IDownloadCategory[]) => {
    const uploadErrors: string[] = [];
    if (rubric) {
      rubric.map((cat) => {
        if (!(typeof cat.name === 'string')) {
          uploadErrors.push(`Name field of ${cat.name} must be a string`);
        }
        let numDuplicateName = 0;
        rubric.forEach((cat2) => {
          if (cat2.name === cat.name) {
            numDuplicateName += 1;
          }
        });
        if (numDuplicateName > 1) {
          uploadErrors.push(`Multiple categories with the same name (${cat.name})`);
        }
        cat.rubricComments.map((comm) => {
          if (!(typeof comm.text === 'string')) {
            uploadErrors.push('Make sure every comment text field contains a string');
          }
          if (!(typeof comm.pointDelta === 'number')) {
            uploadErrors.push('Make sure every comment pointDelta field contains a number');
          }
        });
      });
      return uploadErrors;
    }
    uploadErrors.push('Uploaded JSON object is empty.');
    return uploadErrors;
  };

  public formatUpdateMessages = (data: string[], message: string) => {
    if (data.length > 0) {
      return (
        <div>
          <b>{message}</b>
          {data.map((elem, index) => {
            return (
              <div className="uploadChangesText" key={index}>
                {elem}
              </div>
            );
          })}
          <div className="error-padding" />
        </div>
      );
    } else return;
  };

  public dummyUpload = (file: File) => {
    return;
  };

  public saveRubric = () => {
    this.props.onRubricUpload(this.state.newCategories, this.state.newComments);
    this.toggleStatus();
  };

  public render() {
    const { status } = this.state;

    const dialogActions = [
      {
        secondary: true,
        children: 'Cancel',
        onClick: this.toggleStatus,
        disabled: this.state.updatingRubric,
      },
    ];

    let content;
    switch (status) {
      case STATUS.LOADING:
        content = <LinearProgress id="circle" className="progressCircle" />;
        break;
      case STATUS.OPEN:
        const exampleText =
          '    [\n\
        {\n\
          "name" : "Hello",\n\
          "pointLimit" : 2,\n\
          "rubricComments" : [{ \n\
            "text" : "this is a new comment",\n\
            "pointDelta" : 0,\n\
          ]},\n\
        ...\n\
      ]';

        content = (
          <div>
            <div>
              Download rubric as a json format:
              <div className="error-padding" />
              <Button
                key="download-rubric"
                className="Btn"
                iconBefore={false}
                iconChildren={'save'}
                onClick={this.downloadRubric}
                primary={true}
                raised={true}
              >
                Download JSON rubric
              </Button>
            </div>

            <div className="padding" />
            <div className="padding" />

            <div>
              <div>Upload file to replace rubric:</div>
              <ReactMarkdown source={exampleText} />
              <div className="error-padding" />
              <FileUpload
                id="rubricUpload-FileInput"
                accept="application/json"
                multiple={false}
                onLoad={this.onRubricUpload}
                onChange={this.dummyUpload}
              />
            </div>
          </div>
        );
        break;
      case STATUS.UPLOAD_ERRORS:
        content = this.state.uploadErrors.map((error, index) => {
          return (
            <div key={index}>
              <div className="uploadErrorText">{error}</div>
              <div className="error-padding" />
            </div>
          );
        });
        break;
      case STATUS.FILE_UPLOADED:
        const isReplacement = this.props.rubricCategories.length > 0;
        if (isReplacement) {
          content = (
            <div>
              <div>Are you sure you want to upload this rubric?</div>
              <br />
              <div>
                <b>Warning:</b> selecting continue will overwrite your existing rubric.
              </div>
            </div>
          );
        } else {
          content = <div>Are you sure you want to upload this rubric?</div>;
        }

        dialogActions.push({
          secondary: false,
          children: 'Continue',
          onClick: this.saveRubric,
          disabled: this.state.updatingRubric,
        });
    }

    return (
      <div className="admin-rubric__FileDialog">
        <Button
          raised
          onClick={this.toggleStatus}
          primary={true}
          iconChildren={'vertical_align_center'}
          iconBefore={false}
          flat={true}
          className="admin-rubric__FileDialog__triggerButton"
          disabled={this.props.isDisabled}
        >
          Upload / Download Rubric
        </Button>

        <DialogContainer
          id="dialog--rubricUpload"
          className="dialog--rubricUpload"
          visible={this.state.status !== STATUS.CLOSED}
          title="Rubric Upload/Download"
          onHide={this.toggleStatus}
          actions={dialogActions}
          modal
        >
          {content}
        </DialogContainer>
      </div>
    );
  }
}
export default RubricFileDialog;
