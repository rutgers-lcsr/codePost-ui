# PatchedQuiz

## Properties

| Name                 | Type                                                      |
| -------------------- | --------------------------------------------------------- |
| `id`                 | number                                                    |
| `course`             | number                                                    |
| `assignment`         | number                                                    |
| `title`              | string                                                    |
| `description`        | string                                                    |
| `assignmentTrigger`  | [QuizAssignmentTriggerEnum](QuizAssignmentTriggerEnum.md) |
| `availableFrom`      | string                                                    |
| `availableUntil`     | string                                                    |
| `timeLimitMinutes`   | number                                                    |
| `attemptsAllowed`    | number                                                    |
| `shuffleQuestions`   | boolean                                                   |
| `showCorrectAnswers` | [QuizShowAnswersEnum](QuizShowAnswersEnum.md)             |
| `passingScore`       | number                                                    |
| `passingScoreUnit`   | [QuizPassingScoreUnitEnum](QuizPassingScoreUnitEnum.md)   |
| `isPublished`        | boolean                                                   |
| `quizQuestions`      | [Array&lt;QuizQuestion&gt;](QuizQuestion.md)              |
| `questionGroups`     | [Array&lt;QuizQuestionGroup&gt;](QuizQuestionGroup.md)    |
| `source`             | [QuizSourceEnum](QuizSourceEnum.md)                       |
| `createdBy`          | number                                                    |
| `metadata`           | string                                                    |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
