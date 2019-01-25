import * as React from 'react';

import { CoursePatchType, CourseType } from '../../infrastructure/course';
import { timezones } from './timezones';

interface IProps {
  currentCourse: CourseType;
  updateSettings: (newCourse: CoursePatchType) => void;
}

interface IState {
  sendReleasedSubmissionsToBack: boolean;
  showStudentsStatistics: boolean;
  timezone: string;
}

class CourseSettingsPanel extends React.Component<IProps, IState> {
  public state: Readonly<IState> = {
    sendReleasedSubmissionsToBack: this.props.currentCourse.sendReleasedSubmissionsToBack,
    showStudentsStatistics: this.props.currentCourse.showStudentsStatistics,
    timezone: this.props.currentCourse.timezone,
  };

  public toggleValue = (label: string, event: any) => {
    this.setState((prevstate) => {
      const newState = { ...prevstate };
      newState[label] = !this.state[label];
      return newState;
    });
  };

  public handleChange = (label: string, event: any) => {
    const value = event.target.value;
    this.setState((prevstate) => {
      const newState = { ...prevstate };
      newState[label] = value;
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
      sendReleasedSubmissionsToBack: this.state.sendReleasedSubmissionsToBack,
      showStudentsStatistics: this.state.showStudentsStatistics,
      timezone: this.state.timezone,
    };

    this.props.updateSettings(payload);
  };

  public render() {
    const { sendReleasedSubmissionsToBack, showStudentsStatistics, timezone } = this.state;
    const timezoneOptions = timezones.map((el, i) => {
      return (
        <option key={i} value={el}>
          {el}
        </option>
      );
    });

    return (
      <form onSubmit={this.updateSettings}>
        Show statistics to students{' '}
        <input
          type="checkbox"
          onChange={this.toggleValue.bind(this.props, 'showStudentsStatistics')}
          checked={showStudentsStatistics}
        />
        <br />
        Send released submissions to back of grader queue{' '}
        <input
          type="checkbox"
          onChange={this.toggleValue.bind(this.props, 'sendReleasedSubmissionsToBack')}
          checked={sendReleasedSubmissionsToBack}
        />
        <br />
        Select a timezone{' '}
        <select value={timezone} onChange={this.handleChange.bind(this.props, 'timezone')}>
          {timezoneOptions}
        </select>
        <br />
        <input type="submit" />
      </form>
    );
  }
}
export default CourseSettingsPanel;
