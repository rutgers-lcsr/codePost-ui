// @ts-nocheck
/* tslint:disable */
/* eslint-disable */
/**
 * A single AI model entry.
 * @export
 * @interface AIModel
 */
export interface AIModel {
  /**
   * Model identifier to pass to the provider API
   * @type {string}
   * @memberof AIModel
   */
  id: string;
  /**
   * Human-readable display name
   * @type {string}
   * @memberof AIModel
   */
  name: string;
  /**
   * Whether this is the default model for the provider
   * @type {boolean}
   * @memberof AIModel
   */
  isDefault?: boolean;
}
/**
 * Models available for a single provider.
 * @export
 * @interface AIProviderModels
 */
export interface AIProviderModels {
  /**
   * Provider identifier (e.g. 'gemini', 'openai')
   * @type {string}
   * @memberof AIProviderModels
   */
  provider: string;
  /**
   * Curated list of known models for this provider
   * @type {Array<AIModel>}
   * @memberof AIProviderModels
   */
  models: Array<AIModel>;
  /**
   * Models fetched from the provider's API (only included when credentials are supplied)
   * @type {Array<AIModel>}
   * @memberof AIProviderModels
   */
  liveModels?: Array<AIModel>;
  /**
   * Error message if querying the provider failed
   * @type {string}
   * @memberof AIProviderModels
   */
  liveError?: string | null;
}
/**
 * Response wrapper for the AI models endpoint.
 * @export
 * @interface AIProviderModelsList
 */
export interface AIProviderModelsList {
  /**
   * List of providers with their models
   * @type {Array<AIProviderModels>}
   * @memberof AIProviderModelsList
   */
  providers: Array<AIProviderModels>;
}
/**
 * Usage breakdown by a dimension (course, assignment, provider, model).
 * @export
 * @interface AIUsageBreakdown
 */
export interface AIUsageBreakdown {
  /**
   * ID of the entity (course or assignment)
   * @type {number}
   * @memberof AIUsageBreakdown
   */
  id: number | null;
  /**
   * Name/label for this breakdown item
   * @type {string}
   * @memberof AIUsageBreakdown
   */
  name: string;
  /**
   *
   * @type {number}
   * @memberof AIUsageBreakdown
   */
  totalTokens: number;
  /**
   *
   * @type {number}
   * @memberof AIUsageBreakdown
   */
  inputTokens: number;
  /**
   *
   * @type {number}
   * @memberof AIUsageBreakdown
   */
  outputTokens: number;
  /**
   *
   * @type {number}
   * @memberof AIUsageBreakdown
   */
  estimatedCost: number;
  /**
   *
   * @type {number}
   * @memberof AIUsageBreakdown
   */
  requestCount: number;
}
/**
 * A single time bucket in usage aggregation.
 * @export
 * @interface AIUsageBucket
 */
export interface AIUsageBucket {
  /**
   * Start of the time bucket
   * @type {string}
   * @memberof AIUsageBucket
   */
  period: string;
  /**
   * Total tokens used in this bucket
   * @type {number}
   * @memberof AIUsageBucket
   */
  totalTokens: number;
  /**
   * Total input tokens in this bucket
   * @type {number}
   * @memberof AIUsageBucket
   */
  inputTokens: number;
  /**
   * Total output tokens in this bucket
   * @type {number}
   * @memberof AIUsageBucket
   */
  outputTokens: number;
  /**
   * Total estimated cost in USD
   * @type {number}
   * @memberof AIUsageBucket
   */
  estimatedCost: number;
  /**
   * Number of API calls in this bucket
   * @type {number}
   * @memberof AIUsageBucket
   */
  requestCount: number;
}
/**
 * Aggregated usage summary with time-series data and breakdowns.
 * @export
 * @interface AIUsageSummary
 */
export interface AIUsageSummary {
  /**
   * Grand total tokens in the range
   * @type {number}
   * @memberof AIUsageSummary
   */
  totalTokens: number;
  /**
   * Grand total input tokens
   * @type {number}
   * @memberof AIUsageSummary
   */
  inputTokens: number;
  /**
   * Grand total output tokens
   * @type {number}
   * @memberof AIUsageSummary
   */
  outputTokens: number;
  /**
   *
   * @type {number}
   * @memberof AIUsageSummary
   */
  estimatedCost: number;
  /**
   * Total number of requests
   * @type {number}
   * @memberof AIUsageSummary
   */
  requestCount: number;
  /**
   * Usage data bucketed by time
   * @type {Array<AIUsageBucket>}
   * @memberof AIUsageSummary
   */
  timeSeries: Array<AIUsageBucket>;
  /**
   * Usage breakdown by dimension
   * @type {Array<AIUsageBreakdown>}
   * @memberof AIUsageSummary
   */
  breakdown: Array<AIUsageBreakdown>;
  /**
   * Usage breakdown by AI model
   * @type {Array<AIUsageBreakdown>}
   * @memberof AIUsageSummary
   */
  modelBreakdown?: Array<AIUsageBreakdown>;
  /**
   *
   * @type {GranularityEnum}
   * @memberof AIUsageSummary
   */
  granularity: GranularityEnum;
  /**
   *
   * @type {string}
   * @memberof AIUsageSummary
   */
  startDate: string;
  /**
   *
   * @type {string}
   * @memberof AIUsageSummary
   */
  endDate: string;
}

/**
 *
 * @export
 * @interface ActivateCipResponse
 */
export interface ActivateCipResponse {
  /**
   *
   * @type {boolean}
   * @memberof ActivateCipResponse
   */
  success: boolean;
}
/**
 * * `all` - All courses
 * * `selected` - Selected courses only
 * * `none` - Disabled
 * @export
 * @enum {string}
 */
export enum AiCoursePolicyEnum {
  All = 'all',
  Selected = 'selected',
  None = 'none',
}

/**
 * * `gemini` - Google Gemini
 * * `openai` - OpenAI
 * * `ollama` - Ollama (Self-hosted)
 * * `portkey` - Portkey (Self-hosted)
 * * `custom` - Custom Provider
 * @export
 * @enum {string}
 */
export enum AiProviderEnum {
  Gemini = 'gemini',
  Openai = 'openai',
  Ollama = 'ollama',
  Portkey = 'portkey',
  Custom = 'custom',
}

/**
 * Assignment Serializer from which all other Assignment Serializer subclasses inherit from
 * @export
 * @interface Assignment
 */
export interface Assignment {
  /**
   *
   * @type {number}
   * @memberof Assignment
   */
  readonly id: number;
  /**
   * The name of the assignment.
   * @type {string}
   * @memberof Assignment
   */
  name: string;
  /**
   * A boolean field. 'True' if the assignment is released for students to view. 'False' otherwise.
   * @type {boolean}
   * @memberof Assignment
   */
  isReleased?: boolean;
  /**
   * A boolean field. 'True' if grades/feedback are released for students to view. 'False' otherwise.
   * @type {boolean}
   * @memberof Assignment
   */
  feedbackReleased?: boolean;
  /**
   * The related course_id.
   * @type {number}
   * @memberof Assignment
   */
  course: number;
  /**
   *
   * @type {Array<number>}
   * @memberof Assignment
   */
  readonly rubricCategories: Array<number>;
  /**
   * A boolean field. If true, students will be allowed to upload submissions until the upload due date.
   * @type {boolean}
   * @memberof Assignment
   */
  allowStudentUpload?: boolean;
  /**
   * A boolean field. If true, students will be allowed to invite partners to their submission.
   * @type {boolean}
   * @memberof Assignment
   */
  allowStudentUploadWithPartners?: boolean;
  /**
   * The date after which students are not allowed to upload submissions. Only useful if allowStudentUpload is set to True.
   * @type {string}
   * @memberof Assignment
   */
  uploadDueDate?: string | null;
  /**
   * An integer representing the maximum number of late days to continue to accept submissions for this assignment.
   * @type {number}
   * @memberof Assignment
   */
  maxLateDays?: number;
  /**
   * A boolean field. If true, students can see their submission and comments before finalization and published
   * @type {boolean}
   * @memberof Assignment
   */
  liveFeedbackMode?: boolean;
  /**
   * A boolean field. If True and an uploadDueDate is set, students will still be able to submit after a deadline has passed.
   * @type {boolean}
   * @memberof Assignment
   */
  allowLateUploads?: boolean;
  /**
   *
   * @type {number}
   * @memberof Assignment
   */
  readonly environment: number;
  /**
   *
   * @type {Array<number>}
   * @memberof Assignment
   */
  readonly files: Array<number>;
  /**
   *
   * @type {Array<number>}
   * @memberof Assignment
   */
  readonly fileTemplates: Array<number>;
  /**
   *
   * @type {number}
   * @memberof Assignment
   */
  readonly maxStudentTestRuns: number | null;
  /**
   * Optional integer to specify the order of a Course's Assignments.
   * @type {number}
   * @memberof Assignment
   */
  sortKey?: number;
  /**
   * The explanation of an assignment, visible to students.
   * @type {string}
   * @memberof Assignment
   */
  explanation?: string;
  /**
   * A boolean field. 'True' if the assignment is viewable by students.
   * @type {boolean}
   * @memberof Assignment
   */
  isVisible?: boolean;
  /**
   * Sections from which to hide this assignment.
   * @type {Array<number>}
   * @memberof Assignment
   */
  hideFrom?: Array<number>;
  /**
   *
   * @type {boolean}
   * @memberof Assignment
   */
  readonly nudgeMode: boolean;
  /**
   *
   * @type {any}
   * @memberof Assignment
   */
  lateDeductions?: any | null;
  /**
   * If set, overrides course setting. If True, students can see graders for this assignment.
   * @type {boolean}
   * @memberof Assignment
   */
  studentsCanSeeGraders?: boolean | null;
  /**
   *
   * @type {Array<number>}
   * @memberof Assignment
   */
  readonly dataSets: Array<number>;
  /**
   * Total points for the assignment.
   * @type {number}
   * @memberof Assignment
   */
  points: number;
  /**
   * A boolean field. 'True' if the students should not see their grades for this assignment. 'False' otherwise.
   * @type {boolean}
   * @memberof Assignment
   */
  hideGrades?: boolean;
  /**
   * A boolean field. If 'True', graders will not have access to the students field of submission objects, unless they have elevated privileges.
   * @type {boolean}
   * @memberof Assignment
   */
  anonymousGrading?: boolean;
  /**
   * A boolean field. If True, the graders of a submission will be hidden from students.
   * @type {boolean}
   * @memberof Assignment
   */
  hideGradersFromStudents?: boolean;
  /**
   * A boolean field. If True, students can provide feedback on rubric comments.
   * @type {boolean}
   * @memberof Assignment
   */
  commentFeedback?: boolean;
  /**
   * A boolean field. If true, grades begin at 0 (instead of assignment.points)
   * @type {boolean}
   * @memberof Assignment
   */
  additiveGrading?: boolean;
  /**
   * A boolean field. If True, students will be allowed to submit questions and regrade requests after their submission has been graded.
   * @type {boolean}
   * @memberof Assignment
   */
  allowRegradeRequests?: boolean;
  /**
   * Instructions (in Markdown) to show students when they submit regrade requests.
   * @type {string}
   * @memberof Assignment
   */
  regradeInstructions?: string;
  /**
   * The date after which students are not allowed submit a regrade request.
   * @type {string}
   * @memberof Assignment
   */
  regradeDeadline?: string | null;
  /**
   * A boolean field. If true, graders will be required to link a rubric comment on all comments.
   * @type {boolean}
   * @memberof Assignment
   */
  forcedRubricMode?: boolean;
  /**
   * A boolean field. If true, admins will be able upload template code files. Those template files will be used to de-emphasize provided versus student-written code in submissions.
   * @type {boolean}
   * @memberof Assignment
   */
  templateMode?: boolean;
  /**
   * A boolean field. If true, admins and graders can edit the assignment rubric inline in the code console.
   * @type {boolean}
   * @memberof Assignment
   */
  collaborativeRubricMode?: boolean;
  /**
   * A boolean field. If True, graders will be allowed to edit student submissions (e.g. for testing fixes).
   * @type {boolean}
   * @memberof Assignment
   */
  gradersCanEditSubmissions?: boolean;
  /**
   *
   * @type {Array<number>}
   * @memberof Assignment
   */
  readonly testCategories: Array<number>;
  /**
   * A boolean field. If true, an assignment's 10 most frequently used rubric comments will be shown within the code console.
   * @type {boolean}
   * @memberof Assignment
   */
  showFrequentlyUsedRubricComments?: boolean;
  /**
   * System prompt for AI comment generation. Placeholders: {assignment_name}, {file_content}, {selected_content}, {rubric_context}, {grader_draft}
   * @type {string}
   * @memberof Assignment
   */
  aiSystemPrompt?: string;
  /**
   * If True, submission files will be automatically executed and cached when a student submits.
   * @type {boolean}
   * @memberof Assignment
   */
  runFilesOnSubmit?: boolean;
  /**
   * If True, autograder tests will automatically run when a student submits.
   * @type {boolean}
   * @memberof Assignment
   */
  runTestsOnSubmit?: boolean;
  /**
   * If True, the results of autograder tests will be included in the submission grade calculation.
   * @type {boolean}
   * @memberof Assignment
   */
  testsAffectGrade?: boolean;
}
/**
 *
 * @export
 * @interface AssignmentClone
 */
export interface AssignmentClone {
  /**
   * ID of the destination course
   * @type {number}
   * @memberof AssignmentClone
   */
  course: number;
}
/**
 * Serializer for AssignmentDataSet model
 * @export
 * @interface AssignmentDataSet
 */
export interface AssignmentDataSet {
  /**
   *
   * @type {number}
   * @memberof AssignmentDataSet
   */
  readonly id: number;
  /**
   * The related assignment_id.
   * @type {number}
   * @memberof AssignmentDataSet
   */
  assignment: number;
  /**
   * The name of the data set.
   * @type {string}
   * @memberof AssignmentDataSet
   */
  name: string;
  /**
   * Optional description of the data set.
   * @type {string}
   * @memberof AssignmentDataSet
   */
  description?: string;
  /**
   * The data set file
   * @type {string}
   * @memberof AssignmentDataSet
   */
  file: string;
  /**
   *
   * @type {string}
   * @memberof AssignmentDataSet
   */
  readonly fileUrl: string | null;
  /**
   *
   * @type {number}
   * @memberof AssignmentDataSet
   */
  readonly fileSize: number | null;
  /**
   *
   * @type {string}
   * @memberof AssignmentDataSet
   */
  readonly fileName: string | null;
  /**
   *
   * @type {string}
   * @memberof AssignmentDataSet
   */
  mountPath?: string;
  /**
   *
   * @type {boolean}
   * @memberof AssignmentDataSet
   */
  isActive?: boolean;
  /**
   *
   * @type {string}
   * @memberof AssignmentDataSet
   */
  readonly created: string;
  /**
   *
   * @type {string}
   * @memberof AssignmentDataSet
   */
  readonly modified: string;
  /**
   * If True, this dataset will be hidden from students.
   * @type {boolean}
   * @memberof AssignmentDataSet
   */
  readonly hidden: boolean;
  /**
   *
   * @type {boolean}
   * @memberof AssignmentDataSet
   */
  isTestResource?: boolean;
}
/**
 * Serializer for creating AssignmentDataSet
 * @export
 * @interface AssignmentDataSetCreate
 */
export interface AssignmentDataSetCreate {
  /**
   * The related assignment_id.
   * @type {number}
   * @memberof AssignmentDataSetCreate
   */
  assignment: number;
  /**
   * The name of the data set.
   * @type {string}
   * @memberof AssignmentDataSetCreate
   */
  name: string;
  /**
   * Optional description of the data set.
   * @type {string}
   * @memberof AssignmentDataSetCreate
   */
  description?: string;
  /**
   * The data set file
   * @type {string}
   * @memberof AssignmentDataSetCreate
   */
  file: string;
  /**
   *
   * @type {string}
   * @memberof AssignmentDataSetCreate
   */
  mountPath?: string;
  /**
   *
   * @type {boolean}
   * @memberof AssignmentDataSetCreate
   */
  isActive?: boolean;
  /**
   * If True, this dataset will be hidden from students.
   * @type {boolean}
   * @memberof AssignmentDataSetCreate
   */
  hidden?: boolean;
  /**
   *
   * @type {boolean}
   * @memberof AssignmentDataSetCreate
   */
  isTestResource?: boolean;
}
/**
 * Serializer for updating AssignmentDataSet (without file upload)
 * @export
 * @interface AssignmentDataSetUpdate
 */
export interface AssignmentDataSetUpdate {
  /**
   * The name of the data set.
   * @type {string}
   * @memberof AssignmentDataSetUpdate
   */
  name: string;
  /**
   * Optional description of the data set.
   * @type {string}
   * @memberof AssignmentDataSetUpdate
   */
  description?: string;
  /**
   *
   * @type {string}
   * @memberof AssignmentDataSetUpdate
   */
  mountPath?: string;
  /**
   *
   * @type {boolean}
   * @memberof AssignmentDataSetUpdate
   */
  isActive?: boolean;
  /**
   *
   * @type {boolean}
   * @memberof AssignmentDataSetUpdate
   */
  isTestResource?: boolean;
}
/**
 * Serializer for assignment deadline data used by the deploy calendar.
 * @export
 * @interface AssignmentDeadline
 */
export interface AssignmentDeadline {
  /**
   *
   * @type {number}
   * @memberof AssignmentDeadline
   */
  id: number;
  /**
   *
   * @type {string}
   * @memberof AssignmentDeadline
   */
  name: string;
  /**
   *
   * @type {string}
   * @memberof AssignmentDeadline
   */
  courseName: string;
  /**
   *
   * @type {string}
   * @memberof AssignmentDeadline
   */
  coursePeriod: string;
  /**
   *
   * @type {number}
   * @memberof AssignmentDeadline
   */
  courseId: number;
  /**
   *
   * @type {string}
   * @memberof AssignmentDeadline
   */
  uploadDueDate: string | null;
  /**
   *
   * @type {string}
   * @memberof AssignmentDeadline
   */
  lateUploadDeadline: string | null;
  /**
   *
   * @type {number}
   * @memberof AssignmentDeadline
   */
  maxLateDays: number;
  /**
   *
   * @type {boolean}
   * @memberof AssignmentDeadline
   */
  allowLateUploads: boolean;
  /**
   *
   * @type {boolean}
   * @memberof AssignmentDeadline
   */
  allowStudentUpload: boolean;
  /**
   *
   * @type {string}
   * @memberof AssignmentDeadline
   */
  regradeDeadline: string | null;
  /**
   *
   * @type {number}
   * @memberof AssignmentDeadline
   */
  studentCount: number;
}
/**
 *
 * @export
 * @interface AssignmentDownloadResponse
 */
export interface AssignmentDownloadResponse {
  /**
   *
   * @type {string}
   * @memberof AssignmentDownloadResponse
   */
  zip: string;
  /**
   *
   * @type {string}
   * @memberof AssignmentDownloadResponse
   */
  filename: string;
}
/**
 * Serializer for AssignmentFile objects.
 * These are files that belong to assignments (templates, instructions, etc.).
 * @export
 * @interface AssignmentFile
 */
export interface AssignmentFile {
  /**
   * The name of the file.
   * @type {string}
   * @memberof AssignmentFile
   */
  name: string;
  /**
   * The data in a file. should be utf-8 encoded text.
   * @type {string}
   * @memberof AssignmentFile
   */
  data?: string;
  /**
   * The extension for the file (e.g. '.java' or '.py'
   * @type {string}
   * @memberof AssignmentFile
   */
  extension: string;
  /**
   * The related assignment_id.
   * @type {number}
   * @memberof AssignmentFile
   */
  assignment: number;
  /**
   *
   * @type {number}
   * @memberof AssignmentFile
   */
  readonly id: number;
  /**
   * Optional file path, delimited by slashes, to indicate a directory structure.
   * @type {string}
   * @memberof AssignmentFile
   */
  path?: string | null;
  /**
   * If student upload is enabled, a file with this name and extension will be required.
   * @type {boolean}
   * @memberof AssignmentFile
   */
  required?: boolean;
  /**
   * Optional description shown to students.
   * @type {string}
   * @memberof AssignmentFile
   */
  description?: string;
  /**
   *
   * @type {string}
   * @memberof AssignmentFile
   */
  readonly created: string;
  /**
   *
   * @type {string}
   * @memberof AssignmentFile
   */
  readonly modified: string;
  /**
   * If True, this file will be hidden from students (but available for tests/helpers).
   * @type {boolean}
   * @memberof AssignmentFile
   */
  hidden?: boolean;
  /**
   *
   * @type {boolean}
   * @memberof AssignmentFile
   */
  isTestResource?: boolean;
}
/**
 * Summary serializer for AssignmentFile objects.
 * Excludes 'data' to reduce payload size in list views.
 * @export
 * @interface AssignmentFileSummary
 */
