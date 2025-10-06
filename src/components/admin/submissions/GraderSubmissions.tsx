/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

import { FolderOpenOutlined, PlusCircleOutlined, UserAddOutlined } from '@ant-design/icons';

/* ant imports */
import { Breadcrumb, Checkbox, Empty } from 'antd';

/* other library imports */
import Highlighter from 'react-highlight-words';

import { Link, Route, Switch } from 'react-router-dom';

/* codePost imports  */
import { IAssignmentToSubmissionsMap, IGraderSubmissionsDataTable } from '../../../types/common';

import { encodeForLink } from '../../../components/core/URLutils';

import { AssignmentType, sortAssignments } from '../../../infrastructure/assignment';
import { SubmissionInfoType } from '../../../infrastructure/submission';

import { ITableDetailColumn, TableDetail } from '../other/TableDetail';

import GraderDetail from './graders/GraderDetail';

import CPButton from '../../../components/core/CPButton';
import CPTooltip from '../../../components/core/CPTooltip';
import { tooltips } from '../../../components/core/tooltips';

import Loading from '../../../components/core/Loading';

/**********************************************************************************************************************/

export interface IByGraderProps {
  /* UI control */
  loadComplete: boolean;
  baseURL: string;

  /* submissions data */
  assignments: AssignmentType[];
  submissionsByAssignment: IAssignmentToSubmissionsMap;
  submissionsByGrader: IGraderSubmissionsDataTable;
  graders: string[];
  inactiveGraders: string[];

  viewsBySubmission: { [submissionID: number]: { [student: string]: string } };
  deleteSubmission: (submission: SubmissionInfoType) => Promise<void>;

  match: any;
}

interface IState {
  showInactive: boolean;
  showActive: boolean;
  means: { [assignmentID: number]: string | null };
}

class GraderData extends React.Component<IByGraderProps, IState> {
  public state: Readonly<IState> = {
    showActive: true,
    showInactive: false,
    means: {},
  };

  public componentDidMount() {
    const newMeans: any = {};
    for (const key of Object.keys(this.props.submissionsByAssignment)) {
      const submissions: SubmissionInfoType[] = this.props.submissionsByAssignment[+key];
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
    } else if (typeof a === 'object' && typeof b === 'object') {
      try {
        return b.props.children.props.children - a.props.children.props.children;
      } catch {
        return 0;
      }
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
    if (!this.props.loadComplete) {
      return <Loading />;
    }

    return (
      <Switch>
        {this.props.graders.map((grader) => (
          <Route
            key={`route-grader-${grader}`}
            path={`${this.props.match.url}/${grader}`}
            render={(props: any) => (
              <GraderDetail
                {...props}
                baseURL={this.props.match.url}
                assignments={this.props.assignments}
                graders={this.props.graders}
                viewsBySubmission={this.props.viewsBySubmission}
                deleteSubmission={this.props.deleteSubmission}
                means={this.state.means}
                grader={grader}
                submissionsByAssignment={this.props.submissionsByGrader[grader]}
              />
            )}
          />
        ))}
        <Route
          exact={true}
          path={this.props.match.url}
          render={(_props) => {
            let data: Record<string, unknown>[] = [];
            let columns: ITableDetailColumn[] = [];
            let toggleInactiveGraders;

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
                  sorter: (a, b) => a.key.localeCompare(b.key),
                  renderForSearch: (searchText: string) => {
                    return (_: string, record) => {
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
                    sorter: (a: Record<string, unknown>, b: Record<string, unknown>) => {
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
                    <Checkbox
                      defaultChecked={this.state.showActive}
                      onChange={this.toggleValue.bind(this, 'showActive')}
                    >
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
                const toRet: any = {
                  expand: (
                    <Link to={`${this.props.match.url}/${graderEmail}`}>
                      <div style={{ cursor: 'pointer' }}>
                        <CPTooltip title={tooltips.admin.graderSubmissions.expand} hideThisOnHideTips={true}>
                          <FolderOpenOutlined />
                        </CPTooltip>
                      </div>
                    </Link>
                  ),
                  key: graderEmail,
                  grader: graderEmail,
                };
                for (const assignment of this.props.assignments) {
                  const graded = this.props.submissionsByGrader[graderEmail][assignment.id];
                  if (graded) {
                    toRet[assignment.name] = (
                      <Link to={`${this.props.match.url}/${graderEmail}/${encodeForLink(assignment.name)}`}>
                        <span style={{ cursor: 'pointer' }}>{graded.length}</span>
                      </Link>
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
                    styles={{
                      image: {
                        height: 60,
                      },
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
                      <Link to={`${this.props.baseURL}/roster/graders`}>
                        <CPButton cpType="primary" key={1} icon={<UserAddOutlined />}>
                          Add some graders
                        </CPButton>
                      </Link>
                    ) : null}

                    {this.props.assignments.length === 0 ? (
                      <span>
                        {numGraders === 0 ? <span>&nbsp; &nbsp;</span> : null}
                        <Link to={`${this.props.baseURL}/assignments/overview`}>
                          <CPButton cpType="primary" key={2} icon={<PlusCircleOutlined />}>
                            Add an assignment
                          </CPButton>
                        </Link>
                      </span>
                    ) : null}
                  </Empty>
                }
                columns={columns}
                data={data}
                actions={[toggleInactiveGraders]}
                breadcrumbs={
                  <Breadcrumb
                    items={[
                      {
                        title: <Link to={this.props.match.url}>Submissions</Link>,
                      },
                      {
                        title: <Link to={this.props.match.url}>By Grader</Link>,
                      },
                    ]}
                  />
                }
                titleInfo={tooltips.admin.graderSubmissions.title}
              />
            );
          }}
        />
      </Switch>
    );
  }
}

export default GraderData;
