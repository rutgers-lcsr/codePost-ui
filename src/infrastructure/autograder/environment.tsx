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
      helperFiles: t.array(t.number),
      solutionFiles: t.array(t.number),
      compileText: t.string,
      isRunning: t.boolean,
      sourceFiles: t.array(t.number),
      dumpMode: t.boolean,
      testParsing: t.boolean,
      dockerfile: t.string,
      buildType: t.string,
      allowNetworkAccess: t.boolean,
      maxStudentTestRuns: t.union([t.null, t.number]),
      exposeDumpLogs: t.boolean,
      maxExposedFailedTests: t.union([t.null, t.number]),
      dockerRunInstructions: t.array(t.string),
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
      compileText: t.string,
      dumpMode: t.boolean,
      testParsing: t.boolean,
      buildType: t.string,
      allowNetworkAccess: t.boolean,
      maxStudentTestRuns: t.union([t.null, t.number]),
      exposeDumpLogs: t.boolean,
      maxExposedFailedTests: t.union([t.null, t.number]),
      dockerRunInstructions: t.array(t.string),
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
      compileText: t.string,
      dumpMode: t.boolean,
      testParsing: t.boolean,
      buildType: t.string,
      allowNetworkAccess: t.boolean,
      maxStudentTestRuns: t.union([t.null, t.number]),
      maxExposedFailedTests: t.union([t.null, t.number]),
      dockerRunInstructions: t.array(t.string),
      dockerfile: t.string,
    }),
  ],
  'EnvironmentPatch',
);

const BuildStatus = t.type({
  isSuccess: t.boolean,
  inProgress: t.boolean,
  logs: t.string,
});

const RunAllData = t.intersection([
  GenericObject,
  t.type({
    sendEmail: t.boolean,
  }),
]);

const RunData = t.intersection([
  GenericObject,
  t.partial({
    files: t.string,
    submission: t.number,
    simulate: t.boolean,
    exposedOnly: t.boolean,
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

const Dockerfile = t.string;

export type TestTemplateType = t.TypeOf<typeof TestTemplate>;
export type TestsSourceType = t.TypeOf<typeof TestsSource>;

export type EnvironmentType = t.TypeOf<typeof EnvironmentV>;

export class Environment {
  public static create = createObject(EnvironmentV, EnvironmentVPost, 'autograder/environments');
  public static read = readObject(EnvironmentV, 'autograder/environments');
  public static delete = deleteObject(EnvironmentV, 'autograder/environments');
  public static update = updateObject(EnvironmentV, EnvironmentVPatch, 'autograder/environments');

  public static build = updateObjectDetail(t.type({}), EnvironmentV, 'autograder/environments', 'build');
  public static status = readObjectDetail(BuildStatus, 'autograder/environments', 'status');
  public static eject = readObjectDetail(TestsSource, 'autograder/environments', 'eject');
  public static runAll = updateObjectDetail(TaskV, RunAllData, 'autograder/environments', 'runAll');
  public static run = updateObjectDetail(TaskV, RunData, 'autograder/environments', 'run');
  public static dockerfile = readObjectDetail(Dockerfile, 'autograder/environments', 'dockerfile');
}
