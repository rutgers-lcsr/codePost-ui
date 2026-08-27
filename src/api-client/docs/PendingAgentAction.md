# PendingAgentAction

Dashboard rows for Tier-3 agent confirmations. The plan describes a destructive operation in instructor-only detail, so this serializer must only ever be reachable by a human course admin.

## Properties

| Name          | Type                                                            |
| ------------- | --------------------------------------------------------------- |
| `id`          | number                                                          |
| `tool`        | string                                                          |
| `plan`        | string                                                          |
| `status`      | [PendingAgentActionStatusEnum](PendingAgentActionStatusEnum.md) |
| `expiresAt`   | string                                                          |
| `requestedBy` | string                                                          |
| `created`     | string                                                          |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
