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

import { TaskV } from './runTypes';

const EnvironmentV = t.intersection(
  [
    GenericObject,
    t.type({
      language: t.string,
      assignment: t.number,
      dependencies: t.string,
      helperFiles: t.array(t.number),
      solutionFiles: t.array(t.number),
      compileText: t.string,
      isRunning: t.boolean,
      sourceFiles: t.array(t.number),
      dumpMode: t.boolean,
      testParsing: t.boolean,
      dockerfile: t.string,
    }),
    t.partial({}),
  ],
  'Environment',
);

const EnvironmentVPost = t.intersection(
  [
    GenericObject,
    t.type({
      language: t.string,
      assignment: t.number,
      dependencies: t.string,
      compileText: t.string,
      dumpMode: t.boolean,
      testParsing: t.boolean,
    }),
    t.partial({}),
  ],
  'EnvironmentPost',
);

const EnvironmentVPatch = t.intersection(
  [
    GenericObject,
    t.partial({
      language: t.string,
      dependencies: t.string,
      compileText: t.string,
      dumpMode: t.boolean,
      testParsing: t.boolean,
    }),
  ],
  'EnvironmentPatch',
);

const BuildData = t.intersection([
  GenericObject,
  t.type({
    dependencies: t.array(t.string),
    language: t.string,
  }),
]);

const RunAllData = t.intersection([
  GenericObject,
  t.type({
    sendEmail: t.boolean,
  }),
]);

const TestTemplate = t.intersection([
  GenericObject,
  t.type({
    name: t.string,
    code: t.string,
    errorIfMissing: t.union([t.null, t.boolean]),
  }),
]);

const TestsSource = t.intersection([
  GenericObject,
  t.type({
    templates: t.array(TestTemplate),
    main: t.string,
  }),
]);

export type TestTemplateType = t.TypeOf<typeof TestTemplate>;
export type TestsSourceType = t.TypeOf<typeof TestsSource>;

export type EnvironmentType = t.TypeOf<typeof EnvironmentV>;

export class Environment {
  public static create = createObject(EnvironmentV, EnvironmentVPost, 'autograder/environments');
  public static read = readObject(EnvironmentV, 'autograder/environments');
  public static delete = deleteObject(EnvironmentV, 'autograder/environments');
  public static update = updateObject(EnvironmentV, EnvironmentVPatch, 'autograder/environments');

  public static build = updateObjectDetail(EnvironmentV, BuildData, 'autograder/environments', 'build');
  public static eject = readObjectDetail(TestsSource, 'autograder/environments', 'eject');
  public static runAll = updateObjectDetail(TaskV, RunAllData, 'autograder/environments', 'runAll');
  public static run = readObjectDetail(TaskV, 'autograder/environments', 'run');
}
