import * as React from 'react';
import { Button, DialogContainer, TextField } from 'react-md';
import Select from 'react-select';

import { CourseType } from '../../infrastructure/course';

import { IOptionNumber } from '../../types/common';

interface IProps {
  courses: CourseType[];
  addErrorToast: (text: string, action: string | undefined) => void;
  createCourse: (courseName: string, coursePeriod: string) => Promise<CourseType>;
  selectorItemsFormatter: any;
  selectorCurrentFormatter: any;
}

interface IState {
  newCourseName: string;
  newCoursePeriod: string;
  dialogVisible: boolean;
  currentCourse?: CourseType;
}

class NewCourseDialog extends React.Component<IProps, IState> {
  public state: Readonly<IState> = {
    newCourseName: '',
    newCoursePeriod: '',
    dialogVisible: false,
    currentCourse: this.props.courses.length > 0 ? this.props.courses[0] : undefined,
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

  public handleCourseChange = (option: IOptionNumber) => {
    const currentCourse = this.props.courses.filter((course: CourseType) => {
      return course.id === option.value;
    })[0];

    this.setState({ currentCourse });
  };

  public render() {
    const { courses, selectorItemsFormatter, selectorCurrentFormatter } = this.props;
    const { dialogVisible, currentCourse } = this.state;
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
          className="dialog--create-course"
          visible={dialogVisible}
          title="Create a new course"
          onHide={this.toggleDialog}
          actions={dialogActions}
          disableScrollLocking={true}
          modal
        >
          <div>Start from scratch</div>
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
          <div>--------- OR ---------</div>
          <div>Copy from an existing course</div>
          <Select
            className="selector--new-course-dialog"
            options={selectorItemsFormatter(courses)}
            onChange={this.handleCourseChange}
            value={selectorCurrentFormatter(currentCourse)}
          />
        </DialogContainer>
      </div>
    );
  }
}
export default NewCourseDialog;
