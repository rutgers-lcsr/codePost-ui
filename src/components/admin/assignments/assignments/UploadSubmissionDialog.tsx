/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* ant imports */
import { Button, Icon, message, Modal, Progress, Switch, Upload, Table, Tag, Collapse } from 'antd';

/* other library imports */
import Select from 'react-select';

/* codePost imports */
import {
  AssignmentType,
  TestCaseType,
  TestCategoryType,
  SubmissionTestType,
  StudentSubmissionType,
  FileTemplateType,
} from '../../../../infrastructure/types';
import { AssignmentStudent } from '../../../../infrastructure/assignment';
import { Submission } from '../../../../infrastructure/submission';
import { FileTemplate } from '../../../../infrastructure/fileTemplate';

import { File } from '../../../../infrastructure/file';

import CPTooltip from '../../../../components/core/CPTooltip';
import { tooltips } from '../../../../components/core/tooltips';

import { IStudentSubmissionsDataTable } from '../../../../types/common';

import { acceptedFilesSet, acceptedFilesString } from './AcceptedFileTypes';

import { resizeImage } from '../../other/AdminUtils';

import TestsList from '../../../../components/code-review/code-panel/TestsList';
import { TestCasesByCategory, fetchTestsBySubmission } from '../../../../components/core/testFetchUtils';

import { awaitTestResult } from '../../../../components/admin/assignments/tests/testResult';

import { SubmissionTestResultType } from '../../../../infrastructure/autograder/runTypes';

/**********************************************************************************************************************/

interface IProps {
  isVisible: boolean;
  onCancel: () => void;
  assignments: AssignmentType[];
  selectedAssignment?: AssignmentType;
  students: string[];
  selectedStudents: string[];
  submissions: IStudentSubmissionsDataTable;
  uploadSubmission: (assignment: AssignmentType, partners: string[], files: any[]) => Promise<StudentSubmissionType>;

  disableStudentSelect?: boolean;
  onSuccess?: () => void;
  isStudent?: boolean;
}

enum STATUS {
  NONE,
  SAVING /* reading files from user's file system */,
  TESTING /* testing uploaded submission against codePost tests */,
  COMPLETE /* completed upload */,
}

interface IState {
  selectedStudents: string[];
  selectedAssignment?: AssignmentType;
  // List of files in codePost format for upload
  files: any[];
  // List of files in ant format. Required to make make the dialog a controlled list so we
  // can remove files from the list if they are not valid
  fileList: any[];
  status: STATUS;

  rejectedFiles: string[];

  uploadDirectory: boolean;

  testCategories: TestCategoryType[];
  testCases: TestCasesByCategory;
  submissionTests: SubmissionTestType[];
  submission?: StudentSubmissionType;
  loadingTests: boolean;

  fileTemplates: FileTemplateType[];
}

