import * as React from 'react';
import { Button, DialogContainer, FileUpload, LinearProgress } from 'react-md';

import { IRubricCategoryToRubricCommentsMap } from '../../types/common';

import { AssignmentType } from '../../infrastructure/assignment';
import { RubricCategoryType } from '../../infrastructure/rubricCategory';
import { RubricCommentType } from '../../infrastructure/rubricComment';

interface IProps {
  activeAssignment: AssignmentType | undefined;
  activeRubricCategories: RubricCategoryType[] | undefined;
  activeRubricComments: IRubricCategoryToRubricCommentsMap | undefined;
  addErrorToast: (text: string, action: string | undefined) => void;
  addToast: (text: string, action: string | undefined) => void;
  createRubricCategory: (
    assignmentID: number,
    categoryName: string,
    pointLimit: number | undefined,
    newComments: RubricCommentType[],
  ) => Promise<RubricCategoryType>;
  createRubricComment: (
    assignmentID: number,
    categoryID: number,
    text: string,
    pointDelta: number,
  ) => Promise<RubricCommentType>;
  deleteRubricCategory: (assignmentID: number, categoryID: number, categoryName: string) => Promise<void>;
  deleteRubricComment: (assignmentID: number, categoryID: number, commentID: number) => Promise<void>;
  updateRubricCategory: (
    assignmentID: number,
    categoryID: number,
    categoryName: string,
    categoryPointLimit: number | undefined,
  ) => Promise<RubricCategoryType>;
  updateRubricComment: (
    categoryID: number,
    commentID: number,
    text: string | undefined,
    pointDelta: number | undefined,
  ) => Promise<RubricCommentType>;
  parentUpdate: (assignment: AssignmentType | undefined) => void;
}

interface IDownloadCategory {
  id: number;
  name: string;
  pointLimit: number | undefined;
  rubricComments: RubricCommentType[];
}

interface IState {
  dialogVisible: boolean;
  uploadErrors: string[];
  updatingRubric: boolean;
  updates: { [index: string]: string[] } | undefined;
  jsonUpload: IDownloadCategory[];
  uploadFileName: string | undefined;
}

class RubricFileDialog extends React.Component<IProps, {}> {
  public state: Readonly<IState> = {
    dialogVisible: false,
    uploadErrors: [],
    updatingRubric: false,
    updates: undefined,
    jsonUpload: [],
    uploadFileName: undefined,
  };

  public toggleDialog = () => {
    const { dialogVisible } = this.state;
    this.setState({
      dialogVisible: !dialogVisible,
      uploadErrors: [],
      updates: undefined,
      updatingRubric: false,
      uploadFileName: undefined,
    });
  };

  // create a nested rubric object from existing rubric for download purposes
  public getNestedRubricForDownload = () => {
    const { activeRubricCategories, activeRubricComments } = this.props;
    if (activeRubricCategories && activeRubricComments) {
      const downloadRubric: IDownloadCategory[] = [];
      activeRubricCategories.forEach((cat) => {
        const newCat: IDownloadCategory = {
          id: cat.id,
          name: cat.name,
          pointLimit: cat.pointLimit,
          rubricComments: [],
        };
        if (activeRubricComments[cat.id]) {
          activeRubricComments[cat.id].forEach((comm) => {
            newCat.rubricComments.push(comm);
          });
        }
        downloadRubric.push(newCat);
      });
      return downloadRubric;
    }
    return;
  };

  // Function called upon downloading
  public downloadRubric = () => {
    const rubric = this.getNestedRubricForDownload();
    const a = document.createElement('a');
    a.href = `data:attachment/json, ${JSON.stringify(rubric)}`;
    a.download = 'rubric.json';

    document.body.appendChild(a);
    a.click();
    this.props.addToast('Rubric downloaded succesfully', undefined);
  };