export interface AssignmentFileSummary {
  /**
   * The name of the file.
   * @type {string}
   * @memberof AssignmentFileSummary
   */
  name: string;
  /**
   * The extension for the file (e.g. '.java' or '.py'
   * @type {string}
   * @memberof AssignmentFileSummary
   */
  extension: string;
  /**
   * The related assignment_id.
   * @type {number}
   * @memberof AssignmentFileSummary
   */
  assignment: number;
  /**
   *
   * @type {number}
   * @memberof AssignmentFileSummary
   */
  readonly id: number;
  /**
   * Optional file path, delimited by slashes, to indicate a directory structure.
   * @type {string}
   * @memberof AssignmentFileSummary
   */
  path?: string | null;
  /**
   * If student upload is enabled, a file with this name and extension will be required.
   * @type {boolean}
   * @memberof AssignmentFileSummary
   */
  required?: boolean;
  /**
   * Optional description shown to students.
   * @type {string}
   * @memberof AssignmentFileSummary
   */
  description?: string;
  /**
   *
   * @type {string}
   * @memberof AssignmentFileSummary
   */
  readonly created: string;
  /**
   *
   * @type {string}
   * @memberof AssignmentFileSummary
   */
  readonly modified: string;
  /**
   * If True, this file will be hidden from students (but available for tests/helpers).
   * @type {boolean}
   * @memberof AssignmentFileSummary
   */
  hidden?: boolean;
  /**
   *
   * @type {boolean}
   * @memberof AssignmentFileSummary
   */
  isTestResource?: boolean;
}
/**
 *
 * @export
 * @interface AssignmentGenerateTest
 */
export interface AssignmentGenerateTest {
  /**
   * Name of the file to test (e.g., 'main.py')
   * @type {string}
   * @memberof AssignmentGenerateTest
   */
  targetFilename: string;
  /**
   * ID of an AssignmentFile to use as context
   * @type {number}
   * @memberof AssignmentGenerateTest
   */
  contextFileId?: number;
  /**
   * Name of an AssignmentFile to use as context
   * @type {string}
   * @memberof AssignmentGenerateTest
   */
  contextFileName?: string;
  /**
   * Target language
   * @type {string}
   * @memberof AssignmentGenerateTest
   */
  language?: string;
  /**
   * Rubric context for test generation
   * @type {string}
   * @memberof AssignmentGenerateTest
   */
  rubricText?: string;
}
/**
 *
 * @export
 * @interface AssignmentGenerateTestResponse
 */
export interface AssignmentGenerateTestResponse {
  /**
   * The generated test script
   * @type {string}
   * @memberof AssignmentGenerateTestResponse
   */
  script: string;
}
/**
 *
 * @export
 * @interface AssignmentQueueLengthResponse
 */
export interface AssignmentQueueLengthResponse {
  /**
   *
   * @type {number}
   * @memberof AssignmentQueueLengthResponse
   */
  id: number;
  /**
   *
   * @type {number}
   * @memberof AssignmentQueueLengthResponse
   */
  unclaimed: number;
  /**
   *
   * @type {number}
   * @memberof AssignmentQueueLengthResponse
   */
  finalized: number;
  /**
   *
   * @type {number}
   * @memberof AssignmentQueueLengthResponse
   */
  unfinalized: number;
}
/**
 *
 * @export
 * @interface AssignmentRubricResponse
 */
export interface AssignmentRubricResponse {
  /**
   *
   * @type {number}
   * @memberof AssignmentRubricResponse
   */
  id: number;
  /**
   *
   * @type {Array<RubricCategory>}
   * @memberof AssignmentRubricResponse
   */
  rubricCategories: Array<RubricCategory>;
  /**
   *
   * @type {Array<RubricComment>}
   * @memberof AssignmentRubricResponse
   */
  rubricComments: Array<RubricComment>;
}
/**
 *
 * @export
 * @interface AssignmentStudentTestsResponse
 */
export interface AssignmentStudentTestsResponse {
  /**
   *
   * @type {number}
   * @memberof AssignmentStudentTestsResponse
   */
  id: number;
  /**
   *
   * @type {Array<TestCaseStudent>}
   * @memberof AssignmentStudentTestsResponse
   */
  testCases: Array<TestCaseStudent>;
  /**
   *
   * @type {Array<TestCategory>}
   * @memberof AssignmentStudentTestsResponse
   */
  testCategories: Array<TestCategory>;
}
/**
 *
 * @export
 * @interface AssignmentStudentUploadGetResponse
 */
export interface AssignmentStudentUploadGetResponse {
  /**
   *
   * @type {number}
   * @memberof AssignmentStudentUploadGetResponse
   */
  id: number;
  /**
   *
   * @type {Array<SubmissionFileStudentUpload>}
   * @memberof AssignmentStudentUploadGetResponse
   */
  files: Array<SubmissionFileStudentUpload>;
}
/**
 * Request serializer for async execution
 * @export
 * @interface AsyncExecutionRequest
 */
export interface AsyncExecutionRequest {
  /**
   * ID of the file to execute
   * @type {number}
   * @memberof AsyncExecutionRequest
   */
  fileId: number;
  /**
   * Execution timeout in seconds (1-120)
   * @type {number}
   * @memberof AsyncExecutionRequest
   */
  timeout?: number;
  /**
   * If true, bypass cache and force new execution
   * @type {boolean}
   * @memberof AsyncExecutionRequest
   */
  forceExecute?: boolean;
  /**
   * Optional test script to inject during execution
   * @type {string}
   * @memberof AsyncExecutionRequest
   */
  testCode?: string;
  /**
   * Optional content override for the file (e.g., edited notebook JSON)
   * @type {string}
   * @memberof AsyncExecutionRequest
   */
  codeOverride?: string;
  /**
   * Optional example code to inject during execution
   * @type {string}
   * @memberof AsyncExecutionRequest
   */
  exampleCode?: string;
}
/**
 * Response for async execution task creation
 * @export
 * @interface AsyncTaskResponse
 */
export interface AsyncTaskResponse {
  /**
   * Celery task ID for tracking execution
   * @type {string}
   * @memberof AsyncTaskResponse
   */
  taskId: string;
  /**
   * Initial task status (typically 'queued')
   * @type {string}
   * @memberof AsyncTaskResponse
   */
  status: string;
}
/**
 *
 * @export
 * @interface BeforeStudentUploadResponse
 */
export interface BeforeStudentUploadResponse {
  /**
   *
   * @type {number}
   * @memberof BeforeStudentUploadResponse
   */
  daysLate: number;
  /**
   *
   * @type {number}
   * @memberof BeforeStudentUploadResponse
   */
  pointsOff: number;
  /**
   *
   * @type {number}
   * @memberof BeforeStudentUploadResponse
   */
  lateDayCreditsAvailable?: number;
  /**
   *
   * @type {number}
   * @memberof BeforeStudentUploadResponse
   */
  lateDayCreditsToUse?: number;
  /**
   *
   * @type {number}
   * @memberof BeforeStudentUploadResponse
   */
  adjustedDaysLate?: number;
}
/**
 * * `default` - default
 * * `alpine` - alpine
 * * `ubuntu` - ubuntu
 * * `windows` - windows
 * @export
 * @enum {string}
 */
export enum BuildTypeEnum {
  Default = 'default',
  Alpine = 'alpine',
  Ubuntu = 'ubuntu',
  Windows = 'windows',
}

/**
 * Response for cache check endpoint
 * @export
 * @interface CacheCheckResponse
 */
export interface CacheCheckResponse {
  /**
   * Whether a cached execution result exists
   * @type {boolean}
   * @memberof CacheCheckResponse
   */
  hasCache: boolean;
  /**
   * Execution time of cached result (if has_cache)
   * @type {number}
   * @memberof CacheCheckResponse
   */
  executionTime?: number;
  /**
   * When the cached execution was performed (staff only)
   * @type {string}
   * @memberof CacheCheckResponse
   */
  executedAt?: string | null;
  /**
   * Username who executed the code (staff only)
   * @type {string}
   * @memberof CacheCheckResponse
   */
  executedBy?: string | null;
}
/**
 * Result of a single health probe.
 * @export
 * @interface CeleryCheck
 */
export interface CeleryCheck {
  /**
   *
   * @type {StatusDfeEnum}
   * @memberof CeleryCheck
   */
  status: StatusDfeEnum;
  /**
   *
   * @type {string}
   * @memberof CeleryCheck
   */
  label: string;
  /**
   *
   * @type {string}
   * @memberof CeleryCheck
   */
  detail: string | null;
  /**
   *
   * @type {number}
   * @memberof CeleryCheck
   */
  latencyMs?: number | null;
  /**
   *
   * @type {number}
   * @memberof CeleryCheck
   */
  workerCount?: number | null;
}

/**
 *
 * @export
 * @interface CheckSSOAvailabilityResponse
 */
export interface CheckSSOAvailabilityResponse {
  /**
   *
   * @type {boolean}
   * @memberof CheckSSOAvailabilityResponse
   */
  ssoEnabled: boolean;
  /**
   *
   * @type {string}
   * @memberof CheckSSOAvailabilityResponse
   */
  provider?: string;
  /**
   *
   * @type {number}
   * @memberof CheckSSOAvailabilityResponse
   */
  orgId?: number;
  /**
   *
   * @type {string}
   * @memberof CheckSSOAvailabilityResponse
   */
  orgName?: string;
}
/**
 *
 * @export
 * @interface CheckStatusNewAdminUserResponse
 */
export interface CheckStatusNewAdminUserResponse {
  /**
   *
   * @type {boolean}
   * @memberof CheckStatusNewAdminUserResponse
   */
  pending: boolean;
  /**
   *
   * @type {boolean}
   * @memberof CheckStatusNewAdminUserResponse
   */
  status: boolean;
}
/**
 * Request serializer for code execution
 * @export
 * @interface CodeExecutionRequest
 */
export interface CodeExecutionRequest {
  /**
   * Code to execute
   * @type {string}
   * @memberof CodeExecutionRequest
   */
  code: string;
  /**
   * Language for execution
   * @type {string}
   * @memberof CodeExecutionRequest
   */
  language: string;
  /**
   *
   * @type {number}
   * @memberof CodeExecutionRequest
   */
  timeout?: number;
  /**
   *
   * @type {string}
   * @memberof CodeExecutionRequest
   */
  workingDir?: string | null;
}
/**
 *
 * @export
 * @interface Comment
 */
export interface Comment {
  /**
   *
   * @type {number}
   * @memberof Comment
   */
  readonly id: number;
  /**
   * The text on the comment
   * @type {string}
   * @memberof Comment
   */
  text?: string;
  /**
   * The points deducted. A negative number represents a bonus.
   * @type {number}
   * @memberof Comment
   */
  pointDelta?: number | null;
  /**
   * An integer representing the character position a comment begins on.
   * @type {number}
   * @memberof Comment
   */
  startChar?: number;
  /**
   * An integer representing the character position a comment ends on.
   * @type {number}
   * @memberof Comment
   */
  endChar?: number;
  /**
   * An integer representing the line number a comment begins on.
   * @type {number}
   * @memberof Comment
   */
  startLine: number;
  /**
   * An integer representing the line number a comment begins on.
   * @type {number}
   * @memberof Comment
   */
  endLine?: number;
  /**
   * The related file_id.
   * @type {number}
   * @memberof Comment
   */
  file: number;
  /**
   * The related rubricComment_id. Null if no rubric comment linked.
   * @type {number}
   * @memberof Comment
   */
  rubricComment?: number | null;
  /**
   *
   * @type {string}
   * @memberof Comment
   */
  author?: string;
  /**
   * An integer representing the feedback applied to this comment. Currently only valid if rubricComment is not null.
   * @type {number}
   * @memberof Comment
   */
  readonly feedback: number;
  /**
   *
   * @type {string}
   * @memberof Comment
   */
  readonly color: string | null;
  /**
   *
   * @type {Array<string | null>}
   * @memberof Comment
   */
  tags?: Array<string | null>;
}
/**
 *
 * @export
 * @interface CommentTemplate
 */
export interface CommentTemplate {
  /**
   *
   * @type {number}
   * @memberof CommentTemplate
   */
  readonly id: number;
  /**
   * The text of the template.
   * @type {string}
   * @memberof CommentTemplate
   */
  text: string;
  /**
   *
   * @type {string}
   * @memberof CommentTemplate
   */
  readonly owner: string;
  /**
   * The assignment this template belongs to.
   * @type {number}
   * @memberof CommentTemplate
   */
  assignment: number;
  /**
   * If True, this template is visible to all graders in the assignment.
   * @type {boolean}
   * @memberof CommentTemplate
   */
  isGlobal?: boolean;
  /**
   * Optional file path pattern. If set, template only shows for matching files.
   * @type {string}
   * @memberof CommentTemplate
   */
  filePath?: string | null;
  /**
   * Points delta for this template.
   * @type {number}
   * @memberof CommentTemplate
   */
  pointDelta?: number | null;
  /**
   * Optional linked rubric comment.
   * @type {number}
   * @memberof CommentTemplate
   */
  rubricComment?: number | null;
  /**
   * The original comment this template was created from. Null if manually created or source was deleted.
   * @type {number}
   * @memberof CommentTemplate
   */
  sourceComment?: number | null;
  /**
   * Optional notebook cell ID. If set, template only shows for this cell.
   * @type {string}
   * @memberof CommentTemplate
   */
  cellId?: string | null;
}
/**
 *
 * @export
 * @interface Course
 */
export interface Course {
  /**
   *
   * @type {number}
   * @memberof Course
   */
  readonly id: number;
  /**
   * The name of the course.
   * @type {string}
   * @memberof Course
   */
  name: string;
  /**
   * A string describing the period (e.g. F2019, T32019, etc.
   * @type {string}
   * @memberof Course
   */
  period: string;
  /**
   *
   * @type {Array<number>}
   * @memberof Course
   */
  readonly assignments: Array<number>;
  /**
   *
   * @type {Array<number>}
   * @memberof Course
   */
  readonly sections: Array<number>;
  /**
   * A boolean field. If True, submissions that are claimed and subsequently released will be added to the back of the grading queue.
   * @type {boolean}
   * @memberof Course
   */
  sendReleasedSubmissionsToBack?: boolean;
  /**
   * A boolean field. If True, students will be able to view basic grade statistics for released assignments.
   * @type {boolean}
   * @memberof Course
   */
  showStudentsStatistics?: boolean;
  /**
   * Timezone in which course operates.
   * @type {string}
   * @memberof Course
   */
  timezone?: string;
  /**
   * A boolean field. If True, when emails are added to a course roster that do not correspond to existing codePost users, those emails will be sent an email notifying that they have been added to a course and providing a link to register their (new) accounts.
   * @type {boolean}
   * @memberof Course
   */
  emailNewUsers?: boolean;
  /**
   * A boolean field. If True, new assignments will have anonymous grading mode enabled by default.
   * @type {boolean}
   * @memberof Course
   */
  anonymousGradingDefault?: boolean;
  /**
   * A boolean field. If True, graders will be allowed to add and update unlinked rubric comments.
   * @type {boolean}
   * @memberof Course
   */
  allowGradersToEditRubric?: boolean;
  /**
   * An integer representing the minimum number of comments that graders are asked to make prior to finalizing. 0 indicates no minimum.
   * @type {number}
   * @memberof Course
   */
  minComments?: number;
  /**
   * If True, only admins can unfinalize submissions.
   * @type {boolean}
   * @memberof Course
   */
  noUnfinalize?: boolean;
  /**
   * If True, the course will not be editable.
   * @type {boolean}
   * @memberof Course
   */
  archived?: boolean;
  /**
   * The number of Late Day Credits that each student gets at the beginning of the term. Null if the course does not have students submit directly to codePost.
   * @type {number}
   * @memberof Course
   */
  lateDayCreditsAllowable?: number | null;
  /**
   * If True, will be able to claim submissions from the ungraded queue.
   * @type {boolean}
   * @memberof Course
   */
  activateQueue?: boolean;
  /**
   * A token which allows students to join course.
   * @type {string}
   * @memberof Course
   */
  readonly inviteCode: string | null;
  /**
   * Permissible student email domains.
   * @type {string}
   * @memberof Course
   */
  emailWhitelist?: string;
  /**
   * If True, the course's invite code can be used.
   * @type {boolean}
   * @memberof Course
   */
  inviteCodeEnabled?: boolean;
  /**
   * If True, the graders may send students feedback notifications.
   * @type {boolean}
   * @memberof Course
   */
  enableStudentFeedbackNotifications?: boolean;
  /**
   *
   * @type {Array<number>}
   * @memberof Course
   */
  readonly webhooks: Array<number>;
  /**
   *
   * @type {string}
   * @memberof Course
   */
  expirationDate?: string | null;
  /**
   * The related organization_id
   * @type {number}
   * @memberof Course
   */
  organization?: number;
  /**
   * If True, students can see the grader who graded their submission.
   * @type {boolean}
   * @memberof Course
   */
  studentsCanSeeGraders?: boolean;
  /**
   *
   * @type {number}
   * @memberof Course
   */
  readonly studentCount: number;
  /**
   *
   * @type {boolean}
   * @memberof Course
   */
  readonly isRubricEditor: boolean;
  /**
   *
   * @type {number}
   * @memberof Course
   */
  cloneFrom?: number;
}
/**
 * Serializer for course AI configuration. Admin-only access.
 * @export
 * @interface CourseAISettings
 */
export interface CourseAISettings {
  /**
   *
   * @type {number}
   * @memberof CourseAISettings
   */
  readonly id: number;
  /**
   *
   * @type {string}
   * @memberof CourseAISettings
   */
  aiProvider?: CourseAISettingsAiProviderEnum | null;
  /**
   *
   * @type {string}
   * @memberof CourseAISettings
   */
  aiApiKey?: string | null;
  /**
   *
   * @type {string}
   * @memberof CourseAISettings
   */
  aiBaseUrl?: string | null;
  /**
   *
   * @type {string}
   * @memberof CourseAISettings
   */
  aiModel?: string | null;
  /**
   *
   * @type {boolean}
   * @memberof CourseAISettings
   */
  aiDisabled?: boolean;
  /**
   *
   * @type {boolean}
   * @memberof CourseAISettings
   */
  aiCommentsDisabled?: boolean;
  /**
   *
   * @type {boolean}
   * @memberof CourseAISettings
   */
  aiUseOwnSettings?: boolean;
  /**
   * Custom per-model token rates. JSON: {"model-name": {"input": 0.15, "output": 0.60}}
   * @type {any}
   * @memberof CourseAISettings
   */
  aiTokenRates?: any | null;
  /**
   *
   * @type {boolean}
   * @memberof CourseAISettings
   */
  readonly aiEnabled: boolean;
  /**
   *
   * @type {boolean}
   * @memberof CourseAISettings
   */
  readonly aiCommentsEnabled: boolean;
  /**
   *
   * @type {boolean}
   * @memberof CourseAISettings
   */
  readonly orgAiAvailable: boolean;
  /**
   *
   * @type {boolean}
   * @memberof CourseAISettings
   */
  readonly hasApiKey: boolean;
  /**
   *
   * @type {string}
   * @memberof CourseAISettings
   */
  readonly apiKeyHint: string | null;
  /**
   *
   * @type {{ [key: string]: { [key: string]: any | undefined; } | undefined; }}
   * @memberof CourseAISettings
   */
  readonly defaultTokenRates: { [key: string]: { [key: string]: any | undefined } | undefined };
}

/**
 * @export
 * @enum {string}
 */
export enum CourseAISettingsAiProviderEnum {
  Gemini = 'gemini',
  Openai = 'openai',
  Ollama = 'ollama',
  Portkey = 'portkey',
  Custom = 'custom',
}

/**
 * Serializer for CourseFile objects.
 * These are files that belong to courses (syllabi, resources, etc.).
 * @export
 * @interface CourseFile
 */
