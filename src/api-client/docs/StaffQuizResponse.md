# StaffQuizResponse

A response as staff (grading/review) sees it: adds the grader-only answer key and the sandbox code-execution result. NEVER used for student-facing payloads — neither field is in the student\'s Meta.fields, so StudentQuizResponseSerializer is structurally incapable of exposing them.

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

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
