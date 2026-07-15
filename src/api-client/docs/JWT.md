# JWT

Password-login serializer issuing an access + refresh pair. Extends the standard pair serializer to attach codePost\'s custom claims and to embed the serialized user (and a backward-compatible `token` alias for the access token) in the response.

## Properties

| Name       | Type   |
| ---------- | ------ |
| `username` | string |
| `password` | string |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
