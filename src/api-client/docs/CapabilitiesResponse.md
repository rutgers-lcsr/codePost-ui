# CapabilitiesResponse

Serializer for the capabilities endpoint. Returns `{ \"capabilitiesMap\": { cap_key: bool, ... } }`. The field is named in camelCase so the API response matches the generated TypeScript client property name (no camelCase renderer middleware is installed).

## Properties

| Name              | Type                                                                          |
| ----------------- | ----------------------------------------------------------------------------- |
| `capabilitiesMap` | [CapabilitiesResponseCapabilitiesMap](CapabilitiesResponseCapabilitiesMap.md) |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
