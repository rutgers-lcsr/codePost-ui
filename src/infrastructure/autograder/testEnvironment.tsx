import * as t from 'io-ts';
import { createObject, deleteObject, GenericObject, readObject, updateObject, updateObjectDetail } from '../generics';

const TestEnvironmentV = t.intersection(
  [
    GenericObject,
    t.type({
      language: t.union([t.string, t.null]),
      assignment: t.number,
      dependencies: t.string,
    }),
    t.partial({}),
  ],
  'TestEnvironment',
);

const TestEnvironmentVPost = t.intersection(
  [
    GenericObject,
    t.type({
      language: t.union([t.string, t.null]),
      assignment: t.number,
      dependencies: t.string,
    }),
    t.partial({}),
  ],
  'TestEnvironmentPost',
);

const TestEnvironmentVPatch = t.intersection(
  [
    GenericObject,
    t.partial({
      language: t.union([t.string, t.null]),
      dependencies: t.string,
    }),
  ],
  'TestEnvironmentPatch',
);

const BuildData = t.intersection([
  GenericObject,
  t.type({
    dependencies: t.array(t.string),
    language: t.string,
    simulate: t.boolean,
  }),
]);

const SimulateResponse = t.intersection([GenericObject, t.type({ result: t.boolean, logs: t.array(t.string) })]);

export type TestEnvironmentType = t.TypeOf<typeof TestEnvironmentV>;

export class TestEnvironment {
  public static create = createObject(TestEnvironmentV, TestEnvironmentVPost, 'autograder/testEnvironments');
  public static read = readObject(TestEnvironmentV, 'autograder/testEnvironments');
  public static delete = deleteObject(TestEnvironmentV, 'autograder/testEnvironments');
  public static update = updateObject(TestEnvironmentV, TestEnvironmentVPatch, 'autograder/testEnvironments');

  public static simulateBuild = updateObjectDetail(SimulateResponse, BuildData, 'autograder/testEnvironments', 'build');
  public static updateBuild = updateObjectDetail(TestEnvironmentV, BuildData, 'autograder/testEnvironments', 'build');
}
