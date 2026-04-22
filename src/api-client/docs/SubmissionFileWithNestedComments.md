# SubmissionFileWithNestedComments

Read-only serializer for SubmissionFile that nests full Comment objects (including rubricComment data) instead of returning comment IDs. Used by the console-data bulk endpoint to eliminate N+1 fetches.

## Properties

| Name                  | Type                                                   |
| --------------------- | ------------------------------------------------------ |
| `name`                | string                                                 |
| `data`                | string                                                 |
| `extension`           | string                                                 |
| `submission`          | number                                                 |
| `id`                  | number                                                 |
| `comments`            | [Array&lt;CommentWithRubric&gt;](CommentWithRubric.md) |
| `path`                | string                                                 |
| `hiddenBeforePublish` | boolean                                                |
| `created`             | string                                                 |
| `modified`            | string                                                 |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
