import * as t from 'io-ts';
import { GenericObject, listObject } from './generics';

export const OrganizationV = t.intersection(
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

export type OrganizationType = t.TypeOf<typeof OrganizationV>;

export class Organization {
  public static list = listObject(OrganizationV, 'organizations');
}

// export { Organization, OrganizationType };
