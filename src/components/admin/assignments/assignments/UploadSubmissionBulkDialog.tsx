/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import React from 'react';

/* ant imports */
import { Button, Collapse, Icon, Modal, Statistic, Steps, Switch, Table, Tooltip, Upload } from 'antd';
const Panel = Collapse.Panel;
const Dragger = Upload.Dragger;
const { Step } = Steps;

/* other library imports */
import ReactMarkdown from 'react-markdown';

import _ from 'lodash';

/* codePost imports */
import { AssignmentType } from '../../../../infrastructure/assignment';
import { Submission, SubmissionType } from '../../../../infrastructure/submission';

/**********************************************************************************************************************/

/************************************************
Notes:

Errors that are silently handled right now:
- A student showing up multiple times

Errors that are not gracefully handled right now:
- Failure reading file

*************************************************/

interface IProps {
  isVisible: boolean;
  onCancel: () => void;
  assignment: AssignmentType;
  submissions: SubmissionType[];
  students: string[];
  uploadSubmission: (assignment: AssignmentType, partners: string[], files: any[]) => Promise<void>;
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
  UPLOADED /* user has uploaded submissions */,
  READING /* reading files from user's file system */,
  UPLOADING /* saving submissions via codePost API */,
  FILE_ERROR /* error reading files, so aborting upload */,
  COMPLETE /* completed upload */,
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

  /* raw file objects (unread) for passing to validation function */
  rawFiles: File[];

  /* overwrite mode toggle */
  overwriteMode: boolean;

  /* files with an invalid path */
  errorPaths: string[];

  /* number of successfully uploaded submissions */
  numUploaded: number;
}

class UploadSubmissionBulkDialog extends React.Component<IProps, IState> {
  public state: Readonly<IState> = {
    protoSubmissions: [],
    studentMap: {},
    fileMap: {},
    status: STATUS.NONE,
    numFiles: 0,
    overwriteMode: false,
    errorPaths: [],
    numUploaded: 0,
    rawFiles: [],
  };

  /***************************************************************************************/
  /* Lifecycle methods
  /***************************************************************************************/

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

  /***************************************************************************************/
  /* Pure functions
  /***************************************************************************************/

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

  public isValidStudent = (student: string, students: string[]) => {
    return students.some((el) => {
      return el === student;
    });
  };

  public cancel = () => {
    this.props.onCancel();
  };

