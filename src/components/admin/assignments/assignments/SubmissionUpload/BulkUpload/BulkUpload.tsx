/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import React from 'react';

/* ant imports */
import { Divider, Modal, Progress, Steps } from 'antd';

/* codePost imports */
import {
  UPLOAD_STATUS,
  STUDENT_STATUS,
  getSubforStudent,
  isEqual,
  processSubmissionsFromFiles,
} from './BulkUploadHelpers';

/* codePost imports */
import { AssignmentType, CourseType, SubmissionType } from '../../../../../../infrastructure/types';

import UploadExternal from './UploadExternal';
import BulkUploadConfirm from './BulkUploadConfirm';
import { BulkUploadFooter, BulkUploadNoStudents, BulkUploadHeader, BulkUploadComplete } from './BulkUploadComplete';

import { INTEGRATIONS } from '../../../../../landing/Integrations';

import { codePostFile, IProtoFileUpload, IProtoSubmission, readUploadedFile } from './../FileReader';

const { Step } = Steps;

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
  updateSubmission: (submission: SubmissionType) => Promise<void>;
  deleteSubmission: (submission: SubmissionType) => Promise<void>;
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
  /* raw file objects (unread) for passing to validation function */
  rawFiles: codePostFile[];
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
      rawFiles: [],
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

  public buildNewStudentMap = (students: string[], submissions: SubmissionType[]) => {
    const newMap: any = {};

    for (const student of students) {
      newMap[student.toLowerCase()] = STUDENT_STATUS.MISSING;
    }

    for (const submission of submissions) {
      for (const student of submission.students) {
        newMap[student.toLowerCase()] = STUDENT_STATUS.EXISTING;
      }
    }

    return newMap;
  };

  public onCancel = () => {
    this.props.onCancel();
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
  /* Set state
  /***************************************************************************************/
  public onStepToUpload = () => {
    processSubmissionsFromFiles(
      this.state.rawFiles,
      this.props.students,
      this.state.studentMap,
      this.getStudentsFromFile,
      this.setProtoSubmissions,
    );
    this.setState({ status: STATUS.UPLOADED });
  };

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

  public setRawFiles = (rawFiles: codePostFile[]) => {
    this.setState({ rawFiles });
  };

  public showImportOptions = () => {
    this.setState({ showImportOptions: true });
  };

  public onIntegrationClick = (mode?: string) => {
    if (mode === this.state.mode) {
      this.setState({ mode: undefined });
    } else {
      this.setState({ mode });
    }
  };
  /***************************************************************************************/
  /* Upload business logic
  /***************************************************************************************/

  public readFiles = async () => {
    const submissions = this.state.protoSubmissions;

    await Promise.all(
      submissions.map(async (submission, index: number) => {
        const submitters = submission.students.join(',');
        for (const file of submission.files) {
          try {
            let outputFiles;
            // @ts-ignore FIXME
            if (file.file) {
              // @ts-ignore
              outputFiles = await readUploadedFile(file.file);
            } else {
              outputFiles = await readUploadedFile(file);
            }
            if (file.type === 'application/zip' || ['.zip'].includes(file.name)) {
              outputFiles.map((outputFile: IProtoFileUpload) => {
                const fullName = `anydirname/${submission.students.join(',')}/${outputFile.longname}`;
                const subfiles = { ...this.state.fileMap[submitters], [fullName]: outputFile.data };
                this.setState({ fileMap: { ...this.state.fileMap, [submitters]: subfiles } });
              });
            } else {
              outputFiles.map((outputFile: IProtoFileUpload) => {
                const subfiles = { ...this.state.fileMap[submitters], [outputFile.longname]: outputFile.data };
                this.setState({ fileMap: { ...this.state.fileMap, [submitters]: subfiles } });
              });
            }
          } catch (e) {
            this.setState({ errorPaths: [...this.state.errorPaths, e], status: STATUS.FILE_ERROR });
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

    if (readFiles === numFiles) {
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

  // Make sure all the files are read, and if so, upload them
  public upload = () => {
    const { protoSubmissions, fileMap } = this.state;

    // tslint:disable
    const toUpload = this.state.overwriteMode
      ? protoSubmissions
      : protoSubmissions.filter((el) => {
          return !el.isCollision;
        });
    // tslint:enable
    const promises = toUpload.map((submission) => {
      const files: any[] = [];
      const submitter = submission.students.join(',');

      if (fileMap.hasOwnProperty(submitter)) {
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
        .then((newSub) => {
          const uploadMap = this.state.uploadMap;
          submission.students.forEach((student) => {
            uploadMap[student] = UPLOAD_STATUS.SUCCESS;
          });
          this.setState({ uploadMap, numUploaded: this.state.numUploaded + 1 });
        })
        .catch((errors) => {
          const uploadMap = this.state.uploadMap;
          submission.students.forEach((student) => {
            uploadMap[student] = UPLOAD_STATUS.SUCCESS;
          });
          this.setState({ uploadMap });
        });
    });

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
    const toChange: SubmissionType[] = [];
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

  public getStudentsFromFile = (file: IProtoFileUpload) => {
    const folderName = file.path.split('/')[1];
    return folderName.split(',');
  };

  public externalProcessSubmissions = async (
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
    let numToUpload = 0;
    switch (this.state.status) {
      case STATUS.NONE:
        if (this.props.students.length === 0) {
          content = this.props.course && <BulkUploadNoStudents course={this.props.course} />;
        } else {
          content = (
            <div>
              <BulkUploadHeader
                showImportOptions={this.state.showImportOptions}
                toggleImportOptions={this.showImportOptions}
              />
              <Divider />
              <UploadExternal
                processSubmissionsFromFiles={this.externalProcessSubmissions}
                rawFiles={this.state.rawFiles}
                setRawFiles={this.setRawFiles}
                mode={this.state.mode}
                showImportOptions={this.state.showImportOptions}
                students={this.props.students}
                course={this.props.course}
                setIntegration={this.onIntegrationClick}
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
      case STATUS.READING:
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

    // modal's back button
    let footer;
    switch (this.state.status) {
      case STATUS.NONE:
        footer = (
          <BulkUploadFooter
            backText="Cancel"
            onBack={() => this.setState(this.onCancel)}
            forwardText="Continue"
            onForward={this.onStepToUpload}
            disableForward={this.state.rawFiles.length === 0}
          />
        );
        break;
      case STATUS.UPLOADED:
        footer = (
          <BulkUploadFooter
            backText="Start over"
            onBack={() => this.setState({ status: STATUS.NONE, rawFiles: [] })}
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

    const title =
      this.state.mode && this.state.mode !== 'more' ? (
        <span>
          <img
            src={INTEGRATIONS[this.state.mode].logo}
            style={{ width: '25px', marginRight: 5, marginBottom: 3 }}
            alt=""
          />
          <span style={{ color: '#24be85' }}>
            {this.state.mode.charAt(0).toUpperCase() + this.state.mode.slice(1)} import:
          </span>{' '}
          {this.props.assignment.name}
        </span>
      ) : (
        <span>Upload Submissions: {this.props.assignment.name}</span>
      );

    return (
      <Modal
        visible={true}
        title={title}
        width={900}
        onCancel={this.props.onCancel}
        footer={footer}
        style={{ top: 20 }}
      >
        <Steps size="small" current={stepNumber}>
          {steps.map((item) => {
            return <Step key={item.title} title={item.title} />;
          })}
        </Steps>
        <br />
        {content}
      </Modal>
    );
    /* tslint:enable:jsx-no-lambda */
  }
}

export default BulkUpload;