class UploadSubmissionDialog extends React.Component<IProps, IState> {
  public assignmentOptions = this.props.assignments.map((assignment, i) => {
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
      this.setState({ selectedAssignment: this.props.selectedAssignment });
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

  public loadTemplates = (assignment: AssignmentType) => {
    const promises = assignment.fileTemplates.map((el) => FileTemplate.read(el));
    Promise.all(promises).then((fileTemplates) => this.setState({ fileTemplates }));
  };

  public loadTests = async () => {
    if (this.props.isStudent && this.props.selectedAssignment) {
      this.setState({ loadingTests: true });
      const { testCases, testCategories } = await AssignmentStudent.readStudentTests(this.props.selectedAssignment.id);
      const caseObj: TestCasesByCategory = {};
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
    this.setState({ submissionTests: result, loadingTests: false });
  };

  public runTests = async () => {
    if (this.state.submission) {
      const result = await Submission.run(this.state.submission.id);
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
    if (this.state.selectedAssignment !== null) {
      this.setState({ status: STATUS.SAVING }, () => {
        if (this.state.selectedAssignment !== null) {
          this.props
            .uploadSubmission(this.state.selectedAssignment!, this.state.selectedStudents, this.state.files)
            .then((newSubmission: StudentSubmissionType) => {
              this.setState({
                submission: newSubmission,
                status: this.props.isStudent && this.state.testCategories.length > 0 ? STATUS.TESTING : STATUS.COMPLETE,
                files: [],
                fileList: [],
                rejectedFiles: [],
                selectedStudents: this.props.selectedStudents,
                selectedAssignment: this.props.selectedAssignment ? this.props.selectedAssignment : undefined,
              });
            })
            .catch(() => {
              /* eslint-disable no-multi-str */
              message.error(
                'Sorry, something went wrong. Please try uploading again.\
                If the problem persists, contact the codePost tean.',
              );
              /* eslint-enable no-multi-str */
              this.cancel();
            });
        }
      });
    }
  };

  public getPath = (webkitRelativePath: string) => {
    const pathDirs = webkitRelativePath.split('/');
    const filePath = pathDirs.length > 2 ? pathDirs.slice(1, pathDirs.length - 1).join('/') : null;
    return filePath;
  };

  public onRemove = (file: any) => {
    const filePath = this.getPath(file.webkitRelativePath);
    const newFiles = this.state.files.filter((el) => {
      return el.name !== file.name || el.path !== filePath;
    });
    const newFileList = this.state.fileList.filter((el) => {
      const elPath = this.getPath(el.webkitRelativePath);
      return el.name !== file.name || elPath !== filePath;
    });

    this.setState({ files: newFiles, fileList: newFileList });
  };

  public changeStatus = (newStatus: STATUS) => {
    this.setState({ status: newStatus });
  };

  /* build a list of two student groups: missing submissions and not missing submissions */
  /* use these two groups to populate select */
  public buildStudentOptions = (
    students: string[],
    submissions: IStudentSubmissionsDataTable,
    assignment?: AssignmentType,
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
  public beforeUpload = (file: any, fileList: any) => {
    // Ignore hidden files
    if (file.name[0] === '.') {
      return false;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const extension = file.name.includes('.') ? file.name.split('.').slice(-1)[0] : '';
      if (!acceptedFilesSet.has(`.${extension}`)) {
        // message.error(`${file.name} cannot be uploaded because it is empty.`);
        const joined = this.state.rejectedFiles.concat(file.name);
        this.setState({ rejectedFiles: joined });
        return;
      }

      if (reader.result) {
        let result: any = reader.result;
        if (['png', 'jpeg', 'jpg'].includes(File.extension(file.name)) && typeof result === 'string') {
          result = await resizeImage(result);
        }

        const filePath = this.getPath(file.webkitRelativePath);
        const newFiles = this.state.files.filter((el) => {
          return el.name !== file.name || el.path !== filePath;
        });
        const newFileList = this.state.fileList.filter((el) => {
          const elPath = this.getPath(el.webkitRelativePath);
          return el.name !== file.name || elPath !== filePath;
        });
        const cleanedData = typeof result === 'string' ? result.replace(/\0/g, '') : result;
        this.setState({
          files: [
            ...newFiles,
            {
              name: file.name,
              data: cleanedData,
              path: filePath,
            },
          ],
          fileList: [...newFileList, file],
        });
      } else {
        message.error(`${file.name} cannot be uploaded because it is empty.`);
      }
    };

    if (['png', 'jpg', 'jpeg', 'pdf'].includes(File.extension(file.name))) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }

    // prevent upload
    return false;
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
          <TestsList
            tests={this.state.submissionTests}
            cases={this.state.testCases}
            categories={this.state.testCategories}
            isLoading={this.state.loadingTests}
          />
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

        const settingColumns = [
          { title: 'Setting', dataIndex: 'setting', key: 'setting' },
          { title: 'Toggle', dataIndex: 'toggle', key: 'toggle', align: 'center' as const },
        ];

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

        const fileList = (
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
        );

        // FIXME: make 'upload incomplete submission' a course setting
        content = (
          <div>
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
                accept={acceptedFilesString}
                directory={this.state.uploadDirectory}
              >
                <Button>
                  <Icon type="upload" /> Upload files
                </Button>
              </Upload>
            </div>
            {rejectedFiles}
          </div>
        );
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
        width={700}
        footer={[goBackButton, goForwardButton]}
      >
        {content}
      </Modal>
    );
  }
}
export default UploadSubmissionDialog;