  // Function called upon upload of a file; check to make sure it's a valid json Object
  // Then check to make sure it's a valid rubric Object
  // If any errors in the checking, append
  public onRubricUpload = (file: File, result: string) => {
    this.setState({ uploadErrors: [], uploadFileName: file.name });
    try {
      const rubric = JSON.parse(result);
      const uploadErrors = this.isRubric(rubric);
      if (uploadErrors.length === 0) {
        this.setState({ updatingRubric: true, jsonUpload: rubric, updates: undefined });
        this.updateRubric(rubric, false);
      } else {
        this.setState({ uploadErrors, updates: undefined });
      }
    } catch (error) {
      this.setState({
        uploadErrors: ['Uploaded Rubric is not a valid JSON object'],
        updates: undefined,
      });
      return;
    }
  };

  // Check to make sure the uploaded file is a valid Rubric
  public isRubric = (rubric: IDownloadCategory[]) => {
    const uploadErrors: string[] = [];
    if (rubric) {
      rubric.map((cat) => {
        if (!(typeof cat.id === 'number')) {
          uploadErrors.push(`Id field of ${cat.id} must be a number`);
        }
        if (!(typeof cat.name === 'string')) {
          uploadErrors.push(`Name field of ${cat.name} must be a string`);
        }
        if (Object.keys(cat).length !== 4) {
          uploadErrors.push(`Category of id ${cat.id} has some incorrect keys.
            Please check the spellings of id, name, pointLimit, and category fields`);
        }
        let numDuplicateName = 0;
        let numDuplicateID = 0;
        rubric.forEach((cat2) => {
          if (cat2.name === cat.name) {
            numDuplicateName += 1;
          }
          if (cat2.id === cat.id) {
            numDuplicateID += 1;
          }
        });
        if (numDuplicateName > 1) {
          uploadErrors.push(`Multiple categories with the same name of ${cat.name}`);
        }
        if (numDuplicateID > 1) {
          uploadErrors.push(`Multiple categories with the same id ${cat.id}`);
        }
        cat.rubricComments.map((comm) => {
          if (!(typeof comm.id === 'number')) {
            uploadErrors.push(`Id field of ${comm.id} must be a number`);
          }
          if (!(typeof comm.text === 'string')) {
            uploadErrors.push(`Id field of ${comm.id} must be a number`);
          }
          if (!(typeof comm.pointDelta === 'number')) {
            uploadErrors.push(`pointDelta field of ${comm.id} must be a number`);
          }
          if (!(typeof comm.category === 'number')) {
            uploadErrors.push(`Category field of ${comm.id} must be a number`);
          }
          if (comm.category !== cat.id) {
            uploadErrors.push(`Category field of ${comm.id} must be equal to the ID of it's parent category`);
          }
          if (Object.keys(comm).length !== 4) {
            uploadErrors.push(`Comment of id ${comm.id} has some incorrect keys.
              Please check the spellings of id, text, pointDelta, and category fields`);
          }
        });
      });
      return uploadErrors;
    }
    uploadErrors.push('Uploaded JSON object is empty.');
    return uploadErrors;
  };