export interface CourseFile {
  /**
   * The name of the file.
   * @type {string}
   * @memberof CourseFile
   */
  name: string;
  /**
   * The data in a file. should be utf-8 encoded text.
   * @type {string}
   * @memberof CourseFile
   */
  data?: string;
  /**
   * The extension for the file (e.g. '.java' or '.py'
   * @type {string}
   * @memberof CourseFile
   */
  extension: string;
  /**
   * The related course_id.
   * @type {number}
   * @memberof CourseFile
   */
  course: number;
  /**
   *
   * @type {number}
   * @memberof CourseFile
   */
  readonly id: number;
  /**
   * Optional file path, delimited by slashes, to indicate a directory structure.
   * @type {string}
   * @memberof CourseFile
   */
  path?: string | null;
  /**
   *
   * @type {string}
   * @memberof CourseFile
   */
  readonly created: string;
  /**
   *
   * @type {string}
   * @memberof CourseFile
   */
  readonly modified: string;
}
/**
 *
 * @export
 * @interface CourseRoster
 */
export interface CourseRoster {
  /**
   *
   * @type {number}
   * @memberof CourseRoster
   */
  readonly id: number;
  /**
   * The related organization_id
   * @type {number}
   * @memberof CourseRoster
   */
  readonly organization: number;
  /**
   * The name of the course.
   * @type {string}
   * @memberof CourseRoster
   */
  readonly name: string;
  /**
   * A string describing the period (e.g. F2019, T32019, etc.
   * @type {string}
   * @memberof CourseRoster
   */
  readonly period: string;
  /**
   *
   * @type {Array<string | null>}
   * @memberof CourseRoster
   */
  students: Array<string | null>;
  /**
   *
   * @type {Array<string | null>}
   * @memberof CourseRoster
   */
  graders: Array<string | null>;
  /**
   *
   * @type {Array<string | null>}
   * @memberof CourseRoster
   */
  superGraders: Array<string | null>;
  /**
   *
   * @type {Array<string | null>}
   * @memberof CourseRoster
   */
  rubricEditors: Array<string | null>;
  /**
   *
   * @type {Array<string | null>}
   * @memberof CourseRoster
   */
  courseAdmins: Array<string | null>;
  /**
   *
   * @type {Array<string | null>}
   * @memberof CourseRoster
   */
  inactiveStudents: Array<string | null>;
  /**
   *
   * @type {Array<string | null>}
   * @memberof CourseRoster
   */
  inactiveGraders: Array<string | null>;
  /**
   *
   * @type {Array<string | null>}
   * @memberof CourseRoster
   */
  inactiveCourseAdmins: Array<string | null>;
  /**
   *
   * @type {Array<string>}
   * @memberof CourseRoster
   */
  readonly notActivated: Array<string>;
}
/**
 *
 * @export
 * @interface CourseRosterMap
 */
export interface CourseRosterMap {
  /**
   *
   * @type {{ [key: string]: string | undefined | null; }}
   * @memberof CourseRosterMap
   */
  rosterMap?: { [key: string]: string | undefined | null };
}
/**
 *
 * @export
 * @interface CourseSettings
 */
export interface CourseSettings {
  /**
   *
   * @type {number}
   * @memberof CourseSettings
   */
  readonly id: number;
  /**
   * A boolean field. If True, submissions that are claimed and subsequently released will be added to the back of the grading queue.
   * @type {boolean}
   * @memberof CourseSettings
   */
  sendReleasedSubmissionsToBack?: boolean;
  /**
   * A boolean field. If True, students will be able to view basic grade statistics for released assignments.
   * @type {boolean}
   * @memberof CourseSettings
   */
  showStudentsStatistics?: boolean;
  /**
   * Timezone in which course operates.
   * @type {string}
   * @memberof CourseSettings
   */
  timezone?: string;
  /**
   * A boolean field. If True, when emails are added to a course roster that do not correspond to existing codePost users, those emails will be sent an email notifying that they have been added to a course and providing a link to register their (new) accounts.
   * @type {boolean}
   * @memberof CourseSettings
   */
  emailNewUsers?: boolean;
  /**
   * A boolean field. If True, new assignments will have anonymous grading mode enabled by default.
   * @type {boolean}
   * @memberof CourseSettings
   */
  anonymousGradingDefault?: boolean;
  /**
   * A boolean field. If True, graders will be allowed to add and update unlinked rubric comments.
   * @type {boolean}
   * @memberof CourseSettings
   */
  allowGradersToEditRubric?: boolean;
  /**
   * If True, the course will not be editable.
   * @type {boolean}
   * @memberof CourseSettings
   */
  archived?: boolean;
  /**
   * The number of Late Day Credits that each student gets at the beginning of the term. Null if the course does not have students submit directly to codePost.
   * @type {number}
   * @memberof CourseSettings
   */
  lateDayCreditsAllowable?: number | null;
}
/**
 *
 * @export
 * @interface CourseStudentCaptions
 */
export interface CourseStudentCaptions {
  /**
   *
   * @type {{ [key: string]: string | undefined | null; }}
   * @memberof CourseStudentCaptions
   */
  studentCaptions?: { [key: string]: string | undefined | null };
}
/**
 *
 * @export
 * @interface DashboardStats
 */
export interface DashboardStats {
  /**
   *
   * @type {number}
   * @memberof DashboardStats
   */
  totalOrganizations: number;
  /**
   *
   * @type {number}
   * @memberof DashboardStats
   */
  totalCourses: number;
  /**
   *
   * @type {number}
   * @memberof DashboardStats
   */
  activeCourses: number;
  /**
   *
   * @type {number}
   * @memberof DashboardStats
   */
  archivedCourses: number;
  /**
   *
   * @type {number}
   * @memberof DashboardStats
   */
  totalUniqueUsers: number;
  /**
   *
   * @type {number}
   * @memberof DashboardStats
   */
  totalCodePostAdmins: number;
  /**
   *
   * @type {number}
   * @memberof DashboardStats
   */
  totalCourseAdmins: number;
  /**
   *
   * @type {number}
   * @memberof DashboardStats
   */
  totalGraders: number;
  /**
   *
   * @type {number}
   * @memberof DashboardStats
   */
  totalStudents: number;
  /**
   *
   * @type {number}
   * @memberof DashboardStats
   */
  totalSections: number;
  /**
   *
   * @type {number}
   * @memberof DashboardStats
   */
  totalAssignments: number;
  /**
   *
   * @type {number}
   * @memberof DashboardStats
   */
  avgCoursesPerOrg: number;
  /**
   *
   * @type {number}
   * @memberof DashboardStats
   */
  avgStudentsPerCourse: number;
  /**
   *
   * @type {number}
   * @memberof DashboardStats
   */
  totalInactiveUsers: number;
  /**
   *
   * @type {number}
   * @memberof DashboardStats
   */
  activeUsers30d: number;
}
/**
 * Result of a single health probe.
 * @export
 * @interface DiskCheck
 */
export interface DiskCheck {
  /**
   *
   * @type {StatusDfeEnum}
   * @memberof DiskCheck
   */
  status: StatusDfeEnum;
  /**
   *
   * @type {string}
   * @memberof DiskCheck
   */
  label: string;
  /**
   *
   * @type {string}
   * @memberof DiskCheck
   */
  detail: string | null;
  /**
   *
   * @type {number}
   * @memberof DiskCheck
   */
  latencyMs?: number | null;
  /**
   *
   * @type {number}
   * @memberof DiskCheck
   */
  usedPct?: number | null;
  /**
   *
   * @type {number}
   * @memberof DiskCheck
   */
  freeGb?: number | null;
}

/**
 *
 * @export
 * @interface EmailPasswordResetRequest
 */
export interface EmailPasswordResetRequest {
  /**
   *
   * @type {string}
   * @memberof EmailPasswordResetRequest
   */
  email: string;
}
/**
 *
 * @export
 * @interface EmailPasswordResetResponse
 */
export interface EmailPasswordResetResponse {
  /**
   *
   * @type {boolean}
   * @memberof EmailPasswordResetResponse
   */
  success: boolean;
}
/**
 *
 * @export
 * @interface EmailRegistrationRequest
 */
export interface EmailRegistrationRequest {
  /**
   *
   * @type {string}
   * @memberof EmailRegistrationRequest
   */
  email: string;
  /**
   * Invite code for the course
   * @type {string}
   * @memberof EmailRegistrationRequest
   */
  token: string;
}
/**
 *
 * @export
 * @interface EmailRegistrationResponse
 */
export interface EmailRegistrationResponse {
  /**
   *
   * @type {boolean}
   * @memberof EmailRegistrationResponse
   */
  success: boolean;
  /**
   *
   * @type {boolean}
   * @memberof EmailRegistrationResponse
   */
  codeValid: boolean;
  /**
   *
   * @type {boolean}
   * @memberof EmailRegistrationResponse
   */
  emailValid: boolean;
}
/**
 *
 * @export
 * @interface Environment
 */
export interface Environment {
  /**
   *
   * @type {number}
   * @memberof Environment
   */
  readonly id: number;
  /**
   * The related assignment__id.
   * @type {number}
   * @memberof Environment
   */
  assignment: number;
  /**
   *
   * @type {LanguageEnum}
   * @memberof Environment
   */
  language?: LanguageEnum;
  /**
   *
   * @type {any}
   * @memberof Environment
   */
  dockerRunInstructions?: any | null;
  /**
   * Command to be run on every submission before tests
   * @type {string}
   * @memberof Environment
   */
  compileText?: string;
  /**
   * A custom set of docker commands to append to the base image docker file
   * @type {string}
   * @memberof Environment
   */
  dockerfile?: string;
  /**
   *
   * @type {BuildTypeEnum}
   * @memberof Environment
   */
  buildType?: BuildTypeEnum;
  /**
   * A boolean field indicating whether tests should be run in a container that allows network access.
   * @type {boolean}
   * @memberof Environment
   */
  allowNetworkAccess?: boolean;
  /**
   * An integer field indicating the max times that tests will be run if tests are exposed.
   * @type {number}
   * @memberof Environment
   */
  maxStudentTestRuns?: number | null;
  /**
   * An integer field indicating the limit of the number of failed tests that will be exposed to a student (nudge mode).
   * @type {number}
   * @memberof Environment
   */
  maxExposedFailedTests?: number | null;
  /**
   *
   * @type {boolean}
   * @memberof Environment
   */
  autoDetect?: boolean;
  /**
   *
   * @type {string}
   * @memberof Environment
   */
  imageName?: string | null;
  /**
   *
   * @type {number}
   * @memberof Environment
   */
  readonly buildStatus: number;
  /**
   *
   * @type {string}
   * @memberof Environment
   */
  readonly buildLogs: string;
  /**
   *
   * @type {string}
   * @memberof Environment
   */
  readonly lastBuilt: string;
  /**
   *
   * @type {string}
   * @memberof Environment
   */
  requirements?: string;
  /**
   *
   * @type {any}
   * @memberof Environment
   */
  envVars?: any | null;
  /**
   *
   * @type {number}
   * @memberof Environment
   */
  readonly currentBuildVersion: number;
  /**
   *
   * @type {any}
   * @memberof Environment
   */
  readonly imageHistory: any | null;
  /**
   *
   * @type {boolean}
   * @memberof Environment
   */
  readonly convergencePending: boolean;
  /**
   *
   * @type {any}
   * @memberof Environment
   */
  readonly convergenceStats: any | null;
  /**
   *
   * @type {number}
   * @memberof Environment
   */
  readonly successfulRuns: number;
  /**
   *
   * @type {number}
   * @memberof Environment
   */
  readonly totalRuns: number;
  /**
   *
   * @type {number}
   * @memberof Environment
   */
  readonly successRate: number;
}

/**
 *
 * @export
 * @interface EnvironmentBuildResponse
 */
export interface EnvironmentBuildResponse {
  /**
   *
   * @type {string}
   * @memberof EnvironmentBuildResponse
   */
  task: string;
  /**
   *
   * @type {string}
   * @memberof EnvironmentBuildResponse
   */
  status?: string;
  /**
   *
   * @type {string}
   * @memberof EnvironmentBuildResponse
   */
  error?: string;
}
/**
 *
 * @export
 * @interface EnvironmentBuildStatusError
 */
export interface EnvironmentBuildStatusError {
  /**
   *
   * @type {string}
   * @memberof EnvironmentBuildStatusError
   */
  error: string;
  /**
   *
   * @type {boolean}
   * @memberof EnvironmentBuildStatusError
   */
  inProgress: boolean;
  /**
   *
   * @type {boolean}
   * @memberof EnvironmentBuildStatusError
   */
  isSuccess: boolean;
  /**
   *
   * @type {string}
   * @memberof EnvironmentBuildStatusError
   */
  logs: string;
}
/**
 *
 * @export
 * @interface EnvironmentBuildStatusResponse
 */
export interface EnvironmentBuildStatusResponse {
  /**
   *
   * @type {boolean}
   * @memberof EnvironmentBuildStatusResponse
   */
  inProgress: boolean;
  /**
   *
   * @type {boolean}
   * @memberof EnvironmentBuildStatusResponse
   */
  isSuccess: boolean;
  /**
   *
   * @type {string}
   * @memberof EnvironmentBuildStatusResponse
   */
  logs: string;
  /**
   *
   * @type {string}
   * @memberof EnvironmentBuildStatusResponse
   */
  dockerfile: string;
  /**
   *
   * @type {string}
   * @memberof EnvironmentBuildStatusResponse
   */
  lastBuilt?: string | null;
}
/**
 *
 * @export
 * @interface EnvironmentCleanupRequest
 */
export interface EnvironmentCleanupRequest {
  /**
   *
   * @type {number}
   * @memberof EnvironmentCleanupRequest
   */
  keepCount?: number;
}
/**
 *
 * @export
 * @interface EnvironmentCleanupResponse
 */
export interface EnvironmentCleanupResponse {
  /**
   *
   * @type {boolean}
   * @memberof EnvironmentCleanupResponse
   */
  success: boolean;
  /**
   *
   * @type {number}
   * @memberof EnvironmentCleanupResponse
   */
  deletedCount: number;
  /**
   *
   * @type {string}
   * @memberof EnvironmentCleanupResponse
   */
  message: string;
}
/**
 *
 * @export
 * @interface EnvironmentConvertToManualRequest
 */
export interface EnvironmentConvertToManualRequest {
  /**
   *
   * @type {number}
   * @memberof EnvironmentConvertToManualRequest
   */
  fromVersion?: number;
}
/**
 *
 * @export
 * @interface EnvironmentConvertToManualResponse
 */
export interface EnvironmentConvertToManualResponse {
  /**
   *
   * @type {boolean}
   * @memberof EnvironmentConvertToManualResponse
   */
  success: boolean;
  /**
   *
   * @type {string}
   * @memberof EnvironmentConvertToManualResponse
   */
  message: string;
}
/**
 *
 * @export
 * @interface EnvironmentEjectResponse
 */
export interface EnvironmentEjectResponse {
  /**
   *
   * @type {string}
   * @memberof EnvironmentEjectResponse
   */
  dockerfile: string;
  /**
   *
   * @type {string}
   * @memberof EnvironmentEjectResponse
   */
  testsJson: string;
  /**
   *
   * @type {string}
   * @memberof EnvironmentEjectResponse
   */
  runTestsPy: string;
}
/**
 *
 * @export
 * @interface EnvironmentPreviewRequest
 */
export interface EnvironmentPreviewRequest {
  /**
   *
   * @type {string}
   * @memberof EnvironmentPreviewRequest
   */
  language?: string;
  /**
   *
   * @type {string}
   * @memberof EnvironmentPreviewRequest
   */
  buildType?: string;
  /**
   *
   * @type {string}
   * @memberof EnvironmentPreviewRequest
   */
  dockerfile?: string;
  /**
   *
   * @type {Array<string>}
   * @memberof EnvironmentPreviewRequest
   */
  dockerRunInstructions?: Array<string>;
  /**
   *
   * @type {string}
   * @memberof EnvironmentPreviewRequest
   */
  requirements?: string;
}
/**
 *
 * @export
 * @interface EnvironmentRollbackRequest
 */
export interface EnvironmentRollbackRequest {
  /**
   *
   * @type {number}
   * @memberof EnvironmentRollbackRequest
   */
  version?: number;
}
/**
 *
 * @export
 * @interface EnvironmentRollbackResponse
 */
export interface EnvironmentRollbackResponse {
  /**
   *
   * @type {boolean}
   * @memberof EnvironmentRollbackResponse
   */
  success: boolean;
  /**
   *
   * @type {string}
   * @memberof EnvironmentRollbackResponse
   */
  message: string;
  /**
   *
   * @type {number}
   * @memberof EnvironmentRollbackResponse
   */
  version: number;
}
/**
 *
 * @export
 * @interface EnvironmentRunAllResponse
 */
export interface EnvironmentRunAllResponse {
  /**
   *
   * @type {string}
   * @memberof EnvironmentRunAllResponse
   */
  task: string;
}
/**
 *
 * @export
 * @interface EnvironmentRunResponse
 */
export interface EnvironmentRunResponse {
  /**
   *
   * @type {string}
   * @memberof EnvironmentRunResponse
   */
  task: string;
}
/**
 *
 * @export
 * @interface EnvironmentStatusResponse
 */
export interface EnvironmentStatusResponse {
  /**
   *
   * @type {number}
   * @memberof EnvironmentStatusResponse
   */
  environmentId: number;
  /**
   *
   * @type {boolean}
   * @memberof EnvironmentStatusResponse
   */
  autoDetect?: boolean;
  /**
   *
   * @type {number}
   * @memberof EnvironmentStatusResponse
   */
  currentVersion?: number;
  /**
   *
   * @type {string}
   * @memberof EnvironmentStatusResponse
   */
  imageName?: string | null;
  /**
   *
   * @type {number}
   * @memberof EnvironmentStatusResponse
   */
  buildStatus?: number;
  /**
   *
   * @type {string}
   * @memberof EnvironmentStatusResponse
   */
  lastBuilt?: string | null;
  /**
   *
   * @type {number}
   * @memberof EnvironmentStatusResponse
   */
  successfulRuns?: number;
  /**
   *
   * @type {number}
   * @memberof EnvironmentStatusResponse
   */
  totalRuns?: number;
  /**
   *
   * @type {number}
   * @memberof EnvironmentStatusResponse
   */
  successRate?: number;
  /**
   *
   * @type {boolean}
   * @memberof EnvironmentStatusResponse
   */
  convergencePending?: boolean;
  /**
   *
   * @type {Array<string>}
   * @memberof EnvironmentStatusResponse
   */
  pendingModules?: Array<string>;
  /**
   *
   * @type {Array<{ [key: string]: any | undefined; }>}
   * @memberof EnvironmentStatusResponse
   */
  versionHistory?: Array<{ [key: string]: any | undefined }>;
  /**
   *
   * @type {number}
   * @memberof EnvironmentStatusResponse
   */
  historyCount?: number;
}
/**
 * Standard execution result for code files and notebooks.
 *
 * This is the primary response type for all execution endpoints.
 * @export
 * @interface ExecutionResult
 */
export interface ExecutionResult {
  /**
   * Whether execution completed successfully
   * @type {boolean}
   * @memberof ExecutionResult
   */
  success: boolean;
  /**
   * Standard output from execution
   * @type {string}
   * @memberof ExecutionResult
   */
  stdout?: string;
  /**
   * Standard error from execution
   * @type {string}
   * @memberof ExecutionResult
   */
  stderr?: string;
  /**
   * Error message if execution failed
   * @type {string}
   * @memberof ExecutionResult
   */
  error?: string | null;
  /**
   * Execution duration in seconds
   * @type {number}
   * @memberof ExecutionResult
   */
  executionTime?: number;
  /**
   * Structured output data (notebook cells, images, etc.)
   * @type {{ [key: string]: any | undefined; }}
   * @memberof ExecutionResult
   */
  outputData?: { [key: string]: any | undefined };
  /**
   * System-level logs from the executor
   * @type {Array<string>}
   * @memberof ExecutionResult
   */
  systemLogs?: Array<string>;
  /**
   * Structured test results (if present)
   * @type {Array<{ [key: string]: any | undefined; }>}
   * @memberof ExecutionResult
   */
  tests?: Array<{ [key: string]: any | undefined }>;
  /**
   * When the execution completed
   * @type {string}
   * @memberof ExecutionResult
   */
  timestamp?: string;
}
/**
 * Request serializer for file execution endpoints
 * @export
 * @interface FileExecutionRequest
 */
