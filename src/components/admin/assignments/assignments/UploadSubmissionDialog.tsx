/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* ant imports */
import { Button, Icon, Input, message, Modal, Progress, Switch, Upload, Table, Tag, Typography } from 'antd';

/* other library imports */
import Select from 'react-select';

import { Link } from 'react-router-dom';

/* codePost imports */
import {
  AssignmentType,
  TestCategoryType,
  SubmissionTestType,
  SubmissionType,
  StudentSubmissionType,
  FileTemplateType,
  CourseType,
} from '../../../../infrastructure/types';
import { AssignmentStudent, AssignmentStudentType } from '../../../../infrastructure/assignment';
import { Environment } from '../../../../infrastructure/autograder/environment';
import { FileTemplate } from '../../../../infrastructure/fileTemplate';

import CPTooltip from '../../../../components/core/CPTooltip';
import { tooltips } from '../../../../components/core/tooltips';

import { IStudentSubmissionsDataTable } from '../../../../types/common';

import { UploadFile } from 'antd/lib/upload/interface';

import { IProtoFileUpload, fileToProtoFileUpload, readUploadedFile } from './FileReader';

import TestsList from '../../../../components/code-review/code-panel/TestsList';
import { StudentTestCasesByCategory } from '../../../../components/core/testFetchUtils';

import { awaitTestResult } from '../../../../components/admin/assignments/tests/testResult';

import { SubmissionTestResultType } from '../../../../infrastructure/autograder/runTypes';

import { slack } from '../../../../components/core/slack';

import { encodeForLink } from '../../../../components/core/URLutils';

/**********************************************************************************************************************/

interface IProps {
  isVisible: boolean;
  onCancel: () => void;
  assignments: (AssignmentType | AssignmentStudentType)[];
  selectedAssignment?: AssignmentType | AssignmentStudentType;
  students: string[];
  selectedStudents: string[];
  submissions: IStudentSubmissionsDataTable;
  uploadSubmission:
    | ((assignment: AssignmentStudentType, partners: string[], files: any[]) => Promise<StudentSubmissionType>)
    | ((assignment: AssignmentType, partners: string[], files: any[]) => Promise<SubmissionType>);

  disableStudentSelect?: boolean;
  onSuccess?: () => void;
  isStudent?: boolean;
  course?: CourseType;
  canRunTests?: boolean;
  beforeUploadMessage?: React.ReactNode;
}

enum STATUS {
  NONE,
  SAVING /* reading files from user's file system */,
  TESTING /* testing uploaded submission against codePost tests */,
  COMPLETE /* completed upload */,
}

interface IState {
  selectedStudents: string[];
  selectedAssignment?: AssignmentType | AssignmentStudentType;
  // List of files in codePost format for upload
  files: IProtoFileUpload[];
  // List of files in ant format. Required to make make the dialog a controlled list so we
  // can remove files from the list if they are not valid
  fileList: UploadFile[];
  status: STATUS;

  rejectedFiles: string[];

  uploadDirectory: boolean;

  testCategories: TestCategoryType[];
  testCases: StudentTestCasesByCategory;
  submissionTests: SubmissionTestType[];
  // If the admin turns off exposeDumpLogs then the log will be none
  testsLog: string | null;
  submission?: StudentSubmissionType;
  loadingTests: boolean;

  fileTemplates: FileTemplateType[];
}

class UploadSubmissionDialog extends React.Component<IProps, IState> {
  public assignmentOptions = this.props.assignments.map((assignment: AssignmentType | AssignmentStudentType, i) => {
    return {
      value: assignment.id,
      label: assignment.name,
    };
  });

  public state: Readonly<IState> = {
    selectedStudents: this.props.selectedStudents,
    selectedAssignment: this.props.selectedAssignment,
    files: [],
    fileList: [],
    rejectedFiles: [],
    status: STATUS.NONE,
    uploadDirectory: false,
    testCases: {},
    testCategories: [],
    submissionTests: [],
    testsLog: null,
    loadingTests: false,
    fileTemplates: [],
  };

