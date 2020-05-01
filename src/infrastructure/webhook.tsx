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
  public static create = createObject(WebhookV, WebhookV, 'webhooks');
  public static read = readObject(WebhookV, 'webhooks');
  public static update = updateObject(WebhookV, WebhookVPatch, 'webhooks');
  public static delete = deleteObject(WebhookV, 'webhooks');
}

export const VALID_WEBHOOKS: { [obj: string]: string[] } = {
  course: ['changed', 'name', 'period', 'archived', 'students', 'graders', 'courseAdmins'],
  section: ['added', 'changed', 'removed', 'name'],
  assignment: ['added', 'changed', 'removed', 'name', 'isVisible', 'isReleased', 'explanation', 'points'],
  rubricCategory: ['added', 'changed', 'removed', 'name', 'pointLimit', 'helpText'],
  rubricComment: ['added', 'changed', 'removed', 'text', 'explanation', 'instructionText', 'pointDelta'],
  submission: ['added', 'changed', 'removed', 'grader', 'isFinalized', 'questionIsOpen'],
  file: ['added', 'changed', 'removed', 'code', 'name', 'extension'],
  fileTemplate: ['added', 'changed', 'removed'],
  comment: ['added', 'changed', 'removed', 'text', 'pointDelta', 'rubricComment'],
  testCategory: ['added', 'changed', 'removed'],
  testCase: [
    'added',
    'changed',
    'removed',
    'description',
    'type',
    'pointsFail',
    'pointsPass',
    'text',
    'explanation',
    'exposed',
    'lastSolutionRun',
  ],
  submissionTest: ['added'],
  submissionHistory: ['changed'],
  environment: ['added', 'changed', 'removed', 'isRunning'],
  solutionFile: ['added', 'changed', 'removed'],
  helperFile: ['added', 'changed', 'removed'],
};