export interface FileExecutionRequest {
  /**
   * ID of the file to execute
   * @type {number}
   * @memberof FileExecutionRequest
   */
  fileId: number;
  /**
   * Execution timeout in seconds (1-120)
   * @type {number}
   * @memberof FileExecutionRequest
   */
  timeout?: number;
  /**
   * If true, bypass cache and force new execution
   * @type {boolean}
   * @memberof FileExecutionRequest
   */
  forceExecute?: boolean;
  /**
   * Optional test script to inject during execution
   * @type {string}
   * @memberof FileExecutionRequest
   */
  testCode?: string;
  /**
   * Optional content override for the file (e.g., edited notebook JSON)
   * @type {string}
   * @memberof FileExecutionRequest
   */
  codeOverride?: string;
}
/**
 *
 * @export
 * @interface GenerateOTTRequest
 */
export interface GenerateOTTRequest {
  /**
   *
   * @type {string}
   * @memberof GenerateOTTRequest
   */
  username: string;
}
/**
 *
 * @export
 * @interface GenerateOTTResponse
 */
export interface GenerateOTTResponse {
  /**
   *
   * @type {string}
   * @memberof GenerateOTTResponse
   */
  token: string;
  /**
   *
   * @type {string}
   * @memberof GenerateOTTResponse
   */
  expiresAt: string;
}
/**
 * * `hourly` - hourly
 * * `daily` - daily
 * * `monthly` - monthly
 * @export
 * @enum {string}
 */
export enum GranularityEnum {
  Hourly = 'hourly',
  Daily = 'daily',
  Monthly = 'monthly',
}

/**
 *
 * @export
 * @interface HandleValidationResponse
 */
export interface HandleValidationResponse {
  /**
   *
   * @type {boolean}
   * @memberof HandleValidationResponse
   */
  isValid: boolean;
}
/**
 * Result of a single health probe.
 * @export
 * @interface HealthCheck
 */
export interface HealthCheck {
  /**
   *
   * @type {StatusDfeEnum}
   * @memberof HealthCheck
   */
  status: StatusDfeEnum;
  /**
   *
   * @type {string}
   * @memberof HealthCheck
   */
  label: string;
  /**
   *
   * @type {string}
   * @memberof HealthCheck
   */
  detail: string | null;
  /**
   *
   * @type {number}
   * @memberof HealthCheck
   */
  latencyMs?: number | null;
}

/**
 *
 * @export
 * @interface JWT
 */
export interface JWT {
  /**
   *
   * @type {string}
   * @memberof JWT
   */
  username: string;
  /**
   *
   * @type {string}
   * @memberof JWT
   */
  password: string;
}
/**
 *
 * @export
 * @interface JwtOttResponse
 */
export interface JwtOttResponse {
  /**
   *
   * @type {string}
   * @memberof JwtOttResponse
   */
  token: string;
  /**
   *
   * @type {number}
   * @memberof JwtOttResponse
   */
  expiresAt: number;
}
/**
 * * `python-3.12` - python-3.12
 * * `python-3.11` - python-3.11
 * * `python-3.10` - python-3.10
 * * `python-3.7` - python-3.7
 * * `python-2.7` - python-2.7
 * * `java` - java
 * * `java-17` - java-17
 * * `java-11` - java-11
 * * `c/c++` - c/c++
 * * `node-20` - node-20
 * * `node-18` - node-18
 * * `r-4` - r-4
 * * `ruby` - ruby
 * * `php` - php
 * @export
 * @enum {string}
 */
export enum LanguageEnum {
  Python312 = 'python-3.12',
  Python311 = 'python-3.11',
  Python310 = 'python-3.10',
  Python37 = 'python-3.7',
  Python27 = 'python-2.7',
  Java = 'java',
  Java17 = 'java-17',
  Java11 = 'java-11',
  CC = 'c/c++',
  Node20 = 'node-20',
  Node18 = 'node-18',
  R4 = 'r-4',
  Ruby = 'ruby',
  Php = 'php',
}

/**
 * * `0` - Passed
 * * `1` - Failed
 * * `2` - Error
 * * `3` - Never run
 * @export
 * @enum {string}
 */
export enum LastSolutionRunEnum {
  NUMBER_0 = 0,
  NUMBER_1 = 1,
  NUMBER_2 = 2,
  NUMBER_3 = 3,
}

/**
 *
 * @export
 * @interface LogDumpRequest
 */
export interface LogDumpRequest {
  /**
   *
   * @type {Array<{ [key: string]: any | undefined; }>}
   * @memberof LogDumpRequest
   */
  attachments?: Array<{ [key: string]: any | undefined }>;
  /**
   *
   * @type {number}
   * @memberof LogDumpRequest
   */
  courseID?: number;
}
/**
 *
 * @export
 * @interface LogErrorRequest
 */
export interface LogErrorRequest {
  /**
   *
   * @type {string}
   * @memberof LogErrorRequest
   */
  error?: string;
  /**
   *
   * @type {string}
   * @memberof LogErrorRequest
   */
  errorDetail?: string;
  /**
   *
   * @type {string}
   * @memberof LogErrorRequest
   */
  url?: string;
  /**
   *
   * @type {string}
   * @memberof LogErrorRequest
   */
  screenshot?: string;
}
/**
 *
 * @export
 * @interface LogHappinessRequest
 */
export interface LogHappinessRequest {
  /**
   *
   * @type {string}
   * @memberof LogHappinessRequest
   */
  message?: string;
  /**
   *
   * @type {string}
   * @memberof LogHappinessRequest
   */
  url?: string;
}
/**
 *
 * @export
 * @interface LogSuccessResponse
 */
export interface LogSuccessResponse {
  /**
   *
   * @type {boolean}
   * @memberof LogSuccessResponse
   */
  success: boolean;
}
/**
 * Full response shape returned by both GET and PATCH /system/banner/.
 * @export
 * @interface MaintenanceBannerResponse
 */
export interface MaintenanceBannerResponse {
  /**
   *
   * @type {boolean}
   * @memberof MaintenanceBannerResponse
   */
  active: boolean;
  /**
   * True when active=True and within the schedule window.
   * @type {boolean}
   * @memberof MaintenanceBannerResponse
   */
  activeNow: boolean;
  /**
   *
   * @type {string}
   * @memberof MaintenanceBannerResponse
   */
  message: string;
  /**
   *
   * @type {string}
   * @memberof MaintenanceBannerResponse
   */
  color: string;
  /**
   *
   * @type {SeverityEnum}
   * @memberof MaintenanceBannerResponse
   */
  severity: SeverityEnum;
  /**
   *
   * @type {string}
   * @memberof MaintenanceBannerResponse
   */
  startsAt: string | null;
  /**
   *
   * @type {string}
   * @memberof MaintenanceBannerResponse
   */
  endsAt: string | null;
}

/**
 * Result of a single health probe.
 * @export
 * @interface MigrationCheck
 */
export interface MigrationCheck {
  /**
   *
   * @type {StatusDfeEnum}
   * @memberof MigrationCheck
   */
  status: StatusDfeEnum;
  /**
   *
   * @type {string}
   * @memberof MigrationCheck
   */
  label: string;
  /**
   *
   * @type {string}
   * @memberof MigrationCheck
   */
  detail: string | null;
  /**
   *
   * @type {number}
   * @memberof MigrationCheck
   */
  latencyMs?: number | null;
  /**
   *
   * @type {number}
   * @memberof MigrationCheck
   */
  pending: number;
}

/**
 * Base serializer for File objects.
 * @export
 * @interface ModelFile
 */
export interface ModelFile {
  /**
   * The name of the file.
   * @type {string}
   * @memberof ModelFile
   */
  name: string;
  /**
   * The data in a file. should be utf-8 encoded text.
   * @type {string}
   * @memberof ModelFile
   */
  data?: string;
  /**
   * The extension for the file (e.g. '.java' or '.py'
   * @type {string}
   * @memberof ModelFile
   */
  extension: string;
  /**
   *
   * @type {number}
   * @memberof ModelFile
   */
  readonly id: number;
  /**
   * Optional file path, delimited by slashes, to indicate a directory structure.
   * @type {string}
   * @memberof ModelFile
   */
  path?: string | null;
  /**
   *
   * @type {string}
   * @memberof ModelFile
   */
  readonly created: string;
  /**
   *
   * @type {string}
   * @memberof ModelFile
   */
  readonly modified: string;
}
/**
 * Request serializer for executing a single notebook cell
 * @export
 * @interface NotebookCellExecutionRequest
 */
export interface NotebookCellExecutionRequest {
  /**
   * Cell code to execute
   * @type {string}
   * @memberof NotebookCellExecutionRequest
   */
  cellCode: string;
  /**
   *
   * @type {number}
   * @memberof NotebookCellExecutionRequest
   */
  cellIndex?: number;
  /**
   *
   * @type {number}
   * @memberof NotebookCellExecutionRequest
   */
  timeout?: number;
  /**
   *
   * @type {string}
   * @memberof NotebookCellExecutionRequest
   */
  kernelName?: string;
}
/**
 * Request serializer for notebook execution
 * @export
 * @interface NotebookExecutionRequest
 */
export interface NotebookExecutionRequest {
  /**
   * Notebook JSON content
   * @type {string}
   * @memberof NotebookExecutionRequest
   */
  notebookContent: string;
  /**
   *
   * @type {number}
   * @memberof NotebookExecutionRequest
   */
  timeout?: number;
  /**
   *
   * @type {string}
   * @memberof NotebookExecutionRequest
   */
  kernelName?: string;
}
/**
 *
 * @export
 * @enum {string}
 */
export enum NullEnum {}

/**
 *
 * @export
 * @interface Organization
 */
export interface Organization {
  /**
   *
   * @type {number}
   * @memberof Organization
   */
  readonly id: number;
  /**
   * The name of the organization.
   * @type {string}
   * @memberof Organization
   */
  name: string;
  /**
   * A shortname for the organization (e.g. Princeton University -> PU)
   * @type {string}
   * @memberof Organization
   */
  shortname: string;
  /**
   *
   * @type {string}
   * @memberof Organization
   */
  emailDomain?: string | null;
  /**
   *
   * @type {boolean}
   * @memberof Organization
   */
  ssoEnabled?: boolean;
  /**
   *
   * @type {string}
   * @memberof Organization
   */
  ssoProvider?: string | null;
  /**
   *
   * @type {any}
   * @memberof Organization
   */
  ssoConfig?: any | null;
  /**
   *
   * @type {boolean}
   * @memberof Organization
   */
  sendWelcomeEmail?: boolean;
}
/**
 * Serializer for organization-level AI configuration.
 * @export
 * @interface OrganizationAISettings
 */
export interface OrganizationAISettings {
  /**
   *
   * @type {number}
   * @memberof OrganizationAISettings
   */
  readonly id: number;
  /**
   *
   * @type {string}
   * @memberof OrganizationAISettings
   */
  aiProvider?: OrganizationAISettingsAiProviderEnum | null;
  /**
   *
   * @type {string}
   * @memberof OrganizationAISettings
   */
  aiApiKey?: string | null;
  /**
   *
   * @type {string}
   * @memberof OrganizationAISettings
   */
  aiBaseUrl?: string | null;
  /**
   *
   * @type {string}
   * @memberof OrganizationAISettings
   */
  aiModel?: string | null;
  /**
   *
   * @type {boolean}
   * @memberof OrganizationAISettings
   */
  aiDisabled?: boolean;
  /**
   *
   * @type {boolean}
   * @memberof OrganizationAISettings
   */
  aiCommentsDisabled?: boolean;
  /**
   *
   * @type {AiCoursePolicyEnum}
   * @memberof OrganizationAISettings
   */
  aiCoursePolicy?: AiCoursePolicyEnum;
  /**
   *
   * @type {Array<number>}
   * @memberof OrganizationAISettings
   */
  readonly aiEnabledCourseIds: Array<number>;
  /**
   * Custom per-model token rates. JSON: {"model-name": {"input": 0.15, "output": 0.60}}
   * @type {any}
   * @memberof OrganizationAISettings
   */
  aiTokenRates?: any | null;
  /**
   *
   * @type {boolean}
   * @memberof OrganizationAISettings
   */
  readonly aiEnabled: boolean;
  /**
   *
   * @type {boolean}
   * @memberof OrganizationAISettings
   */
  readonly aiCommentsEnabled: boolean;
  /**
   *
   * @type {boolean}
   * @memberof OrganizationAISettings
   */
  readonly hasApiKey: boolean;
  /**
   *
   * @type {string}
   * @memberof OrganizationAISettings
   */
  readonly apiKeyHint: string | null;
  /**
   *
   * @type {{ [key: string]: { [key: string]: any | undefined; } | undefined; }}
   * @memberof OrganizationAISettings
   */
  readonly defaultTokenRates: { [key: string]: { [key: string]: any | undefined } | undefined };
}

/**
 * @export
 * @enum {string}
 */
export enum OrganizationAISettingsAiProviderEnum {
  Gemini = 'gemini',
  Openai = 'openai',
  Ollama = 'ollama',
  Portkey = 'portkey',
  Custom = 'custom',
}

/**
 * * `ok` - ok
 * * `degraded` - degraded
 * * `critical` - critical
 * @export
 * @enum {string}
 */
export enum OverallEnum {
  Ok = 'ok',
  Degraded = 'degraded',
  Critical = 'critical',
}

/**
 *
 * @export
 * @interface PaginatedSectionList
 */
export interface PaginatedSectionList {
  /**
   *
   * @type {number}
   * @memberof PaginatedSectionList
   */
  count: number;
  /**
   *
   * @type {string}
   * @memberof PaginatedSectionList
   */
  next?: string | null;
  /**
   *
   * @type {string}
   * @memberof PaginatedSectionList
   */
  previous?: string | null;
  /**
   *
   * @type {Array<Section>}
   * @memberof PaginatedSectionList
   */
  results: Array<Section>;
}
/**
 *
 * @export
 * @interface PaginatedSubmissionHistoryList
 */
export interface PaginatedSubmissionHistoryList {
  /**
   *
   * @type {number}
   * @memberof PaginatedSubmissionHistoryList
   */
  count: number;
  /**
   *
   * @type {string}
   * @memberof PaginatedSubmissionHistoryList
   */
  next?: string | null;
  /**
   *
   * @type {string}
   * @memberof PaginatedSubmissionHistoryList
   */
  previous?: string | null;
  /**
   *
   * @type {Array<SubmissionHistory>}
   * @memberof PaginatedSubmissionHistoryList
   */
  results: Array<SubmissionHistory>;
}
/**
 *
 * @export
 * @interface PaginatedSubmissionList
 */
export interface PaginatedSubmissionList {
  /**
   *
   * @type {number}
   * @memberof PaginatedSubmissionList
   */
  count: number;
  /**
   *
   * @type {string}
   * @memberof PaginatedSubmissionList
   */
  next?: string | null;
  /**
   *
   * @type {string}
   * @memberof PaginatedSubmissionList
   */
  previous?: string | null;
  /**
   *
   * @type {Array<Submission>}
   * @memberof PaginatedSubmissionList
   */
  results: Array<Submission>;
}
/**
 *
 * @export
 * @interface PaginatedSubmissionWithTestsList
 */
export interface PaginatedSubmissionWithTestsList {
  /**
   *
   * @type {number}
   * @memberof PaginatedSubmissionWithTestsList
   */
  count: number;
  /**
   *
   * @type {string}
   * @memberof PaginatedSubmissionWithTestsList
   */
  next?: string | null;
  /**
   *
   * @type {string}
   * @memberof PaginatedSubmissionWithTestsList
   */
  previous?: string | null;
  /**
   *
   * @type {Array<SubmissionWithTests>}
   * @memberof PaginatedSubmissionWithTestsList
   */
  results: Array<SubmissionWithTests>;
}
/**
 *
 * @export
 * @interface PaginatedUserList
 */
export interface PaginatedUserList {
  /**
   *
   * @type {number}
   * @memberof PaginatedUserList
   */
  count: number;
  /**
   *
   * @type {string}
   * @memberof PaginatedUserList
   */
  next?: string | null;
  /**
   *
   * @type {string}
   * @memberof PaginatedUserList
   */
  previous?: string | null;
  /**
   *
   * @type {Array<User>}
   * @memberof PaginatedUserList
   */
  results: Array<User>;
}
/**
 * Assignment Serializer from which all other Assignment Serializer subclasses inherit from
 * @export
 * @interface PatchedAssignment
 */
export interface PatchedAssignment {
  /**
   *
   * @type {number}
   * @memberof PatchedAssignment
   */
  readonly id?: number;
  /**
   * The name of the assignment.
   * @type {string}
   * @memberof PatchedAssignment
   */
  name?: string;
  /**
   * A boolean field. 'True' if the assignment is released for students to view. 'False' otherwise.
   * @type {boolean}
   * @memberof PatchedAssignment
   */
  isReleased?: boolean;
  /**
   * A boolean field. 'True' if grades/feedback are released for students to view. 'False' otherwise.
   * @type {boolean}
   * @memberof PatchedAssignment
   */
  feedbackReleased?: boolean;
  /**
   * The related course_id.
   * @type {number}
   * @memberof PatchedAssignment
   */
  course?: number;
  /**
   *
   * @type {Array<number>}
   * @memberof PatchedAssignment
   */
  readonly rubricCategories?: Array<number>;
  /**
   * A boolean field. If true, students will be allowed to upload submissions until the upload due date.
   * @type {boolean}
   * @memberof PatchedAssignment
   */
  allowStudentUpload?: boolean;
  /**
   * A boolean field. If true, students will be allowed to invite partners to their submission.
   * @type {boolean}
   * @memberof PatchedAssignment
   */
  allowStudentUploadWithPartners?: boolean;
  /**
   * The date after which students are not allowed to upload submissions. Only useful if allowStudentUpload is set to True.
   * @type {string}
   * @memberof PatchedAssignment
   */
  uploadDueDate?: string | null;
  /**
   * An integer representing the maximum number of late days to continue to accept submissions for this assignment.
   * @type {number}
   * @memberof PatchedAssignment
   */
  maxLateDays?: number;
  /**
   * A boolean field. If true, students can see their submission and comments before finalization and published
   * @type {boolean}
   * @memberof PatchedAssignment
   */
  liveFeedbackMode?: boolean;
  /**
   * A boolean field. If True and an uploadDueDate is set, students will still be able to submit after a deadline has passed.
   * @type {boolean}
   * @memberof PatchedAssignment
   */
  allowLateUploads?: boolean;
  /**
   *
   * @type {number}
   * @memberof PatchedAssignment
   */
  readonly environment?: number;
  /**
   *
   * @type {Array<number>}
   * @memberof PatchedAssignment
   */
  readonly files?: Array<number>;
  /**
   *
   * @type {Array<number>}
   * @memberof PatchedAssignment
   */
  readonly fileTemplates?: Array<number>;
  /**
   *
   * @type {number}
   * @memberof PatchedAssignment
   */
  readonly maxStudentTestRuns?: number | null;
  /**
   * Optional integer to specify the order of a Course's Assignments.
   * @type {number}
   * @memberof PatchedAssignment
   */
  sortKey?: number;
  /**
   * The explanation of an assignment, visible to students.
   * @type {string}
   * @memberof PatchedAssignment
   */
  explanation?: string;
  /**
   * A boolean field. 'True' if the assignment is viewable by students.
   * @type {boolean}
   * @memberof PatchedAssignment
   */
  isVisible?: boolean;
  /**
   * Sections from which to hide this assignment.
   * @type {Array<number>}
   * @memberof PatchedAssignment
   */
  hideFrom?: Array<number>;
  /**
   *
   * @type {boolean}
   * @memberof PatchedAssignment
   */
  readonly nudgeMode?: boolean;
  /**
   *
   * @type {any}
   * @memberof PatchedAssignment
   */
  lateDeductions?: any | null;
  /**
   * If set, overrides course setting. If True, students can see graders for this assignment.
   * @type {boolean}
   * @memberof PatchedAssignment
   */
  studentsCanSeeGraders?: boolean | null;
  /**
   *
   * @type {Array<number>}
   * @memberof PatchedAssignment
   */
  readonly dataSets?: Array<number>;
  /**
   * Total points for the assignment.
   * @type {number}
   * @memberof PatchedAssignment
   */
  points?: number;
  /**
   * A boolean field. 'True' if the students should not see their grades for this assignment. 'False' otherwise.
   * @type {boolean}
   * @memberof PatchedAssignment
   */
  hideGrades?: boolean;
  /**
   * A boolean field. If 'True', graders will not have access to the students field of submission objects, unless they have elevated privileges.
   * @type {boolean}
   * @memberof PatchedAssignment
   */
  anonymousGrading?: boolean;
  /**
   * A boolean field. If True, the graders of a submission will be hidden from students.
   * @type {boolean}
   * @memberof PatchedAssignment
   */
  hideGradersFromStudents?: boolean;
  /**
   * A boolean field. If True, students can provide feedback on rubric comments.
   * @type {boolean}
   * @memberof PatchedAssignment
   */
  commentFeedback?: boolean;
  /**
   * A boolean field. If true, grades begin at 0 (instead of assignment.points)
   * @type {boolean}
   * @memberof PatchedAssignment
   */
  additiveGrading?: boolean;
  /**
   * A boolean field. If True, students will be allowed to submit questions and regrade requests after their submission has been graded.
   * @type {boolean}
   * @memberof PatchedAssignment
   */
  allowRegradeRequests?: boolean;
  /**
   * Instructions (in Markdown) to show students when they submit regrade requests.
   * @type {string}
   * @memberof PatchedAssignment
   */
  regradeInstructions?: string;
  /**
   * The date after which students are not allowed submit a regrade request.
   * @type {string}
   * @memberof PatchedAssignment
   */
  regradeDeadline?: string | null;
  /**
   * A boolean field. If true, graders will be required to link a rubric comment on all comments.
   * @type {boolean}
   * @memberof PatchedAssignment
   */
  forcedRubricMode?: boolean;
  /**
   * A boolean field. If true, admins will be able upload template code files. Those template files will be used to de-emphasize provided versus student-written code in submissions.
   * @type {boolean}
   * @memberof PatchedAssignment
   */
  templateMode?: boolean;
  /**
   * A boolean field. If true, admins and graders can edit the assignment rubric inline in the code console.
   * @type {boolean}
   * @memberof PatchedAssignment
   */
  collaborativeRubricMode?: boolean;
  /**
   * A boolean field. If True, graders will be allowed to edit student submissions (e.g. for testing fixes).
   * @type {boolean}
   * @memberof PatchedAssignment
   */
  gradersCanEditSubmissions?: boolean;
  /**
   *
   * @type {Array<number>}
   * @memberof PatchedAssignment
   */
  readonly testCategories?: Array<number>;
  /**
   * A boolean field. If true, an assignment's 10 most frequently used rubric comments will be shown within the code console.
   * @type {boolean}
   * @memberof PatchedAssignment
   */
  showFrequentlyUsedRubricComments?: boolean;
  /**
   * System prompt for AI comment generation. Placeholders: {assignment_name}, {file_content}, {selected_content}, {rubric_context}, {grader_draft}
   * @type {string}
   * @memberof PatchedAssignment
   */
  aiSystemPrompt?: string;
  /**
   * If True, submission files will be automatically executed and cached when a student submits.
   * @type {boolean}
   * @memberof PatchedAssignment
   */
  runFilesOnSubmit?: boolean;
  /**
   * If True, autograder tests will automatically run when a student submits.
   * @type {boolean}
   * @memberof PatchedAssignment
   */
  runTestsOnSubmit?: boolean;
  /**
   * If True, the results of autograder tests will be included in the submission grade calculation.
   * @type {boolean}
   * @memberof PatchedAssignment
   */
  testsAffectGrade?: boolean;
}
/**
 * Serializer for updating AssignmentDataSet (without file upload)
 * @export
 * @interface PatchedAssignmentDataSetUpdate
 */
