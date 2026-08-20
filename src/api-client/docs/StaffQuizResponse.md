# StaffQuizResponse

A response as staff (grading/review) sees it: adds the grader-only answer key, the sandbox code-execution result, and the grading provenance (gradedBy/gradedAt). NEVER used for student-facing payloads — none of these fields are in the student\'s Meta.fields, so StudentQuizResponseSerializer is structurally incapable of exposing them.

## Properties

| Name                 | Type                                  |
| -------------------- | ------------------------------------- |
| `id`                 | number                                |
| `question`           | [StudentQuestion](StudentQuestion.md) |
| `sortKey`            | number                                |
| `points`             | number                                |
| `answerText`         | string                                |
| `selectedChoices`    | Array&lt;number&gt;                   |
| `pointsEarned`       | number                                |
| `isCorrect`          | boolean                               |
| `needsManualGrading` | boolean                               |
| `graderFeedback`     | string                                |
| `referenceSolution`  | string                                |
| `codeExecution`      | any                                   |
| `gradedBy`           | string                                |
| `gradedAt`           | string                                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
