# StudentQuiz

Summary of a quiz for a student: settings, availability, and the caller\'s attempt usage.

## Properties

| Name                  | Type                                                    |
| --------------------- | ------------------------------------------------------- |
| `id`                  | number                                                  |
| `course`              | number                                                  |
| `assignment`          | number                                                  |
| `title`               | string                                                  |
| `description`         | string                                                  |
| `timeLimitMinutes`    | number                                                  |
| `attemptsAllowed`     | number                                                  |
| `scoringPolicy`       | [QuizScoringPolicyEnum](QuizScoringPolicyEnum.md)       |
| `passingScore`        | number                                                  |
| `passingScoreUnit`    | [QuizPassingScoreUnitEnum](QuizPassingScoreUnitEnum.md) |
| `showCorrectAnswers`  | [QuizShowAnswersEnum](QuizShowAnswersEnum.md)           |
| `questionCount`       | number                                                  |
| `availability`        | [QuizAvailability](QuizAvailability.md)                 |
| `attemptsUsed`        | number                                                  |
| `hasOpenAttempt`      | boolean                                                 |
| `hasSubmittedAttempt` | boolean                                                 |
| `closeAt`             | string                                                  |
| `myScore`             | number                                                  |
| `myMaxScore`          | number                                                  |
| `myPassed`            | boolean                                                 |
| `myScorePending`      | boolean                                                 |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
