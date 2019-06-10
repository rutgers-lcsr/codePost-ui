/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* style imports */
import {
  Alert,
  Badge,
  Button,
  Collapse,
  Divider,
  Icon,
  Modal,
  Spin,
  Steps,
  Table,
  Tooltip,
  Typography,
  Upload,
} from 'antd';
const { Step } = Steps;

/* other library imports */
import ReactMarkdown from 'react-markdown';

/* codePost imports */

// type definitions
import { SectionType } from '../../../../infrastructure/section';
import { USER_APP } from '../../../../types/common';

import CPButton from '../../../../components/core/CPButton';

/**********************************************************************************************************************/

/*****************************************************/
/* Here's how this component works:
/* (1) Accept .json or .csv
/* (2) Parse file for errors
/* (3) If no errors, calculate diff between uploaded file and existing roster
/* (4) If user accepts diff, execute changes
/*****************************************************/

/* keep track of which step we're on  */
enum UPLOAD_STATUS {
  UPLOAD,
  REVIEW,
  SAVE,
}

/* format in which we expect student roster to be uploaded */
interface IStudentUpload {
  email: string;
  section: string | null;
}

/* format in which we expect student roster to be uploaded */
interface IUserUpload {
  email: string;
}

/* format in which we store information about the difference between two rosters:
 * the one uploaded by the user, and the one currently saved in codePost.
 */
interface IChangeType {
  deleted: { [studentEmail: string]: { properties: object } };
  added: { [studentEmail: string]: { properties: object } };

  /* old and new keys map to objects which can store arbitrary properties of
   * users, which have changed. For now, the object corresponds to {section: sectionName}
   */
  changed: { [studentEmail: string]: { old: object; new: object } };
}

/* format which we expect uploaded roster to take */
interface IUploadType {
  students?: IStudentUpload[];
  graders?: IUserUpload[];
  admins?: IUserUpload[];
}

/* format which we transform the old and new roster into to facilitate comparison */
interface IRosterType {
  students?: Map<string, object>;
  graders?: Map<string, object>;
  admins?: Map<string, object>;
}

interface IProps {
  /* data */
  students: string[];
  graders: string[];
  admins: string[];
  sections: SectionType[];
  sectionsByStudent: { [studentEmail: string]: SectionType };

  /* UI control */
  isDisabled: boolean;
  emailUsers: boolean;

  /* object level REST operations */
  changeRoster: (newRoster: string[], userType: USER_APP) => Promise<void>;
  updateStudentSection: (student: string, section: number) => Promise<void>;
  createSection: (sectionName: string) => Promise<void>;
}

interface IState {
  /* if false, only button will be shown */
  dialogVisible: boolean;

  /* errors parsed from uploaded roster */
  uploadErrors: string[];

  /* are we in the process of updating roster? Show loading status, if so */
  updatingRoster: boolean;

  /* updates that will be made if uploaded roster is confirmed by user */
  updates: { students: IChangeType; graders: IChangeType; admins: IChangeType };

  /* name of the uploaded file (to display back to the user for comfort) */
  fileName: string;

  /* which step of the upload process are we on? */
  status: UPLOAD_STATUS;

  /* new roster from uploaded file */
  newRoster?: IRosterType;
}

class RosterFileUpload extends React.Component<IProps, {}> {
  public state: Readonly<IState> = {
    dialogVisible: false,
    uploadErrors: [],
    updates: {
      students: { deleted: {}, changed: {}, added: {} },
      graders: { deleted: {}, changed: {}, added: {} },
      admins: { deleted: {}, changed: {}, added: {} },
    },
    updatingRoster: false,
    status: UPLOAD_STATUS.UPLOAD,
    fileName: '',
  };

  private exampleJSON = `    students: [\n    \t{"email": "student0@myschool.edu", "section": "P01"},\n\
    \t{"email": "student1@myschool.edu", "section": "null"},\n    \t...\n    ],
    graders: [\n    \t{"email": "grader0@myschool.edu"},\n\
    \t{"email": "grader1@myschool.edu"},\n    \t...\n    ],
    admins: [\n    \t{"email": "admin0@myschool.edu"},\n\
    \t{"email": "admin1@myschool.edu"},\n    \t...\n    ]`;