  // If makeDBUpdate === false, check to see what changes would be makeDBUpdate
  // If makeDBUpdate === true, actually make the api calls to make the changes
  public updateRubric = (newRubric: IDownloadCategory[], makeDBUpdate: boolean) => {
    const { activeRubricComments, activeRubricCategories, activeAssignment } = this.props;
    const updates: { [index: string]: string[] } = {
      newCategories: [],
      newComments: [],
      updatedComments: [],
      updatedCategories: [],
      deletedComments: [],
      deletedCategories: [],
    };
    const promises: any[] = [];

    if (activeRubricCategories && activeRubricComments && activeAssignment) {
      const oldCategories = activeRubricCategories;
      const oldComments = activeRubricComments;

      newRubric.forEach((cat) => {
        // If new category, create category and comments
        const catIndex = oldCategories
          .map((i) => {
            return i.id;
          })
          .indexOf(cat.id);

        if (catIndex === -1) {
          if (makeDBUpdate) {
            const result = this.props.createRubricCategory(
              activeAssignment.id,
              cat.name,
              cat.pointLimit,
              cat.rubricComments,
            );
            promises.push(result);
          }
          updates.newCategories.push(cat.name);
        } else {
          // If new comment for an existing category, create commnet
          cat.rubricComments.forEach((com) => {
            if (com.id === -1) {
              if (makeDBUpdate) {
                const result = this.props.createRubricComment(activeAssignment.id, cat.id, com.text, com.pointDelta);
                promises.push(result);
              }
              updates.newComments.push(com.text);
            } else {
              // If existing comment, and either text or points have changed, update comment
              const comIndex = oldComments[cat.id]
                .map((i) => {
                  return i.id;
                })
                .indexOf(com.id);
              if (
                comIndex !== -1 &&
                (oldComments[cat.id][comIndex].text !== com.text ||
                  oldComments[cat.id][comIndex].pointDelta !== com.pointDelta)
              ) {
                console.log(oldComments[cat.id][comIndex]);
                console.log(com);
                if (makeDBUpdate) {
                  const result = this.props.updateRubricComment(cat.id, com.id, com.text, com.pointDelta);
                  promises.push(result);
                }
                updates.updatedComments.push(com.text);
              }
            }
          });
          // If a rubric comment has been deleted, delete it
          oldComments[cat.id].forEach((oldComment) => {
            const checkDelete = cat.rubricComments
              .map((i) => {
                return i.id;
              })
              .indexOf(oldComment.id);
            if (checkDelete === -1) {
              if (makeDBUpdate) {
                const result = this.props.deleteRubricComment(activeAssignment.id, cat.id, oldComment.id);
                promises.push(result);
              }
              updates.deletedComments.push(oldComment.text);
            }
          });
          // If a category name or pointLimit has been changed, update it
          if (oldCategories[catIndex].name !== cat.name || oldCategories[catIndex].pointLimit !== cat.pointLimit) {
            // Reminder -- need to decide as a team if we can allow pointLimit to be null
            if (makeDBUpdate) {
              const result = this.props.updateRubricCategory(activeAssignment.id, cat.id, cat.name, cat.pointLimit);
              promises.push(result);
            }
            updates.updatedCategories.push(cat.name);
          }
        }
      });
      // Delete deleted categories
      const newCatIDs = newRubric.map((cat) => {
        return cat.id;
      });
      activeRubricCategories.forEach((cat) => {
        if (newCatIDs.indexOf(cat.id) === -1) {
          if (makeDBUpdate) {
            const result = this.props.deleteRubricCategory(activeAssignment.id, cat.id, cat.name);
            promises.push(result);
          }
          updates.deletedCategories.push(cat.name);
        }
      });
      if (makeDBUpdate) {
        Promise.all(promises).then(() => {
          this.setState({ updatingRubric: false });
          this.props.parentUpdate(activeAssignment);
          this.props.addToast('Rubric updated successfully.', undefined);
          this.toggleDialog();
        });
      } else {
        this.setState({ updates, updatingRubric: false });
      }
    }
  };

  // Once the user has seen and proceeded with the changes, trigger an update with
  // makeDBUpdate = true
  public triggerUpdate = () => {
    this.setState({ updatingRubric: true, updates: undefined }, () => this.updateRubric(this.state.jsonUpload, true));
  };

  public dummyUpload = (file: File) => {
    return;
  };

