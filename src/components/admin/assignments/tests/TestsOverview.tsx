/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

import React, { useEffect, useState } from 'react';
import { RouteComponentProps } from '../../../../router/legacy';
import { Link } from 'react-router-dom';

import { Breadcrumb, Button, Empty } from 'antd';

import { TableDetail } from '../../other/TableDetail';

import { AssignmentType } from '../../../../infrastructure/types';
import { Environment } from '../../../../infrastructure/autograder/environment';

import { encodeForLink } from '../../../core/URLutils';

/**********************************************************************************************************************/

interface IProps {
  assignments: AssignmentType[];
}

const TestsOverview = (props: IProps & RouteComponentProps) => {
  const [envBuildStatuses, setEnvBuildStatuses] = useState<{ [key: number]: number }>({});

  const columns = [
    { title: 'Assignment', key: 'assignment', dataIndex: 'assignment' },
    { title: 'Edit Environment', key: 'edit', dataIndex: 'edit', align: 'center' as const },
  ];

  // Deduplicate assignments by ID
  const uniqueAssignments = React.useMemo(() => {
    const seen = new Set<number>();
    return props.assignments.filter((assignment) => {
      if (seen.has(assignment.id)) return false;
      seen.add(assignment.id);
      return true;
    });
  }, [props.assignments]);

  useEffect(() => {
    let isMounted = true;
    const fetchStatuses = async () => {
      const statuses: { [key: number]: number } = {};
      const promises = uniqueAssignments
        .filter((a) => a.environment !== null)
        .map(async (a) => {
          try {
            if (a.environment) {
              const env = await Environment.read(a.environment);
              statuses[a.environment] = env.buildStatus;
            }
          } catch (e) {
            console.error(`Failed to fetch environment status for assignment ${a.name}`, e);
          }
        });

      await Promise.all(promises);

      if (isMounted) {
        setEnvBuildStatuses(statuses);
      }
    };

    fetchStatuses();
    const interval = setInterval(fetchStatuses, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [uniqueAssignments]);

  const data = uniqueAssignments.map((assignment) => {
    return {
      key: `assignment-${assignment.id}`,
      assignment: assignment.name,
      edit: (
        <Link to={`${props.match.url}/${encodeForLink(assignment.name)}/edit`}>
          <Button loading={assignment.environment ? envBuildStatuses[assignment.environment] === 1 : false}>
            {assignment.environment
              ? envBuildStatuses[assignment.environment] === 1
                ? 'Building'
                : 'Edit'
              : 'Create'}
          </Button>
        </Link>
      ),
    };
  });

  return (
    <TableDetail
      loadComplete={true}
      pagination={uniqueAssignments.length < 10 ? false : undefined}
      title={<div className="display-flex align-items-center">Environment Setup</div>}
      isEmpty={data.length === 0}
      emptyNode={
        <Empty
          styles={{
            image: {
              height: 60,
            },
          }}
          description={<span>No assignments yet</span>}
        ></Empty>
      }
      columns={columns}
      data={data}
      actions={[]}
      breadcrumbs={<Breadcrumb items={[{ title: 'Assignments' }, { title: 'Environment Setup' }]} />}
    />
  );
};

export default TestsOverview;
