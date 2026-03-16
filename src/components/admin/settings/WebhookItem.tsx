// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* external imports */
import * as React from 'react';
import { Checkbox, Input, message } from 'antd';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';

/* codePost imports */
import type { Webhook } from '../../../api-client';
import type { PartialUpdateRequest } from '../../../api-client/apis/WebhooksApi';
import { webhooksApi } from '../../../api-client/clients';

/**********************************************************************************************************************/

interface IProps {
  webhook: Webhook;
  setJustSaved: (value: boolean) => void;
}

const WebhookItem = (props: IProps) => {
  const [isActive, setIsActive] = React.useState<boolean>(!!props.webhook.isActive);
  const [target, setTarget] = React.useState<string>(props.webhook.target);

  const onChangeCheckbox = async (e: CheckboxChangeEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsActive(e.target.checked);

    const payload: NonNullable<PartialUpdateRequest['patchedWebhook']> = {
      isActive: e.target.checked,
    };

    try {
      await webhooksApi.partialUpdate({ id: props.webhook.id, patchedWebhook: payload });
      props.setJustSaved(true);
    } catch {
      message.error('Error saving...');
    }
  };

  const onChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTarget(e.target.value);
  };

  const onBlurInput = async (e: React.FocusEvent<HTMLInputElement>) => {
    setTarget(e.target.value);

    const payload: NonNullable<PartialUpdateRequest['patchedWebhook']> = {
      target: e.target.value,
    };

    try {
      await webhooksApi.partialUpdate({ id: props.webhook.id, patchedWebhook: payload });
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
          onPressEnter={(e: React.KeyboardEvent<HTMLInputElement>) => {
            (e.target as HTMLInputElement).blur();
          }}
        />
      </div>
    </div>
  );
};

export default WebhookItem;
