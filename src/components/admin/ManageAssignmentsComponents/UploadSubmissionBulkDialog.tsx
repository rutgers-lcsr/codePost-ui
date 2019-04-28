/****************************************************************************************************/

/* react imports */
import React from 'react';

/* react-md imports */
import { Button, DataTable, SelectionControl, TableBody, TableColumn, TableHeader, TableRow } from 'react-md';

/* other library imports */
import Dropzone from 'react-dropzone';
import ReactMarkdown from 'react-markdown';

/* codePost imports */
import { AssignmentType } from '../../../infrastructure/assignment';
import { Submission, SubmissionType } from '../../../infrastructure/submission';

/****************************************************************************************************/

/************************************************
Notes:

Errors that are silently handled right now:
- A student showing up multiple times

Errors that are not gracefully handled right now:
- Failure reading file

*************************************************/

/* inline styling for dropzone */
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
  uploadSubmission: (assignment: AssignmentType, partners: string[], files: any[]) => Promise<SubmissionType>;
}

interface IProtoSubmission {
  students: string[];
  files: File[];
}

/* note that the order here defines the order in which students are rendered  (ERROR first, UPLOADED last) */
enum STUDENT_STATUS {
  ERROR /* something went wrong with submission upload */,
  SUCCESS /* submission upload succeeded */,
  PENDING /* new submission dragged in, but not yet saved */,
  COLLISION /* not in overwrite mode, user tried to upload a submission for this student, submission already exists */,
  MISSING /* no submission for this student, saved or unsaved */,
  UPLOADED /* existing submission exists for this student */,
}

enum STATUS {
  NONE,
  READING /* reading files from user's file system */,
  UPLOADING /* saving submissions via codePost API */,
}

interface IState {
  /* submissions pending upload */
  protoSubmissions: IProtoSubmission[];

  /* invariant: if studentMap[student] === PENDING, then there exists a submission in protoSubmissions
  such that submission.students contains student */
  studentMap: { [student: string]: STUDENT_STATUS };

  /* Used to store the contents of files */
  fileMap: { [fileName: string]: string };

  /* stores progress */
  status: STATUS;

  /* cache for figuring out whether all files have been read */
  numFiles: number;

  /* overwrite mode toggle */
  overwriteMode: boolean;
}

class UploadSubmissionBulkDialog extends React.Component<IProps, IState> {
  public state: Readonly<IState> = {
    protoSubmissions: [],
    studentMap: {},
    fileMap: {},
    status: STATUS.NONE,
    numFiles: 0,
    overwriteMode: false,
  };

  public componentDidMount() {
    // Cache map logging whether student already has a submission uploaded for this assignment
    const { submissions, students } = this.props;
    this.setState({ studentMap: this.buildNewStudentMap(students, submissions) });
  }

  public componentDidUpdate(prevProps: IProps, prevState: IState) {
    const { status } = this.state;

    if (status === STATUS.READING) {
      this.tryToUpload();
    }
  }

  public buildNewStudentMap = (students: string[], submissions: SubmissionType[]) => {
    const newMap = {};

    for (const student of students) {
      newMap[student] = STUDENT_STATUS.MISSING;
    }

    for (const submission of submissions) {
      for (const student of submission.students) {
        newMap[student] = STUDENT_STATUS.UPLOADED;
      }
    }

    return newMap;
  };

  public cancel = () => {
    this.props.onCancel();
  };

  public onUpload = () => {
    this.setState({ status: STATUS.READING }, () => {
      this.readFiles();
    });
  };

  public readFiles = () => {
    const submissions = this.state.protoSubmissions;
    submissions.forEach((submission) => {
      for (const file of submission.files) {
        const anyFile: any = file;
        const studentsReader = new FileReader();
        studentsReader.onabort = () => console.log('file reading was aborted');
        studentsReader.onerror = () => console.log('file reading has failed');
        studentsReader.onload = () => {
          const result = studentsReader.result;
          const fileMap = this.state.fileMap;
          if (typeof result === 'string') {
            fileMap[anyFile.path] = result;
            this.setState({ fileMap });
          }
        };
        studentsReader.readAsBinaryString(file);
      }
    });
  };

  public tryToUpload = () => {
    const { fileMap, numFiles, overwriteMode } = this.state;
    const readFiles = Object.keys(fileMap).reduce((acc, el) => {
      const toAdd = typeof fileMap[el] === 'undefined' ? 0 : 1;
      return acc + toAdd;
    }, 0);

    if (readFiles === numFiles) {
      if (overwriteMode) {
        this.handleOverwrite().then(() => {
          this.upload();
        });
      } else {
        this.upload();
      }
    }
  };

