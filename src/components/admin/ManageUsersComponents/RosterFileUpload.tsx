import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import { Button, DialogContainer, FileUpload, LinearProgress } from 'react-md';

import { SectionType } from '../../../infrastructure/section';
import { ISectionNoStudents, USER_APP } from '../../../types/common';

interface IProps {
  users: string[];
  getSectionIDFromName: ((sectionName: string) => number | undefined) | null;
  sectionsByStudent: ({ [studentEmail: string]: ISectionNoStudents }) | null;
  addErrorToast: (text: string, action: string | undefined) => void;
  addToast: (text: string, action: string | undefined) => void;
  changeRoster: (newRoster: string[], userType: USER_APP) => Promise<void>;
  changeSectionStudents:
    | ((sectionID: number | undefined, students: string[], showToast: boolean) => Promise<SectionType>)
    | null;
  userType: USER_APP;
  isDisabled: boolean;
  emailUsers: boolean;
}

interface IStudentUpload {
  email: string;
  section: string;
}

interface IState {
  dialogVisible: boolean;
  uploadErrors: string[];
  updatingRoster: boolean;
  updates: { newUsers: string[]; deletedUsers: string[]; changedSections: IStudentUpload[] } | undefined;
  userList: string[];
  // for use in student upload because we need a richer data structure than just string array of emailsS
  studentSectionUpload: IStudentUpload[];
  uploadFileName: string | undefined;
}

class RosterFileUpload extends React.Component<IProps, {}> {
  public state: Readonly<IState> = {
    dialogVisible: false,
    uploadErrors: [],
    updatingRoster: false,
    updates: undefined,
    userList: [],
    studentSectionUpload: [],
    uploadFileName: undefined,
  };

  public toggleDialog = () => {
    const { dialogVisible } = this.state;
    this.setState({
      dialogVisible: !dialogVisible,
      uploadErrors: [],
      updates: undefined,
      updatingRoster: false,
      uploadFileName: undefined,
    });
  };

  // Function called upon downloading
  public downloadRoster = () => {
    const { users, sectionsByStudent, userType } = this.props;
    let dataToDownload;
    if (userType === USER_APP.Student && sectionsByStudent !== null) {
      dataToDownload = users.map((student) => {
        const thisSection = sectionsByStudent[student] ? sectionsByStudent[student].name : null;
        return { email: student, section: thisSection };
      });
    } else {
      dataToDownload = users;
    }
    const a = document.createElement('a');
    a.href = `data:attachment/json, ${JSON.stringify(dataToDownload)}`;
    a.download = `${USER_APP[userType]} roster.json`;

    document.body.appendChild(a);
    a.click();
    this.props.addToast('Roster downloaded.', undefined);
  };

  // Function called upon upload of a file; check to make sure it's a valid json Object
  // Then check for any roster errors
  // If any errors in the checking, append errors and display in dialog
  public onRosterUpload = (file: File, result: string) => {
    const { userType } = this.props;
    this.setState({ uploadErrors: [], uploadFileName: file.name });
    let roster;
    try {
      roster = JSON.parse(result);
    } catch (error) {
      this.setState({
        uploadErrors: ['Uploaded Roster is not a valid JSON object'],
        updates: undefined,
      });
      return;
    }

    let userList;
    // For student uploads, the roster type is a {email: string, section: string} object
    // For admins and graders, it's a string[] of emails
    if (userType === USER_APP.Student) {
      userList = roster.map((i: IStudentUpload) => {
        return i.email;
      });
    } else {
      userList = roster;
    }

    // upload Errors is a pre-processing of data to make sure it's valid before updating database
    // For students, we need the union of roster errors and section errors
    let uploadErrors = this.checkRoster(userList);
    if (userType === USER_APP.Student) {
      const sectionUploadErrors = this.checkSections(roster);
      uploadErrors = [...uploadErrors, ...sectionUploadErrors];
    }

    if (uploadErrors.length === 0) {
      // No upload errors
      this.setState({ updatingRoster: true, userList, updates: undefined });
      // If Student, update both roster and sections
      if (userType === USER_APP.Student) {
        this.setState({ studentSectionUpload: roster });
        Promise.all([this.updateRoster(userList, false), this.updateSections(roster, false)]).then(() => {
          this.setState({ updatingRoster: false });
        });
      } else {
        // If not student, only update roster
        this.updateRoster(userList, false).then(() => {
          this.setState({ updatingRoster: false });
        });
      }
    } else {
      // there are upload errors, notify the user and don't do anything
      this.setState({ uploadErrors, updates: undefined });
    }
  };

