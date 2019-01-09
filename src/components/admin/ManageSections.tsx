import * as React from 'react';
import {
  Button,
  Chip,
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
  removeLeader: (sectionID: number, leaderEmail: string) => Promise<string[]>;
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

  public addLeaderToSection = (sectionID: number, graderEmail: string) => {
    let { changedSections } = this.state;
    const { addLeader } = this.props;
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

  public removeLeaderFromSection = (sectionID: number, graderEmail: string) => {
    let { changedSections } = this.state;
    const { removeLeader, lockedSectionChange } = this.props;

    if (lockedSectionChange) {
      return;
    }

    changedSections.push(sectionID);
    this.setState({ changedSections });

    removeLeader(Number(sectionID), graderEmail).then(() => {
      changedSections = changedSections.filter((i) => {
        return i !== sectionID;
      });
      this.setState({ changedSections });
    });
  };

  public render() {
    const { sectionsLoadComplete, lockedSectionChange, sections, createSection, graders } = this.props;
    const { newSectionField, changedSections } = this.state;

    const lockIcon = lockedSectionChange ? 'lock' : 'lock_open';
    const iconChanged = <FontIcon>track_changes</FontIcon>;

    const allowAddSection = newSectionField && 0 < newSectionField.length && newSectionField.length <= 16;

    let tableBody;
    if (sectionsLoadComplete) {
      tableBody = sections.map((section) => {
        // Reminder - need to change to represent multiple leaders
        let dropDown;
        let leaderDisable = false;

        if (changedSections.indexOf(section.id) !== -1) {
          dropDown = iconChanged;
          leaderDisable = true;
        } else {
          dropDown = undefined;
        }

        const leaderMenuItems = graders
          .filter((grader) => {
            return section.leaders.indexOf(grader) === -1;
          })
          .map((grader) => {
            return {
              label: grader,
              value: grader,
            };
          });

        return (
          <TableRow key={section.id}>
            <TableColumn>{section.name}</TableColumn>
            <TableColumn>
              {section.leaders.map((leader) => {
                return (
                  <Chip
                    key={leader}
                    label={leader}
                    removable={!lockedSectionChange}
                    onClick={this.removeLeaderFromSection.bind(this.props, section.id, leader)}
                  />
                );
              })}
            </TableColumn>
            <SelectFieldColumn
              dropdownIcon={dropDown}
              value={''}
              menuItems={leaderMenuItems}
              disabled={lockedSectionChange || leaderDisable}
              onChange={this.addLeaderToSection.bind(this.props, section.id)}
            />
          </TableRow>
        );
      });
    } else {
      tableBody = (
        <TableRow>
          <TableColumn>Loading...</TableColumn>
          <TableColumn />
        </TableRow>
      );
    }

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
              <TableColumn key={'sectionLeaders'}>Leaders</TableColumn>
              <TableColumn key={'addLeader'}>Add Leader</TableColumn>
            </TableRow>
          </TableHeader>
          <TableBody>{tableBody}</TableBody>
        </DataTable>
        <Button key="Lock" className="Btn" floating={true} fixed={true} icon={true} onClick={this.props.toggleLock}>
          {lockIcon}
        </Button>
      </div>
    );
  }
}

export default ManageSections;