  public upload = () => {
    const { protoSubmissions, fileMap } = this.state;
    this.setState({ status: STATUS.UPLOADING }, () => {
      const promises = protoSubmissions.map((submission) => {
        const files: any[] = [];
        submission.files.forEach((file: any) => {
          const payload = {
            name: file.name,
            data: fileMap[file.path],
          };
          files.push(payload);
        });
        return this.props
          .uploadSubmission(this.props.assignment, submission.students, files)
          .then((newSub) => {
            const studentMap = this.state.studentMap;
            newSub.students.forEach((student) => {
              studentMap[student] = STUDENT_STATUS.SUCCESS;
            });
            this.setState({ studentMap });
          })
          .catch((errors) => {
            const studentMap = this.state.studentMap;
            submission.students.forEach((student) => {
              studentMap[student] = STUDENT_STATUS.ERROR;
            });
            this.setState({ studentMap });
          });
      });

      Promise.all(promises).then(() => {
        this.setState({
          status: STATUS.NONE,
        });
      });
    });
  };

  public isValidStudent = (student: string, students: string[]) => {
    return students.some((el) => {
      return el === student;
    });
  };

  public clearFiles = () => {
    this.setState({
      protoSubmissions: [],
      studentMap: this.buildNewStudentMap(this.props.students, this.props.submissions),
      fileMap: {},
      status: STATUS.NONE,
      numFiles: 0,
    });
  };

  public handleOverwrite = () => {
    const { submissions, students } = this.props;
    const { studentMap } = this.state;

    // loop through students for which we have an upload
    // find their submission in submission list
    // add this submission to a changed list (if it isn't there already)
    // remove the student from submission.students
    const toChange: SubmissionType[] = [];
    students.forEach((student) => {
      if (studentMap[student] === STUDENT_STATUS.PENDING) {
        const match = submissions.find((submission) => {
          return submission.students.some((el) => {
            return el === student;
          });
        });

        if (match) {
          const reMatch = toChange.find((el) => {
            return el.id === match.id;
          });
          if (reMatch) {
            reMatch.students.filter((el) => {
              return el !== student;
            });
          } else {
            const newSub = { ...match };
            newSub.students = newSub.students.filter((el) => {
              return el !== student;
            });
            toChange.push(newSub);
          }
        }
      }
    });

    // loop through changed submissions
    const promises: Array<Promise<any>> = toChange.map((submission) => {
      if (submission.students.length === 0) {
        // if submission.students.length = 0, delete submission
        return Submission.delete(submission.id);
      } else {
        // if submission.students.length > 0, patch students field
        return Submission.update(submission);
      }
    });

    // trigger upload
    return Promise.all(promises);
  };

  public onFileDrop = (acceptedFiles: File[]) => {
    // Process list of uploaded files to see which have valid student information
    this.setState(
      {
        protoSubmissions: [],
        studentMap: this.buildNewStudentMap(this.props.students, this.props.submissions),
        fileMap: {},
        status: STATUS.NONE,
        numFiles: 0,
      },
      () => {
        const folderMap = { ...this.state.protoSubmissions };
        const students = this.props.students;
        const oldStudentMap = this.state.studentMap;
        const newStudentMap = { ...oldStudentMap };

        // casting File (el) to any to access path property (not part of Typescript file object)
        acceptedFiles.forEach((newFile: any) => {
          const path: string = newFile.path;
          if (path.split('/').length === 4) {
            const folderName = path.split('/')[2];
            const emails = folderName.split(',');

            // No need to check folders which we've already validated
            if (!(folderName in folderMap)) {
              // Only use valid emails
              const validEmails = emails.filter((el) => {
                // Email must be valid and so far unsued
                return this.isValidStudent(el, students) && oldStudentMap[el] !== STUDENT_STATUS.PENDING;
              });

              if (this.state.overwriteMode && validEmails.length > 0) {
                folderMap[folderName] = {
                  files: [],
                  students: validEmails,
                };
                validEmails.forEach((el) => {
                  newStudentMap[el] = STUDENT_STATUS.PENDING;
                });
              } else {
                let noCollisions = validEmails.length > 0; // don't proceed if no valid emails to work with
                for (const email of emails) {
                  if (
                    oldStudentMap[email] === STUDENT_STATUS.UPLOADED ||
                    oldStudentMap[email] === STUDENT_STATUS.COLLISION
                  ) {
                    noCollisions = false;
                    newStudentMap[email] = STUDENT_STATUS.COLLISION;
                  }
                }

                if (noCollisions) {
                  folderMap[folderName] = {
                    files: [],
                    students: validEmails,
                  };

                  // cache status so we don't have to search through submission list to figure it out
                  validEmails.forEach((el) => {
                    newStudentMap[el] = STUDENT_STATUS.PENDING;
                  });
                }
              }
            }
          }
        });

        // Sort files into appropriate protoSubmissions
        let numFiles = 0;
        acceptedFiles.forEach((el: any) => {
          const folderName = el.path.split('/')[2];
          if (folderName in folderMap) {
            folderMap[folderName].files.push(el);
            numFiles = numFiles + 1;
          }
        });

        this.setState({
          protoSubmissions: Object.keys(folderMap).map((key) => {
            return folderMap[key];
          }),
          studentMap: newStudentMap,
          numFiles,
        });
      },
    );
  };

