/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* ant imports */
import { Alert, Button, Icon, Modal, Tooltip, Upload } from 'antd';

/* other library imports */
import Select from 'react-select';

/* codePost imports */
import { AssignmentType } from '../../../../infrastructure/assignment';

import { IStudentSubmissionsDataTable } from '../../../../types/common';

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
  files: any[];
  foundCollision: boolean;
  status: STATUS;
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
    foundCollision: false,
    status: STATUS.NONE,
  };

  public componentDidUpdate(prevProps: IProps) {
    if (!prevProps.selectedAssignment && this.props.selectedAssignment) {
      this.setState({ selectedAssignment: this.props.selectedAssignment });
    }
    if (!prevProps.selectedStudents && this.props.selectedStudents) {
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
    this.props.onCancel();
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
                selectedStudents: this.props.selectedStudents,
                selectedAssignment: this.props.selectedAssignment ? this.props.selectedAssignment : undefined,
              });
            });
        }
      });
    }
  };

  public onChangeFiles = (info: any) => {
    this.setState({ files: info.fileList });
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

    let errorText;
    if (this.state.foundCollision) {
      errorText = (
        <Alert
          message={`A submission already exists for one of
            these students. You must delete it before uploading a new submission.`}
          type="error"
        />
      );
    }

    let content;
    switch (status) {
      case STATUS.COMPLETE:
        content = <p>Submission upload complete!</p>;
        break;
      case STATUS.SAVING:
      case STATUS.NONE:
        // FIXME: this method of reading file contents relies on a race win, since
        // we need the fileReaders to finish before we hit upload.
        const beforeUpload = (file: any, fileList: any) => {
          const reader = new FileReader();
          reader.onload = () => {
            if (reader.result) {
              const newFiles = this.state.files.filter((el) => {
                return el.name !== file.name;
              });
              this.setState({
                files: [
                  ...newFiles,
                  {
                    name: file.name,
                    data: reader.result,
                  },
                ],
              });
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
            Students:{' '}
            <Tooltip
              title={`Select multiple students, so long as none of them have a
             pre-existing submission for the assignment you selected.`}
            >
              <Icon type="info-circle" />
            </Tooltip>
            <Select
              placeholder={'Select students'}
              isMulti={true}
              value={selectedStudents}
              options={studentOptions}
              onChange={this.changeStudents}
            />
            <br />
            {errorText}
            <br />
            {/*  beforeUpload prop stops Upload component from trying to upload files to external server */}
            {/*  FIXME: we should prevent users from uploading image files here */}
            <Upload beforeUpload={beforeUpload} listType="text" multiple={true} onChange={this.onChangeFiles}>
              <Button>
                <Icon type="upload" /> Upload
              </Button>
            </Upload>
          </div>
        );
        break;
    }

    return (
      <Modal
        visible={true}
        title="Upload Submissions"
        onCancel={this.props.onCancel}
        width={700}
        footer={[
          <Button key="back" onClick={this.props.onCancel}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={this.state.status === STATUS.SAVING}
            disabled={disableUpload}
            onClick={this.upload}
          >
            Upload
          </Button>,
        ]}
      >
        {content}
      </Modal>
    );
  }
}
export default UploadSubmissionDialog;
