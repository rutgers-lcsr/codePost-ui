# TokenVerifyApi

All URIs are relative to _http://localhost_

| Method                                 | HTTP request            | Description |
| -------------------------------------- | ----------------------- | ----------- |
| [**create**](TokenVerifyApi.md#create) | **POST** /token-verify/ |             |

## create

> TokenVerify create(tokenVerify)

Takes a token and indicates if it is valid. This view provides no information about a token\&#39;s fitness for a particular use.

### Example

```ts
import {
  Configuration,
  TokenVerifyApi,
} from '';
import type { CreateRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const config = new Configuration({
    // To configure HTTP basic authorization: basicAuth
    username: "YOUR USERNAME",
    password: "YOUR PASSWORD",
    // To configure API key authorization: tokenAuth
    apiKey: "YOUR API KEY",
    // To configure API key authorization: cookieAuth
    apiKey: "YOUR API KEY",
  });
  const api = new TokenVerifyApi(config);

  const body = {
    // TokenVerify
    tokenVerify: ...,
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

| Name            | Type                          | Description | Notes |
| --------------- | ----------------------------- | ----------- | ----- |
| **tokenVerify** | [TokenVerify](TokenVerify.md) |             |       |

### Return type

[**TokenVerify**](TokenVerify.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth)

### HTTP request headers

- **Content-Type**: `application/json`, `application/x-www-form-urlencoded`, `multipart/form-data`
- **Accept**: `application/json`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
