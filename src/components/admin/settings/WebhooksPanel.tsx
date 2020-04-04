/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* external imports */
import * as React from 'react';
import { Breadcrumb, Tag } from 'antd';

/* codePost imports */
import CPAdminDetail from '../other/CPAdminDetail';
import { CourseType } from '../../../infrastructure/course';
import { Webhook, WebhookType } from '../../../infrastructure/webhook';
import WebhookItem from './WebhookItem';

/**********************************************************************************************************************/

interface IProps {
  currentCourse: CourseType;
}

const WebhooksPanel = (props: IProps) => {
  const [webhooks, setWebhooks] = React.useState<WebhookType[]>([]);
  const [justSaved, setJustSaved] = React.useState<boolean>(false);

  React.useEffect(() => {
    const fetchWebhooks = async () => {
      if (props.currentCourse.webhooks !== undefined) {
        const res: WebhookType[] = await Promise.all(
          props.currentCourse.webhooks.map(async (id: number) => {
            return await Webhook.read(id);
          }),
        );
        setWebhooks(res);
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

  const content = (
    <div style={{ width: '80%' }}>
      {webhooks.map((webhook: WebhookType) => {
        return <WebhookItem key={`webhook-${webhook.id}`} webhook={webhook} setJustSaved={setJustSaved} />;
      })}
    </div>
  );

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
