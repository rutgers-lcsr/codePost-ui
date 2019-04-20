import * as React from 'react';
import { DialogContainer, SelectionControl, TextField } from 'react-md';
import { AssignmentPatchType, AssignmentType } from '../../../infrastructure/assignment';

interface IProps {
  isVisible: boolean;
  onCancel: () => void;
  onSave: (assignment: AssignmentPatchType) => void;
  currentAssignment: AssignmentType;
}

interface IState {
  anonymousGrading: boolean;
  hideGrades: boolean;
  assignmentName: string;
  points: number;
}

class AssignmentSettingsDialog extends React.Component<IProps, IState> {
  public state: Readonly<IState> = {
    anonymousGrading: this.props.currentAssignment.anonymousGrading,
    hideGrades: this.props.currentAssignment.hideGrades,
    assignmentName: this.props.currentAssignment.name,
    points: this.props.currentAssignment.points,
  };

  public toggleValue = (label: string) => {
    this.setState((prevstate) => {
      const newState = { ...prevstate };
      newState[label] = !this.state[label];
      return newState;
    });
  };

  public setValue = (label: string, value: any) => {
    this.setState((prevstate) => {
      const newState = { ...prevstate };
      newState[label] = value;
      return newState;
    });
  };

  public updateSettings = (e: any) => {
    e.preventDefault();
    const { currentAssignment } = this.props;
    const payload = {
      id: currentAssignment.id,
      anonymousGrading: this.state.anonymousGrading,
      hideGrades: this.state.hideGrades,
      name: this.state.assignmentName,
      points: this.state.points,
    };

    console.log(payload);
    this.props.onSave(payload);
  };

  public render() {
    if (!this.props.isVisible) {
      return <div />;
    }

    const { anonymousGrading, hideGrades, assignmentName, points } = this.state;

    const content = (
      <div>
        <div className="AssignmentSettings__settingItem">
          <div className="AssignmentSettings__settingItem__content">
            <div className="AssignmentSettings__settingItem__name">Name</div>
            <div className="AssignmentSettings__settingItem__description">Must be unique within this course.</div>
          </div>
          <TextField
            defaultValue={assignmentName}
            label={'Assignment Name'}
            fullWidth={false}
            onChange={this.setValue.bind(this.props, 'assignmentName')}
          />
        </div>
        <div className="AssignmentSettings__settingItem">
          <div className="AssignmentSettings__settingItem__content">
            <div className="AssignmentSettings__settingItem__name">Points</div>
            <div className="AssignmentSettings__settingItem__description">
              Total points possible for this assignment.
            </div>
          </div>
          <TextField
            defaultValue={points}
            step={0.5}
            pattern="^d+(\.|\,)\d{1}"
            type="number"
            min={0}
            label={'Assignment Points'}
            fullWidth={false}
            onChange={this.setValue.bind(this.props, 'points')}
          />
        </div>
        <div className="AssignmentSettings__settingItem">
          <div className="AssignmentSettings__settingItem__content">
            <div className="AssignmentSettings__settingItem__name">Anonymous grading mode</div>
            <div className="AssignmentSettings__settingItem__description">
              When enabled, graders will not be able to see student emails associated with submissions. For more info,
              see <a href="https://help.codepost.io">our docs</a>
            </div>
          </div>
          <SelectionControl
            id="toggleAnonymousGrading"
            type="switch"
            name="AssignmentSettings__anonymous"
            className="AssignmentSettings__settingItem__control"
            defaultChecked={anonymousGrading}
            onChange={this.toggleValue.bind(this.props, 'anonymousGrading')}
            aria-label={'Toggle anonymous grading mode'}
          />
        </div>
        <div className="AssignmentSettings__settingItem">
          <div className="AssignmentSettings__settingItem__content">
            <div className="AssignmentSettings__settingItem__name">Hide grades</div>
            <div className="AssignmentSettings__settingItem__description">
              When enabled, students won't be able to view the grades associated with their submissions.
            </div>
          </div>
          <SelectionControl
            id="toggleHideGrades"
            type="switch"
            name="AssignmentSettings__hidegrades"
            className="AssignmentSettings__settingItem__control"
            defaultChecked={hideGrades}
            onChange={this.toggleValue.bind(this.props, 'hideGrades')}
            aria-label={'Hide submission grades from students'}
          />
        </div>
        <div className="AssignmentSettings__cancel" onClick={this.props.onCancel}>
          Cancel
        </div>
        <div className="AssignmentSettings__submit" onClick={this.updateSettings}>
          Submit
        </div>
      </div>
    );
    return (
      <DialogContainer
        className="dialog--assignment-settings"
        id="assignment-settings"
        visible={true}
        title="Assignment settings"
        onHide={this.props.onCancel}
        modal
      >
        {content}
      </DialogContainer>
    );
  }
}
export default AssignmentSettingsDialog;
