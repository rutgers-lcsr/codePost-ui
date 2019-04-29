import * as t from 'io-ts';
import { GenericObject } from './generics';

const SubmissionHistoryV = t.intersection(
  [
    GenericObject,
    t.type({
      student: t.string,
      hasViewed: t.boolean,
      submission: t.number,
    }),
    t.partial({}),
  ],
  'SubmissionHistory',
);

const SubmissionHistoryVPatch = t.intersection(
  [
    GenericObject,
    t.type({
      hasViewed: t.boolean,
    }),
    t.partial({}),
  ],
  'SubmissionHistory',
);

type SubmissionHistoryType = t.TypeOf<typeof SubmissionHistoryV>;

export { SubmissionHistoryType, SubmissionHistoryV, SubmissionHistoryVPatch };
