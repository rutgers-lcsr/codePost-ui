/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* external imports */
import * as React from 'react';
import { Breadcrumb, Collapse, Skeleton, Tag, Table } from 'antd';

/* codePost imports */
import CPAdminDetail from '../other/CPAdminDetail';
import { CourseType } from '../../../infrastructure/course';
import { Webhook, WebhookType } from '../../../infrastructure/webhook';
import useWebhookItem from './WebhookItem';

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
    // <WebhookItem key={`webhook-${webhook.id}`} webhook={webhook} setJustSaved={setJustSaved} />;

    // const [checkbox, input] = useWebhookItem({ webhook: webhook, setJustSaved: setJustSaved });

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

  // const content = <Table dataSource={data} columns={columns} />;
  const content = loading ? <Skeleton /> : <WebhooksTable webhooks={webhooks} course={props.currentCourse} />;
  // const content = (
  //   <Collapse defaultActiveKey={[]} expandIconPosition={'right'}>
  //     {Object.keys(webhooks).map((category: string) => {
  //       const header = (
  //         <div>
  //           <span style={{ textTransform: 'capitalize', fontSize: '14px', fontWeight: 500 }}>{category}</span>
  //           {filterMainHooks(webhooks[category]).map((webhook: WebhookType) => {
  //             return <WebhookItem key={`webhook-${webhook.id}`} webhook={webhook} setJustSaved={setJustSaved} />;
  //           })}
  //         </div>
  //       );
  //       return (
  //         <Collapse.Panel header={header} key={category}>
  //           <div>
  //             {filterDetailHooks(webhooks[category]).map((webhook: WebhookType) => {
  //               return <WebhookItem key={`webhook-${webhook.id}`} webhook={webhook} setJustSaved={setJustSaved} />;
  //             })}
  //           </div>
  //         </Collapse.Panel>
  //       );
  //     })}
  //   </Collapse>
  // );

  const savedTag = justSaved ? <Tag color="green">SAVED</Tag> : null;

  const actions: React.ReactNode[] = [savedTag];

  return (
    <CPAdminDetail
      goBack={null}
      title={`Webhooks: ${props.currentCourse.name} | ${props.currentCourse.period}`}
      actions={actions}
      content={content}
      breadcrumbs={
        <Breadcrumb>
          <Breadcrumb.Item>Course Settings</Breadcrumb.Item>
          <Breadcrumb.Item>Webhooks</Breadcrumb.Item>
        </Breadcrumb>
      }
    />
  );
};

export default WebhooksPanel;
