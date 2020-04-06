/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* external imports */
import * as React from 'react';
import { Breadcrumb, Collapse, Tag } from 'antd';

/* codePost imports */
import CPAdminDetail from '../other/CPAdminDetail';
import { CourseType } from '../../../infrastructure/course';
import { Webhook, WebhookType } from '../../../infrastructure/webhook';
import WebhookItem from './WebhookItem';

/**********************************************************************************************************************/

interface IProps {
  currentCourse: CourseType;
}

interface ICategorizedWebhooks {
  [category: string]: WebhookType[];
}

const WebhooksPanel = (props: IProps) => {
  const [webhooks, setWebhooks] = React.useState<ICategorizedWebhooks>({});
  const [justSaved, setJustSaved] = React.useState<boolean>(false);

  React.useEffect(() => {
    const fetchWebhooks = async () => {
      if (props.currentCourse.webhooks !== undefined) {
        const res: WebhookType[] = await Promise.all(
          props.currentCourse.webhooks.map(async (id: number) => {
            return await Webhook.read(id);
          }),
        );

        const categorizedWebhooks = res.reduce((accumulator: any, current: any) => {
          const category = current.event.split('.')[0];
          if (accumulator.hasOwnProperty(category)) {
            return { ...accumulator, [category]: [...accumulator[category], current] };
          } else {
            return { ...accumulator, [category]: [current] };
          }
        }, {});
        setWebhooks(categorizedWebhooks);
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
    <Collapse defaultActiveKey={['course', 'assignment', 'submission', 'file', 'comment']} expandIconPosition={'right'}>
      {Object.keys(webhooks).map((category: string) => {
        const header = (
          <span style={{ textTransform: 'capitalize', fontSize: '14px', fontWeight: 500 }}>{category}</span>
        );
        return (
          <Collapse.Panel header={header} key={category}>
            <div>
              {webhooks[category].map((webhook: WebhookType) => {
                return <WebhookItem key={`webhook-${webhook.id}`} webhook={webhook} setJustSaved={setJustSaved} />;
              })}
            </div>
          </Collapse.Panel>
        );
      })}
    </Collapse>
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
