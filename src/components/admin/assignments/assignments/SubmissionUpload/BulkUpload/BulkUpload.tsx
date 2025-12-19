/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import React from 'react';

/* ant imports */
import { Divider, Modal, Progress, Steps } from 'antd';

/* codePost imports */
import {
  getSubforStudent,
  isEqual,
  processSubmissionsFromFiles,
  STUDENT_STATUS,
  UPLOAD_STATUS,
} from './BulkUploadHelpers';

/* codePost imports */
import { colors } from '../../../../../../theme/colors';
import { AssignmentType, CourseType, FileType, SubmissionInfoType } from '../../../../../../infrastructure/types';

import { BulkUploadComplete, BulkUploadFooter, BulkUploadHeader, BulkUploadNoStudents } from './BulkUploadComponents';
import BulkUploadConfirm from './BulkUploadConfirm';
import UploadForm from './UploadForm';

import { INTEGRATIONS } from '../../../../../landing/Integrations';

import { codePostFile, IProtoFileUpload, IProtoSubmission, readUploadedFile } from './../FileReader';

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
  submissions: SubmissionInfoType[];
  students: string[];
  uploadSubmission: (assignment: AssignmentType, partners: string[], files: FileType[]) => Promise<void>;
  updateSubmission: (submission: SubmissionInfoType) => Promise<void>;
  deleteSubmission: (submission: SubmissionInfoType) => Promise<void>;
  showImportOptions?: boolean;
  course: CourseType;
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
  /* cached computation: does props.submission contain a submission for the key? */
  studentMap: { [student: string]: STUDENT_STATUS };
  /* cached computation: does props.submission contain a submission for the key? */
  uploadMap: { [student: string]: UPLOAD_STATUS };
  /* Used to store the contents of files */
  fileMap: { [submitters: string]: { [fileName: string]: string | ArrayBuffer | null } };
  /* stores progress */
  status: STATUS;
  /* number of successfully uploaded submissions */
  numUploaded: number;
  /* cache for figuring out whether all files have been read */
  numFiles: number;
  /* overwrite mode toggle */
  overwriteMode: boolean;
  /* files with an invalid path */
  errorPaths: string[];
  /* track current upload mode (normal or with integration) */
  mode?: string;
  /* show import options */
  showImportOptions: boolean;
}

class BulkUpload extends React.Component<IProps, IState> {
  public constructor(props: IProps) {
    super(props);
    this.state = {
      protoSubmissions: [],
      studentMap: this.buildNewStudentMap(this.props.students, this.props.submissions),
      fileMap: {},
      status: STATUS.NONE,
      numFiles: 0,
      overwriteMode: false,
      errorPaths: [],
      numUploaded: 0,
      uploadMap: {},
      mode: undefined,
      showImportOptions: props.showImportOptions === undefined ? false : props.showImportOptions,
    };
  }

  /***************************************************************************************/
  /* Lifecycle methods
  /***************************************************************************************/

  public componentDidMount() {
    // Cache map logging whether student already has a submission uploaded for this assignment
    const { submissions, students } = this.props;
    this.setState({
      studentMap: this.buildNewStudentMap(students, submissions),
    });
  }

  /***************************************************************************************/
  /* Pure functions
  /***************************************************************************************/

  public buildNewStudentMap = (students: string[], submissions: SubmissionInfoType[]) => {
    const newMap: any = {};

    for (const student of students) {
      newMap[student.toLowerCase()] = STUDENT_STATUS.MISSING;
    }

    if (submissions) {
      for (const submission of submissions) {
        for (const student of submission.students) {
          newMap[student.toLowerCase()] = STUDENT_STATUS.EXISTING;
        }
      }
    }

    return newMap;
  };

  public onCancel = () => {
    this.props.onCancel();
  };

  /***************************************************************************************/
  /* Set state
  /***************************************************************************************/
  public onStepToReading = () => {
    this.setState({ status: STATUS.READING }, () => {
      this.readFiles().then(() => {
        this.tryToUpload();
      });
    });
  };

