import * as t from 'io-ts';
import {
  createObject,
  deleteObject,
  GenericObject,
  readObject,
  updateObject,
  updateObjectDetail,
  readObjectDetail,
} from '../generics';

const EnvironmentV = t.intersection(
  [
    GenericObject,
    t.type({
      language: t.union([t.string, t.null]),
      assignment: t.number,
      dependencies: t.string,
      helperFiles: t.array(t.number),
      solutionFiles: t.array(t.number),
      compileText: t.string,
    }),
    t.partial({}),
  ],
  'Environment',
);

const EnvironmentVPost = t.intersection(
  [
    GenericObject,
    t.type({
      language: t.union([t.string, t.null]),
      assignment: t.number,
      dependencies: t.string,
      compileText: t.string,
    }),
    t.partial({}),
  ],
  'EnvironmentPost',
);

const EnvironmentVPatch = t.intersection(
  [
    GenericObject,
    t.partial({
      language: t.union([t.string, t.null]),
      dependencies: t.string,
      compileText: t.string,
    }),
  ],
  'EnvironmentPatch',
);

const BuildData = t.intersection([
  GenericObject,
  t.type({
    dependencies: t.array(t.string),
    language: t.string,
    simulate: t.boolean,
  }),
]);

const TestTemplate = t.intersection([
  GenericObject,
  t.type({
    code: t.string,
    extension: t.string,
  }),
]);

const TestsSource = t.intersection([
  GenericObject,
  t.type({
    templates: t.array(TestTemplate),
    main: t.string,
  }),
]);

const SimulateResponse = t.intersection([GenericObject, t.type({ result: t.boolean, logs: t.array(t.string) })]);

export type TestTemplateType = t.TypeOf<typeof TestTemplate>;
export type TestsSourceType = t.TypeOf<typeof TestsSource>;

export type EnvironmentType = t.TypeOf<typeof EnvironmentV>;

export class Environment {
  public static create = createObject(EnvironmentV, EnvironmentVPost, 'autograder/environments');
  public static read = readObject(EnvironmentV, 'autograder/environments');
  public static delete = deleteObject(EnvironmentV, 'autograder/environments');
  public static update = updateObject(EnvironmentV, EnvironmentVPatch, 'autograder/environments');

  public static simulateBuild = updateObjectDetail(SimulateResponse, BuildData, 'autograder/environments', 'build');
  public static updateBuild = updateObjectDetail(EnvironmentV, BuildData, 'autograder/environments', 'build');
  public static eject = readObjectDetail(TestsSource, 'autograder/environments', 'eject');
}
