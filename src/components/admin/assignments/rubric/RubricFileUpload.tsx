/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

import { UploadOutlined, WarningOutlined } from '@ant-design/icons';

/* antd imports */
import { Button, Collapse, Modal, Spin, Steps, Typography, Upload } from 'antd';

/* other library imports */
import ReactMarkdown from 'react-markdown';

/* codePost imports */
import { IRubricCategoryToRubricCommentsMap } from '../../../../types/common';

import { AssignmentType } from '../../../../infrastructure/assignment';
import { RubricCategoryType } from '../../../../infrastructure/rubricCategory';
import { RubricCommentType } from '../../../../infrastructure/rubricComment';

import CPButton from '../../../../components/core/CPButton';

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
}

interface IDownloadCategory {
  name: string;
  pointLimit: number;
  helpText: string;
  rubricComments: IDownloadComment[];
}

interface IDownloadComment {
  text: string;
  pointDelta: number;
  sortKey?: number;
  explanation?: string;
  instructionText?: string;
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

class RubricFileUpload extends React.Component<IProps, IState> {
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

  public goBack = () => {
    this.setState({
      newCategories: [],
      newComments: {},
      status: STATUS.OPEN,
      displayDeleteLinked: false,
      uploadErrors: [],
      updatingRubric: false,
      jsonUpload: [],
      uploadFileName: '',
    });
  };

  // Turn nested rubric into standard structure
  public parseRubric = (rubric: IDownloadCategory[]) => {
    const categories: RubricCategoryType[] = [];
    const comments: any = {};

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
        helpText: newCategory.helpText,
        atMostOnce: false,
      };

