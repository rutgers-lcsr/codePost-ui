# OrganizationAISettings

Serializer for organization-level AI configuration.

## Properties

| Name                 | Type                                        |
| -------------------- | ------------------------------------------- | ------------ | ------------ |
| `id`                 | number                                      |
| `aiProvider`         | string                                      |
| `aiApiKey`           | string                                      |
| `aiBaseUrl`          | string                                      |
| `aiModel`            | string                                      |
| `aiDisabled`         | boolean                                     |
| `aiCommentsDisabled` | boolean                                     |
| `aiCoursePolicy`     | [AiCoursePolicyEnum](AiCoursePolicyEnum.md) |
| `aiEnabledCourseIds` | Array&lt;number&gt;                         |
| `aiTokenRates`       | any                                         |
| `aiEnabled`          | boolean                                     |
| `aiCommentsEnabled`  | boolean                                     |
| `hasApiKey`          | boolean                                     |
| `apiKeyHint`         | string                                      |
| `defaultTokenRates`  | { [key: string]: { [key: string]: any       | undefined; } | undefined; } |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
