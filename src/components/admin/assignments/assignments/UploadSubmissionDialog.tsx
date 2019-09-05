/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* ant imports */
import { Button, Icon, message, Modal, Progress, Switch, Upload } from 'antd';

/* other library imports */
import Select from 'react-select';

/* codePost imports */
import { AssignmentType } from '../../../../infrastructure/assignment';

import CPTooltip from '../../../../components/core/CPTooltip';
import { tooltips } from '../../../../components/core/tooltips';

import { IStudentSubmissionsDataTable } from '../../../../types/common';

import { acceptedFilesString } from './AcceptedFileTypes';

/**********************************************************************************************************************/

interface IProps {
  isVisible: boolean;
  onCancel: () => void;
  assignments: AssignmentType[];
  selectedAssignment?: AssignmentType;
  students: string[];
  selectedStudents: string[];
  submissions: IStudentSubmissionsDataTable;
  uploadSubmission: (assignment: AssignmentType, partners: string[], files: any[]) => Promise<void>;
}

enum STATUS {
  NONE,
  SAVING /* reading files from user's file system */,
  COMPLETE /* completed upload */,
}

interface IState {
  selectedStudents: string[];
  selectedAssignment?: AssignmentType;
  // List of files in codePost format for upload
  files: any[];
  // List of files in ant format. Required to make make the dialog a controlled list so we
  // can remove files from the list if they are not valid
  fileList: any[];
  status: STATUS;

  uploadDirectory: boolean;
}

class UploadSubmissionDialog extends React.Component<IProps, IState> {
  public assignmentOptions = this.props.assignments.map((assignment, i) => {
    return {
      value: assignment.id,
      label: assignment.name,
    };
  });

  public state: Readonly<IState> = {
    selectedStudents: this.props.selectedStudents,
    selectedAssignment: this.props.selectedAssignment,
    files: [],
    fileList: [],
    status: STATUS.NONE,
    uploadDirectory: false,
  };

  public componentDidUpdate(prevProps: IProps) {
    if (prevProps.selectedAssignment !== this.props.selectedAssignment) {
      this.setState({ selectedAssignment: this.props.selectedAssignment });
    }
    if (prevProps.selectedStudents !== this.props.selectedStudents) {
      this.setState({ selectedStudents: this.props.selectedStudents });
    }
  }

  public changeStudents = (options: any) => {
    const students = options.map((option: any) => option.value);
    this.setState({ selectedStudents: students });
  };

  public changeAssignment = (option: any) => {
    const selectedAssignment = this.props.assignments.find((assn) => {
      return assn.id === option.value;
    });

    this.setState({ selectedAssignment, selectedStudents: [] });
  };

  public cancel = () => {
    this.setState({ status: STATUS.NONE, files: [], fileList: [] });
    this.props.onCancel();
  };

  public toggleDirectoryUpload = () => {
    this.setState({ status: STATUS.NONE, files: [], fileList: [], uploadDirectory: !this.state.uploadDirectory });
  };

  public upload = () => {
    if (this.state.selectedAssignment !== null) {
      this.setState({ status: STATUS.SAVING }, () => {
        if (this.state.selectedAssignment !== null) {
          this.props
            .uploadSubmission(this.state.selectedAssignment!, this.state.selectedStudents, this.state.files)
            .then((newSubmission: any) => {
              this.setState({
                status: STATUS.COMPLETE,
                files: [],
                fileList: [],
                selectedStudents: this.props.selectedStudents,
                selectedAssignment: this.props.selectedAssignment ? this.props.selectedAssignment : undefined,
              });
            })
            .catch(() => {
              message.error(
                'Sorry, something went wrong. Please try uploading again.\
                If the problem persists, contact the codePost tean.',
              );
              this.cancel();
            });
        }
      });
    }
  };

  public onRemove = (file: any) => {
    const newFiles = this.state.files.filter((el) => {
      return el.name !== file.name;
    });
    const newFileList = this.state.fileList.filter((el) => {
      return el.name !== file.name;
    });
    this.setState({ files: newFiles, fileList: newFileList });
  };

  public changeStatus = (newStatus: STATUS) => {
    this.setState({ status: newStatus });
  };

  /* build a list of two student groups: missing submissions and not missing submissions */
  /* use these two groups to populate select */
  public buildStudentOptions = (
    students: string[],
    submissions: IStudentSubmissionsDataTable,
    assignment?: AssignmentType,
  ) => {
    /* FIXME: should use react-select type definition */
    const toRet: any = [
      { label: 'Students missing submissions', options: [] },
      { label: 'Students with submissions (delete before uploading)', options: [] },
    ];

    for (const student of students) {
      if (assignment) {
        if (submissions[student][assignment.id]) {
          toRet[1].options.push({
            value: student,
            label: student,
            isDisabled: true,
          });
        } else {
          toRet[0].options.push({
            value: student,
            label: student,
            isDisabled: false,
          });
        }
      } else {
        toRet[0].options.push({
          value: student,
          label: student,
          isDisabled: false,
        });
      }
    }

    return toRet;
  };