export interface PatchedAssignmentDataSetUpdate {
  /**
   * The name of the data set.
   * @type {string}
   * @memberof PatchedAssignmentDataSetUpdate
   */
  name?: string;
  /**
   * Optional description of the data set.
   * @type {string}
   * @memberof PatchedAssignmentDataSetUpdate
   */
  description?: string;
  /**
   *
   * @type {string}
   * @memberof PatchedAssignmentDataSetUpdate
   */
  mountPath?: string;
  /**
   *
   * @type {boolean}
   * @memberof PatchedAssignmentDataSetUpdate
   */
  isActive?: boolean;
  /**
   *
   * @type {boolean}
   * @memberof PatchedAssignmentDataSetUpdate
   */
  isTestResource?: boolean;
}
/**
 * Serializer for AssignmentFile objects.
 * These are files that belong to assignments (templates, instructions, etc.).
 * @export
 * @interface PatchedAssignmentFile
 */
export interface PatchedAssignmentFile {
  /**
   * The name of the file.
   * @type {string}
   * @memberof PatchedAssignmentFile
   */
  name?: string;
  /**
   * The data in a file. should be utf-8 encoded text.
   * @type {string}
   * @memberof PatchedAssignmentFile
   */
  data?: string;
  /**
   * The extension for the file (e.g. '.java' or '.py'
   * @type {string}
   * @memberof PatchedAssignmentFile
   */
  extension?: string;
  /**
   * The related assignment_id.
   * @type {number}
   * @memberof PatchedAssignmentFile
   */
  assignment?: number;
  /**
   *
   * @type {number}
   * @memberof PatchedAssignmentFile
   */
  readonly id?: number;
  /**
   * Optional file path, delimited by slashes, to indicate a directory structure.
   * @type {string}
   * @memberof PatchedAssignmentFile
   */
  path?: string | null;
  /**
   * If student upload is enabled, a file with this name and extension will be required.
   * @type {boolean}
   * @memberof PatchedAssignmentFile
   */
  required?: boolean;
  /**
   * Optional description shown to students.
   * @type {string}
   * @memberof PatchedAssignmentFile
   */
  description?: string;
  /**
   *
   * @type {string}
   * @memberof PatchedAssignmentFile
   */
  readonly created?: string;
  /**
   *
   * @type {string}
   * @memberof PatchedAssignmentFile
   */
  readonly modified?: string;
  /**
   * If True, this file will be hidden from students (but available for tests/helpers).
   * @type {boolean}
   * @memberof PatchedAssignmentFile
   */
  hidden?: boolean;
  /**
   *
   * @type {boolean}
   * @memberof PatchedAssignmentFile
   */
  isTestResource?: boolean;
}
/**
 *
 * @export
 * @interface PatchedComment
 */
export interface PatchedComment {
  /**
   *
   * @type {number}
   * @memberof PatchedComment
   */
  readonly id?: number;
  /**
   * The text on the comment
   * @type {string}
   * @memberof PatchedComment
   */
  text?: string;
  /**
   * The points deducted. A negative number represents a bonus.
   * @type {number}
   * @memberof PatchedComment
   */
  pointDelta?: number | null;
  /**
   * An integer representing the character position a comment begins on.
   * @type {number}
   * @memberof PatchedComment
   */
  startChar?: number;
  /**
   * An integer representing the character position a comment ends on.
   * @type {number}
   * @memberof PatchedComment
   */
  endChar?: number;
  /**
   * An integer representing the line number a comment begins on.
   * @type {number}
   * @memberof PatchedComment
   */
  startLine?: number;
  /**
   * An integer representing the line number a comment begins on.
   * @type {number}
   * @memberof PatchedComment
   */
  endLine?: number;
  /**
   * The related file_id.
   * @type {number}
   * @memberof PatchedComment
   */
  file?: number;
  /**
   * The related rubricComment_id. Null if no rubric comment linked.
   * @type {number}
   * @memberof PatchedComment
   */
  rubricComment?: number | null;
  /**
   *
   * @type {string}
   * @memberof PatchedComment
   */
  author?: string;
  /**
   * An integer representing the feedback applied to this comment. Currently only valid if rubricComment is not null.
   * @type {number}
   * @memberof PatchedComment
   */
  readonly feedback?: number;
  /**
   *
   * @type {string}
   * @memberof PatchedComment
   */
  readonly color?: string | null;
  /**
   *
   * @type {Array<string | null>}
   * @memberof PatchedComment
   */
  tags?: Array<string | null>;
}
/**
 *
 * @export
 * @interface PatchedCommentTemplate
 */
export interface PatchedCommentTemplate {
  /**
   *
   * @type {number}
   * @memberof PatchedCommentTemplate
   */
  readonly id?: number;
  /**
   * The text of the template.
   * @type {string}
   * @memberof PatchedCommentTemplate
   */
  text?: string;
  /**
   *
   * @type {string}
   * @memberof PatchedCommentTemplate
   */
  readonly owner?: string;
  /**
   * The assignment this template belongs to.
   * @type {number}
   * @memberof PatchedCommentTemplate
   */
  assignment?: number;
  /**
   * If True, this template is visible to all graders in the assignment.
   * @type {boolean}
   * @memberof PatchedCommentTemplate
   */
  isGlobal?: boolean;
  /**
   * Optional file path pattern. If set, template only shows for matching files.
   * @type {string}
   * @memberof PatchedCommentTemplate
   */
  filePath?: string | null;
  /**
   * Points delta for this template.
   * @type {number}
   * @memberof PatchedCommentTemplate
   */
  pointDelta?: number | null;
  /**
   * Optional linked rubric comment.
   * @type {number}
   * @memberof PatchedCommentTemplate
   */
  rubricComment?: number | null;
  /**
   * The original comment this template was created from. Null if manually created or source was deleted.
   * @type {number}
   * @memberof PatchedCommentTemplate
   */
  sourceComment?: number | null;
  /**
   * Optional notebook cell ID. If set, template only shows for this cell.
   * @type {string}
   * @memberof PatchedCommentTemplate
   */
  cellId?: string | null;
}
/**
 *
 * @export
 * @interface PatchedCourse
 */
export interface PatchedCourse {
  /**
   *
   * @type {number}
   * @memberof PatchedCourse
   */
  readonly id?: number;
  /**
   * The name of the course.
   * @type {string}
   * @memberof PatchedCourse
   */
  name?: string;
  /**
   * A string describing the period (e.g. F2019, T32019, etc.
   * @type {string}
   * @memberof PatchedCourse
   */
  period?: string;
  /**
   *
   * @type {Array<number>}
   * @memberof PatchedCourse
   */
  readonly assignments?: Array<number>;
  /**
   *
   * @type {Array<number>}
   * @memberof PatchedCourse
   */
  readonly sections?: Array<number>;
  /**
   * A boolean field. If True, submissions that are claimed and subsequently released will be added to the back of the grading queue.
   * @type {boolean}
   * @memberof PatchedCourse
   */
  sendReleasedSubmissionsToBack?: boolean;
  /**
   * A boolean field. If True, students will be able to view basic grade statistics for released assignments.
   * @type {boolean}
   * @memberof PatchedCourse
   */
  showStudentsStatistics?: boolean;
  /**
   * Timezone in which course operates.
   * @type {string}
   * @memberof PatchedCourse
   */
  timezone?: string;
  /**
   * A boolean field. If True, when emails are added to a course roster that do not correspond to existing codePost users, those emails will be sent an email notifying that they have been added to a course and providing a link to register their (new) accounts.
   * @type {boolean}
   * @memberof PatchedCourse
   */
  emailNewUsers?: boolean;
  /**
   * A boolean field. If True, new assignments will have anonymous grading mode enabled by default.
   * @type {boolean}
   * @memberof PatchedCourse
   */
  anonymousGradingDefault?: boolean;
  /**
   * A boolean field. If True, graders will be allowed to add and update unlinked rubric comments.
   * @type {boolean}
   * @memberof PatchedCourse
   */
  allowGradersToEditRubric?: boolean;
  /**
   * An integer representing the minimum number of comments that graders are asked to make prior to finalizing. 0 indicates no minimum.
   * @type {number}
   * @memberof PatchedCourse
   */
  minComments?: number;
  /**
   * If True, only admins can unfinalize submissions.
   * @type {boolean}
   * @memberof PatchedCourse
   */
  noUnfinalize?: boolean;
  /**
   * If True, the course will not be editable.
   * @type {boolean}
   * @memberof PatchedCourse
   */
  archived?: boolean;
  /**
   * The number of Late Day Credits that each student gets at the beginning of the term. Null if the course does not have students submit directly to codePost.
   * @type {number}
   * @memberof PatchedCourse
   */
  lateDayCreditsAllowable?: number | null;
  /**
   * If True, will be able to claim submissions from the ungraded queue.
   * @type {boolean}
   * @memberof PatchedCourse
   */
  activateQueue?: boolean;
  /**
   * A token which allows students to join course.
   * @type {string}
   * @memberof PatchedCourse
   */
  readonly inviteCode?: string | null;
  /**
   * Permissible student email domains.
   * @type {string}
   * @memberof PatchedCourse
   */
  emailWhitelist?: string;
  /**
   * If True, the course's invite code can be used.
   * @type {boolean}
   * @memberof PatchedCourse
   */
  inviteCodeEnabled?: boolean;
  /**
   * If True, the graders may send students feedback notifications.
   * @type {boolean}
   * @memberof PatchedCourse
   */
  enableStudentFeedbackNotifications?: boolean;
  /**
   *
   * @type {Array<number>}
   * @memberof PatchedCourse
   */
  readonly webhooks?: Array<number>;
  /**
   *
   * @type {string}
   * @memberof PatchedCourse
   */
  expirationDate?: string | null;
  /**
   * The related organization_id
   * @type {number}
   * @memberof PatchedCourse
   */
  organization?: number;
  /**
   * If True, students can see the grader who graded their submission.
   * @type {boolean}
   * @memberof PatchedCourse
   */
  studentsCanSeeGraders?: boolean;
  /**
   *
   * @type {number}
   * @memberof PatchedCourse
   */
  readonly studentCount?: number;
  /**
   *
   * @type {boolean}
   * @memberof PatchedCourse
   */
  readonly isRubricEditor?: boolean;
  /**
   *
   * @type {number}
   * @memberof PatchedCourse
   */
  cloneFrom?: number;
}
/**
 * Serializer for course AI configuration. Admin-only access.
 * @export
 * @interface PatchedCourseAISettings
 */
export interface PatchedCourseAISettings {
  /**
   *
   * @type {number}
   * @memberof PatchedCourseAISettings
   */
  readonly id?: number;
  /**
   *
   * @type {string}
   * @memberof PatchedCourseAISettings
   */
  aiProvider?: PatchedCourseAISettingsAiProviderEnum | null;
  /**
   *
   * @type {string}
   * @memberof PatchedCourseAISettings
   */
  aiApiKey?: string | null;
  /**
   *
   * @type {string}
   * @memberof PatchedCourseAISettings
   */
  aiBaseUrl?: string | null;
  /**
   *
   * @type {string}
   * @memberof PatchedCourseAISettings
   */
  aiModel?: string | null;
  /**
   *
   * @type {boolean}
   * @memberof PatchedCourseAISettings
   */
  aiDisabled?: boolean;
  /**
   *
   * @type {boolean}
   * @memberof PatchedCourseAISettings
   */
  aiCommentsDisabled?: boolean;
  /**
   *
   * @type {boolean}
   * @memberof PatchedCourseAISettings
   */
  aiUseOwnSettings?: boolean;
  /**
   * Custom per-model token rates. JSON: {"model-name": {"input": 0.15, "output": 0.60}}
   * @type {any}
   * @memberof PatchedCourseAISettings
   */
  aiTokenRates?: any | null;
  /**
   *
   * @type {boolean}
   * @memberof PatchedCourseAISettings
   */
  readonly aiEnabled?: boolean;
  /**
   *
   * @type {boolean}
   * @memberof PatchedCourseAISettings
   */
  readonly aiCommentsEnabled?: boolean;
  /**
   *
   * @type {boolean}
   * @memberof PatchedCourseAISettings
   */
  readonly orgAiAvailable?: boolean;
  /**
   *
   * @type {boolean}
   * @memberof PatchedCourseAISettings
   */
  readonly hasApiKey?: boolean;
  /**
   *
   * @type {string}
   * @memberof PatchedCourseAISettings
   */
  readonly apiKeyHint?: string | null;
  /**
   *
   * @type {{ [key: string]: { [key: string]: any | undefined; } | undefined; }}
   * @memberof PatchedCourseAISettings
   */
  readonly defaultTokenRates?: { [key: string]: { [key: string]: any | undefined } | undefined };
}

/**
 * @export
 * @enum {string}
 */
export enum PatchedCourseAISettingsAiProviderEnum {
  Gemini = 'gemini',
  Openai = 'openai',
  Ollama = 'ollama',
  Portkey = 'portkey',
  Custom = 'custom',
}

/**
 * Serializer for CourseFile objects.
 * These are files that belong to courses (syllabi, resources, etc.).
 * @export
 * @interface PatchedCourseFile
 */
export interface PatchedCourseFile {
  /**
   * The name of the file.
   * @type {string}
   * @memberof PatchedCourseFile
   */
  name?: string;
  /**
   * The data in a file. should be utf-8 encoded text.
   * @type {string}
   * @memberof PatchedCourseFile
   */
  data?: string;
  /**
   * The extension for the file (e.g. '.java' or '.py'
   * @type {string}
   * @memberof PatchedCourseFile
   */
  extension?: string;
  /**
   * The related course_id.
   * @type {number}
   * @memberof PatchedCourseFile
   */
  course?: number;
  /**
   *
   * @type {number}
   * @memberof PatchedCourseFile
   */
  readonly id?: number;
  /**
   * Optional file path, delimited by slashes, to indicate a directory structure.
   * @type {string}
   * @memberof PatchedCourseFile
   */
  path?: string | null;
  /**
   *
   * @type {string}
   * @memberof PatchedCourseFile
   */
  readonly created?: string;
  /**
   *
   * @type {string}
   * @memberof PatchedCourseFile
   */
  readonly modified?: string;
}
/**
 *
 * @export
 * @interface PatchedCourseRosterMap
 */
export interface PatchedCourseRosterMap {
  /**
   *
   * @type {{ [key: string]: string | undefined | null; }}
   * @memberof PatchedCourseRosterMap
   */
  rosterMap?: { [key: string]: string | undefined | null };
}
/**
 *
 * @export
 * @interface PatchedCourseStudentCaptions
 */
export interface PatchedCourseStudentCaptions {
  /**
   *
   * @type {{ [key: string]: string | undefined | null; }}
   * @memberof PatchedCourseStudentCaptions
   */
  studentCaptions?: { [key: string]: string | undefined | null };
}
/**
 *
 * @export
 * @interface PatchedEnvironment
 */
export interface PatchedEnvironment {
  /**
   *
   * @type {number}
   * @memberof PatchedEnvironment
   */
  readonly id?: number;
  /**
   * The related assignment__id.
   * @type {number}
   * @memberof PatchedEnvironment
   */
  assignment?: number;
  /**
   *
   * @type {LanguageEnum}
   * @memberof PatchedEnvironment
   */
  language?: LanguageEnum;
  /**
   *
   * @type {any}
   * @memberof PatchedEnvironment
   */
  dockerRunInstructions?: any | null;
  /**
   * Command to be run on every submission before tests
   * @type {string}
   * @memberof PatchedEnvironment
   */
  compileText?: string;
  /**
   * A custom set of docker commands to append to the base image docker file
   * @type {string}
   * @memberof PatchedEnvironment
   */
  dockerfile?: string;
  /**
   *
   * @type {BuildTypeEnum}
   * @memberof PatchedEnvironment
   */
  buildType?: BuildTypeEnum;
  /**
   * A boolean field indicating whether tests should be run in a container that allows network access.
   * @type {boolean}
   * @memberof PatchedEnvironment
   */
  allowNetworkAccess?: boolean;
  /**
   * An integer field indicating the max times that tests will be run if tests are exposed.
   * @type {number}
   * @memberof PatchedEnvironment
   */
  maxStudentTestRuns?: number | null;
  /**
   * An integer field indicating the limit of the number of failed tests that will be exposed to a student (nudge mode).
   * @type {number}
   * @memberof PatchedEnvironment
   */
  maxExposedFailedTests?: number | null;
  /**
   *
   * @type {boolean}
   * @memberof PatchedEnvironment
   */
  autoDetect?: boolean;
  /**
   *
   * @type {string}
   * @memberof PatchedEnvironment
   */
  imageName?: string | null;
  /**
   *
   * @type {number}
   * @memberof PatchedEnvironment
   */
  readonly buildStatus?: number;
  /**
   *
   * @type {string}
   * @memberof PatchedEnvironment
   */
  readonly buildLogs?: string;
  /**
   *
   * @type {string}
   * @memberof PatchedEnvironment
   */
  readonly lastBuilt?: string;
  /**
   *
   * @type {string}
   * @memberof PatchedEnvironment
   */
  requirements?: string;
  /**
   *
   * @type {any}
   * @memberof PatchedEnvironment
   */
  envVars?: any | null;
  /**
   *
   * @type {number}
   * @memberof PatchedEnvironment
   */
  readonly currentBuildVersion?: number;
  /**
   *
   * @type {any}
   * @memberof PatchedEnvironment
   */
  readonly imageHistory?: any | null;
  /**
   *
   * @type {boolean}
   * @memberof PatchedEnvironment
   */
  readonly convergencePending?: boolean;
  /**
   *
   * @type {any}
   * @memberof PatchedEnvironment
   */
  readonly convergenceStats?: any | null;
  /**
   *
   * @type {number}
   * @memberof PatchedEnvironment
   */
  readonly successfulRuns?: number;
  /**
   *
   * @type {number}
   * @memberof PatchedEnvironment
   */
  readonly totalRuns?: number;
  /**
   *
   * @type {number}
   * @memberof PatchedEnvironment
   */
  readonly successRate?: number;
}