  // Check to make sure the uploaded file is a valid roster
  public checkRoster = (users: string[]) => {
    const uploadErrors: string[] = [];
    if (users) {
      const isStringArray = (i: any) => {
        return typeof i === 'string';
      };
      if (
        // check to make sure inputted array is a string array
        !(Array.isArray(users) && users.every(isStringArray))
      ) {
        if (this.props.userType === USER_APP.Student) {
          uploadErrors.push('Uploaded emails are not strings.');
        } else {
          uploadErrors.push('Uploaded roster is not a string array.');
        }
      } else {
        if (users.length === 0) {
          uploadErrors.push('User list is empty.');
        }
        users.map((user, index) => {
          if (user.length === 0) {
            uploadErrors.push(`User at index ${index} is empty.`);
          }
          let numDuplicates = 0;
          users.forEach((user2) => {
            if (user2 === user) {
              numDuplicates += 1;
            }
          });
          if (numDuplicates > 1) {
            uploadErrors.push(`Multiple users of the same name of ${user}.`);
          }
        });
      }
      return uploadErrors;
    }
    uploadErrors.push('Uploaded JSON object is empty.');
    return uploadErrors;
  };

  public checkSections = (data: IStudentUpload[]) => {
    const { getSectionIDFromName } = this.props;

    if (!getSectionIDFromName) {
      return [];
    }

    const uploadErrors: string[] = [];
    data.forEach((i: IStudentUpload) => {
      if (i.section) {
        if (!getSectionIDFromName(i.section)) {
          uploadErrors.push(
            `Section of name ${i.section} does not exist. Please go to the section tab to add the section.`,
          );
        }
      }
    });
    return uploadErrors;
  };

  // If makeDBUpdate === false, check to see what changes would be made and notify user
  // If makeDBUpdate === true, actually make the api calls to make the changes
  public updateRoster = (newUsers: string[], makeDBUpdate: boolean) => {
    const { users, changeRoster, userType } = this.props;
    const updates: { [index: string]: string[] } = {
      newUsers: [],
      deletedUsers: [],
    };
    users.forEach((user) => {
      if (newUsers.indexOf(user) === -1) {
        updates.deletedUsers.push(user);
      }
    });
    newUsers.forEach((user) => {
      if (users.indexOf(user) === -1) {
        updates.newUsers.push(user);
      }
    });
    if (makeDBUpdate) {
      return changeRoster(newUsers, userType);
    } else {
      this.setState({ updates });
      return Promise.resolve();
    }
  };

  // If makeDBUpdate === false, check to see what changes would be made and notify user
  // If makeDBUpdate === true, actually make the api calls to make the changes
  public updateSections = (newUsers: IStudentUpload[], makeDBUpdate: boolean) => {
    const { sectionsByStudent, getSectionIDFromName, changeSectionStudents } = this.props;

    if (sectionsByStudent === null || changeSectionStudents === null || getSectionIDFromName === null) {
      return Promise.reject();
    }

    // updatedSections is used to track changes to show to the user before continuing
    // newSections is the new student list for each section to pass to the API endpoint
    const updatedSections: IStudentUpload[] = [];
    const newSections: { [sectionID: number]: string[] } = {};
    newUsers.forEach((i: IStudentUpload) => {
      // We add section students via API with ID, so need to get the ID of the section
      const sectionID = getSectionIDFromName(i.section);
      const currentSection = sectionsByStudent[i.email];
      if ((currentSection && i.section !== currentSection.name) || (i.section && !currentSection)) {
        updatedSections.push({ email: i.email, section: i.section });
      }
      if (sectionID) {
        if (newSections[sectionID]) {
          newSections[sectionID].push(i.email);
        } else {
          newSections[sectionID] = [i.email];
        }
      }
    });
    // If user has agreed to chnages, make the changes
    if (makeDBUpdate) {
      return Promise.all(
        Object.keys(newSections).map((sectionID: string) => {
          const students = newSections[sectionID];
          // Javscript sets all keys to a string, so need to cast
          const sectionIDNumber = Number(sectionID);
          return changeSectionStudents(sectionIDNumber, students, false);
        }),
      ).then(() => {
        return Promise.resolve();
      });
    } else {
      // If user has not agreed to the changes, show them to the user
      const { updates } = this.state;
      if (updates) {
        const newKey = 'changedSections';
        updates[newKey] = updatedSections;
        this.setState({ updates });
      } else {
        this.setState({ updates: { changedSections: updatedSections } });
      }
      return Promise.resolve();
    }
  };

