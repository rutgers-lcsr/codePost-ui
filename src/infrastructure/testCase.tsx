import * as t from 'io-ts';
import {
  createObject,
  createObjectDetail,
  deleteObject,
  GenericObject,
  readObject,
  updateObject,
  getHeaders,
  handleErrorResponse,
} from './generics';
import { TaskV } from './autograder/runTypes';
export const TestCaseV = t.intersection(
  [
    GenericObject,
    t.type({
      sortKey: t.number,
      testCategory: t.number,
      description: t.string,
      type: t.string,
      pointsPass: t.number,
      pointsFail: t.number,
      text: t.string,
      modified: t.string,
      exposed: t.boolean,
      instances: t.array(t.number),
      explanation: t.string,
      lastSolutionRun: t.number,
      rubricItem: t.union([t.number, t.null]),
    }),
    t.partial({
      targetCellId: t.union([t.number, t.string, t.null]),
      testCode: t.string,
      timeout: t.number,
    }),
  ],
  'TestCase',
);

const TestCaseVPatch = t.intersection(
  [
    GenericObject,
    t.partial({
      sortKey: t.number,
      testCategory: t.number,
      description: t.string,
      type: t.string,
      pointsPass: t.number,
      pointsFail: t.number,
      text: t.string,
      exposed: t.boolean,
      lastSolutionRun: t.number,
      testCode: t.string,
      rubricItem: t.union([t.number, t.null]),
      timeout: t.number,
    }),
  ],
  'TestCasePatch',
);

const TestCaseVPost = t.intersection(
  [
    GenericObject,
    t.type({
      sortKey: t.number,
      testCategory: t.number,
      description: t.string,
      type: t.string,
      pointsPass: t.number,
      pointsFail: t.number,
      text: t.string,
      exposed: t.boolean,
      explanation: t.string,
    }),
    t.partial({
      testCode: t.string,
      rubricItem: t.union([t.number, t.null]),
      timeout: t.number,
    }),
  ],
  'TestCasePost',
);

export const StudentTestCaseV = t.intersection(
  [
    GenericObject,
    t.type({
      sortKey: t.number,
      testCategory: t.number,
      description: t.string,
      pointsPass: t.number,
      pointsFail: t.number,
      explanation: t.string,
      exposed: t.boolean,
      rubricItem: t.union([t.number, t.null]),
    }),
  ],
  'TestCase',
);

const RunTestCaseBodyV = t.intersection([
  GenericObject,
  t.partial({
    submission: t.string,
    files: t.string,
  }),
]);

export type TestCaseType = t.TypeOf<typeof TestCaseV>;
export type StudentTestCaseType = t.TypeOf<typeof StudentTestCaseV>;

export class TestCase {
  public static create = createObject(TestCaseV, TestCaseVPost, 'testCases');
  public static read = readObject(TestCaseV, 'testCases');
  public static delete = deleteObject(TestCaseV, 'testCases');
  public static update = updateObject(TestCaseV, TestCaseVPatch, 'testCases');

  public static run = createObjectDetail(TaskV, RunTestCaseBodyV, 'testCases', 'run');

  public static sort = (testCases: TestCaseType[]): TestCaseType[] => {
    const compare = (a: TestCaseType, b: TestCaseType) => {
      if (a.sortKey === b.sortKey) {
        if (a.id < 0 || b.id < 0) {
          return b.id - a.id;
        }
        return a.id - b.id; // lower ids first
      } else {
        return a.sortKey - b.sortKey; // lower sortKeys first
      }
    };

    return testCases.sort(compare);
  };

  public static runV2 = async (payload: { testId?: number; submissionId: string }) => {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/autograder/v2/run/`, {
      headers: getHeaders(),
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.status === 200) {
      return await res.json();
    }
    return handleErrorResponse(res);
  };
}
