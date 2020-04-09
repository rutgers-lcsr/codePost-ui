import * as t from 'io-ts';
import { compare } from '../components/utils/SortUtils';
import { createObject, deleteObject, GenericObject, readObject, updateObject, readObjectDetail } from './generics';

import { SubmissionV } from './submission';

export const SectionV = t.intersection(
  [
    GenericObject,
    t.type({
      name: t.string,
      students: t.array(t.string),
      leaders: t.array(t.string),
    }),
    t.partial({}),
  ],
  'Section',
);

const SectionVPatch = t.intersection(
  [
    GenericObject,
    t.partial({
      name: t.string,
      students: t.array(t.string),
      leaders: t.array(t.string),
    }),
  ],
  'SectionPatch',
);

export type SectionType = t.TypeOf<typeof SectionV>;

export class Section {
  public static create = createObject(SectionV, SectionV, 'sections');
  public static read = readObject(SectionV, 'sections');
  public static update = updateObject(SectionV, SectionVPatch, 'sections');
  public static delete = deleteObject(SectionV, 'sections');

  public static readSubmissions = readObjectDetail(t.array(SubmissionV), 'sections', 'submissions');
}

export enum SECTION_SORT_TYPE {
  name,
  leader,
}

export function sectionSort(sortType: SECTION_SORT_TYPE, ascending: boolean, a: SectionType, b: SectionType) {
  // Sort by email
  if (sortType === SECTION_SORT_TYPE.name) {
    if (a.name < b.name) return ascending ? -1 : 1;
    else if (a.name > b.name) return ascending ? 1 : -1;
    else return 0;
  }
  // Sort by leader
  if (sortType === SECTION_SORT_TYPE.leader) {
    const aLeader = a.leaders ? a.leaders[0] : null;
    const bLeader = b.leaders ? b.leaders[0] : null;
    return compare(ascending, aLeader, bLeader);
  }
  return 0;
}

// export { SectionType, Section, SectionV, sectionSort };
