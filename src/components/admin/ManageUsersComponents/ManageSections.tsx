import * as React from 'react';
import { Button, DataTable, TableBody, TableColumn, TableHeader, TableRow, TextField } from 'react-md';
import Select from 'react-select';

import { CourseType } from '../../../infrastructure/course';
import { SectionType } from '../../../infrastructure/section';
import { IOption } from '../../../types/common';

interface IProps {
  sections: SectionType[];
  sectionsLoadComplete: boolean;
  lockedSectionChange: boolean;
  toggleLock: () => void;
  currentCourse: CourseType | undefined;
  addToast: (text: string, action: string | undefined) => void;
  createSection: (newSection: string) => void;
  changeLeaders: (sectionID: number, leaderEmails: string[]) => Promise<string[]>;
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

  public changeLeaders = (sectionID: number, input: IOption[]) => {
    const { sections } = this.props;
    const { changedSections } = this.state;

    changedSections.push(sectionID);
    this.setState({ changedSections });

    const thisSection = sections.find((section) => {
      return section.id === sectionID;
    });

    if (!thisSection) {
      return;
    }

    const leaderEmails = input.map((leaderOption) => {
      return leaderOption.label;
    });

    this.props.changeLeaders(Number(sectionID), leaderEmails).then((leaders) => {
      if (leaders) {
        const newChangedSections = changedSections.filter((i) => {
          return i !== sectionID;
        });
        this.setState({ changedSections: newChangedSections });
      }
    });
  };

  public render() {
    const { sectionsLoadComplete, lockedSectionChange, sections, createSection, graders } = this.props;
    const { newSectionField, changedSections } = this.state;

    const allowAddSection = newSectionField && 0 < newSectionField.length && newSectionField.length <= 16;

    let tableBody;
    if (sectionsLoadComplete) {
      tableBody = sections.map((section) => {
        // Reminder - need to change to represent multiple leaders
        let leaderDisable = false;

        if (changedSections.indexOf(section.id) !== -1) {
          leaderDisable = true;
        }
        const gradersToShow = graders.filter((grader) => {
          return section.leaders.indexOf(grader) === -1;
        });
        const menuItems = gradersToShow.map((grader) => {
          return { value: grader, label: grader };
        });

        return (
          <TableRow key={section.id}>
            <TableColumn>{section.name}</TableColumn>
            <Select
              classNamePrefix="multiselect--ManageSections"
              closeMenuOnSelect={true}
              isMulti={true}
              options={menuItems}
              onChange={this.changeLeaders.bind(this.props, section.id)}
              placeholder="Select Leaders..."
              value={section.leaders.map((leader) => {
                return { value: leader, label: leader };
              })}
              isDisabled={leaderDisable || lockedSectionChange}
              isLoading={leaderDisable}
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
      <div className="roster-section">
        <div className="roster-section__addSection">
          <TextField
            id="addSectionField"
            label="Add a Section"
            lineDirection="center"
            placeholder="Section Name"
            className="roster-section__addSection__Field"
            maxLength={16}
            value={newSectionField}
            onChange={this.newSectionFieldOnChange}
            disabled={lockedSectionChange}
          />
          <Button
            iconChildren="done"
            className="roster-section__addSection__Btn"
            disabled={!allowAddSection || lockedSectionChange}
            onClick={createSection.bind(this.props, newSectionField)}
          >
            Add new section
          </Button>
        </div>
        <DataTable className="DataTable--ManageUsers" baseId="Manage-sections-table" plain={true}>
          <TableHeader>
            <TableRow>
              <TableColumn key={'sectionName'}>Section Name</TableColumn>
              <TableColumn key={'sectionLeaders'}>Section Leaders</TableColumn>
            </TableRow>
          </TableHeader>
          <TableBody>{tableBody}</TableBody>
        </DataTable>
      </div>
    );
  }
}

export default ManageSections;
