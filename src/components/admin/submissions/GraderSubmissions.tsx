/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* ant imports */
import { Breadcrumb, Empty, Icon } from 'antd';
import { ColumnProps } from 'antd/lib/table';

/* codePost imports  */
import { IGraderSubmissionsDataTable } from '../../../types/common';

import { AssignmentType } from '../../../infrastructure/assignment';
import { SubmissionType } from '../../../infrastructure/submission';

import TableDetail from '../other/TableDetail';

import GraderDetail from './graders/GraderDetail';

import CPButton from '../../../components/core/CPButton';

import { PANELS } from '../../../Admin';

/**********************************************************************************************************************/

interface IProps {
  loadComplete: boolean;
  assignments: AssignmentType[];
  submissionsByGrader: IGraderSubmissionsDataTable;
  viewsBySubmission: { [submissionID: number]: { [student: string]: string } };
  deleteSubmission: (submission: SubmissionType) => Promise<void>;
  graders: string[];
  changeSubmissionGrader: (submission: SubmissionType, grader: string | undefined) => Promise<void>;
  uploadSubmission: (assignment: AssignmentType, partners: string[], files: any[]) => Promise<void>;
  changeTab: (panel: PANELS) => void;
}

interface IState {
  activeGrader?: string;
}

class GraderData extends React.Component<IProps, IState> {
  public state: Readonly<IState> = {};

  public componentDidUpdate(oldProps: IProps, oldState: IState) {
    if (oldProps.loadComplete && !this.props.loadComplete) {
      this.setState({ activeGrader: undefined });
    }
  }

  public changeActiveGrader = (newGrader: string | undefined) => {
    this.setState({ activeGrader: newGrader });
  };

  public sortFunction = (a: any, b: any) => {
    if (typeof a === 'number' && typeof b === 'number') {
      return b - a;
    } else if (typeof a === 'number') {
      return -1;
    } else if (typeof b === 'number') {
      return 1;
    } else if (a === 'Unfinalized' && b === '--') {
      return -1;
    } else if (a === '--' && b === 'Unfinalized') {
      return 1;
    }

    return 0;
  };

  public render() {
    if (!this.state.activeGrader) {
      let data: any[] = [];
      let columns: Array<ColumnProps<any>> = [];
      if (this.props.loadComplete) {
        const aligner: 'left' | 'center' | 'right' = 'center';
        columns = [
          { title: 'Expand', dataIndex: 'expand', key: 'expand', align: aligner },
          {
            title: 'Grader',
            dataIndex: 'grader',
            key: 'primary',
            sorter: (a: any, b: any) => a.key.localeCompare(b.key),
          },
          ...this.props.assignments.map((assignment) => {
            return {
              title: assignment.name,
              dataIndex: assignment.name,
              key: assignment.name,
              sorter: (a: any, b: any) => {
                return this.sortFunction(a[assignment.name], b[assignment.name]);
              },
              align: aligner,
              className: 'student-table',
            };
          }),
        ];

        data = this.props.graders.map((graderEmail) => {
          const expandFn = () => {
            this.setState({ activeGrader: graderEmail });
          };
          const toRet = { expand: <Icon type="zoom-in" onClick={expandFn} />, grader: graderEmail, key: graderEmail };
          for (const assignment of this.props.assignments) {
            const graded = this.props.submissionsByGrader[graderEmail][assignment.id];
            if (graded) {
              toRet[assignment.name] = graded.length;
            } else {
              toRet[assignment.name] = 0;
            }
          }
          return toRet;
        });
      }

      const numGraders = Object.keys(this.props.submissionsByGrader).length;
      return (
        <TableDetail
          loadComplete={this.props.loadComplete}
          title={'Graded Submissions'}
          isEmpty={numGraders === 0 || this.props.assignments.length === 0}
          emptyNode={
            <Empty
              imageStyle={{
                height: 60,
              }}
              description={
                this.props.assignments.length === 0 && numGraders === 0 ? (
                  <span>No graders or assignments yet</span>
                ) : numGraders === 0 ? (
                  <span>Nice job creating an assignment! Now add some graders.</span>
                ) : (
                  <span>You added graders! Now create an assignment</span>
                )
              }
            >
              {numGraders === 0 ? (
                <CPButton
                  cpType="primary"
                  key={1}
                  icon="user-add"
                  onClick={this.props.changeTab.bind(this, PANELS.ROSTER_GRADERS)}
                >
                  Add some graders
                </CPButton>
              ) : null}

              {this.props.assignments.length === 0 ? (
                <span>
                  {numGraders === 0 ? <span>&nbsp; &nbsp;</span> : null}
                  <CPButton
                    cpType="primary"
                    key={2}
                    icon="plus-circle"
                    onClick={this.props.changeTab.bind(this, PANELS.ASSIGNMENTS)}
                  >
                    Add an assignment
                  </CPButton>
                </span>
              ) : null}
            </Empty>
          }
          columns={columns}
          data={data}
          actions={[]}
          breadcrumbs={
            <Breadcrumb>
              <Breadcrumb.Item>Submissions</Breadcrumb.Item>
              <Breadcrumb.Item>Graders</Breadcrumb.Item>
            </Breadcrumb>
          }
        />
      );
    } else {
      return (
        <GraderDetail
          onBack={this.changeActiveGrader.bind(this, undefined)}
          grader={this.state.activeGrader!}
          submissionsByAssignment={this.props.submissionsByGrader[this.state.activeGrader!]}
          assignments={this.props.assignments}
          graders={this.props.graders}
          viewsBySubmission={this.props.viewsBySubmission}
          deleteSubmission={this.props.deleteSubmission}
          changeSubmissionGrader={this.props.changeSubmissionGrader}
        />
      );
    }
  }
}

export default GraderData;
