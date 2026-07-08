# QuizGeneratedSection

A per-student generation config on a quiz: an instructor-authored prompt template, question count, and points per question. The prompt is strictly validated on save (unknown {variables} are rejected with helpful messages).

## Properties

| Name                | Type   |
| ------------------- | ------ |
| `id`                | number |
| `quiz`              | number |
| `name`              | string |
| `systemPrompt`      | string |
| `numQuestions`      | number |
| `pointsPerQuestion` | number |
| `questionTypes`     | any    |
| `sortKey`           | number |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
