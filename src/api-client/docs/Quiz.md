# Quiz

## Properties

| Name                        | Type                                                                  |
| --------------------------- | --------------------------------------------------------------------- |
| `id`                        | number                                                                |
| `course`                    | number                                                                |
| `assignment`                | number                                                                |
| `title`                     | string                                                                |
| `description`               | string                                                                |
| `assignmentTrigger`         | [QuizAssignmentTriggerEnum](QuizAssignmentTriggerEnum.md)             |
| `availableFrom`             | string                                                                |
| `availableUntil`            | string                                                                |
| `closeEvent`                | [QuizCloseEventEnum](QuizCloseEventEnum.md)                           |
| `closeOffsetMinutes`        | number                                                                |
| `endAttemptsAtClose`        | boolean                                                               |
| `timeLimitMinutes`          | number                                                                |
| `attemptsAllowed`           | number                                                                |
| `shuffleQuestions`          | boolean                                                               |
| `oneQuestionAtATime`        | boolean                                                               |
| `allowBacktracking`         | boolean                                                               |
| `showCorrectAnswers`        | [QuizShowAnswersEnum](QuizShowAnswersEnum.md)                         |
| `showResponses`             | boolean                                                               |
| `passingScore`              | number                                                                |
| `passingScoreUnit`          | [QuizPassingScoreUnitEnum](QuizPassingScoreUnitEnum.md)               |
| `scoringPolicy`             | [QuizScoringPolicyEnum](QuizScoringPolicyEnum.md)                     |
| `multiAttemptScoreMethod`   | [QuizMultiAttemptScoreMethodEnum](QuizMultiAttemptScoreMethodEnum.md) |
| `isPublished`               | boolean                                                               |
| `gradersCanReviewGenerated` | boolean                                                               |
| `autoPublishGenerated`      | boolean                                                               |
| `generatedSections`         | [Array&lt;QuizGeneratedSection&gt;](QuizGeneratedSection.md)          |
| `quizQuestions`             | [Array&lt;QuizQuestion&gt;](QuizQuestion.md)                          |
| `questionGroups`            | [Array&lt;QuizQuestionGroup&gt;](QuizQuestionGroup.md)                |
| `source`                    | [QuizSourceEnum](QuizSourceEnum.md)                                   |
| `createdBy`                 | number                                                                |
| `metadata`                  | string                                                                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
