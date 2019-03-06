import * as React from 'react';
import { Button, DialogContainer, FileUpload, TextField } from 'react-md';

import UploadedFileCard from './UploadedFileCard';

import { AssignmentType } from '../../../infrastructure/assignment';

import Select from 'react-select';

interface IProps {
  isVisible: boolean;
  onCancel: () => void;
  assignment: AssignmentType;
  students: string[];
  uploadSubmission: any;
}

interface IState {
  selectedStudents: string[];
  file?: any;
  files: any[];
}

class UploadSubmissionDialog extends React.Component<IProps, IState> {
  public fileUpload: any = React.createRef();

  public state: Readonly<IState> = {
    selectedStudents: [],
    file: undefined,
    files: [],
  };
  public onChange = (v: string) => {
    return;
  };

  public changeStudents = (options: any) => {
    const selectedStudents = options.map((option: any) => {
      return option.value;
    });
    this.setState({ selectedStudents });
  };

  public cancel = () => {
    this.props.onCancel();
    this.setState({ files: [], selectedStudents: [] });
  };

  public upload = () => {
    this.props.uploadSubmission(this.props.assignment, this.state.selectedStudents, this.state.files);
    this.props.onCancel();
    this.setState({ files: [], selectedStudents: [] });
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

    const items = this.props.students.map((student) => {
      return { value: student, label: student };
    });

    const uploadedFileCards = this.state.files.map((file) => {
      return <UploadedFileCard key={file.id} file={file} onRemoveClick={this.removeFile} />;
    });

    const disableUpload = !(this.state.selectedStudents.length > 0 && this.state.files.length > 0);

    const content = (
      <div>
        <div className="error-padding" />
        <TextField
          className="dialog--upload-submission__assignment"
          label="Assignment"
          value={this.props.assignment.name}
          onChange={this.onChange}
        />
        <div className="error-padding" />
        <Select
          classNamePrefix="multiselect--ManageSections"
          closeMenuOnSelect={true}
          isMulti={true}
          options={items}
          onChange={this.changeStudents}
          placeholder="Select students..."
          value={this.state.selectedStudents.map((student) => {
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