  public toggleOverwriteMode = () => {
    this.setState({ overwriteMode: !this.state.overwriteMode });
  };

  public getFilesForStudent = (student: string, protoSubmissions: IProtoSubmission[]) => {
    for (const sub of protoSubmissions) {
      if (
        sub.students.some((el) => {
          return el === student;
        })
      ) {
        return sub.files;
      }
    }

    return [];
  };

  public render() {
    if (!this.props.isVisible) {
      return <div />;
    }

    const exampleText =
      '    folder/\n\
        student1@university.edu/\n\
          file1.java\n\
          file2.txt\n\
        student2@university.edu,student3@university.edu/\n\
          file1.java\n\
          file2.txt\n ';

    /* tslint:disable:jsx-no-lambda */
    return (
      <div>
        <Dropzone onDrop={this.onFileDrop}>
          {({ getRootProps, getInputProps }) => (
            <section className="container">
              <div style={baseStyle} {...getRootProps({ className: 'dropzone' })}>
                <input {...getInputProps()} />
                <p>Drag your submissions folder here. Make sure to follow the format below</p>
              </div>
            </section>
          )}
        </Dropzone>
        <div className="error-padding" />
        <div className="error-padding" />
        <ReactMarkdown source={exampleText} />
        <div className="dialog--upload-submission__actions">
          <div style={{ display: 'inline-block', padding: '0px 20px' }}>
            Overwrite mode:
            <SelectionControl
              id="toggleShowStudents"
              name="toggleShowStudents"
              type="switch"
              className="toggleShowStudents"
              defaultChecked={this.state.overwriteMode}
              onChange={this.toggleOverwriteMode}
              aria-label={'Overwrite mode'}
              style={{ display: 'inline-block' }}
            />
          </div>
          <Button raised onClick={this.cancel} primary={false} flat={true} style={{ marginLeft: 'auto' }}>
            Cancel
          </Button>
          <Button
            raised
            onClick={this.clearFiles}
            disabled={this.state.numFiles === 0}
            primary={false}
            style={{ marginLeft: '10px' }}
          >
            Clear Uploads
          </Button>
          <Button
            raised
            onClick={this.onUpload}
            disabled={this.state.numFiles === 0}
            primary={true}
            style={{ marginLeft: '10px' }}
          >
            Upload
          </Button>
        </div>
        <div className="error-padding" />
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
                    case STUDENT_STATUS.ERROR:
                      status = 'Something went wrong...please try again';
                      break;
                    case STUDENT_STATUS.SUCCESS:
                      status = 'Successfully uploaded';
                      break;
                    case STUDENT_STATUS.UPLOADED:
                      status = 'Submission already exists';
                      break;
                    case STUDENT_STATUS.COLLISION:
                      status = 'Upload ignored due to existing submission';
                      break;
                    case STUDENT_STATUS.PENDING:
                      const areWeWorking =
                        this.state.status === STATUS.UPLOADING || this.state.status === STATUS.READING;
                      if (areWeWorking) {
                        status = 'Uploading...';
                      } else {
                        const files = this.getFilesForStudent(el, this.state.protoSubmissions);
                        status = `Ready to upload: ${files
                          .map((file) => {
                            return file.name;
                          })
                          .join(', ')}`;
                      }

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
      </div>
    );
    /* tslint:enable:jsx-no-lambda */
  }
}
export default UploadSubmissionBulkDialog;
