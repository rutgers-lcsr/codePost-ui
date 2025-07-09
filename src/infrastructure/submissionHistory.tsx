import * as t from 'io-ts';
import { GenericObject } from './generics';

export const SubmissionHistoryV = t.intersection(
  [
    GenericObject,
    t.type({
      student: t.string,
      hasViewed: t.boolean,
      submission: t.number,
      dateViewed: t.union([t.null, t.string]),
    }),
  ],
  'SubmissionHistory',
);

export const SubmissionHistoryVPatch = t.intersection(
  [
    GenericObject,
    t.type({
      hasViewed: t.boolean,
    }),
  ],
  'SubmissionHistory',
);

export type SubmissionHistoryType = t.TypeOf<typeof SubmissionHistoryV>;

// export { SubmissionHistoryType, SubmissionHistoryV, SubmissionHistoryVPatch };
