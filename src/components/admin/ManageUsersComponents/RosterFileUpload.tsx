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
  changeStudentSection:
    | ((sectionID: number | undefined, studentEmail: string, showToast: boolean) => Promise<SectionType>)
    | null;
  userType: USER_APP;
  isDisabled: boolean;
}

interface IStudentUpload {
  email: string;
  section: string;
}

interface IState {
  dialogVisible: boolean;
  uploadErrors: string[];
  updatingRoster: boolean;
  updates: { [index: string]: string[] } | undefined;
  userList: string[];
  jsonUpload: IStudentUpload[];
  uploadFileName: string | undefined;
}

class RosterFileUpload extends React.Component<IProps, {}> {
  public state: Readonly<IState> = {
    dialogVisible: false,
    uploadErrors: [],
    updatingRoster: false,
    updates: undefined,
    userList: [],
    jsonUpload: [],
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
    if (userType === USER_APP.Student) {
      userList = roster.map((i: IStudentUpload) => {
        return i.email;
      });
    } else {
      userList = roster;
    }

    let uploadErrors = this.isRoster(userList);
    if (userType === USER_APP.Student) {
      const sectionUploadErrors = this.checkSections(roster);
      uploadErrors = [...uploadErrors, ...sectionUploadErrors];
    }

    if (uploadErrors.length === 0) {
      this.setState({ updatingRoster: true, userList, updates: undefined });
      // If Student, update both roster and sections
      if (userType === USER_APP.Student) {
        this.setState({ jsonUpload: roster });
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
      this.setState({ uploadErrors, updates: undefined });
    }
  };

  // Check to make sure the uploaded file is a valid roster
  public isRoster = (users: string[]) => {
    const uploadErrors: string[] = [];
    if (users) {
      if (users.length === 0) {
        uploadErrors.push('User list is empty');
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
          uploadErrors.push(`Multiple users of the same name of ${user}`);
        }
      });
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
          uploadErrors.push(`Section of name ${i.section} does not exist.`);
        }
      }
    });
    return uploadErrors;
  };

  // If makeDBUpdate === false, check to see what changes would be makeDBUpdate
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

  // If makeDBUpdate === false, check to see what changes would be makeDBUpdate
  // If makeDBUpdate === true, actually make the api calls to make the changes
  public updateSections = (newUsers: IStudentUpload[], makeDBUpdate: boolean) => {
    const { sectionsByStudent, getSectionIDFromName, changeStudentSection } = this.props;

    if (sectionsByStudent === null || changeStudentSection === null || getSectionIDFromName === null) {
      return Promise.reject();
    }

    const updatedSections: string[] = [];
    const studentsToChange: IStudentUpload[] = [];
    newUsers.forEach((i: IStudentUpload) => {
      const currentSection = sectionsByStudent[i.email];
      if ((currentSection && i.section !== currentSection.name) || (i.section && !currentSection)) {
        updatedSections.push(i.email);
        studentsToChange.push(i);
      }
    });
    if (makeDBUpdate) {
      return Promise.all(
        studentsToChange.map((i: IStudentUpload) => {
          const sectionID = getSectionIDFromName(i.section);
          return changeStudentSection(sectionID, i.email, false);
        }),
      ).then(() => {
        return Promise.resolve();
      });
    } else {
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
            this.updateSections(this.state.jsonUpload, true).then(() => {
              this.setState({ updatingRoster: false });
              this.toggleDialog();
            });
          } else {
            this.setState({ updatingRoster: false });
            this.toggleDialog();
          }
        });
      } else if (changedSections) {
        this.updateSections(this.state.jsonUpload, true).then(() => {
          this.setState({ updatingRoster: false });
          this.toggleDialog();
        });
      }
    });
  };

  public dummyUpload = (file: File) => {
    return;
  };

  public render() {
    const { dialogVisible, updates } = this.state;
    const { userType } = this.props;
    const dialogActions = [];
    dialogActions.push({
      secondary: true,
      children: 'Cancel',
      onClick: this.toggleDialog,
      disabled: this.state.updatingRoster,
    });

    const errors = this.state.uploadErrors.map((error, index) => {
      return (
        <div key={index}>
          <div className="uploadErrorText">{error}</div>
          <div className="error-padding" />
        </div>
      );
    });

    let updateMessage;
    let newUsers;
    let deletedUsers;
    let changedSections;
    let shouldUpdate = false;

    if (updates) {
      if (updates.newUsers && updates.newUsers.length > 0) {
        shouldUpdate = true;
        newUsers = (
          <div>
            <b>{`The following ${USER_APP[userType]}(s) will be added from the course:`}</b>
            {updates.newUsers.map((elem, index) => {
              return (
                <div className="uploadChangesText" key={index}>
                  {elem}
                </div>
              );
            })}
            <div className="error-padding" />
          </div>
        );
      }

      if (updates.deletedUsers && updates.deletedUsers.length > 0) {
        shouldUpdate = true;
        deletedUsers = (
          <div>
            <b>{`The following ${USER_APP[userType]}(s) will be removed from the course:`}</b>
            {updates.deletedUsers.map((elem, index) => {
              return (
                <div className="uploadChangesText" key={index}>
                  {elem}
                </div>
              );
            })}
            <div className="error-padding" />
          </div>
        );
      }

      if (updates.changedSections && updates.changedSections.length > 0) {
        shouldUpdate = true;
        changedSections = (
          <div>
            <b>{`The following ${USER_APP[userType]}(s) will be be switched sections:`}</b>
            {updates.changedSections.map((elem, index) => {
              return (
                <div className="uploadChangesText" key={index}>
                  {elem}
                </div>
              );
            })}
            <div className="error-padding" />
          </div>
        );
      }

      if (shouldUpdate) {
        updateMessage = (
          <div>
            <div className="error-padding" />
            The following changes will be made to the roster. Do you want to continue?
            <div className="error-padding" />
            <Button raised onClick={this.triggerUpdate} primary={true} flat={true}>
              Continue with changes
            </Button>
            <div className="error-padding" />
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
            <div>
              {`Download ${USER_APP[userType]} roster as a json format:`}
              <div className="error-padding" />
              <Button
                key="download-roster"
                className="Btn"
                iconBefore={false}
                iconChildren={'save'}
                onClick={this.downloadRoster}
                primary={true}
                raised={true}
              >
                Download JSON roster
              </Button>
            </div>
          ) : (
            <div />
          )}
          <div className="error-padding" />
          <div>
            {!this.state.uploadFileName ? (
              <div>
                {`Upload file to replace ${USER_APP[userType]} roster:`}
                <ReactMarkdown source={exampleText} />
                <div className="error-padding" />
                <FileUpload
                  id="rosterUpload-FileInput"
                  accept="application/json"
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
            <div className="error-padding" />
            {this.state.uploadFileName ? <div>{this.state.uploadFileName}</div> : ''}
            <div className="error-padding" />
            {errors}
            {updateMessage}
            {newUsers}
            {deletedUsers}
            {changedSections}
          </div>
        </DialogContainer>
      </div>
    );
  }
}
export default RosterFileUpload;
