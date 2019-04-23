import * as React from 'react';
import { Button, DialogContainer } from 'react-md';

import Dropzone from 'react-dropzone';

import { AssignmentType } from '../../../infrastructure/assignment';

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

class UploadSubmissionBulkDialog extends React.Component<IProps, IState> {
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

    /* tslint:disable:jsx-no-lambda */
    const content = (
      <div>
        <Dropzone
          onDrop={(acceptedFiles) => {
            console.log(acceptedFiles);
          }}
        >
          {({ getRootProps, getInputProps }) => (
            <section className="container">
              <div {...getRootProps({ className: 'dropzone' })}>
                <input {...getInputProps()} />
                <p>Drag 'n' drop some files here, or click to select files</p>
              </div>
            </section>
          )}
        </Dropzone>

        <div className="dialog--upload-submission__actions">
          <Button raised onClick={this.cancel} primary={false} flat={true} style={{ marginLeft: 'auto' }}>
            Cancel
          </Button>
          <Button raised onClick={this.upload} disabled={false} primary={true} style={{ marginLeft: '10px' }}>
            Upload
          </Button>
        </div>
        <div className="error-padding" />
      </div>
    );
    /* tslint:enable:jsx-no-lambda */

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
export default UploadSubmissionBulkDialog;
