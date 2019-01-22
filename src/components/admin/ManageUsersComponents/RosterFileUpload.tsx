import * as React from 'react';
import { Button, DialogContainer, FileUpload, LinearProgress } from 'react-md';

import { USER_APP } from '../../../types/common';

interface IProps {
  users: string[];
  addErrorToast: (text: string, action: string | undefined) => void;
  addToast: (text: string, action: string | undefined) => void;
  changeRoster: (newRoster: string[], userType: USER_APP) => Promise<void>;
  userType: USER_APP;
}

interface IState {
  dialogVisible: boolean;
  uploadErrors: string[];
  updatingRoster: boolean;
  updates: { [index: string]: string[] } | undefined;
  jsonUpload: string[];
  uploadFileName: string | undefined;
}

class RosterFileUpload extends React.Component<IProps, {}> {
  public state: Readonly<IState> = {
    dialogVisible: false,
    uploadErrors: [],
    updatingRoster: false,
    updates: undefined,
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
    const { users, userType } = this.props;
    const a = document.createElement('a');
    a.href = `data:attachment/json, ${JSON.stringify(users)}`;
    a.download = `${USER_APP[userType]} roster.json`;

    document.body.appendChild(a);
    a.click();
    this.props.addToast('Roster downloaded.', undefined);
  };

  // Function called upon upload of a file; check to make sure it's a valid json Object
  // Then check for any roster errors
  // If any errors in the checking, append errors and display in dialog
  public onRosterUpload = (file: File, result: string) => {
    this.setState({ uploadErrors: [], uploadFileName: file.name });
    try {
      const roster = JSON.parse(result);
      const uploadErrors = this.isRoster(roster);
      if (uploadErrors.length === 0) {
        this.setState({ updatingRoster: true, jsonUpload: roster, updates: undefined });
        this.updateRoster(roster, false);
      } else {
        this.setState({ uploadErrors, updates: undefined });
      }
    } catch (error) {
      this.setState({
        uploadErrors: ['Uploaded Roster is not a valid JSON object'],
        updates: undefined,
      });
      return;
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
      changeRoster(newUsers, userType).then(() => {
        this.setState({ updatingRoster: false });
        this.props.addToast('Roster updated successfully.', undefined);
        this.toggleDialog();
      });
    } else {
      this.setState({ updates, updatingRoster: false });
    }
  };

  // Once the user has seen and proceeded with the changes, trigger an update with
  // makeDBUpdate = true
  public triggerUpdate = () => {
    this.setState({ updatingRoster: true, updates: undefined }, () => this.updateRoster(this.state.jsonUpload, true));
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
    let shouldUpdate = false;

    if (updates) {
      if (updates.newUsers.length > 0) {
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

      if (updates.deletedUsers.length > 0) {
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

    return (
      <div>
        <Button
          raised
          onClick={this.toggleDialog}
          primary={true}
          iconChildren={'vertical_align_center'}
          iconBefore={false}
          flat={true}
          className={'manageUsers__rosterUpload'}
        >
          {`${USER_APP[userType]} Roster: Upload / Download`}
        </Button>
        <DialogContainer
          id="rosterFile-dialog"
          visible={dialogVisible}
          title={`${USER_APP[userType]}: Manage roster files`}
          onHide={this.toggleDialog}
          actions={dialogActions}
          modal
          component={'object'}
          portal={true}
        >
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
          <div className="padding" />
          <div>
            {`Upload file to replace ${USER_APP[userType]} roster:`}
            <div className="error-padding" />
            <FileUpload
              id="rosterUpload-FileInput"
              accept="application/json"
              multiple={false}
              onLoad={this.onRosterUpload}
              onChange={this.dummyUpload}
              disabled={this.state.updatingRoster}
            />
            {this.state.updatingRoster ? <LinearProgress id="circle" className="progressCircle" /> : ''}
            <div className="error-padding" />
            {this.state.uploadFileName ? <div>{this.state.uploadFileName}</div> : ''}
            <div className="error-padding" />
            {errors}
            {updateMessage}
            {newUsers}
            {deletedUsers}
          </div>
        </DialogContainer>
      </div>
    );
  }
}
export default RosterFileUpload;
