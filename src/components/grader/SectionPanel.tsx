// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* antd imports */
import { Select } from 'antd';

/* other library imports */

/* codePost imports */
import { Course } from '../../api-client';
import { sectionsApi } from '../../api-client/clients';
import { AssignmentType, SectionType, SubmissionInfoType } from '../../types/models';

import GraderPanelBuilder from './GraderPanel';
import SectionDetailPanel from './SectionDetailPanel';

const SectionPanelShell = GraderPanelBuilder(SectionDetailPanel);

type alignType = 'left' | 'right' | 'center';

/**********************************************************************************************************************/

interface IProps {
  assignments: AssignmentType[];
  sections: SectionType[];
  course: Course;
  graderEmail: string;
  isAdmin: boolean;
}

interface IState {
  submissionsByAssignment: { [id: number]: SubmissionInfoType[] };
  activeSection: SectionType;
  isLoading: boolean;
}

class SectionPanel extends React.Component<IProps, IState> {
  public constructor(props: IProps) {
    super(props);
    this.state = {
      isLoading: true,
      activeSection: this.props.sections[0],
      submissionsByAssignment: [],
    };
  }

  public componentDidMount() {
    this.loadSubmissions(this.props.assignments, this.state.activeSection);
  }

  public componentDidUpdate(oldProps: IProps, _prevState: IState) {
    if (oldProps.assignments !== this.props.assignments) {
      this.loadSubmissions(this.props.assignments, this.state.activeSection);
    }
  }

  public loadSubmissions = async (assignments: AssignmentType[], section: SectionType) => {
    this.setState({ isLoading: true }, async () => {
      const toRet: SubmissionInfoType[][] = [];
      for (const assn of assignments) {
        toRet[assn.id] = await sectionsApi.submissionsList({
          id: section.id,
          assignment: assn.id,
        });
      }

      // Don't update state if activeSection has changed since we started
      if (section === this.state.activeSection) {
        this.setState({ submissionsByAssignment: toRet, isLoading: false });
      }
    });
  };

  public handleSelect = (sectionID: string) => {
    const activeSection = this.props.sections.find((section) => {
      return section.id === Number(sectionID);
    });

    if (activeSection !== undefined && activeSection !== this.state.activeSection) {
      this.setState({ activeSection });
      this.loadSubmissions(this.props.assignments, activeSection);
    }
  };

  public render() {
    const centerAlign: alignType = 'center';
    const columns = [
      {
        title: 'Zoom in',
        dataIndex: 'zoom',
        align: centerAlign,
      },
      {
        title: 'Assignment',
        dataIndex: 'assignment',
      },
      {
        title: 'Submissions',
        dataIndex: 'submissions',
        align: centerAlign,
      },
      {
        title: 'Finalized',
        dataIndex: 'finalized',
        align: centerAlign,
      },
      {
        title: 'Missing',
        dataIndex: 'missing',
        align: centerAlign,
      },
      {
        title: 'Avg. Grade',
        dataIndex: 'grade',
        align: centerAlign,
      },
    ];

    const submissions = this.state.submissionsByAssignment;
    const data = this.props.assignments.map((assignment) => {
      const list = assignment.id in submissions ? submissions[assignment.id] : [];
      const numFinalized = list.filter((sub) => sub.isFinalized).length;
      return {
        assignment: assignment.name,
        submissions: list.length,
        finalized: numFinalized,
        missing: this.state.activeSection.students.length - list.length,
        grade:
          numFinalized > 0
            ? `${(list.reduce((acc, sub) => (sub.isFinalized ? sub.grade! + acc : acc), 0) / numFinalized).toFixed(
                1,
              )}/${assignment.points}`
            : '--',
      };
    });

    let selectContent = <div />;
    if (this.props.sections.length > 1) {
      const menuItems = this.props.sections.map((section) => {
        return (
          <Select.Option key={section.id} value={section.id}>
            {section.name}{' '}
          </Select.Option>
        );
      });
      selectContent = (
        <div>
          <Select
            placeholder="Select section"
            onSelect={this.handleSelect}
            value={this.state.activeSection ? this.state.activeSection.name : undefined}
            style={{ width: 200 }}
            loading={this.state.isLoading}
          >
            {menuItems}
          </Select>
        </div>
      );
    }

    return (
      <SectionPanelShell
        {...this.props}
        assignment={this.props.assignments[0]}
        breadcrumbs={[]}
        assignments={this.props.assignments}
        course={this.props.course}
        data={data}
        columns={columns}
        isLoading={this.state.isLoading}
        actions={[selectContent]}
        title="My sections"
        sections={this.props.sections}
        email={this.props.graderEmail}
      />
    );
  }
}

export default SectionPanel;
