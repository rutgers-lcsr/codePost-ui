// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* external imports */
import { Breadcrumb, Skeleton, Tag } from 'antd';
import * as React from 'react';
import { useQuery } from '@tanstack/react-query';

/* codePost imports */
import type { Course, Webhook } from '../../../api-client';
import { webhooksApi } from '../../../api-client/clients';
import CPAdminDetail from '../other/CPAdminDetail';

import WebhooksTable from './WebhooksTable';

/**********************************************************************************************************************/

interface IProps {
  currentCourse: Course;
}

const WebhooksPanel = (props: IProps) => {
  const [justSaved, setJustSaved] = React.useState<boolean>(false);

  const { data: webhooks = [], isPending: loading } = useQuery({
    queryKey: ['webhooks', props.currentCourse.id] as const,
    queryFn: async (): Promise<Webhook[]> => {
      if (!props.currentCourse.webhooks?.length) return [];
      return Promise.all(
        props.currentCourse.webhooks.map((id: number) => webhooksApi.retrieve({ id })),
      );
    },
    enabled: (props.currentCourse.webhooks?.length ?? 0) > 0,
  });

  React.useEffect(() => {
    const hide = () => {
      setJustSaved(false);
    };

    if (justSaved) {
      setTimeout(hide, 1000);
    }
  }, [justSaved]);

  const content = loading ? <Skeleton /> : <WebhooksTable webhooks={webhooks} course={props.currentCourse} />;

  const savedTag = justSaved ? <Tag color="green">SAVED</Tag> : null;

  const actions: React.ReactNode[] = [savedTag];

  return (
    <CPAdminDetail
      goBack={null}
      title={`Webhooks: ${props.currentCourse.name} | ${props.currentCourse.period}`}
      actions={actions}
      content={content}
      breadcrumbs={<Breadcrumb items={[{ title: 'Course Settings' }, { title: 'Webhooks' }]} />}
    />
  );
};

export default WebhooksPanel;
