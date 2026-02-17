# TokenVerifyApi

All URIs are relative to _http://localhost_

| Method                                             | HTTP request            | Description |
| -------------------------------------------------- | ----------------------- | ----------- |
| [**verifyCreate**](TokenVerifyApi.md#verifycreate) | **POST** /token-verify/ |             |

## verifyCreate

> TokenVerify verifyCreate(tokenVerify)

Takes a token and indicates if it is valid. This view provides no information about a token\&#39;s fitness for a particular use.

### Example

```ts
import {
  Configuration,
  TokenVerifyApi,
} from '';
import type { VerifyCreateRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new TokenVerifyApi();

  const body = {
    // TokenVerify
    tokenVerify: ...,
  } satisfies VerifyCreateRequest;

  try {
    const data = await api.verifyCreate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name            | Type                          | Description | Notes |
| --------------- | ----------------------------- | ----------- | ----- |
| **tokenVerify** | [TokenVerify](TokenVerify.md) |             |       |

### Return type

[**TokenVerify**](TokenVerify.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: `application/json`, `application/x-www-form-urlencoded`, `multipart/form-data`
- **Accept**: `application/json`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
