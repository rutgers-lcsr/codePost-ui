import * as React from 'react';
import { Button, DialogContainer, TextField } from 'react-md';

import { ICourse3 } from '../../types/common';

interface IProps {
  courses: ICourse3[];
  addErrorToast: (text: string, action: string | undefined) => void;
  createCourse: (courseName: string, coursePeriod: string) => Promise<ICourse3>;
}

interface IState {
  newCourseName: string;
  newCoursePeriod: string;
  dialogVisible: boolean;
}

class NewCourseDialog extends React.Component<IProps, {}> {
  public state: Readonly<IState> = {
    newCourseName: '',
    newCoursePeriod: '',
    dialogVisible: false,
  };

  public toggleDialog = () => {
    const { dialogVisible } = this.state;
    this.setState({
      dialogVisible: !dialogVisible,
      newCourseName: '',
    });
  };

  public changeNameField = (newName: string) => {
    this.setState({ newCourseName: newName });
  };

  public changePeriodField = (newPeriod: string) => {
    this.setState({ newCoursePeriod: newPeriod });
  };

  public createNewCourse = () => {
    const { newCourseName, newCoursePeriod } = this.state;
    const { courses } = this.props;
    if (newCourseName.length < 4) {
      this.props.addErrorToast('Course name must be longer than 4 characters', undefined);
      return;
    }
    if (
      courses
        .map((i) => {
          return i.name.toLowerCase();
        })
        .indexOf(newCourseName.toLowerCase()) !== -1
    ) {
      this.props.addErrorToast('Course name must be distinct from other courses.', undefined);
      return;
    }
    this.props.createCourse(newCourseName, newCoursePeriod).then(() => {
      this.toggleDialog();
    });
  };

  public render() {
    const { dialogVisible } = this.state;
    const dialogActions = [];
    dialogActions.push({
      secondary: true,
      children: 'Cancel',
      onClick: this.toggleDialog,
    });

    dialogActions.push(
      <Button flat primary onClick={this.createNewCourse}>
        Create
      </Button>,
    );

    return (
      <div>
        <Button raised onClick={this.toggleDialog}>
          Add new course
        </Button>
        <DialogContainer
          id="newCourse-dialog"
          visible={dialogVisible}
          title="Add new course"
          onHide={this.toggleDialog}
          actions={dialogActions}
          modal
        >
          <TextField
            id="newCourse-name"
            label="Course name"
            defaultValue=""
            onChange={this.changeNameField}
          />
          <TextField
            id="newCourse-period"
            label="Course period (e.g., Spring-2018)"
            defaultValue=""
            onChange={this.changePeriodField}
          />
        </DialogContainer>
      </div>
    );
  }
}
export default NewCourseDialog;
