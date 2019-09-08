/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import React from 'react';

/* ant imports */
import { Button, Collapse, Divider, Modal, Progress, Steps, Switch, Table, Tag, Typography } from 'antd';
const Panel = Collapse.Panel;
const { Step } = Steps;

/* other library imports */

import CPTooltip from '../../../../components/core/CPTooltip';
import { tooltips } from '../../../../components/core/tooltips';

import _ from 'lodash';

/* codePost imports */
import { AssignmentType } from '../../../../infrastructure/assignment';
import { SubmissionType } from '../../../../infrastructure/submission';

import { acceptedFilesSet } from './AcceptedFileTypes';

import UploadForm from './UploadForm';

import { IntegrationButton, INTEGRATIONS } from '../../../landing/Integrations';

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
}

interface IProtoSubmission {
  students: string[];
  files: File[];
  isCollision: boolean /* true if any student has an existing submission */;
}

/* note that the order here defines the order in which students are rendered  (ERROR first, UPLOADED last) */
enum STUDENT_STATUS {
  EXISTING /* student has an existing submission for this assignment */,
  MISSING /* no submission for this student, saved or unsaved */,
}

/* note that the order here defines the order in which students are rendered  (ERROR first, UPLOADED last) */
enum UPLOAD_STATUS {
  SUCCESS,
  ERROR,
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
  fileMap: { [fileName: string]: string };

  /* stores progress */
  status: STATUS;

  /* number of successfully uploaded submissions */
  numUploaded: number;

  /* cache for figuring out whether all files have been read */
  numFiles: number;

  /* raw file objects (unread) for passing to validation function */
  rawFiles: File[];

  /* overwrite mode toggle */
  overwriteMode: boolean;

  /* files with an invalid path */
  errorPaths: string[];

  /* track current upload mode (normal or with integration) */
  mode?: string;

  /* show import options */
  showImportOptions: boolean;
}