  public toggleState = (key: keyof IState) => (prevState: IState): IState => ({
    ...prevState,
    [key]: !prevState[key],
  });

  public getState = (key: keyof IState): any => {
    return this.state[key];
  };

  public componentDidMount() {
    if (this.props.selectedAssignment) {
      this.loadTemplates(this.props.selectedAssignment);
    }
  }

  public componentDidUpdate(prevProps: IProps, prevState: IState) {
    if (prevProps.selectedAssignment !== this.props.selectedAssignment) {
      this.setState({
        selectedAssignment: this.props.selectedAssignment,
        testCategories: [],
        testCases: [],
      });
      if (this.props.selectedAssignment) {
        this.loadTemplates(this.props.selectedAssignment);
        this.loadTests();
      }
    }
    if (prevProps.selectedStudents !== this.props.selectedStudents) {
      this.setState({ selectedStudents: this.props.selectedStudents });
    }

    if (prevState.status !== STATUS.TESTING && this.state.status === STATUS.TESTING) {
      this.runTests();
    }

    if (prevProps.isVisible && !this.props.isVisible) {
      this.setState({ submissionTests: [], testCategories: [], testCases: {} });
    }
  }

  public loadTemplates = (assignment: AssignmentType | AssignmentStudentType) => {
    const promises = assignment.fileTemplates.map((el) => FileTemplate.read(el));
    Promise.all(promises).then((fileTemplates) => this.setState({ fileTemplates }));
  };

  public loadTests = async () => {
    if (this.props.isStudent && this.props.selectedAssignment) {
      this.setState({ loadingTests: true });
      const { testCases, testCategories } = await AssignmentStudent.readStudentTests(this.props.selectedAssignment.id);
      const caseObj: StudentTestCasesByCategory = {};
      testCategories.forEach((category) => {
        caseObj[category.id] = [];
      });
      testCases.forEach((testCase) => {
        caseObj[testCase.testCategory] = [...caseObj[testCase.testCategory], testCase];
      });
      this.setState({ testCategories, testCases: caseObj });
    }
  };

  public setResults = (result: SubmissionTestResultType) => {
    this.setState({ submissionTests: result.submissionTests, testsLog: result.logs, loadingTests: false });
  };

  public runTests = async () => {
    if (this.state.submission && this.state.selectedAssignment && this.state.selectedAssignment.environment) {
      const result = await Environment.run(this.state.selectedAssignment.environment, {
        submission: this.state.submission.id.toString(),
        simulate: 'False',
        exposedOnly: 'True',
      });
      awaitTestResult(result.task, this.setResults);
    }
  };

  public changeStudents = (options: any) => {
    const students = options.map((option: any) => option.value);
    this.setState({ selectedStudents: students });
  };

  public changeAssignment = (option: any) => {
    const selectedAssignment = this.props.assignments.find((assn) => {
      return assn.id === option.value;
    });

    this.setState({ selectedAssignment, selectedStudents: [] });
  };

  public cancel = () => {
    this.setState({ status: STATUS.NONE, files: [], fileList: [], rejectedFiles: [] });
    this.props.onCancel();
  };

  public onSuccess = () => {
    this.setState({ status: STATUS.NONE, files: [], fileList: [], rejectedFiles: [] });
    this.props.onSuccess ? this.props.onSuccess() : this.props.onCancel();
  };

  public toggleDirectoryUpload = () => {
    this.setState({
      status: STATUS.NONE,
      files: [],
      fileList: [],
      rejectedFiles: [],
      uploadDirectory: !this.state.uploadDirectory,
    });
  };