  // Once the user has seen and proceeded with the changes, trigger an update with
  // makeDBUpdate = true
  public triggerUpdate = () => {
    const newUsers = this.state.updates && this.state.updates.newUsers && this.state.updates.newUsers.length > 0;
    const deletedUsers =
      this.state.updates && this.state.updates.deletedUsers && this.state.updates.deletedUsers.length > 0;
    const changedSections =
      this.state.updates && this.state.updates.changedSections && this.state.updates.changedSections.length > 0;

    this.setState({ updatingRoster: true, updates: undefined }, () => {
      if (newUsers || deletedUsers) {
        // If Student, update the roster, then update the sections
        this.updateRoster(this.state.userList, true).then(() => {
          if (changedSections) {
            this.updateSections(this.state.studentSectionUpload, true).then(() => {
              this.setState({ updatingRoster: false });
              this.toggleDialog();
            });
          } else {
            this.setState({ updatingRoster: false });
            this.toggleDialog();
          }
        });
      } else if (changedSections) {
        this.updateSections(this.state.studentSectionUpload, true).then(() => {
          this.setState({ updatingRoster: false });
          this.toggleDialog();
        });
      }
    });
  };

  public dummyUpload = (file: File) => {
    return;
  };

  // User flow is (Download, Upload).
  //   On Upload: check for errors, and if errors notify user
  //              if no errors, see what changes will be made to the course and notify user
  //              If the user agrees, make the api calls to make changes to course
  //   On Download: Trigger download of json file

