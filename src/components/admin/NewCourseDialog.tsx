import * as React from 'react';
import { Button, DialogContainer, TextField } from 'react-md';

import { CourseType } from '../../infrastructure/course';

interface IProps {
  courses: CourseType[];
  addErrorToast: (text: string, action: string | undefined) => void;
  createCourse: (courseName: string, coursePeriod: string) => Promise<CourseType>;
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

  public handleKeyPress = (event: any) => {
    if (event.keyCode === 13) {
      this.createNewCourse();
    }
  };

  public createNewCourse = () => {
    const { newCourseName, newCoursePeriod } = this.state;
    const { courses } = this.props;

    // Check for errors in new Course
    if (newCourseName.length < 4) {
      this.props.addErrorToast('Course name must be longer than 4 characters', undefined);
      return;
    }
    if (newCoursePeriod.length < 1) {
      this.props.addErrorToast('Course period must not be empty', undefined);
      return;
    }
    if (
      courses.filter((c) => {
        return c.name === newCourseName && c.period === newCoursePeriod;
      }).length !== 0
    ) {
      this.props.addErrorToast('Cannot create course with same name and period as existing course.', undefined);
      return;
    }

    // if validCourse, create the Course
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
        <Button type="submit" raised onClick={this.toggleDialog}>
          Create course
        </Button>
        <DialogContainer
          id="newCourse-dialog"
          visible={dialogVisible}
          title="Create a new course"
          onHide={this.toggleDialog}
          actions={dialogActions}
          modal
        >
          <TextField
            id="newCourse-name"
            label="Course name"
            defaultValue=""
            onChange={this.changeNameField}
            onKeyDown={this.handleKeyPress}
          />
          <TextField
            id="newCourse-period"
            label="Course period (e.g., Spring 2018)"
            defaultValue=""
            onChange={this.changePeriodField}
            onKeyDown={this.handleKeyPress}
          />
        </DialogContainer>
      </div>
    );
  }
}
export default NewCourseDialog;