  public upload = () => {
    if (this.state.selectedAssignment) {
      this.setState({ status: STATUS.SAVING }, () => {
        if (this.state.selectedAssignment) {
          const shouldRunTests = this.props.canRunTests && this.state.testCategories.length > 0;
          this.props
            // @ts-ignore
            .uploadSubmission(this.state.selectedAssignment!, this.state.selectedStudents, this.state.files)
            .then((newSubmission: StudentSubmissionType | SubmissionType) => {
              this.setState({
                submission: newSubmission,
                status: shouldRunTests ? STATUS.TESTING : STATUS.COMPLETE,
                files: [],
                fileList: [],
                rejectedFiles: [],
                selectedStudents: this.props.selectedStudents,
                selectedAssignment: this.props.selectedAssignment ? this.props.selectedAssignment : undefined,
              });
            })
            .catch((error: any) => {
              /* eslint-disable no-multi-str */
              message.error(
                'Sorry, something went wrong. Please try uploading again.\
                If the problem persists, contact the codePost team.',
              );
              /* eslint-enable no-multi-str */
              const payload = {
                error: error.toString(),
                errorDetail: JSON.stringify(error, Object.getOwnPropertyNames(error)),
                url: window.location.href,
              };

              slack(`${process.env.REACT_APP_API_URL}/logs/logError/`, payload);

              this.cancel();
            });
        }
      });
    }
  };

  public onRemove = (file: UploadFile) => {
    const protoFileUpload = fileToProtoFileUpload(file);

    const files = this.state.files.filter((f: IProtoFileUpload) => {
      return (
        f.longname !== protoFileUpload.longname &&
        (f.zipSource === undefined || f.zipSource !== protoFileUpload.zipSource)
      );
    });

    const fileList = this.state.fileList.filter((f: UploadFile) => {
      return f.name !== protoFileUpload.longname;
    });

    this.setState({ files, fileList });
  };

  public changeStatus = (newStatus: STATUS) => {
    this.setState({ status: newStatus });
  };

  /* build a list of two student groups: missing submissions and not missing submissions */
  /* use these two groups to populate select */
  public buildStudentOptions = (
    students: string[],
    submissions: IStudentSubmissionsDataTable,
    assignment?: AssignmentType | AssignmentStudentType,
  ) => {
    /* FIXME: should use react-select type definition */
    const toRet: any = [
      { label: 'Students missing submissions', options: [] },
      { label: 'Students with submissions (delete before uploading)', options: [] },
    ];

    for (const student of students) {
      if (assignment) {
        if (submissions[student][assignment.id]) {
          toRet[1].options.push({
            value: student,
            label: student,
            isDisabled: true,
          });
        } else {
          toRet[0].options.push({
            value: student,
            label: student,
            isDisabled: false,
          });
        }
      } else {
        toRet[0].options.push({
          value: student,
          label: student,
          isDisabled: false,
        });
      }
    }

    return toRet;
  };

  public onCancel = () => {
    this.setState({ files: [], fileList: [], rejectedFiles: [], status: STATUS.NONE });
    this.props.onCancel();
  };

  // FIXME: this method of reading file contents relies on a race win, since
  // we need the fileReaders to finish before we hit upload.
  public beforeUpload = async (file: any, fileList: UploadFile[]) => {
    const ProtoFileUpload: IProtoFileUpload = fileToProtoFileUpload(file);

    try {
      const outputFiles = await readUploadedFile(file);

      const newFileList = this.state.fileList.filter((f: UploadFile) => {
        return f.name !== ProtoFileUpload.longname;
      });

      const newFiles = this.state.files.filter((f: IProtoFileUpload) => {
        return !outputFiles
          .map((outputFile: IProtoFileUpload) => {
            return outputFile.longname;
          })
          .includes(f.longname);
      });

      const newFileListItem = { ...file, name: ProtoFileUpload.longname };

      this.setState({ fileList: [...newFileList, newFileListItem], files: [...newFiles, ...outputFiles] });
    } catch (e) {
      this.setState({ rejectedFiles: [...this.state.rejectedFiles, ProtoFileUpload.longname] });
      message.error(e);
    }

    return Promise.reject();
  };

