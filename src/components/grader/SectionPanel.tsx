// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* antd imports */
import { Alert, Select, Typography } from 'antd';

/* other library imports */

/* codePost imports */
import { Link } from 'react-router';
import { Course } from '../../api-client';
import { encodeForLink } from '../core/URLutils';
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
    // The assignments array is a new reference on every refetch; reload only for a new set.
    const ids = (list: AssignmentType[]) => list.map((a) => a.id).join(',');
    if (ids(oldProps.assignments) !== ids(this.props.assignments)) {
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
        key: assignment.id,
        assignment: (
          <Link to={`${encodeForLink(assignment.name)}`} className="text-link">
            <Typography.Text strong className="text-link">
              {assignment.name}
            </Typography.Text>
          </Link>
        ),
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

    // Which section the table is about, always; the picker only when there is a choice.
    const section = this.state.activeSection;
    const studentCount = section?.students?.length ?? 0;
    let selectContent = (
      <Typography.Text strong>
        Section {section?.name}
        <Typography.Text type="secondary">
          {' '}
          · {studentCount} student{studentCount === 1 ? '' : 's'}
        </Typography.Text>
      </Typography.Text>
    );
    const notice =
      section && studentCount === 0 && !this.state.isLoading ? (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message={`Section ${section.name} has no students yet, so there is nothing to grade here.`}
        />
      ) : null;
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
        notice={notice}
        actions={[selectContent]}
        title="My Sections"
        sections={this.props.sections}
        email={this.props.graderEmail}
      />
    );
  }
}

export default SectionPanel;
