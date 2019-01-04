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
import { ICourse, ISection } from '../../types/common';

interface IProps {
  sections: ISection[];
  sectionsLoadComplete: boolean;
  lockedSectionChange: boolean;
  toggleLock: () => void;
  currentCourse: ICourse | undefined;
  addToast: (text: string, action: string | undefined) => void;
  createSection: (newSection: string) => void;
  addLeader: (sectionID: number, leaderEmail: string) => Promise<string[]>;
  graders: string[];
}

interface IState {
  newSectionField: string | undefined;
  changedSections: number[];
}

class ManageSections extends React.Component<IProps, {}> {
  public state: Readonly<IState> = {
    newSectionField: undefined,
    changedSections: [],
  };

  public newSectionFieldOnChange = (value: string) => {
    this.setState({ newSectionField: value });
  };

  public rowLeaderChange = (sectionID: number, graderEmail: string) => {
    let { changedSections } = this.state;
    const { addLeader } = this.props;
    // Reminder -- do some check through the existing sections to only keep tabs on what changed
    changedSections.push(sectionID);
    this.setState({ changedSections });

    addLeader(Number(sectionID), graderEmail).then((leaders) => {
      if (leaders) {
        changedSections = changedSections.filter((i) => {
          return i !== sectionID;
        });
        this.setState({ changedSections });
      }
    });
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
      // Reminder -- fix this to simplify
      return {
        label: grader,
        value: grader,
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
                const currentLeader =
                  section.leaders && section.leaders[0] ? section.leaders[0] : '';

                let dropDown;
                let leaderDisable = false;

                if (changedSections.indexOf(section.id) !== -1) {
                  dropDown = iconChanged;
                  leaderDisable = true;
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
                      disabled={lockedSectionChange || leaderDisable}
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