class UploadSubmissionBulkDialog extends React.Component<IProps, IState> {
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
      newMap[student.toLowerCase()] = STUDENT_STATUS.MISSING;
    }

    for (const submission of submissions) {
      for (const student of submission.students) {
        newMap[student.toLowerCase()] = STUDENT_STATUS.EXISTING;
      }
    }

    return newMap;
  };

  public isEqual = (string1: string, string2: string) => {
    // Case insensitive string compare
    return string1.toLowerCase() === string2.toLowerCase();
  };

  public isValidStudent = (student: string, students: string[]) => {
    return students.some((el) => {
      return this.isEqual(el, student);
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

  public getSubforStudent = (student: string, protoSubmissions: IProtoSubmission[]) => {
    for (const sub of protoSubmissions) {
      if (
        sub.students.some((el) => {
          return this.isEqual(el, student);
        })
      ) {
        return sub;
      }
    }

    return undefined;
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
          const newMessage = `Failed to read file: ${anyFile.webkitRelativePath}`;
          this.setState({ errorPaths: [...errorPaths, newMessage], status: STATUS.FILE_ERROR });
        };
        studentsReader.onload = () => {
          const result = studentsReader.result;
          const fileMap = this.state.fileMap;
          if (typeof result === 'string') {
            fileMap[anyFile.webkitRelativePath] = result;
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
      submission.files.forEach((file: any) => {
        const pathDirs = file.webkitRelativePath.split('/');
        // Want to ignore first (root dir, student email) two and last element (file name) of split
        const filePath = pathDirs.length > 3 ? pathDirs.slice(2, pathDirs.length - 1).join('/') : null;
        const payload = {
          name: file.name,
          data: fileMap[file.webkitRelativePath],
          path: filePath,
        };
        files.push(payload);
      });
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

    // loop through students for which we have an upload
    // find their submission in submission list
    // add this submission to a changed list (if it isn't there already)
    // remove the student from submission.students
    const toChange: SubmissionType[] = [];
    students.forEach((student) => {
      const newSubmission = this.getSubforStudent(student, this.state.protoSubmissions);

      if (newSubmission !== undefined && newSubmission.isCollision) {
        const match = submissions.find((submission) => {
          return submission.students.some((el) => {
            return this.isEqual(el, student);
          });
        });

        if (match) {
          const reMatch = toChange.find((el) => {
            return el.id === match.id;
          });

          if (reMatch) {
            reMatch.students.filter((el) => {
              return !this.isEqual(el, student);
            });
          } else {
            const newSub = { ...match };
            newSub.students = newSub.students.filter((el) => {
              return !this.isEqual(el, student);
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
    const folderMap = {};
    const students = this.props.students;
    const studentMap = this.state.studentMap;
    const invalidPaths: string[] = [];
    const alreadySeen: { [student: string]: boolean } = {};

    /*************************************************************
    Types of errors to check for:
    - path doesn't follow TLD/<students>/file
    - path contains invalid <students>
    - path contains a student listed in a different folder
    - path contains a student multiple times
    /*************************************************************/

    // WARNING:
    // casting File (newFile) to any to access webkitRelativePath property
    // this property is experimental and not on a standards track
    // https://developer.mozilla.org/en-US/docs/Web/API/File/webkitRelativePath
    acceptedFiles.forEach((newFile: any) => {
      // FIXME: webkit prefix only used in Chrome. Extend to Edge and Firefox
      // by detecting browser and removing prefix if necessary
      const path: string = newFile.webkitRelativePath;

      const folderName = path.split('/')[1].trim().toLowerCase();;
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
            return !alreadySeen[el];
          });

          if (validEmails.length !== emails.length) {
            // Some email in the folder name was invalid
            invalidPaths.push(`Contains a duplicate student: ${path}`);
          } else {
            let noCollisions = true;
            for (const email of emails) {
              if (studentMap[email] === STUDENT_STATUS.EXISTING) {
                noCollisions = false;
                break;
              }
            }

            folderMap[folderName] = {
              files: [],
              students: validEmails,
              isCollision: !noCollisions,
            };

            validEmails.forEach((el) => {
              alreadySeen[el] = true;
            });
          }
      }
    });

    // Sort files into appropriate protoSubmissions
    let numFiles = 0;
    acceptedFiles.forEach((el: any) => {
      const folderName = el.webkitRelativePath.split('/')[1].toLowerCase();
      const extension = el.name.includes('.') ? el.name.split('.').slice(-1)[0] : '';
      if (!acceptedFilesSet.has(`.${extension}`)) {
        invalidPaths.push(`File type not accepted: ${el.webkitRelativePath}`);
      } else {
        if (folderName in folderMap) {
          folderMap[folderName].files.push(el);
          numFiles = numFiles + 1;
        }
      }
    });

    // Remove protoSubmissions which have no files (because all of the files are invalid)
    Object.keys(folderMap).forEach((key) => {
      if (folderMap[key].files.length === 0) {
        delete folderMap[key];
      }
    });

    this.setState({
      protoSubmissions: Object.keys(folderMap).map((key) => {
        return folderMap[key];
      }),
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

  public changeStatus = (newStatus: STATUS) => {
    if (newStatus === STATUS.NONE) {
      this.setState({ status: newStatus, rawFiles: [] });
    } else if (newStatus === STATUS.UPLOADED) {
      this.onFileDrop(this.state.rawFiles);
      this.setState({ status: newStatus });
    }
  };

  public onIntegrationClick = (mode?: string) => {
    if (mode === this.state.mode) {
      this.setState({ mode: undefined });
    } else {
      this.setState({ mode });
    }
  };

  public setRawFiles = (rawFiles: File[]) => {
    this.setState({ rawFiles });
  };

  public showImportOptions = () => {
    this.setState({ showImportOptions: true });
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
        content = (
          <div>
            {!this.state.showImportOptions ? (
              <div style={{ margin: '15px 0px' }}>
                Looking to import submissions from a third-party service?{' '}
                <span>
                  <Button size="small" onClick={this.showImportOptions}>
                    Click here
                  </Button>
                </span>
              </div>
            ) : (
              <div
                style={{
                  margin: '15px 0px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <IntegrationButton
                  integration={INTEGRATIONS['canvas']}
                  onClick={this.onIntegrationClick}
                  active={this.state.mode === 'canvas'}
                />
                <div style={{ width: '20px' }} />
                <IntegrationButton
                  integration={INTEGRATIONS['blackboard']}
                  onClick={this.onIntegrationClick}
                  active={this.state.mode === 'blackboard'}
                />
                <div style={{ width: '20px' }} />
                <IntegrationButton
                  integration={INTEGRATIONS['brightspace']}
                  onClick={this.onIntegrationClick}
                  active={this.state.mode === 'brightspace'}
                />
                <div style={{ width: '20px' }} />
                <IntegrationButton
                  integration={INTEGRATIONS['github']}
                  onClick={this.onIntegrationClick}
                  active={this.state.mode === 'github'}
                />
                <div style={{ width: '20px' }} />
                <IntegrationButton
                  integration={INTEGRATIONS['jupyter']}
                  onClick={this.onIntegrationClick}
                  active={this.state.mode === 'jupyter'}
                />
                <div style={{ width: '20px' }} />
                <IntegrationButton
                  integration={INTEGRATIONS['more']}
                  onClick={this.onIntegrationClick}
                  active={this.state.mode === 'more'}
                />
              </div>
            )}

            <UploadForm rawFiles={this.state.rawFiles} setRawFiles={this.setRawFiles} mode={this.state.mode} />
          </div>
        );
        break;
      case STATUS.FILE_ERROR:
      case STATUS.UPLOADED:
        // separate students into lists for presentation
        const studentLists = {
          impacted: {} as { [student: string]: IProtoSubmission },
          missing: [] as string[],
          uploaded: [] as string[],
        };

        const lowerCaseStudents = this.props.students.map((student) => {
          return student.toLowerCase();
        });

        for (const student of lowerCaseStudents) {
          const sub = this.getSubforStudent(student, this.state.protoSubmissions);
          if (sub !== undefined) {
            studentLists.impacted[student] = sub;
          } else {
            // does student have an existing submission?
            if (this.state.studentMap[student] === STUDENT_STATUS.EXISTING) {
              studentLists.uploaded.push(student);
            } else {
              studentLists.missing.push(student);
            }
          }
        }

        // columns for impacted table
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
            align: 'center' as 'center' | 'left' | 'right',
          },
          {
            title: 'Partners',
            dataIndex: 'partners',
            key: 'partners',
          },
          {
            title: 'Files',
            dataIndex: 'files',
            key: 'files',
          },
        ];

        // columns for non-impacted tables
        const studentColumns = [
          {
            title: 'Student',
            dataIndex: 'student',
            key: 'student',
          },
        ];

        // data for impacted table
        let hasCollisions = false;
        const dataSource = Object.keys(studentLists.impacted)
          .sort((a, b) => {
            const studentMap = this.state.studentMap;
            return studentMap[a] - studentMap[b];
          })
          .map((el) => {
            let status;
            const sub = studentLists.impacted[el];

            if (sub.isCollision) {
              hasCollisions = true;
              if (this.state.overwriteMode) {
                numToUpload = numToUpload + 1;
                status = (
                  <Tag color="green" key={el}>
                    Ok
                  </Tag>
                );
              } else {
                let tooltipText;
                if (this.state.studentMap[el] === STUDENT_STATUS.EXISTING) {
                  tooltipText = 'This student already has a submission uploaded for this assignment.';
                } else {
                  tooltipText = `One of this student's partners in the submission you
                     uploaded aleady has a submission uploaded for this assignment.`;
                }
                status = (
                  <CPTooltip title={tooltipText}>
                    <Tag color="volcano" key={el}>
                      CONFLICT
                    </Tag>
                  </CPTooltip>
                );
              }
            } else {
              numToUpload = numToUpload + 1;
              status = (
                <Tag color="green" key={el}>
                  Ok
                </Tag>
              );
            }

            // tslint:disable
            return {
              key: el,
              student: el,
              status,
              partners: sub ? sub.students.filter((student) => !this.isEqual(student, el)).join(', ') : '',
              files: sub
                ? sub.files
                    .map((file) => {
                      return file.name;
                    })
                    .join(', ')
                : '',
            };
            // tslint:enable
          });

        // data for non-impacted tables
        const withSubmissionsData = studentLists.uploaded.map((el) => {
          return {
            student: el,
          };
        });

        const withoutSubmissionsData = studentLists.missing.map((el) => {
          return {
            student: el,
          };
        });

        // for customizing instructions
        const numSubmissions = Object.values(studentLists.impacted).length;
        const numStudents = Object.keys(studentLists.impacted).length;

        content = (
          <div>
            {this.state.errorPaths.length > 0 ? (
              <div>
                <Divider orientation="left" style={{ color: 'red' }}>
                  Errors
                </Divider>
                <div>
                  <div>
                    The following files were rejected. Hit "start over" if you want to re-upload submissions.{' '}
                    <CPTooltip
                      title={tooltips.admin.assignments.uploadSubmissionFileTypes}
                      infoIcon={true}
                      iconStyle={{ paddingLeft: 5 }}
                    />
                  </div>
                  <ul>
                    {this.state.errorPaths.map((el, i) => {
                      return <li key={i}>{el}</li>;
                    })}
                  </ul>
                  <br />
                </div>
              </div>
            ) : null}
            <Divider orientation="left">Instructions</Divider>
            You are about to upload <Typography.Text strong>{numSubmissions}</Typography.Text> submission
            {numSubmissions > 1 ? 's ' : ' '}
            corresponding to <Typography.Text strong>{numStudents}</Typography.Text> student{numStudents > 1 ? 's' : ''}
            . You can view information about the submissions you are about to upload below. If you want to make changes,
            just hit "Start over" to re-upload.
            <br />
            <br />
            {hasCollisions ? (
              <div>
                <br />
                <Tag color="volcano" key="collision-warning">
                  CONFLICT
                </Tag>{' '}
                &nbsp; Existing submissions will be overwritten by this upload. Turn on Overwrite mode if you want to
                upload these submissions. Otherwise, they will be excluded from your upload.
                <br />
                <br /> Overwrite mode: &nbsp;{' '}
                <Switch onChange={this.toggleOverwriteMode} defaultChecked={this.state.overwriteMode} /> &nbsp;
                <br />
                <br />
              </div>
            ) : null}
            <Table pagination={{ pageSize: 5 }} dataSource={dataSource} columns={columns} />
            <Divider orientation="left">Students not uploaded</Divider>
            <Collapse>
              <Panel header="Students without submissions" key="1">
                <Table pagination={{ pageSize: 5 }} dataSource={withoutSubmissionsData} columns={studentColumns} />
              </Panel>
              <Panel header="Students with submissions" key="2">
                <Table pagination={{ pageSize: 5 }} dataSource={withSubmissionsData} columns={studentColumns} />
              </Panel>
            </Collapse>
          </div>
        );
        break;
      case STATUS.READING:
        const readFiles = Object.keys(this.state.fileMap).reduce((acc, el) => {
          const toAdd = typeof this.state.fileMap[el] === 'undefined' ? 0 : 1;
          return acc + toAdd;
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
        const tableColumns = [
          {
            title: 'Students',
            dataIndex: 'students',
            key: 'students',
          },
          {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            align: 'center' as 'center' | 'left' | 'right',
          },
        ];

        const tableRows = this.state.protoSubmissions.map((protoSubmission) => {
          const students = protoSubmission.students;
          let status;
          switch (this.state.uploadMap[students[0]]) {
            case UPLOAD_STATUS.SUCCESS:
              status = (
                <Tag color="green" key={students[0]}>
                  SUCCESS
                </Tag>
              );
              break;
            case UPLOAD_STATUS.ERROR:
              status = (
                <Tag color="red" key={students[0]}>
                  ERROR
                </Tag>
              );
              break;
          }
          return {
            students: protoSubmission.students.join(', '),
            status,
          };
        });

        content = (
          <div>
            <div>
              Reading files: &nbsp; <Progress percent={100} size="small" />
              Uploading submissions: &nbsp; <Progress percent={100} size="small" />
            </div>
            <br />
            <Table pagination={{ pageSize: 5 }} dataSource={tableRows} columns={tableColumns} />
          </div>
        );
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
          <Button key="forward" type="primary" onClick={this.onUpload} disabled={numToUpload === 0}>
            Upload
          </Button>
        );
        break;
      case STATUS.READING:
      case STATUS.UPLOADING:
      case STATUS.COMPLETE:
        goForwardButton = (
          <Button
            key="forward"
            type="primary"
            disabled={this.state.status !== STATUS.COMPLETE}
            onClick={this.props.onCancel}
          >
            Close
          </Button>
        );
        break;
    }

    let panelNumber = 0;
    switch (this.state.status) {
      case STATUS.UPLOADED:
        panelNumber = 1;
        break;
      case STATUS.FILE_ERROR:
      case STATUS.READING:
      case STATUS.UPLOADING:
      case STATUS.COMPLETE:
        panelNumber = 2;
        break;
    }

    return (
      <Modal
        visible={true}
        title={`Upload Submissions: ${this.props.assignment.name}`}
        width={900}
        onCancel={this.props.onCancel}
        footer={[goBackButton, goForwardButton]}
        style={{ top: 20 }}
      >
        <Steps size="small" current={panelNumber}>
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
export default UploadSubmissionBulkDialog;