/**
 *
 * @export
 * @interface PatchedEnvironmentBuildRequest
 */
export interface PatchedEnvironmentBuildRequest {
  /**
   *
   * @type {string}
   * @memberof PatchedEnvironmentBuildRequest
   */
  language?: string;
  /**
   *
   * @type {string}
   * @memberof PatchedEnvironmentBuildRequest
   */
  requirements?: string;
  /**
   *
   * @type {string}
   * @memberof PatchedEnvironmentBuildRequest
   */
  dockerfile?: string;
  /**
   *
   * @type {any}
   * @memberof PatchedEnvironmentBuildRequest
   */
  dockerRunInstructions?: any | null;
  /**
   *
   * @type {string}
   * @memberof PatchedEnvironmentBuildRequest
   */
  buildType?: string;
  /**
   *
   * @type {boolean}
   * @memberof PatchedEnvironmentBuildRequest
   */
  autoDetect?: boolean;
}
/**
 *
 * @export
 * @interface PatchedEnvironmentRunAllRequest
 */
export interface PatchedEnvironmentRunAllRequest {
  /**
   *
   * @type {boolean}
   * @memberof PatchedEnvironmentRunAllRequest
   */
  sendEmail?: boolean;
}
/**
 *
 * @export
 * @interface PatchedEnvironmentRunRequest
 */
export interface PatchedEnvironmentRunRequest {
  /**
   *
   * @type {number}
   * @memberof PatchedEnvironmentRunRequest
   */
  submission?: number | null;
  /**
   *
   * @type {boolean}
   * @memberof PatchedEnvironmentRunRequest
   */
  simulate?: boolean;
  /**
   *
   * @type {boolean}
   * @memberof PatchedEnvironmentRunRequest
   */
  exposedOnly?: boolean;
  /**
   *
   * @type {any}
   * @memberof PatchedEnvironmentRunRequest
   */
  files?: any | null;
}
/**
 * Base serializer for File objects.
 * @export
 * @interface PatchedFile
 */
export interface PatchedFile {
  /**
   * The name of the file.
   * @type {string}
   * @memberof PatchedFile
   */
  name?: string;
  /**
   * The data in a file. should be utf-8 encoded text.
   * @type {string}
   * @memberof PatchedFile
   */
  data?: string;
  /**
   * The extension for the file (e.g. '.java' or '.py'
   * @type {string}
   * @memberof PatchedFile
   */
  extension?: string;
  /**
   *
   * @type {number}
   * @memberof PatchedFile
   */
  readonly id?: number;
  /**
   * Optional file path, delimited by slashes, to indicate a directory structure.
   * @type {string}
   * @memberof PatchedFile
   */
  path?: string | null;
  /**
   *
   * @type {string}
   * @memberof PatchedFile
   */
  readonly created?: string;
  /**
   *
   * @type {string}
   * @memberof PatchedFile
   */
  readonly modified?: string;
}
/**
 *
 * @export
 * @interface PatchedMaintenanceBanner
 */
export interface PatchedMaintenanceBanner {
  /**
   *
   * @type {boolean}
   * @memberof PatchedMaintenanceBanner
   */
  active?: boolean;
  /**
   *
   * @type {string}
   * @memberof PatchedMaintenanceBanner
   */
  message?: string;
  /**
   *
   * @type {string}
   * @memberof PatchedMaintenanceBanner
   */
  color?: string;
  /**
   *
   * @type {SeverityEnum}
   * @memberof PatchedMaintenanceBanner
   */
  severity?: SeverityEnum;
  /**
   *
   * @type {string}
   * @memberof PatchedMaintenanceBanner
   */
  startsAt?: string | null;
  /**
   *
   * @type {string}
   * @memberof PatchedMaintenanceBanner
   */
  endsAt?: string | null;
}

/**
 *
 * @export
 * @interface PatchedOrganization
 */
export interface PatchedOrganization {
  /**
   *
   * @type {number}
   * @memberof PatchedOrganization
   */
  readonly id?: number;
  /**
   * The name of the organization.
   * @type {string}
   * @memberof PatchedOrganization
   */
  name?: string;
  /**
   * A shortname for the organization (e.g. Princeton University -> PU)
   * @type {string}
   * @memberof PatchedOrganization
   */
  shortname?: string;
  /**
   *
   * @type {string}
   * @memberof PatchedOrganization
   */
  emailDomain?: string | null;
  /**
   *
   * @type {boolean}
   * @memberof PatchedOrganization
   */
  ssoEnabled?: boolean;
  /**
   *
   * @type {string}
   * @memberof PatchedOrganization
   */
  ssoProvider?: string | null;
  /**
   *
   * @type {any}
   * @memberof PatchedOrganization
   */
  ssoConfig?: any | null;
  /**
   *
   * @type {boolean}
   * @memberof PatchedOrganization
   */
  sendWelcomeEmail?: boolean;
}
/**
 * Serializer for updating organization AI settings including enabled courses.
 * @export
 * @interface PatchedOrganizationAISettingsUpdate
 */
export interface PatchedOrganizationAISettingsUpdate {
  /**
   *
   * @type {string}
   * @memberof PatchedOrganizationAISettingsUpdate
   */
  aiProvider?: PatchedOrganizationAISettingsUpdateAiProviderEnum | null;
  /**
   *
   * @type {string}
   * @memberof PatchedOrganizationAISettingsUpdate
   */
  aiApiKey?: string | null;
  /**
   *
   * @type {string}
   * @memberof PatchedOrganizationAISettingsUpdate
   */
  aiBaseUrl?: string | null;
  /**
   *
   * @type {string}
   * @memberof PatchedOrganizationAISettingsUpdate
   */
  aiModel?: string | null;
  /**
   *
   * @type {boolean}
   * @memberof PatchedOrganizationAISettingsUpdate
   */
  aiDisabled?: boolean;
  /**
   *
   * @type {boolean}
   * @memberof PatchedOrganizationAISettingsUpdate
   */
  aiCommentsDisabled?: boolean;
  /**
   *
   * @type {AiCoursePolicyEnum}
   * @memberof PatchedOrganizationAISettingsUpdate
   */
  aiCoursePolicy?: AiCoursePolicyEnum;
  /**
   * List of course IDs to enable for org AI (used when aiCoursePolicy is 'selected')
   * @type {Array<number>}
   * @memberof PatchedOrganizationAISettingsUpdate
   */
  aiEnabledCourseIds?: Array<number>;
  /**
   * Custom per-model token rates. JSON: {"model-name": {"input": 0.15, "output": 0.60}}
   * @type {any}
   * @memberof PatchedOrganizationAISettingsUpdate
   */
  aiTokenRates?: any | null;
}

/**
 * @export
 * @enum {string}
 */
export enum PatchedOrganizationAISettingsUpdateAiProviderEnum {
  Gemini = 'gemini',
  Openai = 'openai',
  Ollama = 'ollama',
  Portkey = 'portkey',
  Custom = 'custom',
}

/**
 *
 * @export
 * @interface PatchedRubricCategory
 */
export interface PatchedRubricCategory {
  /**
   *
   * @type {number}
   * @memberof PatchedRubricCategory
   */
  readonly id?: number;
  /**
   * The related assignment_id.
   * @type {number}
   * @memberof PatchedRubricCategory
   */
  assignment?: number;
  /**
   * The name of the category (e.g. 'General').
   * @type {string}
   * @memberof PatchedRubricCategory
   */
  name?: string;
  /**
   * An integer cap for the maximum number of points that can be deducted under this category.
   * @type {number}
   * @memberof PatchedRubricCategory
   */
  pointLimit?: number | null;
  /**
   *
   * @type {Array<number>}
   * @memberof PatchedRubricCategory
   */
  readonly rubricComments?: Array<number>;
  /**
   * Optional integer to specify the order of an Assignment's Rubric Categories
   * @type {number}
   * @memberof PatchedRubricCategory
   */
  sortKey?: number;
  /**
   * Subtext for the category name.
   * @type {string}
   * @memberof PatchedRubricCategory
   */
  helpText?: string;
  /**
   * A boolean field. If True, at most one rubric comment from this rubric category can be applied to a submission.
   * @type {boolean}
   * @memberof PatchedRubricCategory
   */
  atMostOnce?: boolean;
}
/**
 *
 * @export
 * @interface PatchedRubricComment
 */
export interface PatchedRubricComment {
  /**
   *
   * @type {number}
   * @memberof PatchedRubricComment
   */
  readonly id?: number;
  /**
   * The text on the rubric comment.
   * @type {string}
   * @memberof PatchedRubricComment
   */
  text?: string;
  /**
   * The points deducted. A negative number represents a bonus.
   * @type {number}
   * @memberof PatchedRubricComment
   */
  pointDelta?: number;
  /**
   * The related rubricCategory_id
   * @type {number}
   * @memberof PatchedRubricComment
   */
  category?: number;
  /**
   * Optional integer to specify the order of a Rubric Category's comments.
   * @type {number}
   * @memberof PatchedRubricComment
   */
  sortKey?: number;
  /**
   * The explanation of a rubric comment shown to students.
   * @type {string}
   * @memberof PatchedRubricComment
   */
  explanation?: string;
  /**
   * Text shown to the grader in the custom text field of an instance comment.
   * @type {string}
   * @memberof PatchedRubricComment
   */
  instructionText?: string;
  /**
   * If True, instruction text will pre-populate instance comments.
   * @type {boolean}
   * @memberof PatchedRubricComment
   */
  templateTextOn?: boolean;
  /**
   *
   * @type {string}
   * @memberof PatchedRubricComment
   */
  name?: string | null;
}
/**
 *
 * @export
 * @interface PatchedSection
 */
export interface PatchedSection {
  /**
   * The name of the section.
   * @type {string}
   * @memberof PatchedSection
   */
  name?: string;
  /**
   *
   * @type {number}
   * @memberof PatchedSection
   */
  readonly id?: number;
  /**
   * The related course_id.
   * @type {number}
   * @memberof PatchedSection
   */
  course?: number;
  /**
   *
   * @type {Array<string | null>}
   * @memberof PatchedSection
   */
  leaders?: Array<string | null>;
  /**
   *
   * @type {Array<string | null>}
   * @memberof PatchedSection
   */
  students?: Array<string | null>;
}
/**
 *
 * @export
 * @interface PatchedSubmission
 */
export interface PatchedSubmission {
  /**
   *
   * @type {number}
   * @memberof PatchedSubmission
   */
  readonly id?: number;
  /**
   * The related assignment_id.
   * @type {number}
   * @memberof PatchedSubmission
   */
  assignment?: number;
  /**
   *
   * @type {Array<string | null>}
   * @memberof PatchedSubmission
   */
  students?: Array<string | null>;
  /**
   *
   * @type {string}
   * @memberof PatchedSubmission
   */
  grader?: string | null;
  /**
   * A boolean field. 'True' if the submission is finalized. 'False' otherwise.
   * @type {boolean}
   * @memberof PatchedSubmission
   */
  isFinalized?: boolean;
  /**
   *
   * @type {string}
   * @memberof PatchedSubmission
   */
  readonly dateEdited?: string;
  /**
   * The grade for the submission. Null if not graded yet.
   * @type {number}
   * @memberof PatchedSubmission
   */
  readonly grade?: number | null;
  /**
   * Index used to order the queue from which graders draw submissions. Will sort low to high.
   * @type {number}
   * @memberof PatchedSubmission
   */
  queueOrderKey?: number;
  /**
   * The date this submission was created. None if just created, and files haven't been uploaded yet. Used for Celery tasks.
   * @type {string}
   * @memberof PatchedSubmission
   */
  dateUploaded?: string | null;
  /**
   * A boolean field. If true the submission has an open question.
   * @type {boolean}
   * @memberof PatchedSubmission
   */
  questionIsOpen?: boolean;
  /**
   * A boolean field. If 'True', the submission's question is a regrade request.
   * @type {boolean}
   * @memberof PatchedSubmission
   */
  questionIsRegrade?: boolean;
  /**
   * The text of the question.
   * @type {string}
   * @memberof PatchedSubmission
   */
  readonly questionText?: string;
  /**
   *
   * @type {string}
   * @memberof PatchedSubmission
   */
  questionResponder?: string | null;
  /**
   * The text of the question response.
   * @type {string}
   * @memberof PatchedSubmission
   */
  questionResponse?: string;
  /**
   * The date the request / question was submitted.
   * @type {string}
   * @memberof PatchedSubmission
   */
  readonly questionDate?: string | null;
  /**
   * The date the response was submitted.
   * @type {string}
   * @memberof PatchedSubmission
   */
  readonly responseDate?: string | null;
  /**
   *
   * @type {Array<number>}
   * @memberof PatchedSubmission
   */
  readonly tests?: Array<number>;
  /**
   * Number of times exposed tests have been run for a submission. It only increments if the maxStudentTestRuns Environment setting is on.
   * @type {number}
   * @memberof PatchedSubmission
   */
  readonly testRunsCompleted?: number;
  /**
   * The number of Late Day Credits used by the Submission.
   * @type {number}
   * @memberof PatchedSubmission
   */
  lateDayCreditsUsed?: number;
  /**
   *
   * @type {Array<SubmissionFile>}
   * @memberof PatchedSubmission
   */
  readonly files?: Array<SubmissionFile>;
}
/**
 * Serializer for SubmissionFile objects.
 * These are files that belong to student submissions.
 * @export
 * @interface PatchedSubmissionFile
 */
export interface PatchedSubmissionFile {
  /**
   * The name of the file.
   * @type {string}
   * @memberof PatchedSubmissionFile
   */
  name?: string;
  /**
   * The data in a file. should be utf-8 encoded text.
   * @type {string}
   * @memberof PatchedSubmissionFile
   */
  data?: string;
  /**
   * The extension for the file (e.g. '.java' or '.py'
   * @type {string}
   * @memberof PatchedSubmissionFile
   */
  extension?: string;
  /**
   * The related submission_id.
   * @type {number}
   * @memberof PatchedSubmissionFile
   */
  submission?: number;
  /**
   *
   * @type {number}
   * @memberof PatchedSubmissionFile
   */
  readonly id?: number;
  /**
   *
   * @type {Array<number>}
   * @memberof PatchedSubmissionFile
   */
  readonly comments?: Array<number>;
  /**
   * Optional file path, delimited by slashes, to indicate a directory structure.
   * @type {string}
   * @memberof PatchedSubmissionFile
   */
  path?: string | null;
  /**
   * Whether this file should hidden to students before their feedback has been published. This is for autogenerated test files that shouldn't be exposed to students on upload.
   * @type {boolean}
   * @memberof PatchedSubmissionFile
   */
  hiddenBeforePublish?: boolean;
  /**
   *
   * @type {string}
   * @memberof PatchedSubmissionFile
   */
  readonly created?: string;
  /**
   *
   * @type {string}
   * @memberof PatchedSubmissionFile
   */
  readonly modified?: string;
}
/**
 *
 * @export
 * @interface PatchedSubmissionTest
 */
export interface PatchedSubmissionTest {
  /**
   *
   * @type {number}
   * @memberof PatchedSubmissionTest
   */
  readonly id?: number;
  /**
   * The related submission_id.
   * @type {number}
   * @memberof PatchedSubmissionTest
   */
  submission?: number;
  /**
   * The related parent test id
   * @type {number}
   * @memberof PatchedSubmissionTest
   */
  testCase?: number;
  /**
   * The logs of a test.
   * @type {string}
   * @memberof PatchedSubmissionTest
   */
  logs?: string;
  /**
   * A boolean field. 'True' if the submission passed this test. 'False' otherwise.
   * @type {boolean}
   * @memberof PatchedSubmissionTest
   */
  passed?: boolean;
  /**
   *
   * @type {number}
   * @memberof PatchedSubmissionTest
   */
  readonly testCategory?: number;
  /**
   *
   * @type {string}
   * @memberof PatchedSubmissionTest
   */
  readonly created?: string;
  /**
   *
   * @type {string}
   * @memberof PatchedSubmissionTest
   */
  readonly modified?: string;
  /**
   * A boolean field. 'True' if the test resulted in an error. False otherwise.
   * @type {boolean}
   * @memberof PatchedSubmissionTest
   */
  isError?: boolean;
  /**
   * Aggregate score earned from all subtests.
   * @type {number}
   * @memberof PatchedSubmissionTest
   */
  score?: number;
  /**
   * Maximum possible score from all subtests.
   * @type {number}
   * @memberof PatchedSubmissionTest
   */
  maxScore?: number;
  /**
   * Structured test results (list of subtests).
   * @type {any}
   * @memberof PatchedSubmissionTest
   */
  results?: any | null;
}
/**
 *
 * @export
 * @interface PatchedTestCase
 */
export interface PatchedTestCase {
  /**
   *
   * @type {number}
   * @memberof PatchedTestCase
   */
  readonly id?: number;
  /**
   * The related testCategory__id.
   * @type {number}
   * @memberof PatchedTestCase
   */
  testCategory?: number;
  /**
   * Integer to specify the order of a Assignment's Tests.
   * @type {number}
   * @memberof PatchedTestCase
   */
  sortKey?: number;
  /**
   * Test description.
   * @type {string}
   * @memberof PatchedTestCase
   */
  description?: string;
  /**
   *
   * @type {TypeEnum}
   * @memberof PatchedTestCase
   */
  type?: TypeEnum;
  /**
   * The points assigned to a failed test.
   * @type {number}
   * @memberof PatchedTestCase
   */
  pointsFail?: number;
  /**
   * The points assigned to a passed test.
   * @type {number}
   * @memberof PatchedTestCase
   */
  pointsPass?: number;
  /**
   * The text of the test
   * @type {string}
   * @memberof PatchedTestCase
   */
  text?: string;
  /**
   *
   * @type {string}
   * @memberof PatchedTestCase
   */
  readonly modified?: string;
  /**
   * If True and type is not 'external', this test will be run when a student submits, and the results shown to the student
   * @type {boolean}
   * @memberof PatchedTestCase
   */
  exposed?: boolean;
  /**
   *
   * @type {Array<number>}
   * @memberof PatchedTestCase
   */
  readonly instances?: Array<number>;
  /**
   * A description of what the test achieves
   * @type {string}
   * @memberof PatchedTestCase
   */
  explanation?: string;
  /**
   *
   * @type {LastSolutionRunEnum}
   * @memberof PatchedTestCase
   */
  lastSolutionRun?: LastSolutionRunEnum;
  /**
   * The custom test script code.
   * @type {string}
   * @memberof PatchedTestCase
   */
  testCode?: string;
  /**
   * The ID of the notebook cell to target for execution.
   * @type {string}
   * @memberof PatchedTestCase
   */
  targetCellId?: string | null;
  /**
   * The related rubric comment. If set, failure applies this rubric item.
   * @type {number}
   * @memberof PatchedTestCase
   */
  rubricItem?: number | null;
  /**
   * The name of the function in the test script.
   * @type {string}
   * @memberof PatchedTestCase
   */
  functionName?: string | null;
  /**
   * Execution timeout in seconds for this test.
   * @type {number}
   * @memberof PatchedTestCase
   */
  timeout?: number;
}

/**
 *
 * @export
 * @interface PatchedTestCategory
 */
