import * as React from 'react';

import { CourseType } from '../../infrastructure/course';

interface IProps {
  currentCourse: CourseType;
  updateSettings: (newCourse: CourseType) => void;
}

interface IState {
  sendReleasedSubmissionsToBack: boolean;
  showStudentsStatistics: boolean;
}

class CourseSettingsPanel extends React.Component<IProps, IState> {
  public state: Readonly<IState> = {
    sendReleasedSubmissionsToBack: this.props.currentCourse.sendReleasedSubmissionsToBack,
    showStudentsStatistics: this.props.currentCourse.showStudentsStatistics,
  };

  public toggleValue = (label: string, event: any) => {
    this.setState((prevstate) => {
      const newState = { ...prevstate };
      newState[label] = !this.state[label];
      return newState;
    });
  };

  public updateSettings = (e: any) => {
    e.preventDefault();
    const { currentCourse } = this.props;
    const payload = {
      id: currentCourse.id, // codePost convention
      name: currentCourse.name,
      period: currentCourse.period,
      assignments: [], // ignored by API
      sections: [], // ignored by API
      sendReleasedSubmissionsToBack: this.state.sendReleasedSubmissionsToBack,
      showStudentsStatistics: this.state.showStudentsStatistics,
    };

    this.props.updateSettings(payload);
  };

  public render() {
    const { sendReleasedSubmissionsToBack, showStudentsStatistics } = this.state;
    return (
      <form onSubmit={this.updateSettings}>
                Show statistics to students
        <input
          type="checkbox"
          onChange={this.toggleValue.bind(this.props, 'showStudentsStatistics')}
          checked={showStudentsStatistics}
        />
        <br />
                Send released submissions to back of grader queue
        <input
          type="checkbox"
          onChange={this.toggleValue.bind(this.props, 'sendReleasedSubmissionsToBack')}
          checked={sendReleasedSubmissionsToBack}
        />
        <br />
        <br />
        <input type="submit" />
      </form>
    );
  }
}
export default CourseSettingsPanel;
