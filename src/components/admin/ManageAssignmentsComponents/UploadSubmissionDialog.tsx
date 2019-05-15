/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* react-md imports */
import { Button, FileUpload } from 'react-md';

/* other library imports */
import Select from 'react-select';

/* codePost imports */
import UploadedFileCard from './UploadedFileCard';

import { AssignmentType } from '../../../infrastructure/assignment';
import { SubmissionType } from '../../../infrastructure/submission';

/**********************************************************************************************************************/

interface IProps {
  isVisible: boolean;
  onCancel: () => void;
  assignments: AssignmentType[];
  selectedAssignment: AssignmentType | null;
  students: string[];
  selectedStudents: string[];
  submissions: SubmissionType[];
  uploadSubmission: (assignment: AssignmentType, partners: string[], files: any[]) => Promise<SubmissionType>;
}

interface IState {
  selectedStudents: string[];
  selectedAssignment: AssignmentType | null;
  file?: any;
  files: any[];
  foundCollision: boolean;
}

class UploadSubmissionDialog extends React.Component<IProps, IState> {
  public fileUpload: any = React.createRef();

  public state: Readonly<IState> = {
    selectedStudents: this.props.selectedStudents,
    selectedAssignment: this.props.selectedAssignment,
    file: undefined,
    files: [],
    foundCollision: false,
  };

  public componentDidUpdate(prevProps: IProps) {
    if (!prevProps.selectedAssignment && this.props.selectedAssignment) {
      this.setState({ selectedAssignment: this.props.selectedAssignment });
    }
    if (!prevProps.selectedStudents && this.props.selectedStudents) {
      this.setState({ selectedStudents: this.props.selectedStudents });
    }
  }

  public checkForCollision = (assignment: AssignmentType, submissions: SubmissionType[], students: string[]) => {
    return submissions.some((el) => {
      if (el.assignment === assignment.id) {
        return el.students.some((student) => {
          return students.some((el2) => {
            return el2 === student;
          });
        });
      } else {
        return false;
      }
    });
  };

  public changeStudents = (options: any) => {
    const selectedStudents = options.map((option: any) => {
      return option.value;
    });

    let newCollision = false;
    if (this.state.selectedAssignment !== null) {
      newCollision = this.checkForCollision(this.state.selectedAssignment, this.props.submissions, selectedStudents);
    }

    this.setState({ selectedStudents, foundCollision: newCollision });
  };

  public changeAssignment = (option: any) => {
    const selectedAssignment = this.props.assignments.find((assn) => {
      return assn.id === option.value;
    });

    let newCollision = false;
    if (selectedAssignment) {
      newCollision = this.checkForCollision(selectedAssignment, this.props.submissions, this.state.selectedStudents);
      this.setState({ selectedAssignment, foundCollision: newCollision });
    }
  };

  public cancel = () => {
    this.props.onCancel();
    // If the students or assignment was passed in, we want to keep it in state
    if (!this.props.selectedStudents) {
      this.setState({ files: [], selectedStudents: [] });
    } else if (!this.props.selectedAssignment) {
      this.setState({ files: [], selectedAssignment: null });
    } else {
      this.setState({ files: [] });
    }
  };

  public upload = () => {
    if (this.state.selectedAssignment !== null) {
      this.props.uploadSubmission(this.state.selectedAssignment, this.state.selectedStudents, this.state.files);
      this.props.onCancel();
      // If the students or assignment was passed in, we want to keep it in state
      if (!this.props.selectedStudents) {
        this.setState({ files: [], selectedStudents: [] });
      } else if (!this.props.selectedAssignment) {
        this.setState({ files: [], selectedAssignment: null });
      } else {
        this.setState({ files: [] });
      }
    }
  };

  // ----- File upload -----
  public setFileUpload = (fileUpload: any) => {
    this.fileUpload = fileUpload;
  };

  public setFile = (file: any) => {
    this.setState({ file });
  };

  public removeFile = (file: any) => {
    const files = this.state.files.filter((f) => {
      return f.name !== file.name;
    });
    this.setState({ files });
  };

  public handleLoad = (uploadedFile: any, uploadedData: any) => {
    const { name, size, type, lastModified } = uploadedFile;
    const file = {
      name,
      size,
      type,
      data: uploadedData,
      lastModified: new Date(lastModified),
    };

    const files = [...this.state.files, file];

    this.setState({ files });
  };

  public onChangeFiles = () => {
    return;
  };

  public render() {
    if (!this.props.isVisible) {
      return <div />;
    }

    const uploadedFileCards = this.state.files.map((file) => {
      return <UploadedFileCard key={file.id} file={file} onRemoveClick={this.removeFile} />;
    });

    const disableUpload = !(
      this.state.selectedStudents.length > 0 &&
      this.state.files.length > 0 &&
      this.state.selectedAssignment
    );

    const studentOptions = this.props.students.map((student) => {
      return { value: student, label: student };
    });

    const assignmentOptions = this.props.assignments.map((assn) => {
      return { value: assn.id, label: assn.name };
    });

    const selectedAssignment = this.state.selectedAssignment;

    const selectedStudents = this.state.selectedStudents;

    let errorText;
    if (this.state.foundCollision) {
      errorText = (
        <div>
          <div>
            A submission already exists for one of these students. Please delete it before uploading a new submission.
          </div>
          <div className="error-padding" />
          <div className="error-padding" />
        </div>
      );
    }

    const content = (
      <div>
        <div className="error-padding" />
        <Select
          classNamePrefix="select--ManageSections"
          closeMenuOnSelect={true}
          options={assignmentOptions}
          isDisabled={this.props.selectedAssignment}
          onChange={this.changeAssignment}
          placeholder="Select Assignments..."
          value={selectedAssignment ? { value: selectedAssignment.id, label: selectedAssignment.name } : undefined}
          menuPlacement="auto"
        />
        <div className="error-padding" />
        <Select
          classNamePrefix="multiselect--ManageSections"
          closeMenuOnSelect={true}
          isMulti={true}
          isDisabled={this.props.selectedStudents.length > 0}
          options={studentOptions}
          onChange={this.changeStudents}
          placeholder="Select students..."
          value={selectedStudents.map((student) => {
            return { value: student, label: student };
          })}
          menuPlacement="auto"
        />
        <div className="error-padding" />
        {errorText}
        <FileUpload
          id="multiple-file-upload"
          multiple
          secondary
          className=" file-upload__button"
          name="multipart-file-upload"
          ref={this.setFileUpload}
          label="Select files"
          onLoadStart={this.setFile}
          onChange={this.onChangeFiles}
          onLoad={this.handleLoad}
        />

        <div className="error-padding" />
        {uploadedFileCards}

        <div className="error-padding" />
        <div className="error-padding" />

        <div className="dialog--upload-submission__actions">
          <Button raised onClick={this.cancel} primary={false} flat={true} style={{ marginLeft: 'auto' }}>
            Cancel
          </Button>
          <Button
            raised
            onClick={this.upload}
            disabled={disableUpload || this.state.foundCollision}
            primary={true}
            flat={true}
            style={{ marginLeft: '10px' }}
          >
            Upload
          </Button>
        </div>
        <div className="error-padding" />
      </div>
    );
    return content;
  }
}
export default UploadSubmissionDialog;
