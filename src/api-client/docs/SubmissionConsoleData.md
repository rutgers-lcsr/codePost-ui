# SubmissionConsoleData

Bulk serializer for the code console. Returns the full nested tree: submission → files → comments (with rubricComment data). Eliminates the N+1 fetch waterfall on the frontend.

## Properties

| Name                 | Type                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------ |
| `id`                 | number                                                                               |
| `assignment`         | number                                                                               |
| `students`           | Array&lt;string&gt;                                                                  |
| `grader`             | string                                                                               |
| `isFinalized`        | boolean                                                                              |
| `dateEdited`         | string                                                                               |
| `grade`              | number                                                                               |
| `queueOrderKey`      | number                                                                               |
| `dateUploaded`       | string                                                                               |
| `files`              | [Array&lt;SubmissionFileWithNestedComments&gt;](SubmissionFileWithNestedComments.md) |
| `tests`              | Array&lt;number&gt;                                                                  |
| `questionIsOpen`     | boolean                                                                              |
| `questionIsRegrade`  | boolean                                                                              |
| `questionText`       | string                                                                               |
| `questionDate`       | string                                                                               |
| `responseDate`       | string                                                                               |
| `testRunsCompleted`  | number                                                                               |
| `lateDayCreditsUsed` | number                                                                               |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
