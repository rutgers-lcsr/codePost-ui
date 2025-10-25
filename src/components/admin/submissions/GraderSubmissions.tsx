/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

import { PlusCircleOutlined, UserAddOutlined, ZoomInOutlined } from '@ant-design/icons';

/* ant imports */
import { Breadcrumb, Checkbox, Empty } from 'antd';

/* other library imports */
import Highlighter from 'react-highlight-words';

import { Link, Route, Routes } from 'react-router-dom';
import { LegacyRouteRenderer } from '../../../router/legacy';

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

const GraderData: React.FC<IByGraderProps> = (props) => {
  const [showInactive, setShowInactive] = React.useState(false);
  const [showActive, setShowActive] = React.useState(true);
  const [means, setMeans] = React.useState<{ [assignmentID: number]: string | null }>({});

  const {
    loadComplete,
    baseURL,
    assignments,
    submissionsByAssignment,
    submissionsByGrader,
    graders,
    inactiveGraders,
    viewsBySubmission,
    deleteSubmission,
    match,
  } = props;

  React.useEffect(() => {
    const newMeans: Record<string, string | null> = {};
    for (const key of Object.keys(submissionsByAssignment)) {
      const submissions: SubmissionInfoType[] = submissionsByAssignment[+key];
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
    setMeans(newMeans);
  }, [submissionsByAssignment]);

  const sortFunction = React.useCallback((a: any, b: any) => {
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
  }, []);

  const toggleValue = React.useCallback((value: 'showActive' | 'showInactive') => {
    if (value === 'showActive') {
      setShowActive((prev) => !prev);
    } else {
      setShowInactive((prev) => !prev);
    }
  }, []);

  if (!loadComplete) {
    return <Loading />;
  }

  return (
    <Routes>
      {graders.map((grader) => (
        <Route
          key={`route-grader-${grader}`}
          path={`${grader}/*`}
          element={
            <LegacyRouteRenderer
              path={`${match.url}/${grader}/*`}
              render={(props: any) => (
                <GraderDetail
                  {...props}
                  baseURL={match.url}
                  assignments={assignments}
                  graders={graders}
                  viewsBySubmission={viewsBySubmission}
                  deleteSubmission={deleteSubmission}
                  means={means}
                  grader={grader}
                  submissionsByAssignment={submissionsByGrader[grader]}
                />
              )}
            />
          }
        />
      ))}
      <Route
        index
        element={
          <LegacyRouteRenderer
            path={match.url}
            render={(_props) => {
              let data: Record<string, unknown>[] = [];
              let columns: ITableDetailColumn[] = [];
              let toggleInactiveGraders;

              if (loadComplete) {
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
                        if (graders.indexOf(grader) > -1) {
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
                  ...sortAssignments(assignments).map((assignment) => {
                    return {
                      title: assignment.name,
                      dataIndex: assignment.name,
                      key: assignment.name,
                      sorter: (a: Record<string, unknown>, b: Record<string, unknown>) => {
                        return sortFunction(a[assignment.name], b[assignment.name]);
                      },
                      align: aligner,
                      className: 'student-table',
                    };
                  }),
                ];

                // UI control for selecting which graders appear in table rows
                const hasInactiveGraders = inactiveGraders.length > 0;
                if (hasInactiveGraders) {
                  toggleInactiveGraders = (
                    <div>
                      <Checkbox defaultChecked={showActive} onChange={toggleValue.bind(this, 'showActive')}>
                        Active graders
                      </Checkbox>
                      <CPTooltip title={tooltips.admin.studentSubmissions.inactives} hideThisOnHideTips={true}>
                        <Checkbox defaultChecked={showInactive} onChange={toggleValue.bind(this, 'showInactive')}>
                          Inactive graders
                        </Checkbox>
                      </CPTooltip>
                    </div>
                  );
                }

                // Figure out which set of graders to show in table rows
                let rowValues: string[] = [];
                if (showActive && showInactive) {
                  rowValues = Object.keys(submissionsByGrader);
                } else if (showInactive) {
                  rowValues = inactiveGraders;
                } else if (showActive) {
                  rowValues = graders;
                }

                data = rowValues.map((graderEmail) => {
                  const toRet: any = {
                    expand: (
                      <Link to={`${match.url}/${graderEmail}`}>
                        <div style={{ cursor: 'pointer' }}>
                          <CPTooltip title={tooltips.admin.graderSubmissions.expand} hideThisOnHideTips={true}>
                            <ZoomInOutlined />
                          </CPTooltip>
                        </div>
                      </Link>
                    ),
                    key: graderEmail,
                    grader: graderEmail,
                  };
                  for (const assignment of assignments) {
                    const graded = submissionsByGrader[graderEmail][assignment.id];
                    if (graded) {
                      toRet[assignment.name] = (
                        <Link to={`${match.url}/${graderEmail}/${encodeForLink(assignment.name)}`}>
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

              const numGraders = Object.keys(submissionsByGrader).length;
              return (
                <TableDetail
                  loadComplete={loadComplete}
                  title={'Submissions by Grader'}
                  isEmpty={numGraders === 0 || assignments.length === 0}
                  emptyNode={
                    <Empty
                      styles={{
                        image: {
                          height: 60,
                        },
                      }}
                      description={
                        assignments.length === 0 && numGraders === 0 ? (
                          <span>No graders or assignments yet</span>
                        ) : numGraders === 0 ? (
                          <span>Nice job creating an assignment! Now add some graders.</span>
                        ) : (
                          <span>You added graders! Now create an assignment</span>
                        )
                      }
                    >
                      {numGraders === 0 ? (
                        <Link to={`${baseURL}/roster/graders`}>
                          <CPButton cpType="primary" key={1} icon={<UserAddOutlined />}>
                            Add some graders
                          </CPButton>
                        </Link>
                      ) : null}

                      {assignments.length === 0 ? (
                        <span>
                          {numGraders === 0 ? <span>&nbsp; &nbsp;</span> : null}
                          <Link to={`${baseURL}/assignments/overview`}>
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
                          title: <Link to={match.url}>Submissions</Link>,
                        },
                        {
                          title: <Link to={match.url}>By Grader</Link>,
                        },
                      ]}
                    />
                  }
                  titleInfo={tooltips.admin.graderSubmissions.title}
                />
              );
            }}
          />
        }
      />
    </Routes>
  );
};

export default GraderData;
