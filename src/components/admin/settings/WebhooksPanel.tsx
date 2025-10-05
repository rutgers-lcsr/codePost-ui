/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* external imports */
import { Breadcrumb, Skeleton, Tag } from 'antd';
import * as React from 'react';

/* codePost imports */
import { CourseType } from '../../../infrastructure/course';
import { Webhook, WebhookType } from '../../../infrastructure/webhook';
import CPAdminDetail from '../other/CPAdminDetail';

import WebhooksTable from './WebhooksTable';

/**********************************************************************************************************************/

interface IProps {
  currentCourse: CourseType;
}

type AlignType = 'center' | 'right' | 'left' | undefined;

const WebhooksPanel = (props: IProps) => {
  const [webhooks, setWebhooks] = React.useState<WebhookType[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [justSaved, setJustSaved] = React.useState<boolean>(false);

  const columns = [
    {
      title: 'Enabled',
      dataIndex: 'enabled',
      key: 'enabled',
    },
    {
      title: 'Object',
      dataIndex: 'object',
      key: 'object',
      align: 'center' as AlignType,
      render: (object: string) => {
        return <Tag>{object}</Tag>;
      },
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
    },
    {
      title: 'Target',
      dataIndex: 'target',
      key: 'target',
    },
  ];

  const data = webhooks.map((webhook: WebhookType) => {
    const [object, action] = webhook.event.split('.');
    return {
      key: `webhook-${webhook.id}`,
      enabled: webhook.is_active,
      object,
      action,
      target: webhook.target,
    };
  });

  React.useEffect(() => {
    const fetchWebhooks = async () => {
      if (props.currentCourse.webhooks !== undefined) {
        const res: WebhookType[] = await Promise.all(
          props.currentCourse.webhooks.map(async (id: number) => {
            return await Webhook.read(id);
          }),
        );

        setWebhooks(res);
        setLoading(false);
      }
    };
    fetchWebhooks();
  }, []);

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
