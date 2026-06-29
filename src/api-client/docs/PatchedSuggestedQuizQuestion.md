# PatchedSuggestedQuizQuestion

An AI quiz-question suggestion. Staff-only. A pending suggestion\'s content may be edited (PATCH) before it is accepted into a real Question. `status` and the link fields are system-managed via the accept/reject actions.

## Properties

| Name                | Type                                                        |
| ------------------- | ----------------------------------------------------------- |
| `id`                | number                                                      |
| `assignment`        | number                                                      |
| `sourceQuestion`    | number                                                      |
| `questionType`      | [QuestionTypeEnum](QuestionTypeEnum.md)                     |
| `text`              | string                                                      |
| `choicesData`       | any                                                         |
| `points`            | number                                                      |
| `language`          | string                                                      |
| `starterCode`       | string                                                      |
| `referenceSolution` | string                                                      |
| `status`            | [SuggestedCommentStatusEnum](SuggestedCommentStatusEnum.md) |
| `acceptedBy`        | number                                                      |
| `acceptedQuestion`  | number                                                      |
| `generationBatch`   | string                                                      |
| `created`           | string                                                      |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
