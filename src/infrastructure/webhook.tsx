import * as t from 'io-ts';
import { createObject, deleteObject, GenericObject, readObject, updateObject } from './generics';

const WebhookV = t.intersection(
  [
    GenericObject,
    t.type({
      course: t.number,
      is_active: t.boolean,
      event: t.string,
      target: t.string,
    }),
    t.partial({}),
  ],
  'Webhook',
);

const WebhookVPatch = t.intersection(
  [
    GenericObject,
    t.partial({
      is_active: t.boolean,
      event: t.string,
      target: t.string,
    }),
  ],
  'WebhookPatch',
);

export type WebhookType = t.TypeOf<typeof WebhookV>;

export class Webhook {
  public static read = readObject(WebhookV, 'webhooks');
  public static update = updateObject(WebhookV, WebhookVPatch, 'webhooks');
}