export interface PatchedTestCategory {
  /**
   *
   * @type {number}
   * @memberof PatchedTestCategory
   */
  readonly id?: number;
  /**
   * The name of the test.
   * @type {string}
   * @memberof PatchedTestCategory
   */
  name?: string;
  /**
   *
   * @type {Array<number>}
   * @memberof PatchedTestCategory
   */
  readonly testCases?: Array<number>;
  /**
   * The related assignment__id.
   * @type {number}
   * @memberof PatchedTestCategory
   */
  assignment?: number;
  /**
   * Python script containing @test decorated functions.
   * @type {string}
   * @memberof PatchedTestCategory
   */
  testScript?: string;
  /**
   * Total points available for this category.
   * @type {number}
   * @memberof PatchedTestCategory
   */
  maxPoints?: number;
  /**
   * Integer to specify the order of display.
   * @type {number}
   * @memberof PatchedTestCategory
   */
  sortKey?: number;
  /**
   * The name of the file this test targets.
   * @type {string}
   * @memberof PatchedTestCategory
   */
  targetFileName?: string | null;
  /**
   *
   * @type {Array<TestCategoryResource>}
   * @memberof PatchedTestCategory
   */
  readonly resources?: Array<TestCategoryResource>;
}
/**
 *
 * @export
 * @interface PatchedTestCategoryResource
 */
export interface PatchedTestCategoryResource {
  /**
   *
   * @type {number}
   * @memberof PatchedTestCategoryResource
   */
  readonly id?: number;
  /**
   * The related test category.
   * @type {number}
   * @memberof PatchedTestCategoryResource
   */
  category?: number;
  /**
   * The source file.
   * @type {number}
   * @memberof PatchedTestCategoryResource
   */
  file?: number | null;
  /**
   * The source dataset.
   * @type {number}
   * @memberof PatchedTestCategoryResource
   */
  dataset?: number | null;
  /**
   *
   * @type {string}
   * @memberof PatchedTestCategoryResource
   */
  targetPath?: string;
  /**
   *
   * @type {AssignmentFile}
   * @memberof PatchedTestCategoryResource
   */
  readonly fileDetails?: AssignmentFile;
  /**
   *
   * @type {AssignmentDataSet}
   * @memberof PatchedTestCategoryResource
   */
  readonly datasetDetails?: AssignmentDataSet;
}
/**
 *
 * @export
 * @interface PatchedUser
 */
export interface PatchedUser {
  /**
   *
   * @type {number}
   * @memberof PatchedUser
   */
  readonly id?: number;
  /**
   *
   * @type {string}
   * @memberof PatchedUser
   */
  email?: string;
  /**
   *
   * @type {string}
   * @memberof PatchedUser
   */
  password?: string;
  /**
   *
   * @type {number}
   * @memberof PatchedUser
   */
  organization?: number | null;
  /**
   *
   * @type {Array<Course>}
   * @memberof PatchedUser
   */
  readonly studentCourses?: Array<Course>;
  /**
   *
   * @type {Array<Course>}
   * @memberof PatchedUser
   */
  graderCourses?: Array<Course>;
  /**
   *
   * @type {Array<Course>}
   * @memberof PatchedUser
   */
  superGraderCourses?: Array<Course>;
  /**
   *
   * @type {Array<Course>}
   * @memberof PatchedUser
   */
  courseadminCourses?: Array<Course>;
  /**
   *
   * @type {Array<Section>}
   * @memberof PatchedUser
   */
  leaderSections?: Array<Section>;
  /**
   *
   * @type {boolean}
   * @memberof PatchedUser
   */
  codePostAdmin?: boolean;
  /**
   *
   * @type {boolean}
   * @memberof PatchedUser
   */
  canCreateCourses?: boolean;
  /**
   *
   * @type {boolean}
   * @memberof PatchedUser
   */
  canModifyRosters?: boolean;
  /**
   *
   * @type {boolean}
   * @memberof PatchedUser
   */
  isOrgStaff?: boolean;
  /**
   *
   * @type {boolean}
   * @memberof PatchedUser
   */
  showProductTips?: boolean;
  /**
   *
   * @type {string}
   * @memberof PatchedUser
   */
  apiToken?: string | null;
  /**
   *
   * @type {Array<number>}
   * @memberof PatchedUser
   */
  studentSections?: Array<number>;
  /**
   *
   * @type {boolean}
   * @memberof PatchedUser
   */
  readonly hasCredentials?: boolean;
  /**
   *
   * @type {string}
   * @memberof PatchedUser
   */
  readonly token?: string | null;
}
/**
 *
 * @export
 * @interface PatchedWebhook
 */
export interface PatchedWebhook {
  /**
   *
   * @type {number}
   * @memberof PatchedWebhook
   */
  readonly id?: number;
  /**
   *
   * @type {number}
   * @memberof PatchedWebhook
   */
  course?: number;
  /**
   *
   * @type {string}
   * @memberof PatchedWebhook
   */
  event?: string;
  /**
   *
   * @type {string}
   * @memberof PatchedWebhook
   */
  target?: string;
  /**
   *
   * @type {boolean}
   * @memberof PatchedWebhook
   */
  isActive?: boolean;
  /**
   *
   * @type {string}
   * @memberof PatchedWebhook
   */
  readonly lastTriggeredAt?: string | null;
  /**
   *
   * @type {string}
   * @memberof PatchedWebhook
   */
  readonly lastTriggeredStatus?: string | null;
}
/**
 *
 * @export
 * @interface RegisterAndSetPasswordRequest
 */
export interface RegisterAndSetPasswordRequest {
  /**
   *
   * @type {string}
   * @memberof RegisterAndSetPasswordRequest
   */
  uid: string;
  /**
   *
   * @type {string}
   * @memberof RegisterAndSetPasswordRequest
   */
  token: string;
  /**
   *
   * @type {string}
   * @memberof RegisterAndSetPasswordRequest
   */
  password1: string;
  /**
   *
   * @type {string}
   * @memberof RegisterAndSetPasswordRequest
   */
  password2: string;
}
/**
 *
 * @export
 * @interface RegisterAndSetPasswordResponse
 */
export interface RegisterAndSetPasswordResponse {
  /**
   *
   * @type {boolean}
   * @memberof RegisterAndSetPasswordResponse
   */
  isValid: boolean;
}
/**
 *
 * @export
 * @interface ResetPasswordRequest
 */
export interface ResetPasswordRequest {
  /**
   *
   * @type {string}
   * @memberof ResetPasswordRequest
   */
  uid: string;
  /**
   *
   * @type {string}
   * @memberof ResetPasswordRequest
   */
  token: string;
  /**
   *
   * @type {string}
   * @memberof ResetPasswordRequest
   */
  password: string;
}
/**
 *
 * @export
 * @interface ResetPasswordResponse
 */
export interface ResetPasswordResponse {
  /**
   *
   * @type {boolean}
   * @memberof ResetPasswordResponse
   */
  isValid: boolean;
  /**
   *
   * @type {boolean}
   * @memberof ResetPasswordResponse
   */
  success: boolean;
}
/**
 *
 * @export
 * @interface RubricCategory
 */
export interface RubricCategory {
  /**
   *
   * @type {number}
   * @memberof RubricCategory
   */
  readonly id: number;
  /**
   * The related assignment_id.
   * @type {number}
   * @memberof RubricCategory
   */
  assignment: number;
  /**
   * The name of the category (e.g. 'General').
   * @type {string}
   * @memberof RubricCategory
   */
  name: string;
  /**
   * An integer cap for the maximum number of points that can be deducted under this category.
   * @type {number}
   * @memberof RubricCategory
   */
  pointLimit?: number | null;
  /**
   *
   * @type {Array<number>}
   * @memberof RubricCategory
   */
  readonly rubricComments: Array<number>;
  /**
   * Optional integer to specify the order of an Assignment's Rubric Categories
   * @type {number}
   * @memberof RubricCategory
   */
  sortKey?: number;
  /**
   * Subtext for the category name.
   * @type {string}
   * @memberof RubricCategory
   */
  helpText?: string;
  /**
   * A boolean field. If True, at most one rubric comment from this rubric category can be applied to a submission.
   * @type {boolean}
   * @memberof RubricCategory
   */
  atMostOnce?: boolean;
}
/**
 *
 * @export
 * @interface RubricComment
 */
export interface RubricComment {
  /**
   *
   * @type {number}
   * @memberof RubricComment
   */
  readonly id: number;
  /**
   * The text on the rubric comment.
   * @type {string}
   * @memberof RubricComment
   */
  text?: string;
  /**
   * The points deducted. A negative number represents a bonus.
   * @type {number}
   * @memberof RubricComment
   */
  pointDelta: number;
  /**
   * The related rubricCategory_id
   * @type {number}
   * @memberof RubricComment
   */
  category: number;
  /**
   * Optional integer to specify the order of a Rubric Category's comments.
   * @type {number}
   * @memberof RubricComment
   */
  sortKey?: number;
  /**
   * The explanation of a rubric comment shown to students.
   * @type {string}
   * @memberof RubricComment
   */
  explanation?: string;
  /**
   * Text shown to the grader in the custom text field of an instance comment.
   * @type {string}
   * @memberof RubricComment
   */
  instructionText?: string;
  /**
   * If True, instruction text will pre-populate instance comments.
   * @type {boolean}
   * @memberof RubricComment
   */
  templateTextOn?: boolean;
  /**
   *
   * @type {string}
   * @memberof RubricComment
   */
  name?: string | null;
}
/**
 *
 * @export
 * @interface Section
 */
export interface Section {
  /**
   * The name of the section.
   * @type {string}
   * @memberof Section
   */
  name: string;
  /**
   *
   * @type {number}
   * @memberof Section
   */
  readonly id: number;
  /**
   * The related course_id.
   * @type {number}
   * @memberof Section
   */
  course: number;
  /**
   *
   * @type {Array<string | null>}
   * @memberof Section
   */
  leaders: Array<string | null>;
  /**
   *
   * @type {Array<string | null>}
   * @memberof Section
   */
  students: Array<string | null>;
}
/**
 *
 * @export
 * @interface SetCredentialsRequest
 */
export interface SetCredentialsRequest {
  /**
   *
   * @type {string}
   * @memberof SetCredentialsRequest
   */
  organization: string;
  /**
   *
   * @type {string}
   * @memberof SetCredentialsRequest
   */
  password1: string;
  /**
   *
   * @type {string}
   * @memberof SetCredentialsRequest
   */
  password2: string;
}
/**
 *
 * @export
 * @interface SetCredentialsResponse
 */
export interface SetCredentialsResponse {
  /**
   *
   * @type {boolean}
   * @memberof SetCredentialsResponse
   */
  isValid: boolean;
}
/**
 * * `info` - info
 * * `warning` - warning
 * * `critical` - critical
 * @export
 * @enum {string}
 */
export enum SeverityEnum {
  Info = 'info',
  Warning = 'warning',
  Critical = 'critical',
}

/**
 * Response serializer for shell metrics endpoint
 * @export
 * @interface ShellMetricsResponse
 */
export interface ShellMetricsResponse {
  /**
   *
   * @type {number}
   * @memberof ShellMetricsResponse
   */
  activeCount: number;
  /**
   *
   * @type {number}
   * @memberof ShellMetricsResponse
   */
  inCount: number;
  /**
   *
   * @type {number}
   * @memberof ShellMetricsResponse
   */
  outCount: number;
  /**
   *
   * @type {number}
   * @memberof ShellMetricsResponse
   */
  workerCount: number;
  /**
   *
   * @type {Array<string>}
   * @memberof ShellMetricsResponse
   */
  workerIds?: Array<string>;
  /**
   *
   * @type {Array<string>}
   * @memberof ShellMetricsResponse
   */
  activeIds?: Array<string>;
  /**
   *
   * @type {string}
   * @memberof ShellMetricsResponse
   */
  redisUrl?: string;
  /**
   *
   * @type {Array<ShellMetricsSession>}
   * @memberof ShellMetricsResponse
   */
  sessions?: Array<ShellMetricsSession>;
}
/**
 * Serializer for a single shell session metrics payload
 * @export
 * @interface ShellMetricsSession
 */
export interface ShellMetricsSession {
  /**
   *
   * @type {string}
   * @memberof ShellMetricsSession
   */
  sessionId?: string;
  /**
   *
   * @type {number}
   * @memberof ShellMetricsSession
   */
  lastActivity?: number | null;
}
/**
 * * `ok` - ok
 * * `warning` - warning
 * * `error` - error
 * @export
 * @enum {string}
 */
export enum StatusDfeEnum {
  Ok = 'ok',
  Warning = 'warning',
  Error = 'error',
}

/**
 *
 * @export
 * @interface StudentSubmission
 */
export interface StudentSubmission {
  /**
   *
   * @type {number}
   * @memberof StudentSubmission
   */
  readonly id: number;
  /**
   * The related assignment_id.
   * @type {number}
   * @memberof StudentSubmission
   */
  readonly assignment: number;
  /**
   *
   * @type {Array<string>}
   * @memberof StudentSubmission
   */
  students: Array<string>;
  /**
   * A boolean field. 'True' if the submission is finalized. 'False' otherwise.
   * @type {boolean}
   * @memberof StudentSubmission
   */
  readonly isFinalized: boolean;
  /**
   *
   * @type {Array<SubmissionFile>}
   * @memberof StudentSubmission
   */
  readonly files: Array<SubmissionFile>;
  /**
   * The grade for the submission. Null if not graded yet.
   * @type {number}
   * @memberof StudentSubmission
   */
  readonly grade: number | null;
  /**
   * A boolean field. If true the submission has an open question.
   * @type {boolean}
   * @memberof StudentSubmission
   */
  readonly questionIsOpen: boolean;
  /**
   * A boolean field. If 'True', the submission's question is a regrade request.
   * @type {boolean}
   * @memberof StudentSubmission
   */
  readonly questionIsRegrade: boolean;
  /**
   * The text of the question.
   * @type {string}
   * @memberof StudentSubmission
   */
  readonly questionText: string;
  /**
   *
   * @type {string}
   * @memberof StudentSubmission
   */
  questionResponder?: string | null;
  /**
   * The text of the question response.
   * @type {string}
   * @memberof StudentSubmission
   */
  readonly questionResponse: string;
  /**
   * The date the request / question was submitted.
   * @type {string}
   * @memberof StudentSubmission
   */
  readonly questionDate: string | null;
  /**
   * The date the response was submitted.
   * @type {string}
   * @memberof StudentSubmission
   */
  readonly responseDate: string | null;
  /**
   * The date this submission was created. None if just created, and files haven't been uploaded yet. Used for Celery tasks.
   * @type {string}
   * @memberof StudentSubmission
   */
  readonly dateUploaded: string | null;
  /**
   *
   * @type {boolean}
   * @memberof StudentSubmission
   */
  readonly hasGrader: boolean;
  /**
   *
   * @type {Array<number>}
   * @memberof StudentSubmission
   */
  readonly tests: Array<number>;
  /**
   * Number of times exposed tests have been run for a submission. It only increments if the maxStudentTestRuns Environment setting is on.
   * @type {number}
   * @memberof StudentSubmission
   */
  readonly testRunsCompleted: number;
  /**
   * The number of Late Day Credits used by the Submission.
   * @type {number}
   * @memberof StudentSubmission
   */
  readonly lateDayCreditsUsed: number;
}
/**
 *
 * @export
 * @interface Submission
 */
export interface Submission {
  /**
   *
   * @type {number}
   * @memberof Submission
   */
  readonly id: number;
  /**
   * The related assignment_id.
   * @type {number}
   * @memberof Submission
   */
  assignment: number;
  /**
   *
   * @type {Array<string | null>}
   * @memberof Submission
   */
  students: Array<string | null>;
  /**
   *
   * @type {string}
   * @memberof Submission
   */
  grader?: string | null;
  /**
   * A boolean field. 'True' if the submission is finalized. 'False' otherwise.
   * @type {boolean}
   * @memberof Submission
   */
  isFinalized?: boolean;
  /**
   *
   * @type {string}
   * @memberof Submission
   */
  readonly dateEdited: string;
  /**
   * The grade for the submission. Null if not graded yet.
   * @type {number}
   * @memberof Submission
   */
  readonly grade: number | null;
  /**
   * Index used to order the queue from which graders draw submissions. Will sort low to high.
   * @type {number}
   * @memberof Submission
   */
  queueOrderKey?: number;
  /**
   * The date this submission was created. None if just created, and files haven't been uploaded yet. Used for Celery tasks.
   * @type {string}
   * @memberof Submission
   */
  dateUploaded?: string | null;
  /**
   * A boolean field. If true the submission has an open question.
   * @type {boolean}
   * @memberof Submission
   */
  questionIsOpen?: boolean;
  /**
   * A boolean field. If 'True', the submission's question is a regrade request.
   * @type {boolean}
   * @memberof Submission
   */
  questionIsRegrade?: boolean;
  /**
   * The text of the question.
   * @type {string}
   * @memberof Submission
   */
  readonly questionText: string;
  /**
   *
   * @type {string}
   * @memberof Submission
   */
  questionResponder?: string | null;
  /**
   * The text of the question response.
   * @type {string}
   * @memberof Submission
   */
  questionResponse?: string;
  /**
   * The date the request / question was submitted.
   * @type {string}
   * @memberof Submission
   */
  readonly questionDate: string | null;
  /**
   * The date the response was submitted.
   * @type {string}
   * @memberof Submission
   */
  readonly responseDate: string | null;
  /**
   *
   * @type {Array<number>}
   * @memberof Submission
   */
  readonly tests: Array<number>;
  /**
   * Number of times exposed tests have been run for a submission. It only increments if the maxStudentTestRuns Environment setting is on.
   * @type {number}
   * @memberof Submission
   */
  readonly testRunsCompleted: number;
  /**
   * The number of Late Day Credits used by the Submission.
   * @type {number}
   * @memberof Submission
   */
  lateDayCreditsUsed?: number;
  /**
   *
   * @type {Array<SubmissionFile>}
   * @memberof Submission
   */
  readonly files: Array<SubmissionFile>;
}
/**
 *
 * @export
 * @interface SubmissionCheckPermissionResponse
 */
export interface SubmissionCheckPermissionResponse {
  /**
   *
   * @type {boolean}
   * @memberof SubmissionCheckPermissionResponse
   */
  read: boolean;
  /**
   *
   * @type {boolean}
   * @memberof SubmissionCheckPermissionResponse
   */
  write: boolean;
  /**
   *
   * @type {boolean}
   * @memberof SubmissionCheckPermissionResponse
   */
  filesOnly: boolean;
}
/**
 * Serializer for SubmissionFile objects.
 * These are files that belong to student submissions.
 * @export
 * @interface SubmissionFile
 */
export interface SubmissionFile {
  /**
   * The name of the file.
   * @type {string}
   * @memberof SubmissionFile
   */
  name: string;
  /**
   * The data in a file. should be utf-8 encoded text.
   * @type {string}
   * @memberof SubmissionFile
   */
  data?: string;
  /**
   * The extension for the file (e.g. '.java' or '.py'
   * @type {string}
   * @memberof SubmissionFile
   */
  extension: string;
  /**
   * The related submission_id.
   * @type {number}
   * @memberof SubmissionFile
   */
  submission: number;
  /**
   *
   * @type {number}
   * @memberof SubmissionFile
   */
  readonly id: number;
  /**
   *
   * @type {Array<number>}
   * @memberof SubmissionFile
   */
  readonly comments: Array<number>;
  /**
   * Optional file path, delimited by slashes, to indicate a directory structure.
   * @type {string}
   * @memberof SubmissionFile
   */
  path?: string | null;
  /**
   * Whether this file should hidden to students before their feedback has been published. This is for autogenerated test files that shouldn't be exposed to students on upload.
   * @type {boolean}
   * @memberof SubmissionFile
   */
  hiddenBeforePublish?: boolean;
  /**
   *
   * @type {string}
   * @memberof SubmissionFile
   */
  readonly created: string;
  /**
   *
   * @type {string}
   * @memberof SubmissionFile
   */
  readonly modified: string;
}
/**
 * Simplified serializer for students uploading submission files.
 * @export
 * @interface SubmissionFileStudentUpload
 */
export interface SubmissionFileStudentUpload {
  /**
   * The name of the file.
   * @type {string}
   * @memberof SubmissionFileStudentUpload
   */
  name: string;
  /**
   * The data in a file. should be utf-8 encoded text.
   * @type {string}
   * @memberof SubmissionFileStudentUpload
   */
  data?: string;
  /**
   * The extension for the file (e.g. '.java' or '.py'
   * @type {string}
   * @memberof SubmissionFileStudentUpload
   */
  extension: string;
  /**
   * The related submission_id.
   * @type {number}
   * @memberof SubmissionFileStudentUpload
   */
  submission: number;
  /**
   *
   * @type {number}
   * @memberof SubmissionFileStudentUpload
   */
  readonly id: number;
  /**
   * Optional file path, delimited by slashes, to indicate a directory structure.
   * @type {string}
   * @memberof SubmissionFileStudentUpload
   */
  path?: string | null;
}
/**
 *
 * @export
 * @interface SubmissionHistory
 */
