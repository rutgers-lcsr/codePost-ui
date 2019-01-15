import * as t from 'io-ts';
import { createObject, deleteObject, GenericObject, readObject, updateObject } from './generics';

const SectionV = t.intersection(
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

type SectionType = t.TypeOf<typeof SectionV>;

class Section {
  public static create = createObject(SectionV, SectionV, 'sections');
  public static read = readObject(SectionV, 'sections');
  public static update = updateObject(SectionV, SectionVPatch, 'sections');
  public static delete = deleteObject(SectionV, 'sections');
}

export { SectionType, Section };
