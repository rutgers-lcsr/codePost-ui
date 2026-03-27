# CourseAISettings

Serializer for course AI configuration. Admin-only access.

## Properties

| Name                 | Type                                  |
| -------------------- | ------------------------------------- | ------------ | ------------ |
| `id`                 | number                                |
| `aiProvider`         | string                                |
| `aiApiKey`           | string                                |
| `aiBaseUrl`          | string                                |
| `aiModel`            | string                                |
| `aiDisabled`         | boolean                               |
| `aiCommentsDisabled` | boolean                               |
| `aiChatDisabled`     | boolean                               |
| `aiUseOwnSettings`   | boolean                               |
| `aiTokenRates`       | any                                   |
| `aiEnabled`          | boolean                               |
| `aiCommentsEnabled`  | boolean                               |
| `aiChatEnabled`      | boolean                               |
| `orgAiAvailable`     | boolean                               |
| `hasApiKey`          | boolean                               |
| `apiKeyHint`         | string                                |
| `defaultTokenRates`  | { [key: string]: { [key: string]: any | undefined; } | undefined; } |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
