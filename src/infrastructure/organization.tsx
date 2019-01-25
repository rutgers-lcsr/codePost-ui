import * as t from 'io-ts';
import { GenericObject } from './generics';

const OrganizationV = t.intersection(
  [
    GenericObject,
    t.type({
      name: t.string,
      shortname: t.string,
      emailDomain: t.string,
    }),
    t.partial({}),
  ],
  'Organization',
);

type OrganizationType = t.TypeOf<typeof OrganizationV>;

export { OrganizationType };
