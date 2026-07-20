# StaffQuizAttempt

A quiz attempt as staff (grading) sees it: the student\'s identity plus every response with answers, grading state, and the grader-only answer key. Callers set reveal/revealScore context to True.

## Properties

| Name                 | Type                                                   |
| -------------------- | ------------------------------------------------------ |
| `id`                 | number                                                 |
| `quiz`               | number                                                 |
| `attemptNumber`      | number                                                 |
| `status`             | [QuizAttemptStatusEnum](QuizAttemptStatusEnum.md)      |
| `startedAt`          | string                                                 |
| `deadline`           | string                                                 |
| `submittedAt`        | string                                                 |
| `score`              | number                                                 |
| `maxScore`           | number                                                 |
| `needsManualGrading` | boolean                                                |
| `passed`             | boolean                                                |
| `isOfficialOverride` | boolean                                                |
| `oneQuestionAtATime` | boolean                                                |
| `allowBacktracking`  | boolean                                                |
| `showResponses`      | boolean                                                |
| `serverNow`          | string                                                 |
| `responses`          | [Array&lt;StaffQuizResponse&gt;](StaffQuizResponse.md) |
| `student`            | string                                                 |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
