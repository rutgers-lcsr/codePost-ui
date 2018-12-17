import * as React from 'react';
import {
  Button,
  CircularProgress,
  DataTable,
  FontIcon,
  SelectFieldColumn,
  TableBody,
  TableColumn,
  TableHeader,
  TableRow,
  TextField,
} from 'react-md';
import '../../styles/index.scss';
import { ICourse, IGrader, ISection } from '../../types/common';

interface IProps {
  sections: ISection[];
  sectionsLoadComplete: boolean;
  lockedSectionChange: boolean;
  toggleLock: () => void;
  currentCourse: ICourse | undefined;
  addToast: (text: string, action: string | undefined) => void;
  createSection: (newSection: string) => void;
  addLeader: (sectionID: number, leaderEmail: string) => void;
  graders: IGrader[];
}

interface IState {
  newSectionField: string | undefined;
  changedSections: { [sectionID: number]: string };
}

class ManageSections extends React.Component<IProps, {}> {
  public state: Readonly<IState> = {
    newSectionField: undefined,
    changedSections: {},
  };

  public newSectionFieldOnChange = (value: string) => {
    this.setState({ newSectionField: value });
  };

  public rowLeaderChange = (sectionID: number, graderEmail: string) => {
    const { changedSections } = this.state;
    // Reminder -- do some check through the existing sections to only keep tabs on what changed
    changedSections[sectionID] = graderEmail;
    this.setState({ changedSections });
  };

  public triggerLeaderChanges = () => {
    const { changedSections } = this.state;
    const { addLeader } = this.props;
    // Reminder -- do some check through the existing sections to only keep tabs on what changed
    Object.keys(changedSections).forEach((sectionID) => {
      const leaderEmail = changedSections[sectionID];
      addLeader(Number(sectionID), leaderEmail);
    });

    this.setState({ changedSections: {} });
  };

  public render() {
    const {
      sectionsLoadComplete,
      lockedSectionChange,
      sections,
      createSection,
      graders,
    } = this.props;
    const { newSectionField, changedSections } = this.state;

    const lockIcon = lockedSectionChange ? 'lock' : 'lock_open';
    const iconChanged = <FontIcon>track_changes</FontIcon>;

    const allowAddSection =
      newSectionField && 0 < newSectionField.length && newSectionField.length <= 16;

    const leaderMenuItems = graders.map((grader) => {
      return {
        label: grader.profile.username,
        value: grader.profile.username,
      };
    });

    if (sectionsLoadComplete && sections) {
      return (
        <div>
          <TextField
            id="addSectionField"
            label="Add a Section"
            lineDirection="center"
            placeholder="Section Name"
            className="md-cell md-cell--bottom"
            maxLength={16}
            value={newSectionField}
            onChange={this.newSectionFieldOnChange}
            disabled={lockedSectionChange}
          />
          <Button
            iconChildren="done"
            className="save-Btn"
            disabled={!allowAddSection || lockedSectionChange}
            onClick={createSection.bind(this.props, newSectionField)}
          >
            Add new section
          </Button>
          <Button
            iconChildren="done"
            className="save-Btn"
            disabled={lockedSectionChange || Object.keys(changedSections).length === 0}
            onClick={this.triggerLeaderChanges}
          >
            Save new Section Leaders
          </Button>
          <hr />
          <DataTable className="Manage-sections-table" baseId="Manage-sections-table" plain={true}>
            <TableHeader>
              <TableRow>
                <TableColumn key={'sectionName'}>Section Name</TableColumn>
                <TableColumn key={'sectionLeader'}>Leader</TableColumn>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sections.map((section) => {
                // Reminder - need to change to represent multiple leaders
                let currentLeader =
                  section.leader && section.leader[0] ? section.leader[0].profile.username : '';
                let dropDown;
                if (section.id in changedSections) {
                  currentLeader = changedSections[section.id];
                  dropDown = iconChanged;
                } else {
                  dropDown = undefined;
                }
                return (
                  <TableRow key={section.id}>
                    <TableColumn>{section.name}</TableColumn>
                    <SelectFieldColumn
                      dropdownIcon={dropDown}
                      value={currentLeader}
                      menuItems={leaderMenuItems}
                      disabled={lockedSectionChange}
                      onChange={this.rowLeaderChange.bind(this.props, section.id)}
                    />
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

export default ManageSections;