  private exampleCSV = `    role,email,section\n\
    student,student0@myschool.edu,P01\n\
    student,student0@myschool.edu,null\n\
    ...\n\
    grader,grader0@myschool.edu,\n\
    grader,grader0@myschool.edu,\n\
    ...\n\
    admin,admin0@myschool.edu,\n\
    admin,admin10@myschool.edu,\n\
    ...\n\ `;

  public componentDidUpdate(prevProps: IProps, prevState: IState) {
    // clear information from modal after it is unmounted, so appearance
    // doesn't change during the unmounting process
    if (prevState.dialogVisible && !this.state.dialogVisible) {
      this.setState({
        uploadErrors: [],
        status: UPLOAD_STATUS.UPLOAD,
        updates: {
          students: { deleted: {}, changed: {}, added: {} },
          graders: { deleted: {}, changed: {}, added: {} },
          admins: { deleted: {}, changed: {}, added: {} },
        },
        updatingRoster: false,
        fileName: '',
      });
    }
  }

  public toggleDialog = () => {
    const { dialogVisible } = this.state;
    this.setState({
      dialogVisible: !dialogVisible,
    });
  };

  public changeStatus = (newStatus: UPLOAD_STATUS) => {
    this.setState({ status: newStatus });
  };

  public convertCSVtoJSON = (csv: string) => {
    /*
     * Schema:
     * role,email,section
     * note: section only appears if role=student
     */
    const columns = 'role,email,section';
    const csvLines = csv.split('\n');

    /* is file empty */
    if (csvLines.length === 0) {
      throw new Error('CSV is empty');
    }

    /* does first row have the format we would expect of a CSV? */
    if (csvLines[0].trim() !== columns) {
      throw new Error('First line has an incorrect format.');
    }

    const toRet: IUploadType = {
      students: [],
      graders: [],
      admins: [],
    };
    for (const line of csvLines) {
      const tokens = line.replace(/['"]+/g, '').split(',');
      if (tokens.length !== 3) {
        throw new Error('Incorrect row detected');
      } else {
        switch (tokens[0]) {
          case 'student':
            // make sure to handle case where "null" string corresponds to no section
            toRet.students!.push({ email: tokens[1], section: tokens[2] === 'null' ? null : tokens[2] });
            break;
          case 'grader':
            toRet.graders!.push({ email: tokens[1] });
            break;
          case 'admin':
            toRet.admins!.push({ email: tokens[1] });
            break;
        }
      }
    }

    if (toRet.students!.length === 0) {
      delete toRet.students;
    }
    if (toRet.graders!.length === 0) {
      delete toRet.graders;
    }
    if (toRet.admins!.length === 0) {
      delete toRet.admins;
    }

    return toRet;
  };

  public getSectionIDFromName = (sectionName: string) => {
    if (typeof sectionName === null || sectionName === null) {
      return undefined;
    }

    const thisSection = this.props.sections.find((section) => {
      return section.name.trim() === sectionName.trim();
    });
    return thisSection ? thisSection.id : undefined;
  };

  public updateRoster = () => {
    const diff = this.state.updates;
    const { students, graders, admins } = this.props;

    this.setState({ updatingRoster: true, status: UPLOAD_STATUS.SAVE }, () => {
      if ('students' in diff) {
        /* remove and add users */
        const newStudents = [
          ...students.filter((student) => {
            return !Object.keys(diff.students.deleted).includes(student);
          }),
          ...Object.keys(diff.students.added),
        ];
        this.props.changeRoster(newStudents, USER_APP.Student);

        /* Set sections of added students */
        for (const addedStudent of Object.keys(diff.students.added)) {
          const newSectionName = diff.students.added[addedStudent]['section'].name;
          if (newSectionName !== this.props.sectionsByStudent[addedStudent]) {
            const sectionID = this.getSectionIDFromName(newSectionName);
            if (sectionID) {
              this.props.updateStudentSection(addedStudent, sectionID);
            } else {
              this.props.createSection(newSectionName).then(() => {
                this.props.updateStudentSection(addedStudent, this.getSectionIDFromName(newSectionName)!);
              });
            }
          }
        }

        /* update sections of changed students */
        for (const changedStudent of Object.keys(diff.students.changed)) {
          const newSectionName: string = diff.students.changed[changedStudent].new['section'];
          const sectionID = this.getSectionIDFromName(newSectionName);
          if (sectionID) {
            this.props.updateStudentSection(changedStudent, sectionID);
          } else {
            this.props.createSection(newSectionName).then(() => {
              this.props.updateStudentSection(changedStudent, this.getSectionIDFromName(newSectionName)!);
            });
          }
        }
      }

      if ('graders' in diff) {
        const newGraders = [
          ...graders.filter((grader) => {
            return !Object.keys(diff.graders.deleted).includes(grader);
          }),
          ...Object.keys(diff.graders.added),
        ];
        this.props.changeRoster(newGraders, USER_APP.Grader);
      }

      if ('admins' in diff) {
        const newAdmins = [
          ...admins.filter((admin) => {
            return !Object.keys(diff.admins.deleted).includes(admin);
          }),
          ...Object.keys(diff.admins.added),
        ];
        this.props.changeRoster(newAdmins, USER_APP.CourseAdmin);
      }

      /* update status */
      this.setState({ updatingRoster: false });
    });
  };

  public rosterDiff = (oldRoster: IRosterType, newRoster: IRosterType) => {
    /* used for determining whether a user's details have changed */
    const shallowCompare = (obj1: any, obj2: any) =>
      Object.keys(obj1).length === Object.keys(obj2).length &&
      Object.keys(obj1).every((key) => {
        return obj2.hasOwnProperty(key) && obj1[key] === obj2[key];
      });

    const keys = Object.keys(newRoster);
    const toRet = {};
    for (const key of keys) {
      const oldList: string[] = Array.from(oldRoster[key].keys());
      const newList: string[] = Array.from(newRoster[key].keys());

      /* calculate changed users and removed users */
      const deletedList = {};
      const changedList = {};
      for (const user of oldList) {
        if (!newList.includes(user)) {
          deletedList[user] = oldRoster[key].get(user);
        } else {
          if (!shallowCompare(oldRoster[key].get(user), newRoster[key].get(user))) {
            changedList[user] = {
              old: oldRoster[key].get(user),
              new: newRoster[key].get(user),
            };
          }
        }
      }

      /* calculate added users */
      const addedList = {};
      for (const user of newList) {
        if (!oldList.includes(user)) {
          addedList[user] = newRoster[key].get(user);
        }
      }
      toRet[key] = {
        deleted: deletedList,
        added: addedList,
        changed: changedList,
      };
    }

    return toRet;
  };

  // Check to make sure the uploaded file is a valid roster
  public checkRoster = (roster: IRosterType) => {
    const uploadErrors: string[] = [];
    const keys = Object.keys(roster);

    /* check to make sure uploaded roster isn't empty */
    let isEmpty = true;
    for (const key of keys) {
      if (key in roster && roster[key].size > 0) {
        isEmpty = false;
        break;
      }
    }
    if (isEmpty) {
      uploadErrors.push('Uploaded roster is empty.');
      return uploadErrors;
    }

    // FIXME: add more tests here

    return uploadErrors;
  };

  public transformNewRoster = (newRoster: IUploadType): IRosterType => {
    const keys = ['students', 'graders', 'admins'];
    const transformed = keys.map((key) => {
      const toRet = new Map();
      if (key in newRoster) {
        const users = newRoster[key];
        for (const user of users) {
          const { ['email']: emailString, ...userProperties } = user;
          toRet.set(emailString, userProperties);
        }
      }
      return toRet;
    });

    const transformedRoster = {};
    if ('students' in newRoster) {
      transformedRoster['students'] = transformed[0];
    }
    if ('graders' in newRoster) {
      transformedRoster['graders'] = transformed[1];
    }
    if ('admins' in newRoster) {
      transformedRoster['admins'] = transformed[2];
    }
    return transformedRoster;
  };

  public transformOldRoster = (
    students: string[],
    graders: string[],
    admins: string[],
    sectionsByStudent: { [studentEmail: string]: SectionType },
  ): IRosterType => {
    const studentMap = new Map();
    for (const student of students) {
      studentMap.set(student, {
        section: sectionsByStudent[student] ? sectionsByStudent[student].name : null,
      });
    }

    const graderMap = new Map();
    for (const grader of graders) {
      graderMap.set(grader, {});
    }

    const adminMap = new Map();
    for (const admin of admins) {
      adminMap.set(admin, {});
    }

    return {
      students: studentMap,
      graders: graderMap,
      admins: adminMap,
    };
  };

  // Function called immediately after an uploaded file is read
  public onRosterUpload = (file: File, result: string) => {
    this.setState(
      {
        updates: {
          students: { deleted: [], changed: {}, added: [] },
          graders: { deleted: [], changed: {}, added: [] },
          admins: { deleted: [], changed: {}, added: [] },
        },
        fileName: file.name,
        newRoster: undefined,
      },
      () => {
        let roster;

        try {
          switch (file.name.split('.')[1]) {
            case 'json':
              roster = JSON.parse(result);
              break;
            case 'csv':
              roster = this.convertCSVtoJSON(result);
              break;
            default:
              throw new Error('Unsupported file format.');
          }
        } catch (error) {
          this.setState({
            uploadErrors: [error.toString()],
            status: UPLOAD_STATUS.REVIEW,
            fileName: file.name,
          });
          return;
        }

        /* transform roster object into a more flexible data structure */
        /* Map(email, other information) */
        const newRoster = this.transformNewRoster(roster);

        /* make sure newRoster is free of errors */
        const uploadErrors = this.checkRoster(newRoster);
        if (uploadErrors.length > 0) {
          this.setState({ status: UPLOAD_STATUS.REVIEW, uploadErrors });
        }

        /* calculate diff between old and new roster */
        const oldRoster = this.transformOldRoster(
          this.props.students,
          this.props.graders,
          this.props.admins,
          this.props.sectionsByStudent,
        );
        const diff = this.rosterDiff(oldRoster, newRoster);
        this.setState({ status: UPLOAD_STATUS.REVIEW, updates: diff, newRoster, uploadErrors: [] });
      },
    );
  };

  public changedStudentsToJSX = (changes: IChangeType) => {
    const diffItems = [
      {
        title: 'Deleted: ',
        items: Object.keys(changes.deleted),
        key: 'deleted',
      },
      {
        title: 'Added: ',
        items: Object.keys(changes.added),
        key: 'added',
      },
      {
        title: 'Changed: ',
        items: Object.keys(changes.changed),
        changedKey: 'sections',
        key: 'changed',
      },
    ];

    let addingSections = false;

    return (
      <div>
        {diffItems.map((diffItem, i) => {
          if (diffItem.items.length === 0) {
            return (
              <div key={i}>
                <br />
                <h5>{diffItem.title}</h5>
              </div>
            );
          }

          let columns = [
            {
              title: 'Email',
              dataIndex: 'email',
              key: 'email',
            },
          ];

          if (diffItem.key === 'changed') {
            columns = [
              ...columns,
              {
                title: 'Changed from',
                dataIndex: 'from',
                key: 'from',
              },
              {
                title: 'Changed to',
                dataIndex: 'to',
                key: 'to',
              },
            ];
          } else {
            columns = [
              ...columns,
              {
                title: 'Section',
                dataIndex: 'section',
                key: 'section',
              },
            ];
          }

          const dataSource = diffItem.items.map((el: any, j: number) => {
            if (diffItem.title === 'Changed: ') {
              let toSectionName = changes.changed[el].new['section'];
              if (toSectionName === null) {
                toSectionName = 'No section';
              } else if (!this.getSectionIDFromName(toSectionName)) {
                toSectionName = `${toSectionName}*`;
                addingSections = true;
              }

              let fromSectionName = changes.changed[el].old['section'];
              if (fromSectionName === null) {
                fromSectionName = 'No section';
              }

              return {
                email: el,
                from: `Section: ${fromSectionName}`,
                to: `Section: ${toSectionName}`,
              };
            } else {
              let sectionName = changes[diffItem.key][el].section;
              if (sectionName === null) {
                sectionName = 'No section';
              } else if (!this.getSectionIDFromName(sectionName)) {
                sectionName = `${sectionName}*`;
                addingSections = true;
              }
              return { email: el, section: sectionName };
            }
          });

          return (
            <div key={i}>
              <br />
              <h5>{diffItem.title}</h5>
              <Table pagination={false} style={{ lineHeight: 1 }} dataSource={dataSource} columns={columns} />
            </div>
          );
        })}
        <span>
          {addingSections ? (
            <div>
              <br />
              <p>* these sections will be created if you continue</p>
            </div>
          ) : null}
        </span>
      </div>
    );
  };

  public changesToJSX = (changes: IChangeType) => {
    const diffItems = [
      {
        title: 'Deleted: ',
        items: Object.keys(changes.deleted),
      },
      {
        title: 'Added: ',
        items: Object.keys(changes.added),
      },
      {
        title: 'Changed: ',
        items: Object.keys(changes.changed),
        changedKey: 'sections',
      },
    ];

    return (
      <div>
        {diffItems.map((diffItem, i) => {
          if (diffItem.items.length === 0) {
            return (
              <div key={i}>
                <br />
                <h5>{diffItem.title}</h5>
              </div>
            );
          }

          const columns = [
            {
              title: 'Email',
              dataIndex: 'email',
              key: 'email',
            },
          ];

          const dataSource = diffItem.items.map((el: any, j: number) => {
            return { email: el };
          });

          return (
            <div key={i}>
              <br />
              <h5>{diffItem.title}</h5>
              <Table pagination={false} style={{ lineHeight: 1 }} dataSource={dataSource} columns={columns} />
            </div>
          );
        })}
      </div>
    );
  };

  public beforeUpload = (file: any, fileList: any) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        this.onRosterUpload(file, reader.result);
      }
    };
    reader.readAsText(file);

