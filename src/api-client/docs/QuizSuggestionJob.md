# QuizSuggestionJob

Read-only view of an AI quiz-suggestion generation run (for status polling).

## Properties

| Name             | Type                                                          |
| ---------------- | ------------------------------------------------------------- |
| `id`             | number                                                        |
| `course`         | number                                                        |
| `assignment`     | number                                                        |
| `sourceQuestion` | number                                                        |
| `status`         | [QuizSuggestionJobStatusEnum](QuizSuggestionJobStatusEnum.md) |
| `taskId`         | string                                                        |
| `createdCount`   | number                                                        |
| `errorMessage`   | string                                                        |
| `created`        | string                                                        |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
