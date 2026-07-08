# GeneratedQuestionSet

A student\'s generated question set with its questions — the review payload. Staff-only (never exposed to students).

## Properties

| Name                 | Type                                                                |
| -------------------- | ------------------------------------------------------------------- |
| `id`                 | number                                                              |
| `quiz`               | number                                                              |
| `student`            | number                                                              |
| `studentEmail`       | string                                                              |
| `submission`         | number                                                              |
| `status`             | [GeneratedQuestionSetStatusEnum](GeneratedQuestionSetStatusEnum.md) |
| `approvedBy`         | number                                                              |
| `approvedByEmail`    | string                                                              |
| `approvedAt`         | string                                                              |
| `errorMessage`       | string                                                              |
| `generationMetadata` | string                                                              |
| `questions`          | [Array&lt;GeneratedQuizQuestion&gt;](GeneratedQuizQuestion.md)      |
| `created`            | string                                                              |
| `modified`           | string                                                              |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