  public onUpload = () => {
    this.setState({ status: STATUS.READING }, () => {
      this.readFiles();
    });
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

  /***************************************************************************************/
  /* Upload business logic
  /***************************************************************************************/

  public readFiles = () => {
    const submissions = this.state.protoSubmissions;
    submissions.forEach((submission) => {
      for (const file of submission.files) {
        const anyFile: any = file;
        const studentsReader = new FileReader();
        studentsReader.onabort = () => console.log('file reading was aborted');
        studentsReader.onerror = () => {
          const errorPaths = this.state.errorPaths;
          const newMessage = `Failed to read file: ${anyFile.path}`;
          this.setState({ errorPaths: [...errorPaths, newMessage], status: STATUS.FILE_ERROR });
        };
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
            submission.students.forEach((student) => {
              studentMap[student] = STUDENT_STATUS.SUCCESS;
            });
            this.setState({ studentMap, numUploaded: this.state.numUploaded + 1 });
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
          status: STATUS.COMPLETE,
        });
      });
    });
  };

  public clearFiles = () => {
    this.setState({
      protoSubmissions: [],
      studentMap: this.buildNewStudentMap(this.props.students, this.props.submissions),
      fileMap: {},
      status: STATUS.NONE,
      numFiles: 0,
      numUploaded: 0,
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

  public allStudentsValid = (candidates: string[], students: string[]) => {
    for (const candidate of candidates) {
      if (!this.isValidStudent(candidate, students)) {
        return false;
      }
    }

    return true;
  };

  public noDuplicates = (candidates: string[]) => {
    const seenCandidates = {};
    for (const candidate of candidates) {
      if (seenCandidates[candidate]) {
        return false;
      } else {
        seenCandidates[candidate] = true;
      }
    }

    return true;
  };

  public onFileDrop = (acceptedFiles: File[]) => {
    // Process list of uploaded files to see which have valid student information
    const folderMap = {};
    const students = this.props.students;
    const oldStudentMap = this.buildNewStudentMap(this.props.students, this.props.submissions);
    const newStudentMap = _.cloneDeep(oldStudentMap);
    const invalidPaths: string[] = [];

    /*************************************************************
    Types of errors to check for:
    - path doesn't follow TLD/<students>/file
    - path contains invalid <students>
    - path contains a student listed in a different folder
    - path contains a student multiple times
    /*************************************************************/

    // casting File (el) to any to access path property (not part of Typescript file object)
    acceptedFiles.forEach((newFile: any) => {
      // Validate file path
      const path: string = newFile.webkitRelativePath;
      if (path.split('/').length !== 3) {
        invalidPaths.push(`Invalid folder structure: ${path}`);
      } else {
        const folderName = path.split('/')[1];
        const emails = folderName.split(',');

        if (!this.allStudentsValid(emails, students)) {
          invalidPaths.push(`Folder refers to invalid student: ${path}`);
        } else if (!this.noDuplicates(emails)) {
          invalidPaths.push(`Folder contains duplicate students: ${path}`);
        } else {
          // No need to check folders which we've already validated
          if (!(folderName in folderMap)) {
            // Only use valid emails
            const validEmails = emails.filter((el) => {
              // Email must be valid and so far unsued
              return newStudentMap[el] !== STUDENT_STATUS.PENDING;
            });

            if (validEmails.length !== emails.length) {
              // Some email in the folder name was invalid
              invalidPaths.push(`Contains a duplicate student: ${path}`);
            } else {
              if (this.state.overwriteMode) {
                folderMap[folderName] = {
                  files: [],
                  students: validEmails,
                };
                validEmails.forEach((el) => {
                  newStudentMap[el] = STUDENT_STATUS.PENDING;
                });
              } else {
                let noCollisions = true;
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
        }
      }
    });

    // Sort files into appropriate protoSubmissions
    let numFiles = 0;
    acceptedFiles.forEach((el: any) => {
      const folderName = el.webkitRelativePath.split('/')[1];
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
      fileMap: {},
      numFiles,
      errorPaths: invalidPaths,
    });
  };

  public toggleOverwriteMode = () => {
    this.setState({ overwriteMode: !this.state.overwriteMode }, () => {
      this.onFileDrop(this.state.rawFiles);
    });
  };

  public onChange = (arg: any) => {
    console.log(arg);
  };

  public changeStatus = (newStatus: STATUS) => {
    if (newStatus === STATUS.NONE) {
      this.setState({ status: newStatus, rawFiles: [] });
    } else if (newStatus === STATUS.UPLOADED) {
      this.onFileDrop(this.state.rawFiles);
      this.setState({ status: newStatus });
    }
  };

  /***************************************************************************************/
  /* Render
  /***************************************************************************************/

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

    let errors;
    if (this.state.errorPaths.length > 0) {
      let fileError;
      if (this.state.status === STATUS.FILE_ERROR) {
        fileError = <p> An error occurred while reading file from your computer. Please cancel and try again</p>;
      }

      errors = (
        <div className="error">
          <h3> Errors </h3>
          {fileError}
          <ul>
            {this.state.errorPaths.map((el, i) => {
              return <li key={i}>{el}</li>;
            })}
          </ul>
          <br />
          <br />
        </div>
      );
    }

    /* tslint:disable */
    const columns = [
      {
        title: 'Student',
        dataIndex: 'student',
        key: 'student',
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
      },
    ];

    const dataSource = this.props.students
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
            const areWeWorking = this.state.status === STATUS.UPLOADING || this.state.status === STATUS.READING;
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
        return {
          key: el,
          student: el,
          status,
        };
      });

    const beforeUpload = (file: any, fileList: any) => {
      const newList = [...this.state.rawFiles, file];
      this.setState({ rawFiles: newList });

      // prevent upload
      return false;
    };

    const steps = [
      {
        title: 'Upload',
      },
      {
        title: 'Review',
      },
      {
        title: 'Save',
      },
    ];

    let content;
    switch (this.state.status) {
      case STATUS.NONE:
        content = (
          <div>
            <Collapse>
              <Panel header="Instructions" key="1">
                Upload a folder with the following file structure.
                <br />
                <ReactMarkdown source={exampleText} />
              </Panel>
            </Collapse>
            <br />
            <br />
            <Dragger
              showUploadList={false}
              directory={true}
              multiple={true}
              beforeUpload={beforeUpload}
              onChange={this.onChange}
            >
              <p className="ant-upload-drag-icon">
                <Icon type="inbox" />
              </p>
              <p className="ant-upload-text">Click or drag a folder to upload</p>
              <p className="ant-upload-hint">Make sure you use the format specified in the Instructions above.</p>
            </Dragger>
            <br />
            <Statistic title="Uploaded files" value={this.state.rawFiles.length} />
          </div>
        );
        break;
      case STATUS.UPLOADED:
        content = (
          <div>
            {errors}
            Overwrite mode: &nbsp;{' '}
            <Switch onChange={this.toggleOverwriteMode} defaultChecked={this.state.overwriteMode} />{' '}
            <Tooltip title={`If selected, existing submissions will be overwritten.`}>
              <Icon type="question-circle" />
            </Tooltip>
            <br />
            <br />
            <Table pagination={{ pageSize: 5 }} dataSource={dataSource} columns={columns} />
          </div>
        );
        break;
      case STATUS.READING:
        content = <div>Reading files...</div>;
        break;
      case STATUS.UPLOADING:
        content = <div>Uploading files...</div>;
        break;
      case STATUS.COMPLETE:
        content = <div>Success!</div>;
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
      case STATUS.UPLOADED:
        goBackButton = (
          <Button key="back" onClick={this.changeStatus.bind(this, STATUS.NONE)}>
            Start over
          </Button>
        );
        break;
    }

    // modal's forward button
    let goForwardButton = null;
    switch (this.state.status) {
      case STATUS.NONE:
        goForwardButton = (
          <Button
            key="forward"
            type="primary"
            disabled={this.state.rawFiles.length === 0}
            onClick={this.changeStatus.bind(this, STATUS.UPLOADED)}
          >
            Continue
          </Button>
        );
        break;
      case STATUS.UPLOADED:
        goForwardButton = (
          <Button key="forward" type="primary" onClick={this.onUpload}>
            Upload
          </Button>
        );
        break;
      case STATUS.READING:
      case STATUS.UPLOADING:
      case STATUS.COMPLETE:
        goForwardButton = (
          <Button key="forward" type="primary" disabled={this.state.status !== STATUS.COMPLETE}>
            Close
          </Button>
        );
        break;
    }

    return (
      <Modal
        visible={true}
        title="Upload Submissions"
        width={700}
        onCancel={this.props.onCancel}
        footer={[goBackButton, goForwardButton]}
      >
        <Steps size="small" current={this.state.status}>
          {steps.map((item) => {
            return <Step key={item.title} title={item.title} />;
          })}
        </Steps>
        <br />
        <br />
        {content}
      </Modal>
    );
    /* tslint:enable:jsx-no-lambda */
  }
}
export default UploadSubmissionBulkDialog;
