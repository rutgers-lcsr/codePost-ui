import * as React from 'react';
import {
  Button,
  CircularProgress,
  DataTable,
  TableBody,
  TableColumn,
  TableHeader,
  TableRow,
  TextField,
} from 'react-md';
import Select from 'react-select';

import { CourseType } from '../../../infrastructure/course';
import { SectionType } from '../../../infrastructure/section';
import { IOption } from '../../../types/common';
import { getSortIndex } from './SortUtils';

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
  deleteSection: (sectionID: number) => Promise<void>;
}

interface IState {
  newSectionField: string | undefined;
  changedSections: number[];
  sortedIndex: Array<boolean | undefined>;
}

class ManageSections extends React.Component<IProps, {}> {
  public state: Readonly<IState> = {
    newSectionField: undefined,
    changedSections: [],
    // SortedIndex index corresponds to columns: index 0 is section name, index at 1 is leader
    sortedIndex: [true, undefined],
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

  public sectionSortFunction(a: SectionType, b: SectionType) {
    const { sortedIndex } = this.state;
    // Sort by email
    if (typeof sortedIndex[0] !== 'undefined') {
      if (a.name < b.name) return sortedIndex[0] ? -1 : 1;
      else if (a.name > b.name) return sortedIndex[0] ? 1 : -1;
      else return 0;
    }
    // Sort by viewAll column case
    if (typeof sortedIndex[1] !== 'undefined') {
      const aLeader = a.leaders ? a.leaders[0] : null;
      const bLeader = b.leaders ? b.leaders[0] : null;
      if (aLeader && !bLeader) return sortedIndex[1] ? -1 : 1;
      else if (!aLeader && bLeader) return sortedIndex[1] ? 1 : -1;
      if (aLeader && bLeader) {
        if (aLeader < bLeader) return sortedIndex[1] ? -1 : 1;
        if (aLeader > bLeader) return sortedIndex[1] ? 1 : -1;
        return 0;
      } else return 0;
    }
    return 0;
  }

  public toggleSort = (columnIndex: number) => {
    const { sortedIndex } = this.state;
    const newSortedIndex = getSortIndex(sortedIndex, columnIndex);
    // set new sortedIndex to state
    this.setState({ sortedIndex: newSortedIndex });
  };

  public render() {
    const { sectionsLoadComplete, lockedSectionChange, sections, createSection, graders } = this.props;
    const { newSectionField, changedSections, sortedIndex } = this.state;

    const allowAddSection = newSectionField && 0 < newSectionField.length && newSectionField.length <= 16;

    let tableBody;
    if (sectionsLoadComplete) {
      // make a copy before sorting
      const sectionsSorted = JSON.parse(JSON.stringify(sections));
      sectionsSorted.sort(this.sectionSortFunction.bind(this));
      tableBody = sectionsSorted.map((section: SectionType) => {
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
            <TableColumn key={'delete-${section.id}'}>
              <Button
                key={`deleteBtn-${section.id}`}
                className="Btn"
                icon={true}
                disabled={lockedSectionChange}
                onClick={this.props.deleteSection.bind(this.props, section.id)}
                style={{ marginLeft: '40px' }}
              >
                cancel
              </Button>
            </TableColumn>
          </TableRow>
        );
      });
    } else {
      tableBody = <CircularProgress id="progress" className="progress-circle" />;
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
        <DataTable className="DataTable--ManageSections" baseId="Manage-sections-table" plain={true}>
          <TableHeader>
            <TableRow>
              <TableColumn key={'sectionName'} sorted={sortedIndex[0]} onClick={this.toggleSort.bind(this.props, 0)}>
                Section Name
              </TableColumn>
              <TableColumn key={'sectionLeaders'} sorted={sortedIndex[1]} onClick={this.toggleSort.bind(this.props, 1)}>
                Section Leaders
              </TableColumn>
              <TableColumn key={'deleteSection'}>Delete Section</TableColumn>
            </TableRow>
          </TableHeader>
          <TableBody>{tableBody}</TableBody>
        </DataTable>
      </div>
    );
  }
}

export default ManageSections;