  public onCancel = () => {
    this.setState({ files: [], fileList: [], status: STATUS.NONE });
    this.props.onCancel();
  };

  public render() {
    const { isVisible } = this.props;
    const { status } = this.state;

    if (!isVisible) {
      return <div />;
    }

    const disableUpload = !(
      this.state.selectedStudents.length > 0 &&
      this.state.files.length > 0 &&
      this.state.selectedAssignment
    );

    let content;
    switch (status) {
      case STATUS.COMPLETE:
        content = (
          <div>
            Uploading submissions: &nbsp; <Progress percent={100} size="small" />
            <br />
            <br />
            Upload complete!
          </div>
        );
        break;
      case STATUS.SAVING:
        content = (
          <div>
            Uploading submissions: &nbsp; <Progress percent={0} size="small" />
          </div>
        );
      case STATUS.NONE:
        // FIXME: this method of reading file contents relies on a race win, since
        // we need the fileReaders to finish before we hit upload.
        const beforeUpload = (file: any, fileList: any) => {
          // Ignore hidden files
          if (file.name[0] === '.') {
            return false;
          }

          const reader = new FileReader();
          reader.onload = () => {
            if (reader.result) {
              const newFiles = this.state.files.filter((el) => {
                return el.name !== file.name;
              });
              const newFileList = this.state.fileList.filter((el) => {
                return el.name !== file.name;
              });
              const pathDirs = file.webkitRelativePath.split('/');
              const filePath = pathDirs.length > 2 ? pathDirs.slice(1, pathDirs.length - 1).join('/') : null;
              this.setState({
                files: [
                  ...newFiles,
                  {
                    name: file.name,
                    data: reader.result,
                    path: filePath,
                  },
                ],
                fileList: [...newFileList, file],
              });
            } else {
              message.error(`${file.name} cannot be uploaded because it is empty.`);
            }
          };
          reader.readAsText(file);

          // prevent upload
          return false;
        };
        const studentOptions = this.buildStudentOptions(
          this.props.students,
          this.props.submissions,
          this.state.selectedAssignment,
        );

        const selectedStudents = this.state.selectedStudents.map((student) => {
          return {
            label: student,
            value: student,
          };
        });

        content = (
          <div>
            Assignment:
            <Select
              defaultValue={
                this.state.selectedAssignment
                  ? { value: this.state.selectedAssignment!.id, label: this.state.selectedAssignment!.name }
                  : {}
              }
              isDisabled={typeof this.props.selectedAssignment === 'object'}
              onChange={this.changeAssignment}
              options={this.assignmentOptions}
            />
            <br />
            <br />
            Students: <CPTooltip title={tooltips.admin.assignments.uploadSubmission} infoIcon={true} />
            <Select
              placeholder={'Select students'}
              isMulti={true}
              value={selectedStudents}
              options={studentOptions}
              onChange={this.changeStudents}
            />
            <br />
            {/*  beforeUpload prop stops Upload component from trying to upload files to external server */}
            {/*  FIXME: we should prevent users from uploading image files here */}
            <div style={{ marginBottom: 15 }}>
              Upload a Full Directory &nbsp;{' '}
              <Switch checked={this.state.uploadDirectory} onClick={this.toggleDirectoryUpload} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Upload
                beforeUpload={beforeUpload}
                listType="text"
                multiple={true}
                onRemove={this.onRemove}
                fileList={this.state.fileList}
                accept={acceptedFilesString}
                directory={this.state.uploadDirectory}
              >
                <Button>
                  <Icon type="upload" /> Upload files
                </Button>
              </Upload>
              <CPTooltip
                title={tooltips.admin.assignments.uploadSubmissionFileTypes}
                infoIcon={true}
                iconStyle={{ paddingLeft: 5 }}
              />
            </div>
          </div>
        );
        break;
    }

    // modal's back button
    let goBackButton;
    switch (this.state.status) {
      case STATUS.NONE:
        goBackButton = (
          <Button key="back" onClick={this.cancel}>
            Cancel
          </Button>
        );
        break;
      case STATUS.SAVING:
        goBackButton = (
          <Button key="back" disabled={true}>
            Cancel
          </Button>
        );
        break;
    }

    // modal's forward button
    let goForwardButton = null;
    switch (this.state.status) {
      case STATUS.NONE:
        goForwardButton = (
          <Button key="submit" type="primary" disabled={disableUpload} onClick={this.upload}>
            Upload
          </Button>
        );
        break;
      case STATUS.SAVING:
        goForwardButton = (
          <Button key="submit" type="primary" disabled={true} loading={true}>
            Upload
          </Button>
        );
        break;
      case STATUS.COMPLETE:
        goForwardButton = (
          <Button key="submit" type="primary" onClick={this.cancel}>
            Close
          </Button>
        );
        break;
    }

    return (
      <Modal
        visible={true}
        title="Upload Submissions"
        onCancel={this.onCancel}
        width={700}
        footer={[goBackButton, goForwardButton]}
      >
        {content}
      </Modal>
    );
  }
}
export default UploadSubmissionDialog;
