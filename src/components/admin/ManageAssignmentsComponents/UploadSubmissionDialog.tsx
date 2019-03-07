import * as React from 'react';
import { Button, DialogContainer, FileUpload } from 'react-md';

import UploadedFileCard from './UploadedFileCard';

import { AssignmentType } from '../../../infrastructure/assignment';

import Select from 'react-select';

interface IProps {
  isVisible: boolean;
  onCancel: () => void;
  assignments: AssignmentType[];
  selectedAssignment: AssignmentType | null;
  students: string[];
  selectedStudents: string[] | null;
  uploadSubmission: any;
}

interface IState {
  selectedStudents: string[];
  selectedAssignment: AssignmentType | null;
  file?: any;
  files: any[];
}

class UploadSubmissionDialog extends React.Component<IProps, IState> {
  public fileUpload: any = React.createRef();

  public state: Readonly<IState> = {
    selectedStudents: this.props.selectedStudents ? this.props.selectedStudents : [],
    selectedAssignment: this.props.selectedAssignment,
    file: undefined,
    files: [],
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
    const selectedStudents = options.map((option: any) => {
      return option.value;
    });
    this.setState({ selectedStudents });
  };

  public changeAssignment = (option: any) => {
    const selectedAssignment = this.props.assignments.find((assn) => {
      return assn.id === option.value;
    });
    if (selectedAssignment) {
      this.setState({ selectedAssignment });
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
          isDisabled={this.props.selectedStudents}
          options={studentOptions}
          onChange={this.changeStudents}
          placeholder="Select students..."
          value={selectedStudents.map((student) => {
            return { value: student, label: student };
          })}
          menuPlacement="auto"
        />
        <div className="error-padding" />
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
            disabled={disableUpload}
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
    return (
      <DialogContainer
        id="rubricFile-dialog"
        className="dialog--upload-submission"
        visible={true}
        title="Upload Submission"
        onHide={this.cancel}
      >
        {content}
      </DialogContainer>
    );
  }
}
export default UploadSubmissionDialog;
