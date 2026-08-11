# Assignment

Assignment Serializer from which all other Assignment Serializer subclasses inherit from

## Properties

| Name                               | Type                                                            |
| ---------------------------------- | --------------------------------------------------------------- |
| `id`                               | number                                                          |
| `name`                             | string                                                          |
| `state`                            | [AssignmentStateEnum](AssignmentStateEnum.md)                   |
| `effectiveState`                   | [AssignmentStateEnum](AssignmentStateEnum.md)                   |
| `publishedAt`                      | string                                                          |
| `publishAt`                        | string                                                          |
| `scheduledPublishRanAt`            | string                                                          |
| `isReleased`                       | boolean                                                         |
| `feedbackStatus`                   | [AssignmentFeedbackStatusEnum](AssignmentFeedbackStatusEnum.md) |
| `releaseFeedbackAt`                | string                                                          |
| `scheduledFeedbackReleaseRanAt`    | string                                                          |
| `feedbackReleased`                 | boolean                                                         |
| `course`                           | number                                                          |
| `rubricCategories`                 | Array&lt;number&gt;                                             |
| `allowStudentUpload`               | boolean                                                         |
| `allowStudentUploadWithPartners`   | boolean                                                         |
| `uploadDueDate`                    | string                                                          |
| `maxLateDays`                      | number                                                          |
| `liveFeedbackMode`                 | boolean                                                         |
| `allowLateUploads`                 | boolean                                                         |
| `environment`                      | number                                                          |
| `files`                            | Array&lt;number&gt;                                             |
| `fileTemplates`                    | Array&lt;number&gt;                                             |
| `maxStudentTestRuns`               | number                                                          |
| `sortKey`                          | number                                                          |
| `explanation`                      | string                                                          |
| `isVisible`                        | boolean                                                         |
| `hideFrom`                         | Array&lt;number&gt;                                             |
| `nudgeMode`                        | boolean                                                         |
| `lateDeductions`                   | any                                                             |
| `studentsCanSeeGraders`            | boolean                                                         |
| `dataSets`                         | Array&lt;number&gt;                                             |
| `points`                           | number                                                          |
| `hideGrades`                       | boolean                                                         |
| `anonymousGrading`                 | boolean                                                         |
| `hideGradersFromStudents`          | boolean                                                         |
| `commentFeedback`                  | boolean                                                         |
| `additiveGrading`                  | boolean                                                         |
| `allowRegradeRequests`             | boolean                                                         |
| `regradeInstructions`              | string                                                          |
| `regradeDeadline`                  | string                                                          |
| `forcedRubricMode`                 | boolean                                                         |
| `templateMode`                     | boolean                                                         |
| `collaborativeRubricMode`          | boolean                                                         |
| `gradersCanEditSubmissions`        | boolean                                                         |
| `testCategories`                   | Array&lt;number&gt;                                             |
| `showFrequentlyUsedRubricComments` | boolean                                                         |
| `aiSystemPrompt`                   | string                                                          |
| `aiSummaryPrompt`                  | string                                                          |
| `aiDescription`                    | string                                                          |
| `aiDescriptionLocked`              | boolean                                                         |
| `runFilesOnSubmit`                 | boolean                                                         |
| `runTestsOnSubmit`                 | boolean                                                         |
| `testsAffectGrade`                 | boolean                                                         |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
