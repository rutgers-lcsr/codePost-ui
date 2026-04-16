// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

import React from 'react';
import { Link, useLocation } from 'react-router-dom';

import { Breadcrumb, Button, Empty } from 'antd';
import { useQuery } from '@tanstack/react-query';

import { TableDetail } from '../../other/TableDetail';

import { autograderApi } from '../../../../api-client/clients';
import { AssignmentType } from '../../../../types/models';

import { encodeForLink } from '../../../core/URLutils';

/**********************************************************************************************************************/

interface IProps {
  assignments: AssignmentType[];
}

const TestsOverview = (props: IProps) => {
  const location = useLocation();

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

  const envIds = React.useMemo(
    () => uniqueAssignments.filter((a) => a.environment !== null).map((a) => a.environment!),
    [uniqueAssignments],
  );

  const { data: envBuildStatuses = {} } = useQuery({
    queryKey: ['envBuildStatuses', ...envIds],
    queryFn: async () => {
      const statuses: { [key: number]: number } = {};
      await Promise.all(
        uniqueAssignments
          .filter((a) => a.environment !== null)
          .map(async (a) => {
            try {
              if (a.environment) {
                const env = await autograderApi.environmentsRetrieve({ id: a.environment });
                statuses[a.environment] = env.buildStatus;
              }
            } catch (e) {
              console.error(`Failed to fetch environment status for assignment ${a.name}`, e);
            }
          }),
      );
      return statuses;
    },
    enabled: envIds.length > 0,
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
  });

  const data = uniqueAssignments.map((assignment) => {
    return {
      key: `assignment-${assignment.id}`,
      assignment: assignment.name,
      edit: (
        <Link to={`${location.pathname}/${encodeForLink(assignment.name)}/edit`}>
          <Button loading={assignment.environment ? envBuildStatuses[assignment.environment] === 1 : false}>
            {assignment.environment ? (envBuildStatuses[assignment.environment] === 1 ? 'Building' : 'Edit') : 'Create'}
          </Button>
        </Link>
      ),
    };
  });

  return (
    <TableDetail
      loadComplete={true}
      pagination={uniqueAssignments.length < 10 ? false : undefined}
      title={<div className="display-flex align-items-center">Environment & Tests</div>}
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
      breadcrumbs={<Breadcrumb items={[{ title: 'Assignments' }, { title: 'Environment & Tests' }]} />}
    />
  );
};

export default TestsOverview;
