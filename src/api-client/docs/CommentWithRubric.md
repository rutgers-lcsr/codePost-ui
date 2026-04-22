# CommentWithRubric

Read-only comment serializer that nests the full RubricComment object instead of just returning its ID. Used by the console-data bulk endpoint to eliminate the N+1 rubricComment fetch waterfall.

## Properties

| Name            | Type                              |
| --------------- | --------------------------------- |
| `id`            | number                            |
| `text`          | string                            |
| `pointDelta`    | number                            |
| `startChar`     | number                            |
| `endChar`       | number                            |
| `startLine`     | number                            |
| `endLine`       | number                            |
| `file`          | number                            |
| `rubricComment` | [RubricComment](RubricComment.md) |
| `author`        | string                            |
| `feedback`      | number                            |
| `color`         | string                            |
| `tags`          | Array&lt;string&gt;               |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
