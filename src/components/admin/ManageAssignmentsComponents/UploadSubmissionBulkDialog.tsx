import React from 'react';
import { Button, DataTable, DialogContainer, TableBody, TableColumn, TableHeader, TableRow } from 'react-md';

// import StyledDropzone from './StyledDropzone';
import Dropzone from 'react-dropzone';

import { AssignmentType } from '../../../infrastructure/assignment';
import { SubmissionType } from '../../../infrastructure/submission';

const baseStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: undefined,
  alignItems: 'center',
  padding: '20px',
  borderWidth: 2,
  borderRadius: 2,
  borderColor: '#eeeeee',
  borderStyle: 'dashed',
  backgroundColor: '#fafafa',
  color: '#bdbdbd',
  outline: 'none',
  transition: 'border .24s ease-in-out',
};

interface IProps {
  isVisible: boolean;
  onCancel: () => void;
  assignment: AssignmentType;
  submissions: SubmissionType[];
  students: string[];
}

interface IProtoSubmission {
  students: string[];
  files: File[];
}

enum STUDENT_STATUS {
  PENDING,
  MISSING,
  UPLOADED,
}

interface IState {
  /* submissions pending upload */
  protoSubmissions: IProtoSubmission[];

  /* invariant: if studentMap[student] === PENDING, then there exists a submission in protoSubmissions
  such that submission.students contains student */
  studentMap: { [student: string]: STUDENT_STATUS };
}

class UploadSubmissionBulkDialog extends React.Component<IProps, IState> {
  public state: Readonly<IState> = {
    protoSubmissions: [],
    studentMap: {},
  };

  public componentDidMount() {
    // Cache map logging whether student already has a submission uploaded for this assignment
    const { submissions, students } = this.props;
    const newMap = {};

    for (const student of students) {
      newMap[student] = STUDENT_STATUS.MISSING;
    }

    for (const submission of submissions) {
      for (const student of submission.students) {
        newMap[student] = STUDENT_STATUS.UPLOADED;
      }
    }

    this.setState({ studentMap: newMap });
  }

  public cancel = () => {
    this.props.onCancel();
  };

  public upload = () => {
    console.log('uploading submission!');
  };

  public isValidStudent = (student: string, students: string[]) => {
    return students.some((el) => {
      return el === student;
    });
  };

  public onFileDrop = (acceptedFiles: File[]) => {
    // Parse who the files belong to
    // (1) if folder name is an email, see if that email corresponds to student
    //    => if it does, great. Now check if that student already has a submission
    //         => if they do, reject the files
    //         => if they don't, accept the files
    // (2) if that doesn't work, look for a file named partners.txt
    //    => if it exists, parse the contents into student emails and check whether those students are valid
    //        => if they are valid, check to see if a submission exists for any of them
    //              => if yes, reject
    //              => if no, add files to queue
    //   => if the emails aren't valid, reject

    // acceptedFiles.forEach((file) => {
    //   reader.readAsBinaryString(file);
    // });

    // const { studentMap } = this.state;

    // toUpload/1/xxx.java
    // toUpload/2/xxx.java
    // toUpload/james@princeton.edu

    // Process list of upload files to see which have valid student information
    // casting File (el) to any to access path property (not part of Typescript file object)
    const folderMap = { ...this.state.protoSubmissions };
    const students = this.props.students;
    const oldStudentMap = this.state.studentMap;
    const newStudentMap = { ...oldStudentMap };

    // For reading students.txt files
    const studentsReader = new FileReader();
    studentsReader.onabort = () => console.log('file reading was aborted');
    studentsReader.onerror = () => console.log('file reading has failed');
    studentsReader.onload = () => {
      // Do whatever you want with the file contents
      const binaryStr = studentsReader.result;
      console.log(binaryStr);
      return binaryStr;
    };

    acceptedFiles.forEach((el: any) => {
      const path: string = el.path;
      if (path.split('/').length === 4) {
        const folderName = path.split('/')[2];

        // No need to check folders which we've already validated
        if (!(folderName in folderMap)) {
          if (this.isValidStudent(folderName, students)) {
            if (oldStudentMap[folderName] !== STUDENT_STATUS.UPLOADED) {
              // OPTION 1: folder name encodes student, for whom there is no submission
              folderMap[folderName] = {
                files: [],
                students: [folderName],
              };
              newStudentMap[folderName] = STUDENT_STATUS.PENDING;
            }
          } else {
            // OPTION 2: folder contains a students.txt, which validates all files in that folder
            const fileName = path.split('/')[3];
            if (fileName === 'students.txt') {
              // FIXME: Check to see if the contents of students.txt is a valid list of students
              const newStudents = studentsReader.readAsBinaryString(el);
              console.log(newStudents);
            }
          }
        }
      }
    });

    acceptedFiles.forEach((el: any) => {
      const folderName = el.path.split('/')[2];
      if (folderName in folderMap) {
        folderMap[folderName].files.push(el);
      }
    });

    // sort studentList by upload status (uploaded at top, then empty, then students with pre-existing submissions)

    this.setState({
      protoSubmissions: Object.keys(folderMap).map((key) => {
        return folderMap[key];
      }),
      studentMap: newStudentMap,
    });
  };

  public render() {
    if (!this.props.isVisible) {
      return <div />;
    }

    // table of students
    // First column = student email
    // second column = text
    // If student has a submission, gray out row and include text "Submission already uplodated *X*"
    // If student does not have a submission, leave cell blank
    // If user has uploaded files for a specific student, include files in cell

    /* tslint:disable:jsx-no-lambda */
    const content = (
      <div>
        <Dropzone onDrop={this.onFileDrop}>
          {({ getRootProps, getInputProps }) => (
            <section className="container">
              <div style={baseStyle} {...getRootProps({ className: 'dropzone' })}>
                <input {...getInputProps()} />
                <p>Drag 'n' drop some files here, or click to select files</p>
              </div>
            </section>
          )}
        </Dropzone>

        <div className="error-padding" />
        <h2>Students</h2>
        <div>
          <DataTable plain={true}>
            <TableHeader>
              <TableRow>
                <TableColumn key={'student'}>student</TableColumn>
                <TableColumn key={'status'}>status</TableColumn>
              </TableRow>
            </TableHeader>
            <TableBody>
              {this.props.students
                .sort((a, b) => {
                  const studentMap = this.state.studentMap;
                  return studentMap[a] - studentMap[b];
                })
                .map((el) => {
                  let status;
                  switch (this.state.studentMap[el]) {
                    case STUDENT_STATUS.UPLOADED:
                      status = 'Submission already exists';
                      break;
                    case STUDENT_STATUS.PENDING:
                      status = 'pending!';
                      break;
                  }

                  return (
                    <TableRow key={el} className="disabled">
                      <TableColumn>{el}</TableColumn>
                      <TableColumn>{status}</TableColumn>
                    </TableRow>
                  );
                })}
            </TableBody>
          </DataTable>
        </div>

        <div className="dialog--upload-submission__actions">
          <Button raised onClick={this.cancel} primary={false} flat={true} style={{ marginLeft: 'auto' }}>
            Cancel
          </Button>
          <Button raised onClick={this.upload} disabled={false} primary={true} style={{ marginLeft: '10px' }}>
            Upload
          </Button>
        </div>
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