  public setProtoSubmissions = (protoSubmissions: IProtoSubmission[], numFiles: number, errors: string[]) => {
    this.setState({
      protoSubmissions,
      fileMap: {},
      numFiles,
      errorPaths: errors,
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

  public setImportOptions = (showOptions: boolean) => {
    if (!showOptions) {
      // If we're turning off import options, reset the mode
      this.setState({ showImportOptions: false, mode: undefined });
    } else {
      this.setState({ showImportOptions: showOptions });
    }
  };

  public onIntegrationClick = (mode?: string) => {
    this.setState({ mode: mode, showImportOptions: false });
  };

  public toggleOverwriteMode = () => {
    // this.setState({ overwriteMode: !this.state.overwriteMode }, () => {
    //   this.processSubmissionsFromFiles(this.state.rawFiles, this.getStudentsFromFile);
    // });
    // CHECK FOR REVIEWER: Why do we need to call process Submissions from files again after overwrite mode is toggled?
    // Old Code:
    // this.setState({ overwriteMode: !this.state.overwriteMode }, () => {
    //   this.processSubmissionsFromFiles(this.state.rawFiles, this.getStudentsFromFile);
    // });
    this.setState({ overwriteMode: !this.state.overwriteMode });
  };
  /***************************************************************************************/
  /* Upload business logic
  /***************************************************************************************/

  public readFiles = async () => {
    const submissions = this.state.protoSubmissions;

    await Promise.all(
      submissions.map(async (submission) => {
        const submitters = submission.students.join(',');
        for (const file of submission.files) {
          try {
            let outputFiles;
            if ('file' in file && file.file) {
              const f = file.file;
              outputFiles = await readUploadedFile(f as File | Blob);
            } else {
              outputFiles = await readUploadedFile(file);
            }
            if (file.type === 'application/zip' || ['.zip'].includes(file.name)) {
              outputFiles.map((outputFile: IProtoFileUpload) => {
                const fullName = `anydirname/${submission.students.join(',')}/${outputFile.longname}`;
                const subfiles = { ...this.state.fileMap[submitters], [fullName]: outputFile.data };
                this.setState((oldState) => {
                  return { fileMap: { ...oldState.fileMap, [submitters]: subfiles } };
                });
              });
            } else {
              outputFiles.map((outputFile: IProtoFileUpload) => {
                const subfiles = { ...this.state.fileMap[submitters], [outputFile.longname]: outputFile.data };
                this.setState((oldState) => {
                  return { fileMap: { ...oldState.fileMap, [submitters]: subfiles } };
                });
              });
            }
          } catch (e) {
            this.setState({ errorPaths: [...this.state.errorPaths, String(e)], status: STATUS.FILE_ERROR });
          }
        }
      }),
    );
  };

  // Make sure all the files are read, and if so, upload them
  public tryToUpload = () => {
    const { fileMap, numFiles, overwriteMode } = this.state;

    const readFiles = Object.keys(fileMap).reduce((acc, el) => {
      const subTotal = Object.keys(fileMap[el]).reduce((acc2: any, el2: any) => {
        const toAdd = typeof fileMap[el][el2] === 'undefined' ? 0 : 1;
        return acc2 + toAdd;
      }, 0);

      return acc + subTotal;
    }, 0);

    // FIXME: we need to account for unzipped archives that contain more than one file
    // in state.numFiles
    if (readFiles >= numFiles) {
      this.setState({ status: STATUS.UPLOADING }, () => {
        if (overwriteMode) {
          this.handleOverwrite().then(() => {
            this.upload();
          });
        } else {
          this.upload();
        }
      });
    }
  };

  public uploadSubmission = (submission: IProtoSubmission) => {
    const { fileMap } = this.state;

    const files: any[] = [];
    const submitter = submission.students.join(',');

    if (Object.prototype.hasOwnProperty.call(fileMap, submitter)) {
      Object.keys(fileMap[submitter]).forEach((fullname: string) => {
        const path = fullname;
        const fileName = fullname.split('/').slice(-1)[0];
        const pathDirs = path.split('/');
        // Want to ignore first (root dir, student email) two and last element (file name) of split
        const filePath = pathDirs.length > 3 ? pathDirs.slice(2, pathDirs.length - 1).join('/') : null;
        const payload = {
          name: fileName,
          data: fileMap[submitter][path],
          path: filePath,
        };
        files.push(payload);
      });
    }
    return this.props
      .uploadSubmission(this.props.assignment, submission.students, files)
      .then(() => {
        const uploadMap = this.state.uploadMap;
        submission.students.forEach((student) => {
          uploadMap[student] = UPLOAD_STATUS.SUCCESS;
        });
        this.setState({ uploadMap, numUploaded: this.state.numUploaded + 1 });
      })
      .catch(() => {
        const uploadMap = this.state.uploadMap;
        submission.students.forEach((student) => {
          uploadMap[student] = UPLOAD_STATUS.SUCCESS;
        });
        this.setState({ uploadMap });
      });
  };

  // Make sure all the files are read, and if so, upload them
  public upload = () => {
    const { protoSubmissions } = this.state;

    // tslint:disable
    const toUpload = this.state.overwriteMode
      ? protoSubmissions
      : protoSubmissions.filter((el) => {
          return !el.isCollision;
        });
    // tslint:enable

    const promises: Promise<void>[] = [];

    // Recursive function to upload, and then upload the next submission in the queue
    // Returns a promise that only finishes when all of it's recursive children finish
    const uploadAndPop = (submission: IProtoSubmission): Promise<void> => {
      return this.uploadSubmission(submission).then(() => {
        if (toUpload.length) {
          const newSub = toUpload.pop();
          if (newSub) {
            return uploadAndPop(newSub);
          }
          return Promise.resolve();
        }
      });
    };

    // The number of concurrent submissions that can be uploaded at once.
    // The number of network requests = this number * number of files
    const MAX_NUM_CONNECTIONS = 5;
    const connectionsLimit = Math.min(toUpload.length, MAX_NUM_CONNECTIONS);
    for (let i = 0; i < connectionsLimit; i++) {
      const parentNode = toUpload.pop();
      if (parentNode) {
        promises.push(uploadAndPop(parentNode));
      }
    }

    Promise.all(promises).then(() => {
      this.setState({
        status: STATUS.COMPLETE,
      });
    });
  };

  public handleOverwrite = () => {
    const { submissions, students } = this.props;

    // loop through students for which we have an upload
    // find their submission in submission list
    // add this submission to a changed list (if it isn't there already)
    // remove the student from submission.students
    const toChange: SubmissionInfoType[] = [];
    students.forEach((student) => {
      const newSubmission = getSubforStudent(student, this.state.protoSubmissions);

      if (newSubmission !== undefined && newSubmission.isCollision) {
        const match = submissions.find((submission) => {
          return submission.students.some((el) => {
            return isEqual(el, student);
          });
        });

        if (match) {
          const reMatch = toChange.find((el) => {
            return el.id === match.id;
          });

          if (reMatch) {
            reMatch.students = reMatch.students.filter((el) => {
              return !isEqual(el, student);
            });
          } else {
            const newSub = { ...match };
            newSub.students = newSub.students.filter((el) => {
              return !isEqual(el, student);
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
        return this.props.deleteSubmission(submission);
      } else {
        // if submission.students.length > 0, patch students field
        return this.props.updateSubmission(submission);
      }
    });

    // trigger upload
    return Promise.all(promises);
  };

  /***************************************************************************************/
  /* Child functions to change state
  /***************************************************************************************/
  public processSubmissions = async (
    acceptedFiles: codePostFile[],
    getStudentsFromFile: (file: IProtoFileUpload) => string[],
  ) => {
    await processSubmissionsFromFiles(
      acceptedFiles,
      this.props.students,
      this.state.studentMap,
      getStudentsFromFile,
      this.setProtoSubmissions,
    );
    this.setState({ status: STATUS.UPLOADED });
  };

  /***************************************************************************************/
  /* Render
  /***************************************************************************************/

  public render() {
    if (!this.props.isVisible) {
      return <div />;
    }

    /*************************** 1. Determine header content (title + step #)******************************/
    const title =
      this.state.mode && this.state.mode !== 'more' ? (
        <span>
          <img
            src={INTEGRATIONS[this.state.mode].logo}
            style={{ width: '25px', marginRight: 5, marginBottom: 3 }}
            alt=""
          />
          <span style={{ color: colors.brandPrimary }}>
            {this.state.mode.charAt(0).toUpperCase() + this.state.mode.slice(1)} import:
          </span>{' '}
          {this.props.assignment.name}
        </span>
      ) : (
        <span>Upload Submissions: {this.props.assignment.name}</span>
      );

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

    let stepNumber;
    switch (this.state.status) {
      case STATUS.NONE:
        stepNumber = 0;
        break;
      case STATUS.COMPLETE:
        stepNumber = 2;
        break;
      default:
        stepNumber = 1;
        break;
    }

    /*************************** 2. Determine content based on status ******************************/
    let content;
    let numToUpload = 0;
    switch (this.state.status) {
      case STATUS.NONE:
        if (this.props.students.length === 0) {
          content = this.props.course && <BulkUploadNoStudents course={this.props.course} />;
        } else {
          content = (
            <div>
              {/*Only show the header if a mode hasn't been chosen */}
              {!this.state.mode && (
                <div>
                  <BulkUploadHeader
                    showImportOptions={this.state.showImportOptions}
                    toggleImportOptions={this.setImportOptions.bind(this, true)}
                  />
                  <Divider />
                </div>
              )}
              <UploadForm
                processSubmissionsFromFiles={this.processSubmissions}
                mode={this.state.mode}
                showImportOptions={this.state.showImportOptions}
                students={this.props.students}
                course={this.props.course}
                setIntegration={this.onIntegrationClick}
                onCancel={this.onCancel}
                setImportOptions={this.setImportOptions}
              />
            </div>
          );
        }

        break;
      case STATUS.FILE_ERROR:
      case STATUS.UPLOADED:
        // separate students into lists for presentation
        numToUpload = this.state.protoSubmissions.reduce((acc, sub) => {
          // Upload if submission has no collisions or has collision and overwrite mode is on
          if (!sub.isCollision || (sub.isCollision && this.state.overwriteMode)) {
            return acc + 1;
          }
          return acc;
        }, 0);
        content = (
          <BulkUploadConfirm
            students={this.props.students}
            protoSubmissions={this.state.protoSubmissions}
            studentMap={this.state.studentMap}
            overwriteMode={this.state.overwriteMode}
            toggleOverwriteMode={this.toggleOverwriteMode}
            errorPaths={this.state.errorPaths}
          />
        );

        break;
      case STATUS.READING: {
        const readFiles = Object.keys(this.state.fileMap).reduce((acc, el) => {
          const subTotal = Object.keys(this.state.fileMap[el]).reduce((acc2: any, el2: any) => {
            const toAdd = typeof this.state.fileMap[el][el2] === 'undefined' ? 0 : 1;
            return acc2 + toAdd;
          }, 0);

          return acc + subTotal;
        }, 0);
        content = (
          <div>
            Reading files: &nbsp;{' '}
            <Progress percent={parseFloat(((readFiles / this.state.numFiles) * 100).toFixed(0))} size="small" />
            Uploading submissions: &nbsp; <Progress percent={0} size="small" />
          </div>
        );
        break;
      }
      case STATUS.UPLOADING:
        content = (
          <div>
            Reading files: &nbsp; <Progress percent={100} size="small" />
            Uploading submissions: &nbsp;{' '}
            <Progress
              percent={parseFloat(((this.state.numUploaded / this.state.protoSubmissions.length) * 100).toFixed(0))}
              size="small"
            />
          </div>
        );
        break;
      case STATUS.COMPLETE:
        content = (
          <BulkUploadComplete protoSubmissions={this.state.protoSubmissions} uploadMap={this.state.uploadMap} />
        );
        break;
    }

    /*************************** 3. Determine footer based on status ******************************/
    let footer;
    switch (this.state.status) {
      case STATUS.NONE:
        // footer will be provided by the child upload components
        footer = <div />;
        break;
      case STATUS.UPLOADED:
        footer = (
          <BulkUploadFooter
            backText="Start over"
            onBack={() => this.setState({ status: STATUS.NONE })}
            forwardText="Upload"
            onForward={this.onStepToReading}
            disableForward={numToUpload === 0}
          />
        );
        break;
      case STATUS.READING:
      case STATUS.UPLOADING:
      case STATUS.COMPLETE:
        footer = (
          <BulkUploadFooter
            backText=""
            onBack={null}
            forwardText="Close"
            onForward={this.props.onCancel}
            disableForward={this.state.status !== STATUS.COMPLETE}
          />
        );
        break;
    }

    /*************************** 4. Return modal ******************************/
    return (
      <Modal open={true} title={title} width={900} onCancel={this.props.onCancel} footer={null} style={{ top: 20 }}>
        <Steps
          size="small"
          current={stepNumber}
          items={steps.map((item) => ({
            key: item.title,
            title: item.title,
          }))}
        />
        <br />
        {content}
        {footer}
      </Modal>
    );
    /* tslint:enable:jsx-no-lambda */
  }
}

export default BulkUpload;
