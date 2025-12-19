import * as t from 'io-ts';
import {
  createObject,
  createObjectDetail,
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
      compileText: t.string,
      dockerfile: t.string,
      buildType: t.string,
      allowNetworkAccess: t.boolean,
      maxStudentTestRuns: t.union([t.null, t.number]),
      maxExposedFailedTests: t.union([t.null, t.number]),
      dockerRunInstructions: t.array(t.string),
      // New fields for custom environments
      requirements: t.string,
      imageName: t.union([t.string, t.null]),
      buildStatus: t.number,
      buildLogs: t.string,
      lastBuilt: t.union([t.string, t.null]),
      autoDetect: t.boolean,
      envVars: t.record(t.string, t.string),

      // Auto-Detect / Convergence Fields
      currentBuildVersion: t.union([t.number, t.null]),
      imageHistory: t.array(t.any),
      convergencePending: t.boolean,
      convergenceStats: t.record(t.string, t.any),
      successfulRuns: t.number,
      totalRuns: t.number,
      successRate: t.number,
      isRunning: t.union([t.boolean, t.undefined]),
    }),
    t.partial({}),
  ],
  'Environment',
);

const EnvironmentVPost = t.intersection(
  [
    t.type({
      language: t.string,
      assignment: t.number,
      compileText: t.string,
      buildType: t.string,
      allowNetworkAccess: t.boolean,
      maxStudentTestRuns: t.union([t.null, t.number]),
      maxExposedFailedTests: t.union([t.null, t.number]),
      dockerRunInstructions: t.array(t.string),
      requirements: t.string,
      dockerfile: t.string,
      autoDetect: t.boolean,
      envVars: t.record(t.string, t.string),
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
      buildType: t.string,
      allowNetworkAccess: t.boolean,
      maxStudentTestRuns: t.union([t.null, t.number]),
      maxExposedFailedTests: t.union([t.null, t.number]),
      dockerRunInstructions: t.array(t.string),
      requirements: t.string,
      dockerfile: t.string,
      autoDetect: t.boolean,
      envVars: t.record(t.string, t.string),
    }),
  ],
  'EnvironmentPatch',
);

const BuildStatus = t.type({
  isSuccess: t.boolean,
  inProgress: t.boolean,
  logs: t.string,
  dockerfile: t.union([t.string, t.null, t.undefined]),
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

const ReproductionKit = t.type({
  Dockerfile: t.string,
  'tests.json': t.string,
  'run_tests.py': t.string,
});

export type ReproductionKitType = t.TypeOf<typeof ReproductionKit>;
export type TestTemplateType = t.TypeOf<typeof TestTemplate>;
export type TestsSourceType = t.TypeOf<typeof TestsSource>;

export type EnvironmentType = t.TypeOf<typeof EnvironmentV>;

export class Environment {
  public static create = createObject(EnvironmentV, EnvironmentVPost, 'autograder/environments');
  public static read = readObject(EnvironmentV, 'autograder/environments');
  public static delete = deleteObject(EnvironmentV, 'autograder/environments');
  public static update = updateObject(EnvironmentV, EnvironmentVPatch, 'autograder/environments');

  public static build = updateObjectDetail(TaskV, EnvironmentVPatch, 'autograder/environments', 'build');
  public static status = readObjectDetail(BuildStatus, 'autograder/environments', 'build_status');
  public static eject = readObjectDetail(ReproductionKit, 'autograder/environments', 'eject');
  public static runAll = updateObjectDetail(TaskV, RunAllData, 'autograder/environments', 'runAll');
  public static run = updateObjectDetail(TaskV, RunData, 'autograder/environments', 'run');
  public static dockerfile = readObjectDetail(Dockerfile, 'autograder/environments', 'dockerfile');
  public static preview = createObjectDetail(Dockerfile, EnvironmentVPatch, 'autograder/environments', 'preview');
}