  public render() {
    const { dialogVisible, updates, uploadErrors } = this.state;
    const { userType } = this.props;
    const dialogActions = [];
    dialogActions.push({
      secondary: true,
      children: 'Cancel',
      onClick: this.toggleDialog,
      className: 'roster-upload__cancelBtn',
      disabled: this.state.updatingRoster,
    });

    const errors =
      uploadErrors.length > 0 ? (
        <div className="roster-upload__error">
          <div className="roster-upload__error-title">
            The uploaded file has the following <b>errors:</b>
          </div>
          {uploadErrors.map((error, index) => {
            return (
              <div className="roster-upload__error-text" key={index}>
                {error}
              </div>
            );
          })}
        </div>
      ) : (
        <div />
      );

    const changes = [];
    let updateMessage;
    if (updates) {
      if (updates.newUsers && updates.newUsers.length > 0) {
        changes.push(
          <div className="roster-upload__changes-container">
            <div className="roster-upload__changes-title">
              {`${USER_APP[userType]}(s) to be `}
              <b>added</b> to the <b>course</b>
            </div>
            {updates.newUsers.map((elem: string, index: number) => {
              return (
                <div className="roster-upload__changes-text" key={index}>
                  {elem}
                </div>
              );
            })}
          </div>,
        );
      }

      if (updates.deletedUsers && updates.deletedUsers.length > 0) {
        changes.push(
          <div className="roster-upload__changes-container">
            <div className="roster-upload__changes-title">
              {`${USER_APP[userType]}(s) to be `}
              <b>removed</b> from the <b>course</b>
            </div>
            {updates.deletedUsers.map((elem, index) => {
              return (
                <div className="roster-upload__changes-text" key={index}>
                  {elem}
                </div>
              );
            })}
          </div>,
        );
      }

      if (updates.changedSections && updates.changedSections.length > 0) {
        changes.push(
          <div className="roster-upload__changes-container">
            <div className="roster-upload__changes-title">
              {`${USER_APP[userType]}(s) to be `}
              <b>added</b> to a <b>new section</b>
            </div>
            {updates.changedSections.map((elem, index) => {
              return (
                <div className="roster-upload__changes-text" key={index}>
                  {`${elem.email}: ${elem.section}`}
                </div>
              );
            })}
          </div>,
        );
      }

      if (changes.length > 0) {
        updateMessage = (
          <div className="roster-upload__changesHeader-container">
            <div className="roster-upload__changesHeader-title">
              The changes below will be made to the roster. Do you want to continue?
            </div>
            <Button
              className="roster-upload__changesHeader-button"
              raised
              onClick={this.triggerUpdate}
              primary={true}
              flat={true}
            >
              Continue with changes
            </Button>
          </div>
        );
      } else {
        updateMessage = (
          <div className="roster-upload__changesHeader-container">
            <div className="roster-upload__changesHeader-title">
              The uploaded roster has no changes to the current roster.
            </div>
          </div>
        );
      }
    }
    let exampleText;
    if (userType === USER_APP.Student) {
      exampleText =
        '    [\n    {"email": "user1@emaildomain.edu", "section": "P01"},\n\
    {"email": "user1@emaildomain.edu", "section": null},\n    ...\n    ]';
    } else {
      exampleText = '    [\n    "user1@emaildomain.edu", \n    "user2@emaildomain.edu",\n    ...\n    ]';
    }
    return (
      <div>
        <Button
          raised={true}
          onClick={this.toggleDialog}
          primary={true}
          iconChildren={'vertical_align_center'}
          iconBefore={false}
          className={'manageUsers__rosterUpload'}
          disabled={this.props.isDisabled}
        >
          {`${USER_APP[userType]} Roster: Upload / Download`}
        </Button>
        <DialogContainer
          id="dialog--rosterUpload"
          className="dialog--rosterUpload"
          visible={dialogVisible}
          title={`${USER_APP[userType]}: Manage roster files`}
          onHide={this.toggleDialog}
          actions={dialogActions}
          modal
          component={'object'}
          portal={true}
        >
          {!this.state.uploadFileName ? (
            <div className="roster-upload__fileDownload-container">
              <div className="roster-upload__fileUpload-text">
                <div className="roster-upload__fileDownload-strong">Download </div>
                {`${USER_APP[userType]} roster as a json format`}
              </div>
              <Button
                key="download-roster"
                className="roster-upload__fileDownload-button"
                iconBefore={false}
                iconChildren={'save'}
                onClick={this.downloadRoster}
                primary={true}
                raised={true}
                disabled={this.props.users.length === 0}
              >
                Download JSON roster
              </Button>
            </div>
          ) : (
            <div />
          )}
          <div>
            {!this.state.uploadFileName ? (
              <div className="roster-upload__fileUpload-container">
                <div className="roster-upload__fileUpload-text">
                  <div className="roster-upload__fileUpload-strong">Upload </div>
                  {`file to replace ${USER_APP[userType]} roster`}
                </div>
                <div className="roster-upload__fileUpload-explanationText">
                  {`Please make sure that the uploaded file is in the following format.${
                    userType === USER_APP.Student
                      ? ' The section field is optional and can be excluded or set to null if not applicable.'
                      : ''
                  }`}
                </div>
                <ReactMarkdown className="roster-upload__fileUpload-markdown" source={exampleText} />
                <FileUpload
                  id="rosterUpload-FileInput"
                  accept="application/json"
                  className="roster-upload__fileUpload-button"
                  multiple={false}
                  onLoad={this.onRosterUpload}
                  onChange={this.dummyUpload}
                  disabled={this.state.updatingRoster}
                />
              </div>
            ) : (
              <div />
            )}
            {this.state.updatingRoster ? <LinearProgress id="circle" className="progressCircle" /> : ''}
            {this.state.uploadFileName ? (
              <div className="roster-upload__fileName">{`Uploaded file: ${this.state.uploadFileName}`}</div>
            ) : (
              ''
            )}
            <div className="roster-upload__emailUsers">
              New users added <b>will {this.props.emailUsers ? '' : 'not'} be emailed.</b> To change this please see the
              Course Settings panel.
            </div>
            {errors}
            {updateMessage}
            {changes}
          </div>
        </DialogContainer>
      </div>
    );
  }
}
export default RosterFileUpload;