  public render() {
    const { isVisible } = this.props;
    const { status } = this.state;

    if (!isVisible) {
      return <div />;
    }

    const disableUpload = !(
      this.state.selectedStudents.length > 0 &&
      this.state.files.length > 0 &&
      this.state.selectedAssignment
    );

    const areRequiredFilesPresent = this.state.fileTemplates.every(
      (ft) => !ft.required || this.state.files.some((el) => el.name === ft.name),
    );

    let content;
    switch (status) {
      case STATUS.COMPLETE:
        content = (
          <div>
            Uploading submissions: &nbsp; <Progress percent={100} size="small" />
            <br />
            <br />
            Upload complete!
          </div>
        );
        break;
      case STATUS.SAVING:
        content = (
          <div>
            Uploading submissions: &nbsp; <Progress percent={0} size="small" />
          </div>
        );
        break;
      case STATUS.TESTING:
        content = (
          <div style={{ minHeight: 'calc(100vh - 300px)' }}>
            <TestsList
              tests={this.state.submissionTests}
              cases={this.state.testCases}
              categories={this.state.testCategories}
              isLoading={this.state.loadingTests}
              logs={this.state.testsLog === null ? undefined : this.state.testsLog}
            />
          </div>
        );
        break;
      case STATUS.NONE:
        const studentOptions = this.buildStudentOptions(
          this.props.students,
          this.props.submissions,
          this.state.selectedAssignment,
        );

        const selectedStudents = this.state.selectedStudents.map((student) => {
          return {
            label: student,
            value: student,
          };
        });

        const rejectedFiles =
          this.state.rejectedFiles.length === 0 ? (
            <div />
          ) : (
            <div style={{ color: 'red', marginBottom: 10, marginTop: '10px' }}>
              The following files were not uploaded:{' '}
              {this.state.rejectedFiles.map((fileName, index) => {
                return `${fileName}${index === this.state.rejectedFiles.length - 1 ? '' : ', '}`;
              })}
            </div>
          );

        /*****************************************************************************************/
        /* Build list of settings and toggles
        /*****************************************************************************************/

        const settings = [
          {
            setting: 'Upload a directory',
            tooltip: 'Turn this on to upload nested folders.',
            variable: 'uploadDirectory' as keyof IState,
          },
          // {
          //   setting: 'Upload an incomplete submission',
          //   tooltip: 'Turn this on to a submission missing required files.',
          //   variable: 'allowIncomplete' as keyof IState,
          // },
          // {
          //   setting: 'Upload extra files',
          //   tooltip: 'Turn this on to upload files not specifed by the assignment.',
          //   variable: 'allowExtra' as keyof IState,
          // },
        ];

        const settingList = (
          <span>
            {settings.map((setting) => (
              <span>
                {setting.setting} <CPTooltip title={setting.tooltip} infoIcon={true} /> &nbsp;{' '}
                <Switch
                  checked={this.getState(setting.variable)}
                  onClick={() => {
                    this.setState(this.toggleState(setting.variable));
                    return;
                  }}
                />
              </span>
            ))}
          </span>
        );

        /*****************************************************************************************/
        /* Build list of required and optional files
        /*****************************************************************************************/
        const requiredColumns = [
          { title: 'Assignment files', dataIndex: 'name', key: 'file' },
          { title: 'Uploaded', dataIndex: 'uploaded', key: 'uploaded', align: 'center' as const },
        ];

        const fileList =
          this.state.fileTemplates.length > 0 ? (
            <Table
              columns={requiredColumns}
              dataSource={this.state.fileTemplates.map((el) => {
                const exists = this.state.files.some((file) => file.name === el.name);
                return {
                  ...el,
                  name: (
                    <span>
                      {el.required ? <Tag color={exists ? 'green' : 'volcano'}>REQUIRED</Tag> : <Tag>OPTIONAL</Tag>}
                      {el.name}
                    </span>
                  ),
                  uploaded: exists ? (
                    <Icon type="check-circle" style={{ color: 'green' }} />
                  ) : (
                    <Icon type="close-circle" style={{ color: 'red' }} />
                  ),
                };
              })}
              pagination={false}
            />
          ) : (
            <span />
          );

        const unzippedFiles = this.state.files.filter((el) => el.zipSource !== undefined);

        // Address https://github.com/codepost-io/codePost-ui/issues/1039
        if (!this.props.isStudent && this.props.students.length === 0) {
          content = (
            <div>
              After you add students, you can upload their submissions here. <br />
              <br />{' '}
              <Link
                to={
                  this.props.course
                    ? `/admin/${encodeForLink(this.props.course.name)}/${encodeForLink(
                        this.props.course.period,
                      )}/roster/students`
                    : ''
                }
              >
                <Button>Add students</Button>
              </Link>
            </div>
          );
        } else {
          content = (
            <div>
              {this.props.beforeUploadMessage && (
                <div style={{ marginBottom: 15 }}>{this.props.beforeUploadMessage}</div>
              )}
              Assignment:
              <Select
                defaultValue={
                  this.state.selectedAssignment
                    ? { value: this.state.selectedAssignment!.id, label: this.state.selectedAssignment!.name }
                    : {}
                }
                isDisabled={typeof this.props.selectedAssignment === 'object'}
                onChange={this.changeAssignment}
                options={this.assignmentOptions}
              />
              <br />
              <br />
              Students:{' '}
              {this.props.isStudent ? (
                <CPTooltip title={tooltips.admin.assignments.uploadSubmission} infoIcon={true} />
              ) : (
                <span />
              )}
              <Select
                placeholder={'Select students'}
                isMulti={true}
                value={selectedStudents}
                options={studentOptions}
                onChange={this.changeStudents}
                isDisabled={this.props.disableStudentSelect}
              />
              <br />
              {/*  beforeUpload prop stops Upload component from trying to upload files to external server */}
              {/*  FIXME: we should prevent users from uploading image files here */}
              {fileList}
              <br />
              {settingList}
              <br />
              <br />
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Upload
                  beforeUpload={this.beforeUpload}
                  listType="text"
                  multiple={true}
                  onRemove={this.onRemove}
                  fileList={this.state.fileList}
                  directory={this.state.uploadDirectory}
                >
                  <Button>
                    <Icon type="upload" /> Upload files
                  </Button>
                </Upload>
              </div>
              <span>
                {unzippedFiles.length > 0 ? (
                  <span>
                    <br />
                    <b>The following files will be unzipped on upload:</b>{' '}
                    {unzippedFiles.map((el) => `${el.path}/${el.name}`).join(', ')}
                  </span>
                ) : (
                  <div />
                )}
              </span>
              <br />
              {rejectedFiles}
            </div>
          );
        }
        break;
    }

    // modal's back button
    let goBackButton;
    switch (this.state.status) {
      case STATUS.NONE:
        goBackButton = (
          <Button key="back" onClick={this.cancel.bind(this, undefined)}>
            Cancel
          </Button>
        );
        break;
      case STATUS.SAVING:
        goBackButton = (
          <Button key="back" disabled={true}>
            Cancel
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
            key="submit"
            type="primary"
            disabled={disableUpload || !areRequiredFilesPresent}
            onClick={this.upload}
          >
            Upload
          </Button>
        );
        break;
      case STATUS.SAVING:
        goForwardButton = (
          <Button key="submit" type="primary" disabled={true} loading={true}>
            Upload
          </Button>
        );
        break;
      case STATUS.TESTING:
      case STATUS.COMPLETE:
        goForwardButton = (
          <Button key="submit" type="primary" onClick={this.onSuccess} disabled={this.state.loadingTests}>
            Close
          </Button>
        );
        break;
    }

    return (
      <Modal
        visible={true}
        title="Upload Submissions"
        onCancel={this.onCancel}
        width={800}
        footer={[goBackButton, goForwardButton]}
      >
        {content}
      </Modal>
    );
  }
}
export default UploadSubmissionDialog;
