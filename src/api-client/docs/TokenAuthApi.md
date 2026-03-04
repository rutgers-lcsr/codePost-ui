# TokenAuthApi

All URIs are relative to _http://localhost_

| Method                               | HTTP request          | Description |
| ------------------------------------ | --------------------- | ----------- |
| [**create**](TokenAuthApi.md#create) | **POST** /token-auth/ |             |

## create

> JWT create(jWT)

Takes a set of user credentials and returns a sliding JSON web token to prove the authentication of those credentials.

### Example

```ts
import {
  Configuration,
  TokenAuthApi,
} from '';
import type { CreateRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new TokenAuthApi();

  const body = {
    // JWT
    jWT: ...,
  } satisfies CreateRequest;

  try {
    const data = await api.create(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name    | Type          | Description | Notes |
| ------- | ------------- | ----------- | ----- |
| **jWT** | [JWT](JWT.md) |             |       |

### Return type

[**JWT**](JWT.md)

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