export interface SubmissionHistory {
  /**
   *
   * @type {number}
   * @memberof SubmissionHistory
   */
  readonly id: number;
  /**
   *
   * @type {string}
   * @memberof SubmissionHistory
   */
  student: string;
  /**
   * The related submission_id.
   * @type {number}
   * @memberof SubmissionHistory
   */
  readonly submission: number;
  /**
   * A boolean field indicating whether the student has seen the submission.
   * @type {boolean}
   * @memberof SubmissionHistory
   */
  hasViewed?: boolean;
  /**
   *
   * @type {string}
   * @memberof SubmissionHistory
   */
  readonly dateViewed: string | null;
}
/**
 *
 * @export
 * @interface SubmissionPartnerLinkResponse
 */
export interface SubmissionPartnerLinkResponse {
  /**
   *
   * @type {number}
   * @memberof SubmissionPartnerLinkResponse
   */
  id: number;
  /**
   *
   * @type {string}
   * @memberof SubmissionPartnerLinkResponse
   */
  token: string;
}
/**
 *
 * @export
 * @interface SubmissionTest
 */
export interface SubmissionTest {
  /**
   *
   * @type {number}
   * @memberof SubmissionTest
   */
  readonly id: number;
  /**
   * The related submission_id.
   * @type {number}
   * @memberof SubmissionTest
   */
  submission: number;
  /**
   * The related parent test id
   * @type {number}
   * @memberof SubmissionTest
   */
  testCase: number;
  /**
   * The logs of a test.
   * @type {string}
   * @memberof SubmissionTest
   */
  logs: string;
  /**
   * A boolean field. 'True' if the submission passed this test. 'False' otherwise.
   * @type {boolean}
   * @memberof SubmissionTest
   */
  passed: boolean;
  /**
   *
   * @type {number}
   * @memberof SubmissionTest
   */
  readonly testCategory: number;
  /**
   *
   * @type {string}
   * @memberof SubmissionTest
   */
  readonly created: string;
  /**
   *
   * @type {string}
   * @memberof SubmissionTest
   */
  readonly modified: string;
  /**
   * A boolean field. 'True' if the test resulted in an error. False otherwise.
   * @type {boolean}
   * @memberof SubmissionTest
   */
  isError?: boolean;
  /**
   * Aggregate score earned from all subtests.
   * @type {number}
   * @memberof SubmissionTest
   */
  score?: number;
  /**
   * Maximum possible score from all subtests.
   * @type {number}
   * @memberof SubmissionTest
   */
  maxScore?: number;
  /**
   * Structured test results (list of subtests).
   * @type {any}
   * @memberof SubmissionTest
   */
  results?: any | null;
}
/**
 *
 * @export
 * @interface SubmissionTestResultsResponse
 */
export interface SubmissionTestResultsResponse {
  /**
   *
   * @type {Array<SubmissionTest>}
   * @memberof SubmissionTestResultsResponse
   */
  submissionTests: Array<SubmissionTest>;
  /**
   *
   * @type {string}
   * @memberof SubmissionTestResultsResponse
   */
  logs: string;
}
/**
 *
 * @export
 * @interface SubmissionWithTests
 */
export interface SubmissionWithTests {
  /**
   *
   * @type {number}
   * @memberof SubmissionWithTests
   */
  readonly id: number;
  /**
   *
   * @type {Array<SubmissionTest>}
   * @memberof SubmissionWithTests
   */
  tests: Array<SubmissionTest>;
}
/**
 *
 * @export
 * @interface SubscribeToEmailListRequest
 */
export interface SubscribeToEmailListRequest {
  /**
   *
   * @type {string}
   * @memberof SubscribeToEmailListRequest
   */
  email: string;
}
/**
 *
 * @export
 * @interface SubscribeToEmailListResponse
 */
export interface SubscribeToEmailListResponse {
  /**
   *
   * @type {boolean}
   * @memberof SubscribeToEmailListResponse
   */
  success: boolean;
}
/**
 *
 * @export
 * @interface SystemActivityResponse
 */
export interface SystemActivityResponse {
  /**
   *
   * @type {Array<{ [key: string]: any | undefined; }>}
   * @memberof SystemActivityResponse
   */
  results: Array<{ [key: string]: any | undefined }>;
  /**
   *
   * @type {number}
   * @memberof SystemActivityResponse
   */
  total: number;
  /**
   *
   * @type {number}
   * @memberof SystemActivityResponse
   */
  page: number;
  /**
   *
   * @type {number}
   * @memberof SystemActivityResponse
   */
  pages: number;
}
/**
 *
 * @export
 * @interface SystemHealthResponse
 */
export interface SystemHealthResponse {
  /**
   *
   * @type {string}
   * @memberof SystemHealthResponse
   */
  checkedAt: string;
  /**
   *
   * @type {OverallEnum}
   * @memberof SystemHealthResponse
   */
  overall: OverallEnum;
  /**
   *
   * @type {HealthCheck}
   * @memberof SystemHealthResponse
   */
  database: HealthCheck;
  /**
   *
   * @type {CeleryCheck}
   * @memberof SystemHealthResponse
   */
  celery: CeleryCheck;
  /**
   *
   * @type {HealthCheck}
   * @memberof SystemHealthResponse
   */
  cache: HealthCheck;
  /**
   *
   * @type {MigrationCheck}
   * @memberof SystemHealthResponse
   */
  migrations: MigrationCheck;
  /**
   *
   * @type {DiskCheck}
   * @memberof SystemHealthResponse
   */
  disk: DiskCheck;
  /**
   *
   * @type {number}
   * @memberof SystemHealthResponse
   */
  recentEvents1h: number;
}

/**
 * Response for task status check
 * @export
 * @interface TaskStatusResponse
 */
export interface TaskStatusResponse {
  /**
   * Current task status
   *
   * * `PENDING` - PENDING
   * * `STARTED` - STARTED
   * * `SUCCESS` - SUCCESS
   * * `FAILURE` - FAILURE
   * * `RETRY` - RETRY
   * * `REVOKED` - REVOKED
   * @type {TaskStatusResponseStatusEnum}
   * @memberof TaskStatusResponse
   */
  status: TaskStatusResponseStatusEnum;
  /**
   * Task result (if completed)
   * @type {{ [key: string]: any | undefined; }}
   * @memberof TaskStatusResponse
   */
  result?: { [key: string]: any | undefined } | null;
}

/**
 * * `PENDING` - PENDING
 * * `STARTED` - STARTED
 * * `SUCCESS` - SUCCESS
 * * `FAILURE` - FAILURE
 * * `RETRY` - RETRY
 * * `REVOKED` - REVOKED
 * @export
 * @enum {string}
 */
export enum TaskStatusResponseStatusEnum {
  Pending = 'PENDING',
  Started = 'STARTED',
  Success = 'SUCCESS',
  Failure = 'FAILURE',
  Retry = 'RETRY',
  Revoked = 'REVOKED',
}

/**
 *
 * @export
 * @interface TestCase
 */
export interface TestCase {
  /**
   *
   * @type {number}
   * @memberof TestCase
   */
  readonly id: number;
  /**
   * The related testCategory__id.
   * @type {number}
   * @memberof TestCase
   */
  testCategory: number;
  /**
   * Integer to specify the order of a Assignment's Tests.
   * @type {number}
   * @memberof TestCase
   */
  sortKey?: number;
  /**
   * Test description.
   * @type {string}
   * @memberof TestCase
   */
  description: string;
  /**
   *
   * @type {TypeEnum}
   * @memberof TestCase
   */
  type: TypeEnum;
  /**
   * The points assigned to a failed test.
   * @type {number}
   * @memberof TestCase
   */
  pointsFail?: number;
  /**
   * The points assigned to a passed test.
   * @type {number}
   * @memberof TestCase
   */
  pointsPass?: number;
  /**
   * The text of the test
   * @type {string}
   * @memberof TestCase
   */
  text?: string;
  /**
   *
   * @type {string}
   * @memberof TestCase
   */
  readonly modified: string;
  /**
   * If True and type is not 'external', this test will be run when a student submits, and the results shown to the student
   * @type {boolean}
   * @memberof TestCase
   */
  exposed?: boolean;
  /**
   *
   * @type {Array<number>}
   * @memberof TestCase
   */
  readonly instances: Array<number>;
  /**
   * A description of what the test achieves
   * @type {string}
   * @memberof TestCase
   */
  explanation?: string;
  /**
   *
   * @type {LastSolutionRunEnum}
   * @memberof TestCase
   */
  lastSolutionRun?: LastSolutionRunEnum;
  /**
   * The custom test script code.
   * @type {string}
   * @memberof TestCase
   */
  testCode?: string;
  /**
   * The ID of the notebook cell to target for execution.
   * @type {string}
   * @memberof TestCase
   */
  targetCellId?: string | null;
  /**
   * The related rubric comment. If set, failure applies this rubric item.
   * @type {number}
   * @memberof TestCase
   */
  rubricItem?: number | null;
  /**
   * The name of the function in the test script.
   * @type {string}
   * @memberof TestCase
   */
  functionName?: string | null;
  /**
   * Execution timeout in seconds for this test.
   * @type {number}
   * @memberof TestCase
   */
  timeout?: number;
}

/**
 *
 * @export
 * @interface TestCaseRunRequest
 */
export interface TestCaseRunRequest {
  /**
   *
   * @type {number}
   * @memberof TestCaseRunRequest
   */
  submission?: number | null;
  /**
   *
   * @type {any}
   * @memberof TestCaseRunRequest
   */
  files?: any | null;
}
/**
 *
 * @export
 * @interface TestCaseRunResponse
 */
export interface TestCaseRunResponse {
  /**
   *
   * @type {string}
   * @memberof TestCaseRunResponse
   */
  task: string;
}
/**
 *
 * @export
 * @interface TestCaseStudent
 */
export interface TestCaseStudent {
  /**
   *
   * @type {number}
   * @memberof TestCaseStudent
   */
  readonly id: number;
  /**
   * The related testCategory__id.
   * @type {number}
   * @memberof TestCaseStudent
   */
  testCategory: number;
  /**
   * Integer to specify the order of a Assignment's Tests.
   * @type {number}
   * @memberof TestCaseStudent
   */
  sortKey?: number;
  /**
   * Test description.
   * @type {string}
   * @memberof TestCaseStudent
   */
  description: string;
  /**
   * The points assigned to a failed test.
   * @type {number}
   * @memberof TestCaseStudent
   */
  pointsFail?: number;
  /**
   * The points assigned to a passed test.
   * @type {number}
   * @memberof TestCaseStudent
   */
  pointsPass?: number;
  /**
   * A description of what the test achieves
   * @type {string}
   * @memberof TestCaseStudent
   */
  explanation?: string;
  /**
   * If True and type is not 'external', this test will be run when a student submits, and the results shown to the student
   * @type {boolean}
   * @memberof TestCaseStudent
   */
  exposed?: boolean;
  /**
   * The related rubric comment. If set, failure applies this rubric item.
   * @type {number}
   * @memberof TestCaseStudent
   */
  rubricItem?: number | null;
}
/**
 *
 * @export
 * @interface TestCategory
 */
export interface TestCategory {
  /**
   *
   * @type {number}
   * @memberof TestCategory
   */
  readonly id: number;
  /**
   * The name of the test.
   * @type {string}
   * @memberof TestCategory
   */
  name: string;
  /**
   *
   * @type {Array<number>}
   * @memberof TestCategory
   */
  readonly testCases: Array<number>;
  /**
   * The related assignment__id.
   * @type {number}
   * @memberof TestCategory
   */
  assignment: number;
  /**
   * Python script containing @test decorated functions.
   * @type {string}
   * @memberof TestCategory
   */
  testScript?: string;
  /**
   * Total points available for this category.
   * @type {number}
   * @memberof TestCategory
   */
  maxPoints?: number;
  /**
   * Integer to specify the order of display.
   * @type {number}
   * @memberof TestCategory
   */
  sortKey?: number;
  /**
   * The name of the file this test targets.
   * @type {string}
   * @memberof TestCategory
   */
  targetFileName?: string | null;
  /**
   *
   * @type {Array<TestCategoryResource>}
   * @memberof TestCategory
   */
  readonly resources: Array<TestCategoryResource>;
}
/**
 *
 * @export
 * @interface TestCategoryResource
 */
export interface TestCategoryResource {
  /**
   *
   * @type {number}
   * @memberof TestCategoryResource
   */
  readonly id: number;
  /**
   * The related test category.
   * @type {number}
   * @memberof TestCategoryResource
   */
  category: number;
  /**
   * The source file.
   * @type {number}
   * @memberof TestCategoryResource
   */
  file?: number | null;
  /**
   * The source dataset.
   * @type {number}
   * @memberof TestCategoryResource
   */
  dataset?: number | null;
  /**
   *
   * @type {string}
   * @memberof TestCategoryResource
   */
  targetPath: string;
  /**
   *
   * @type {AssignmentFile}
   * @memberof TestCategoryResource
   */
  readonly fileDetails: AssignmentFile;
  /**
   *
   * @type {AssignmentDataSet}
   * @memberof TestCategoryResource
   */
  readonly datasetDetails: AssignmentDataSet;
}
/**
 * Request serializer for running tests
 * @export
 * @interface TestExecutionRequest
 */
export interface TestExecutionRequest {
  /**
   * ID of the test to run. If null, runs all tests.
   * @type {number}
   * @memberof TestExecutionRequest
   */
  testId?: number | null;
  /**
   * ID of the submission to test
   * @type {number}
   * @memberof TestExecutionRequest
   */
  submissionId: number;
  /**
   * Map of file ID to temporary content for ephemeral execution
   * @type {{ [key: string]: string | undefined; }}
   * @memberof TestExecutionRequest
   */
  fileOverrides?: { [key: string]: string | undefined };
}
/**
 * Response for test execution
 * @export
 * @interface TestExecutionResult
 */
export interface TestExecutionResult {
  /**
   * Whether the test execution completed
   * @type {boolean}
   * @memberof TestExecutionResult
   */
  success: boolean;
  /**
   * Test result details (object or list)
   * @type {any}
   * @memberof TestExecutionResult
   */
  result?: any | null;
  /**
   * Error message if test failed
   * @type {string}
   * @memberof TestExecutionResult
   */
  error?: string;
}
/**
 *
 * @export
 * @interface TokenRefreshSliding
 */
export interface TokenRefreshSliding {
  /**
   *
   * @type {string}
   * @memberof TokenRefreshSliding
   */
  token: string;
}
/**
 *
 * @export
 * @interface TokenVerify
 */
export interface TokenVerify {
  /**
   *
   * @type {string}
   * @memberof TokenVerify
   */
  token: string;
}
/**
 * * `io` - io
 * * `io_cli` - io_cli
 * * `unit` - unit
 * * `shell` - shell
 * * `file` - file
 * * `external` - external
 * * `script` - script
 * @export
 * @enum {string}
 */
export enum TypeEnum {
  Io = 'io',
  IoCli = 'io_cli',
  Unit = 'unit',
  Shell = 'shell',
  File = 'file',
  External = 'external',
  Script = 'script',
}

/**
 *
 * @export
 * @interface User
 */
export interface User {
  /**
   *
   * @type {number}
   * @memberof User
   */
  readonly id: number;
  /**
   *
   * @type {string}
   * @memberof User
   */
  email?: string;
  /**
   *
   * @type {string}
   * @memberof User
   */
  password: string;
  /**
   *
   * @type {number}
   * @memberof User
   */
  organization?: number | null;
  /**
   *
   * @type {Array<Course>}
   * @memberof User
   */
  readonly studentCourses: Array<Course>;
  /**
   *
   * @type {Array<Course>}
   * @memberof User
   */
  graderCourses: Array<Course>;
  /**
   *
   * @type {Array<Course>}
   * @memberof User
   */
  superGraderCourses: Array<Course>;
  /**
   *
   * @type {Array<Course>}
   * @memberof User
   */
  courseadminCourses: Array<Course>;
  /**
   *
   * @type {Array<Section>}
   * @memberof User
   */
  leaderSections: Array<Section>;
  /**
   *
   * @type {boolean}
   * @memberof User
   */
  codePostAdmin?: boolean;
  /**
   *
   * @type {boolean}
   * @memberof User
   */
  canCreateCourses: boolean;
  /**
   *
   * @type {boolean}
   * @memberof User
   */
  canModifyRosters: boolean;
  /**
   *
   * @type {boolean}
   * @memberof User
   */
  isOrgStaff?: boolean;
  /**
   *
   * @type {boolean}
   * @memberof User
   */
  showProductTips: boolean;
  /**
   *
   * @type {string}
   * @memberof User
   */
  apiToken?: string | null;
  /**
   *
   * @type {Array<number>}
   * @memberof User
   */
  studentSections: Array<number>;
  /**
   *
   * @type {boolean}
   * @memberof User
   */
  readonly hasCredentials: boolean;
  /**
   *
   * @type {string}
   * @memberof User
   */
  readonly token: string | null;
}
/**
 *
 * @export
 * @interface ValidateNewAdminUserRequest
 */
export interface ValidateNewAdminUserRequest {
  /**
   *
   * @type {string}
   * @memberof ValidateNewAdminUserRequest
   */
  organization: string;
  /**
   *
   * @type {string}
   * @memberof ValidateNewAdminUserRequest
   */
  email: string;
}
/**
 *
 * @export
 * @interface ValidateNewAdminUserResponse
 */
export interface ValidateNewAdminUserResponse {
  /**
   *
   * @type {boolean}
   * @memberof ValidateNewAdminUserResponse
   */
  success: boolean;
  /**
   *
   * @type {string}
   * @memberof ValidateNewAdminUserResponse
   */
  actionId: string;
}
/**
 *
 * @export
 * @interface ValidateOTTRequest
 */
export interface ValidateOTTRequest {
  /**
   *
   * @type {string}
   * @memberof ValidateOTTRequest
   */
  token: string;
}
/**
 *
 * @export
 * @interface VerifyRegistrationTokenRequest
 */
export interface VerifyRegistrationTokenRequest {
  /**
   *
   * @type {string}
   * @memberof VerifyRegistrationTokenRequest
   */
  uid: string;
  /**
   *
   * @type {string}
   * @memberof VerifyRegistrationTokenRequest
   */
  token: string;
}
/**
 *
 * @export
 * @interface VerifyRegistrationTokenResponse
 */
export interface VerifyRegistrationTokenResponse {
  /**
   *
   * @type {boolean}
   * @memberof VerifyRegistrationTokenResponse
   */
  isValid: boolean;
  /**
   *
   * @type {string}
   * @memberof VerifyRegistrationTokenResponse
   */
  email?: string;
}
/**
 *
 * @export
 * @interface VerifyResetTokenRequest
 */
export interface VerifyResetTokenRequest {
  /**
   *
   * @type {string}
   * @memberof VerifyResetTokenRequest
   */
  uid: string;
  /**
   *
   * @type {string}
   * @memberof VerifyResetTokenRequest
   */
  token: string;
}
/**
 *
 * @export
 * @interface VerifyResetTokenResponse
 */
export interface VerifyResetTokenResponse {
  /**
   *
   * @type {boolean}
   * @memberof VerifyResetTokenResponse
   */
  isValid: boolean;
  /**
   *
   * @type {string}
   * @memberof VerifyResetTokenResponse
   */
  email?: string;
}
/**
 *
 * @export
 * @interface Webhook
 */
export interface Webhook {
  /**
   *
   * @type {number}
   * @memberof Webhook
   */
  readonly id: number;
  /**
   *
   * @type {number}
   * @memberof Webhook
   */
  course: number;
  /**
   *
   * @type {string}
   * @memberof Webhook
   */
  event: string;
  /**
   *
   * @type {string}
   * @memberof Webhook
   */
  target: string;
  /**
   *
   * @type {boolean}
   * @memberof Webhook
   */
  isActive?: boolean;
  /**
   *
   * @type {string}
   * @memberof Webhook
   */
  readonly lastTriggeredAt: string | null;
  /**
   *
   * @type {string}
   * @memberof Webhook
   */
  readonly lastTriggeredStatus: string | null;
}
