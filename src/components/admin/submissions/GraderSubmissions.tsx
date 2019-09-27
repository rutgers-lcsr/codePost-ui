/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* ant imports */
import { Breadcrumb, Checkbox, Empty, Icon } from 'antd';

/* other library imports */
import Highlighter from 'react-highlight-words';

/* codePost imports  */
import { IAssignmentToSubmissionsMap, IGraderSubmissionsDataTable } from '../../../types/common';

import { AssignmentType, sortAssignments } from '../../../infrastructure/assignment';
import { SubmissionType } from '../../../infrastructure/submission';

import { ITableDetailColumn, TableDetail } from '../other/TableDetail';

import GraderDetail from './graders/GraderDetail';

import CPButton from '../../../components/core/CPButton';
import CPTooltip from '../../../components/core/CPTooltip';
import { tooltips } from '../../../components/core/tooltips';

import { PANELS } from '../Admin';

/**********************************************************************************************************************/

interface IProps {
  /* UI control */
  loadComplete: boolean;

  /* submissions data */
  assignments: AssignmentType[];
  submissionsByAssignment: IAssignmentToSubmissionsMap;
  submissionsByGrader: IGraderSubmissionsDataTable;
  graders: string[];
  inactiveGraders: string[];

  viewsBySubmission: { [submissionID: number]: { [student: string]: string } };
  deleteSubmission: (submission: SubmissionType) => Promise<void>;
  uploadSubmission: (assignment: AssignmentType, partners: string[], files: any[]) => Promise<void>;
  changeTab: (panel: PANELS) => void;
}

interface IState {
  activeGrader?: string;
  showInactive: boolean;
  showActive: boolean;
  means: { [assignmentID: number]: string | null };
}

class GraderData extends React.Component<IProps, IState> {
  public state: Readonly<IState> = {
    showActive: true,
    showInactive: false,
    means: {},
  };

  public componentDidMount() {
    const newMeans: any = {};
    for (const key of Object.keys(this.props.submissionsByAssignment)) {
      const submissions: SubmissionType[] = this.props.submissionsByAssignment[+key];
      let scoreSum = 0;
      let numFinalized = 0;
      for (const submission of submissions) {
        if (submission.isFinalized) {
          scoreSum = scoreSum + submission.grade!;
          numFinalized = numFinalized + 1;
        }
      }

      if (numFinalized > 0) {
        newMeans[key] = (scoreSum / numFinalized).toFixed(1);
      } else {
        newMeans[key] = null;
      }
    }
    this.setState({ means: newMeans });
  }

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

  public toggleValue = (value: string) => {
    this.setState((prevState: IState) => {
      const newState: any = { ...prevState };
      newState[value] = !newState[value];
      return newState;
    });
  };

  public render() {
    let toggleInactiveGraders;

    if (!this.state.activeGrader) {
      let data: any[] = [];
      let columns: ITableDetailColumn[] = [];
      if (this.props.loadComplete) {
        const aligner: 'left' | 'center' | 'right' = 'center';
        columns = [
          {
            title: 'Zoom in',
            dataIndex: 'expand',
            key: 'expand',
            align: aligner,
          },
          {
            title: 'Grader',
            dataIndex: 'grader',
            key: 'primary',
            sorter: (a: any, b: any) => a.key.localeCompare(b.key),
            renderForSearch: (searchText: string) => {
              return (text: string, record: any, index: number) => {
                const grader = record.grader;
                if (this.props.graders.indexOf(grader) > -1) {
                  return (
                    <Highlighter
                      highlightStyle={{
                        backgroundColor: '#5CBB8B',
                        padding: 0,
                      }}
                      searchWords={[searchText]}
                      autoEscape
                      textToHighlight={grader}
                    />
                  );
                } else {
                  return (
                    <span style={{ color: '#ccc' }}>
                      <Highlighter
                        highlightStyle={{
                          backgroundColor: '#5CBB8B',
                          padding: 0,
                        }}
                        searchWords={[searchText]}
                        autoEscape
                        textToHighlight={grader}
                      />
                    </span>
                  );
                }
              };
            },
          },
          ...sortAssignments(this.props.assignments).map((assignment) => {
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

        // UI control for selecting which graders appear in table rows
        const hasInactiveGraders = this.props.inactiveGraders.length > 0;
        if (hasInactiveGraders) {
          toggleInactiveGraders = (
            <div>
              <Checkbox defaultChecked={this.state.showActive} onChange={this.toggleValue.bind(this, 'showActive')}>
                Active graders
              </Checkbox>
              <CPTooltip title={tooltips.admin.studentSubmissions.inactives} hideThisOnHideTips={true}>
                <Checkbox
                  defaultChecked={this.state.showInactive}
                  onChange={this.toggleValue.bind(this, 'showInactive')}
                >
                  Inactive graders
                </Checkbox>
              </CPTooltip>
            </div>
          );
        }

        // Figure out which set of graders to show in table rows
        let rowValues: string[] = [];
        if (this.state.showActive && this.state.showInactive) {
          rowValues = Object.keys(this.props.submissionsByGrader);
        } else if (this.state.showInactive) {
          rowValues = this.props.inactiveGraders;
        } else if (this.state.showActive) {
          rowValues = this.props.graders;
        }

        data = rowValues.map((graderEmail) => {
          const expandFn = (event: React.MouseEvent<HTMLElement>) => {
            this.setState({ activeGrader: graderEmail });
          };

          const toRet: any = {
            expand: (
              <div onClick={expandFn} style={{ cursor: 'pointer' }}>
                <CPTooltip title={tooltips.admin.graderSubmissions.expand} hideThisOnHideTips={true}>
                  <Icon type="folder-open" />
                </CPTooltip>
              </div>
            ),
            key: graderEmail,
            grader: graderEmail,
          };
          for (const assignment of this.props.assignments) {
            const graded = this.props.submissionsByGrader[graderEmail][assignment.id];
            if (graded) {
              toRet[assignment.name] = (
                <span style={{ cursor: 'pointer' }} onClick={expandFn}>
                  {graded.length}
                </span>
              );
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
          title={'Submissions by Grader'}
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
          actions={[toggleInactiveGraders]}
          breadcrumbs={
            <Breadcrumb>
              <Breadcrumb.Item>Submissions</Breadcrumb.Item>
              <Breadcrumb.Item>By Grader</Breadcrumb.Item>
            </Breadcrumb>
          }
          titleInfo={tooltips.admin.graderSubmissions.title}
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
          means={this.state.means}
        />
      );
    }
  }
}

export default GraderData;
