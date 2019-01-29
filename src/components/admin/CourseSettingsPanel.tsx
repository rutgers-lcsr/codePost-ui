import * as React from 'react';

import { SelectionControl } from 'react-md';

import Select from 'react-select';

import { IOption } from '../../types/common';

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

  public toggleValue = (label: string) => {
    this.setState((prevstate) => {
      const newState = { ...prevstate };
      newState[label] = !this.state[label];
      return newState;
    });
  };

  public handleChange = (label: string, selected: IOption) => {
    const value = selected.value;
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
      assignments: [], // ignored by API
      sections: [], // ignored by API
    };

    this.props.updateSettings(payload);
  };

  public render() {
    const { sendReleasedSubmissionsToBack, showStudentsStatistics, timezone } = this.state;
    const timezoneOptions = timezones.map((el) => {
      return { label: el, value: el };
    });

    return (
      <div className="CourseSettings">
        <div className="CourseSettings__main-container">
          <div className="CourseSettings__title">Course Settings</div>
          <div className="CourseSettings__main-container__items">
            <div className="CourseSettings__settingItem-top">
              <div className="CourseSettings__settingItem__content">
                <div className="CourseSettings__settingItem__name">Show statistics to students</div>
                <div className="CourseSettings__settingItem__description">
                  Selecting will show assignment mean and median to students when the assignment is released.
                </div>
              </div>
              <SelectionControl
                id="toggleStatsSetting"
                type="switch"
                name="CourseSettings__Stats"
                className="CourseSettings__settingItem__control"
                defaultChecked={showStudentsStatistics}
                onChange={this.toggleValue.bind(this.props, 'showStudentsStatistics')}
              />
            </div>
            <div className="CourseSettings__settingItem">
              <div className="CourseSettings__settingItem__content">
                <div className="CourseSettings__settingItem__name">
                  Send released submissions to back of grader queue
                </div>
                <div className="CourseSettings__settingItem__description">
                  Selecting will move released assignments to the back of the course queue, so that graders cannot
                  easily get the same assignment they just released.
                </div>
              </div>
              <SelectionControl
                id="toggleQueueSetting"
                type="switch"
                name="CourseSettings__Queue"
                className="CourseSettings__settingItem__control"
                defaultChecked={sendReleasedSubmissionsToBack}
                onChange={this.toggleValue.bind(this.props, 'sendReleasedSubmissionsToBack')}
              />
            </div>
            <div className="CourseSettings__settingItem">
              <div className="CourseSettings__settingItem__content">
                <div className="CourseSettings__settingItem__name">Select a timezone</div>
                <div className="CourseSettings__settingItem__description">
                  All date edited fields for the course will be in this timezone, even if a other course users' devices
                  are in a different time zone.
                </div>
              </div>
              <Select
                id="toggleTimeZoneSetting"
                className="CourseSettings__settingItem__select"
                classNamePrefix="CourseSettings__settingItem__select"
                value={{ label: timezone, value: timezone }}
                onChange={this.handleChange.bind(this.props, 'timezone')}
                options={timezoneOptions}
              />
            </div>
          </div>
          <div className="CourseSettings__submit" onClick={this.updateSettings}>
            Submit
          </div>
        </div>
      </div>
    );
  }
}
export default CourseSettingsPanel;
