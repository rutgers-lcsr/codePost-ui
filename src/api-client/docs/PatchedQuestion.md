# PatchedQuestion

A quiz question that lives in exactly one bank, with nested writable choices. Choices are synced atomically on create/update — a question and its options are authored as a unit (a multiple-choice question is meaningless without them).

## Properties

| Name                | Type                                             |
| ------------------- | ------------------------------------------------ |
| `id`                | number                                           |
| `course`            | number                                           |
| `bank`              | number                                           |
| `questionType`      | [QuestionTypeEnum](QuestionTypeEnum.md)          |
| `text`              | string                                           |
| `description`       | string                                           |
| `points`            | number                                           |
| `generalFeedback`   | string                                           |
| `language`          | string                                           |
| `starterCode`       | string                                           |
| `referenceSolution` | string                                           |
| `source`            | [QuizSourceEnum](QuizSourceEnum.md)              |
| `createdBy`         | number                                           |
| `choices`           | [Array&lt;QuestionChoice&gt;](QuestionChoice.md) |
| `metadata`          | string                                           |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
