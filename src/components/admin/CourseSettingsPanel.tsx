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
  emailNewUsers: boolean;
  allowGradersToEditRubric: boolean;
}

class CourseSettingsPanel extends React.Component<IProps, IState> {
  public state: Readonly<IState> = {
    sendReleasedSubmissionsToBack: this.props.currentCourse.sendReleasedSubmissionsToBack,
    showStudentsStatistics: this.props.currentCourse.showStudentsStatistics,
    timezone: this.props.currentCourse.timezone,
    emailNewUsers: this.props.currentCourse.emailNewUsers,
    allowGradersToEditRubric: this.props.currentCourse.allowGradersToEditRubric,
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
      emailNewUsers: this.state.emailNewUsers,
      allowGradersToEditRubric: this.state.allowGradersToEditRubric,
      assignments: [], // ignored by API
      sections: [], // ignored by API
    };

    this.props.updateSettings(payload);
  };

  public render() {
    const {
      sendReleasedSubmissionsToBack,
      showStudentsStatistics,
      timezone,
      emailNewUsers,
      allowGradersToEditRubric,
    } = this.state;
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
                aria-label={'Show statistics to students'}
              />
            </div>
            <div className="CourseSettings__settingItem">
              <div className="CourseSettings__settingItem__content">
                <div className="CourseSettings__settingItem__name">
                  Send released submissions to back of grader queue
                </div>
                <div className="CourseSettings__settingItem__description">
                  Selecting will move released assignments to the back of the course queue, preventing situations in
                  which a grader reclaims a submission that was just released. For more information see our{' '}
                  <a
                    href="https://help.codepost.io/docs/quickstart-onboard-a-grader\
#section-claiming-from-the-submission-queue-"
                  >
                    help guides
                  </a>
                  .
                </div>
              </div>
              <SelectionControl
                id="toggleQueueSetting"
                type="switch"
                name="CourseSettings__Queue"
                className="CourseSettings__settingItem__control"
                defaultChecked={sendReleasedSubmissionsToBack}
                onChange={this.toggleValue.bind(this.props, 'sendReleasedSubmissionsToBack')}
                aria-label={'Send released submissions to back of grader queue'}
              />
            </div>
            <div className="CourseSettings__settingItem">
              <div className="CourseSettings__settingItem__content">
                <div className="CourseSettings__settingItem__name">Email users when added to roster</div>
                <div className="CourseSettings__settingItem__description">
                  If selected, emails will be sent to users notifying them that they have been added to this course's
                  roster. New codePost users will be prompted to create an account.
                </div>
              </div>
              <SelectionControl
                id="toggleEmailSetting"
                type="switch"
                name="CourseSettings__Email"
                className="CourseSettings__settingItem__control"
                defaultChecked={emailNewUsers}
                onChange={this.toggleValue.bind(this.props, 'emailNewUsers')}
                aria-label={'Email users when added to roster'}
              />
            </div>
            <div className="CourseSettings__settingItem">
              <div className="CourseSettings__settingItem__content">
                <div className="CourseSettings__settingItem__name">Allow graders to edit rubric</div>
                <div className="CourseSettings__settingItem__description">
                  If selected, graders will have the option to add, update, and delete unlinked assignment rubric
                  comments. The privilege to edit rubric comments already associated with submissions is reserved for
                  Admins.
                </div>
              </div>
              <SelectionControl
                id="toggleGraderEditSetting"
                type="switch"
                name="CourseSettings__GraderEdit"
                className="CourseSettings__settingItem__control"
                defaultChecked={allowGradersToEditRubric}
                onChange={this.toggleValue.bind(this.props, 'allowGradersToEditRubric')}
                aria-label={'Allow graders to edit rubric'}
              />
            </div>
            <div className="CourseSettings__settingItem">
              <div className="CourseSettings__settingItem__content">
                <div className="CourseSettings__settingItem__name">Course timezone</div>
                <div className="CourseSettings__settingItem__description">
                  Timezone in which all time fields for this course (for all users) will appear.
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
