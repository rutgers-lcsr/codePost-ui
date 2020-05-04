/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* external imports */
import * as React from 'react';
import { Checkbox, Input, message } from 'antd';

/* codePost imports */
import { Webhook, WebhookType } from '../../../infrastructure/webhook';

/**********************************************************************************************************************/

interface IProps {
  webhook: WebhookType;
  setJustSaved: any;
}

const WebhookItem = (props: IProps) => {
  const [isActive, setIsActive] = React.useState<boolean>(props.webhook.is_active);
  const [target, setTarget] = React.useState<string>(props.webhook.target);

  const onChangeCheckbox = async (e: any) => {
    e.stopPropagation();
    e.preventDefault();
    setIsActive(e.target.checked);

    try {
      await Webhook.update({ id: props.webhook.id, is_active: e.target.checked });
      props.setJustSaved(true);
    } catch {
      message.error('Error saving...');
    }
  };

  const onChangeInput = (e: any) => {
    setTarget(e.target.value);
  };

  const onBlurInput = async (e: any) => {
    setTarget(e.target.value);

    try {
      await Webhook.update({ id: props.webhook.id, target: e.target.value });
      props.setJustSaved(true);
    } catch {
      message.error('Error saving...');
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '5px 0px' }}>
      <div style={{ flexBasis: '35%' }}>
        <Checkbox checked={isActive} onChange={onChangeCheckbox}>
          {props.webhook.event}
        </Checkbox>
      </div>
      <div style={{ flexGrow: 1 }}>
        <Input
          value={target}
          onChange={onChangeInput}
          onBlur={onBlurInput}
          onPressEnter={(e: any) => {
            e.target.blur();
          }}
        />
      </div>
    </div>
  );
};

export default WebhookItem;