      newCategory.rubricComments.forEach((newComment: IDownloadComment, indexComment: number) => {
        let sortKey = indexComment;
        if (newComment.sortKey !== undefined) {
          sortKey = newComment.sortKey;
        }

        let explanation = '';
        if (newComment.explanation !== undefined) {
          explanation = newComment.explanation;
        }

        let instructionText = '';
        if (newComment.instructionText !== undefined) {
          instructionText = newComment.instructionText;
        }

        commentList.push({
          id: commentID,
          text: newComment.text,
          pointDelta: newComment.pointDelta,
          category: categoryPayload.id,
          sortKey,
          explanation,
          instructionText,
          templateTextOn: false,
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

  // Function called upon upload of a file; check to make sure the file is a valid json object
  // Then check to make sure it's a valid rubric
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
            uploadFileName: file.name,
          });
        } else {
          this.setState({
            uploadErrors,
            status: STATUS.UPLOAD_ERRORS,
            uploadFileName: file.name,
          });
        }
      } catch (error) {
        this.setState({
          uploadErrors: ["The rubric you uploaded isn't a valid JSON object."],
          status: STATUS.UPLOAD_ERRORS,
          uploadFileName: file.name,
        });
        return;
      }
    });
  };

  // Check to make sure the uploaded file is a valid rubric
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
          return true;
        });
        return true;
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
            return <div key={index}>{elem}</div>;
          })}
          <br />
        </div>
      );
    } else return;
  };

  public dummyUpload = (_file: File) => {
    return;
  };

  public saveRubric = () => {
    this.setState({ status: STATUS.LOADING }, () => {
      this.props.onRubricUpload(this.state.newCategories, this.state.newComments);
      this.toggleStatus();
    });
  };

  // FIXME: this method of reading file contents relies on a race win, since
  // we need the fileReaders to finish before we hit upload.
  public beforeUpload = (file: any, _fileList: any) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        switch (typeof reader.result) {
          case 'string':
            this.onRubricUpload(file, reader.result);
            break;
          default:
            this.onRubricUpload(file, '');
            break;
        }
      }
    };
    reader.readAsText(file);

    // prevent upload
    return false;
  };

  public render() {
    const { status } = this.state;

    let content;
    let footer;
    switch (status) {
      case STATUS.LOADING:
        content = <Spin />;
        break;
      case STATUS.OPEN: {
        const exampleText =
          '    [\n\
        {\n\
          "name" : "Category 1 name",\n\
          "pointLimit" : 2,\n\
          "rubricComments" : [{ \n\
            "text" : "this is a new comment",\n\
            "pointDelta" : 0,\n\
            "sortKey" : 0,\n\
            "explanation" : "",\n\
            "instructionText" : "",\n\
          }],\n\
        }\n\
        ...\n\
      ]';

        content = (
          <div>
            <div>
              <div>
                Upload a rubric encoded in <Typography.Text code>.json</Typography.Text> format. This will replace any
                existing rubric in place for this assignment.
              </div>
              <br />
              <Collapse defaultActiveKey={['json']}>
                <Collapse.Panel header="Required JSON format" key="json">
                  <WarningOutlined /> One common mistake: don't use trailing commas (e.g.{' '}
                  <Typography.Text code>[el1, el2,]</Typography.Text> should be{' '}
                  <Typography.Text code>[el1, el2]</Typography.Text>) <br /> <br />
                  <ReactMarkdown>{exampleText}</ReactMarkdown>
                </Collapse.Panel>
              </Collapse>
              <br />
              <br />
              <Upload beforeUpload={this.beforeUpload} listType="text" multiple={true}>
                <Button>
                  <UploadOutlined /> Upload
                </Button>
              </Upload>
            </div>
          </div>
        );
        footer = [
          <Button key="cancel" onClick={this.toggleStatus}>
            Cancel
          </Button>,
        ];
        break;
      }
      case STATUS.UPLOAD_ERRORS:
        content = this.state.uploadErrors.map((error, index) => {
          return (
            <div key={index}>
              <div className="uploadErrorText">{error}</div>
              <br />
            </div>
          );
        });
        footer = [
          <Button key="back" onClick={this.goBack}>
            Go back
          </Button>,
        ];
        break;
      case STATUS.FILE_UPLOADED: {
        const isReplacement = this.props.rubricCategories.length > 0;
        content = (
          <div>
            <div>
              Uploaded file: <Typography.Text code>{this.state.uploadFileName}</Typography.Text>
            </div>
            <br />
            <br />
            {isReplacement ? (
              <div>
                <Typography.Text type="warning">Warning: </Typography.Text> Continuing will overwrite your existing
                rubric.
              </div>
            ) : null}
          </div>
        );
        footer = [
          <Button key="back" onClick={this.goBack}>
            Go back
          </Button>,
          <Button key="continue" onClick={this.saveRubric} type={isReplacement ? undefined : 'primary'}>
            {isReplacement ? 'Overwrite' : 'Save'}
          </Button>,
        ];
      }
    }

    const steps = ['Upload', 'Review'];
    let currentStep;
    switch (this.state.status) {
      case STATUS.CLOSED:
      case STATUS.OPEN:
        currentStep = 0;
        break;
      case STATUS.UPLOAD_ERRORS:
      case STATUS.FILE_UPLOADED:
        currentStep = 1;
        break;
    }

    return (
      <div className="admin-rubric__FileDialog">
        <CPButton
          cpType="secondary"
          onClick={this.toggleStatus}
          disabled={this.props.isDisabled}
          icon={<UploadOutlined />}
          fallbackIcon={<UploadOutlined />}
          fallbackWidth={1250}
        >
          Upload
        </CPButton>

        <Modal
          open={this.state.status !== STATUS.CLOSED}
          title="Rubric File Upload"
          onCancel={this.toggleStatus}
          onOk={this.saveRubric}
          width={600}
          footer={footer}
        >
          <Steps
            size="small"
            current={currentStep}
            items={steps.map((item) => ({
              key: item,
              title: item,
            }))}
          />
          <br />
          {content}
        </Modal>
      </div>
    );
  }
}
export default RubricFileUpload;