  public render() {
    const { dialogVisible, updates } = this.state;
    const dialogActions = [];
    dialogActions.push({
      secondary: true,
      children: 'Cancel',
      onClick: this.toggleDialog,
      disabled: this.state.updatingRubric,
    });

    const errors = this.state.uploadErrors.map((error, index) => {
      return (
        <div key={index}>
          <div className="uploadErrorText">{error}</div>
          <div className="error-padding" />
        </div>
      );
    });
    const progress = this.state.updatingRubric ? <LinearProgress id="circle" className="progressCircle" /> : '';

    const uploadFile = this.state.uploadFileName ? <div>{this.state.uploadFileName}</div> : '';

    let updateMessage;
    let newCategories;
    let newComments;
    let updatedCategories;
    let updatedComments;
    let deletedCategories;
    let deletedComments;
    let shouldUpdate = false;

    if (updates) {
      if (updates.newCategories.length > 0) {
        shouldUpdate = true;
        newCategories = (
          <div>
            <b>The following categories will be added:</b>
            {updates.newCategories.map((elem, index) => {
              return (
                <div className="uploadChangesText" key={index}>
                  {elem}
                </div>
              );
            })}
            <div className="error-padding" />
          </div>
        );
      }

      if (updates.newComments.length > 0) {
        shouldUpdate = true;
        newComments = (
          <div>
            <b>The following comments will be added:</b>
            {updates.newComments.map((elem, index) => {
              return (
                <div className="uploadChangesText" key={index}>
                  {elem}
                </div>
              );
            })}
            <div className="error-padding" />
          </div>
        );
      }

      if (updates.updatedCategories.length > 0) {
        shouldUpdate = true;
        updatedCategories = (
          <div>
            <b>The following categories will be updated:</b>
            {updates.updatedCategories.map((elem, index) => {
              return (
                <div className="uploadChangesText" key={index}>
                  {elem}
                </div>
              );
            })}
            <div className="error-padding" />
          </div>
        );
      }

      if (updates.updatedComments.length > 0) {
        shouldUpdate = true;
        updatedComments = (
          <div>
            <b>The following comments will be updated: </b>
            {updates.updatedComments.map((elem, index) => {
              return (
                <div className="uploadChangesText" key={index}>
                  {elem}
                </div>
              );
            })}
            <div className="error-padding" />
          </div>
        );
      }

      if (updates.deletedCategories.length > 0) {
        shouldUpdate = true;
        deletedCategories = (
          <div>
            <b>The following categories will be deleted:</b>
            {updates.deletedCategories.map((elem, index) => {
              return (
                <div className="uploadChangesText" key={index}>
                  {elem}
                </div>
              );
            })}
            <div className="error-padding" />
          </div>
        );
      }

      if (updates.deletedComments.length > 0) {
        deletedComments = (
          <div>
            <b>The following comments will be deleted:</b>
            {updates.deletedComments.map((elem, index) => {
              return (
                <div className="uploadChangesText" key={index}>
                  {elem}
                </div>
              );
            })}
            <div className="error-padding" />
          </div>
        );
      }

      if (shouldUpdate) {
        updateMessage = (
          <div>
            <div className="error-padding" />
            The following changes will be made to this rubric. Do you want to continue?
            <div className="error-padding" />
            <Button raised onClick={this.triggerUpdate} primary={true} flat={true}>
              Continue with changes
            </Button>
            <div className="error-padding" />
          </div>
        );
      }
    }
    return (
      <div>
        <Button
          raised
          onClick={this.toggleDialog}
          primary={true}
          iconChildren={'vertical_align_center'}
          iconBefore={false}
          flat={true}
        >
          Upload / Download Rubric
        </Button>
        <DialogContainer
          id="rubricFile-dialog"
          visible={dialogVisible}
          title="Manage rubric files"
          onHide={this.toggleDialog}
          actions={dialogActions}
          modal
        >
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
          <div>
            Upload file to replace rubric:
            <div className="error-padding" />
            <FileUpload
              id="rubricUpload-FileInput"
              accept="application/json"
              multiple={false}
              onLoad={this.onRubricUpload}
              onChange={this.dummyUpload}
              disabled={this.state.updatingRubric}
            />
            {progress}
            <div className="error-padding" />
            {uploadFile}
            <div className="error-padding" />
            {errors}
            {updateMessage}
            {newCategories}
            {newComments}
            {updatedCategories}
            {updatedComments}
            {deletedCategories}
            {deletedComments}
          </div>
        </DialogContainer>
      </div>
    );
  }
}
export default RubricFileDialog;