    // prevent Ant upload component from trying to post file
    return false;
  };

  public render() {
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

    // content encodes the modal's content BELOW the steps component
    let content;
    switch (this.state.status) {
      case UPLOAD_STATUS.UPLOAD:
        content = (
          <div>
            {' '}
            To upload your roster, upload either a <Typography.Text code>.json</Typography.Text> or a{' '}
            <Typography.Text code>.csv</Typography.Text> file in the format described below. You'll have the chance to
            review any changes before they are made after uploading your file.
            <br />
            <br />
            <Collapse bordered={true} accordion={true}>
              <Collapse.Panel header="JSON" key="1">
                <ReactMarkdown source={this.exampleJSON} />
              </Collapse.Panel>
              <Collapse.Panel header="CSV" key="2">
                <ReactMarkdown source={this.exampleCSV} />
              </Collapse.Panel>
            </Collapse>
            <br />
            <Upload beforeUpload={this.beforeUpload} showUploadList={false}>
              <Button>
                <Icon type="upload" /> Click to Upload
              </Button>
            </Upload>
          </div>
        );
        break;
      case UPLOAD_STATUS.REVIEW:
        if (this.state.uploadErrors.length === 0) {
          const uploadedStudents = 'students' in this.state.newRoster!;
          const uploadedGraders = 'graders' in this.state.newRoster!;
          const uploadedAdmins = 'admins' in this.state.newRoster!;

          const sections = [
            {
              title: 'Students',
              key: 'students',
              present: uploadedStudents,
            },
            {
              title: 'Graders',
              key: 'graders',
              present: uploadedGraders,
            },
            {
              title: 'Admins',
              key: 'admins',
              present: uploadedAdmins,
            },
          ];

          content = (
            <div>
              <Divider orientation="left">Status</Divider>
              <Alert message="Your roster was parsed successfully!" type="success" />
              <br />
              <b>Uploaded file:</b> <em>{this.state.fileName}</em>
              <br />
              <b>Users parsed in uploaded file:</b>
              <ul>
                <li>
                  Students:{' '}
                  {uploadedStudents ? this.state.newRoster!.students!.size : 'No students detected in uploaded roster'}
                </li>
                <li>
                  Graders:{' '}
                  {uploadedGraders ? this.state.newRoster!.graders!.size : 'No graders detected in uploaded roster'}
                </li>
                <li>
                  Admins:{' '}
                  {uploadedAdmins ? this.state.newRoster!.admins!.size : 'No admins detected in uploaded roster'}
                </li>
              </ul>
              <Divider orientation="left">Changes</Divider>
              <Collapse accordion bordered={true}>
                {sections
                  .filter((section, i) => section.present)
                  .map((section, i) => {
                    let sectionContent;

                    if (section.key === 'students') {
                      sectionContent = this.changedStudentsToJSX(this.state.updates[section.key]);
                    } else {
                      sectionContent = this.changesToJSX(this.state.updates[section.key]);
                    }

                    return (
                      <Collapse.Panel
                        header={
                          <div>
                            {section.title} &nbsp;
                            <Badge count={this.state.updates[section.key].deleted.length} />
                            <Badge
                              style={{ backgroundColor: '#f4d942' }}
                              count={Object.keys(this.state.updates[section.key].changed).length}
                            />
                            <Badge
                              style={{ backgroundColor: '#52c41a' }}
                              count={this.state.updates[section.key].added.length}
                            />
                          </div>
                        }
                        key={i.toString()}
                      >
                        {sectionContent}
                      </Collapse.Panel>
                    );
                  })}
              </Collapse>
            </div>
          );
        } else {
          content = (
            <div>
              <Alert
                message="The roster you uploaded could not be parsed correctly due to the errors below"
                type="error"
              />
              <br />
              <b>Uploaded file:</b> <em>{this.state.fileName}</em>
              <br />
              <b>Errors:</b>
              <ul>
                {this.state.uploadErrors.map((el, i) => {
                  return <li key={i}>{el}</li>;
                })}
              </ul>
              <br />
              <br />
              <Upload beforeUpload={this.beforeUpload} showUploadList={false}>
                <Button>
                  <Icon type="upload" /> Click to upload again
                </Button>
              </Upload>
            </div>
          );
        }
        break;
      case UPLOAD_STATUS.SAVE:
        if (this.state.updatingRoster) {
          content = (
            <div>
              Updating your roster... <Spin />
            </div>
          );
        } else {
          content = <div>Your rosted was successfully updated!</div>;
        }
        break;
    }

    // modal's back button
    let goBackButton;
    switch (this.state.status) {
      case UPLOAD_STATUS.UPLOAD:
        goBackButton = (
          <Button key="back" onClick={this.toggleDialog}>
            Cancel
          </Button>
        );
        break;
      case UPLOAD_STATUS.REVIEW:
        goBackButton = (
          <Button key="back" onClick={this.changeStatus.bind(this, UPLOAD_STATUS.UPLOAD)}>
            Back
          </Button>
        );
        break;
      case UPLOAD_STATUS.SAVE:
        goBackButton = (
          <Button key="back" type="primary" onClick={this.toggleDialog}>
            Close
          </Button>
        );
        break;
    }

    // modal's forward button
    let goForwardButton = null;
    if (this.state.status === UPLOAD_STATUS.REVIEW) {
      if (this.state.uploadErrors.length > 0) {
        goForwardButton = (
          <Tooltip key="submit" title={'You must fix all errors before proceeding.'}>
            <Button key="submit" type="primary" disabled={true}>
              Continue
            </Button>
          </Tooltip>
        );
      } else {
        goForwardButton = (
          <Button key="submit" type="primary" onClick={this.updateRoster}>
            Confirm
          </Button>
        );
      }
    }

    return (
      <div>
        <CPButton icon="upload" cpType="secondary" onClick={this.toggleDialog}>
          {'Upload roster'}
        </CPButton>
        <Modal
          visible={this.state.dialogVisible}
          onCancel={this.toggleDialog}
          title={'Upload roster'}
          width={700}
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
      </div>
    );
  }
}
export default RosterFileUpload;
