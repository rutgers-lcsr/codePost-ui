import * as React from 'react';
import {
  Button,
  CircularProgress,
  DataTable,
  TableBody,
  TableColumn,
  TableHeader,
  TableRow,
  TextField,
} from 'react-md';
import '../../styles/index.scss';
import { ICourse3, UserEnum } from '../../types/common';

interface IProps {
  graders: string[];
  gradersLoadComplete: boolean;
  lockedGraderChange: boolean;
  toggleLock: () => void;
  currentCourse: ICourse3 | undefined;
  addToast: (text: string, action: string | undefined) => void;
  enrollUser: (email: string, type: UserEnum) => void;
  unEnrollUsers: (emails: string[], type: UserEnum) => void;
}

interface IState {
  newField: string | undefined;
}

class ManageGraders extends React.Component<IProps, {}> {
  public state: Readonly<IState> = {
    newField: undefined,
  };

  public triggerUnEnrollUser = (newUserEmail: string, userType: UserEnum) => {
    const { unEnrollUsers } = this.props;
    unEnrollUsers([newUserEmail], userType);
  };

  public triggerEnrollUser = (newUserEmail: string, userType: UserEnum) => {
    this.props.enrollUser(newUserEmail, userType);
    this.setState({ newField: '' });
  };

  public newFieldOnChange = (value: string) => {
    this.setState({ newField: value });
  };

  public render() {
    const { gradersLoadComplete, lockedGraderChange, graders } = this.props;
    const { newField } = this.state;

    const lockIcon = lockedGraderChange ? 'lock' : 'lock_open';

    const showSaveNewButton = newField && newField.includes('@');
    const graderType = UserEnum.Grader;

    if (gradersLoadComplete && graders) {
      return (
        <div>
          <TextField
            id="addGraderField"
            label="Add Grader"
            lineDirection="center"
            placeholder="Graders's email"
            className="md-cell md-cell--bottom"
            value={newField}
            onChange={this.newFieldOnChange}
            disabled={lockedGraderChange}
          />
          <Button
            iconChildren="done"
            className="save-Btn"
            disabled={!showSaveNewButton || lockedGraderChange}
            onClick={this.triggerEnrollUser.bind(this.props, newField, graderType)}
          >
            Save new grader
          </Button>
          <hr />
          <DataTable className="Manage-admins-table" baseId="Manage-admins-table" plain={true}>
            <TableHeader>
              <TableRow>
                <TableColumn key={'Grader'}>Grader name</TableColumn>
                <TableColumn key={'Unenroll'}>UnEnroll user</TableColumn>
              </TableRow>
            </TableHeader>
            <TableBody>
              {graders.map((grader) => {
                return (
                  <TableRow key={grader}>
                    <TableColumn>{grader}</TableColumn>
                    <TableColumn key={'UnEnroll'}>
                      {' '}
                      <Button
                        key="unEnroll"
                        className="Btn"
                        flat={true}
                        icon={true}
                        disabled={lockedGraderChange}
                        onClick={this.triggerUnEnrollUser.bind(this.props, grader, graderType)}
                      >
                        cancel
                      </Button>
                    </TableColumn>
                  </TableRow>
                );
              })}
            </TableBody>
          </DataTable>
          <Button
            key="Lock"
            className="Btn"
            floating={true}
            fixed={true}
            icon={true}
            onClick={this.props.toggleLock}
          >
            {lockIcon}
          </Button>
        </div>
      );
    }
    return (
      <div>
        <hr />
        <CircularProgress id="circle" className="progressCircle" />
      </div>
    );
  }
}

export default ManageGraders;
