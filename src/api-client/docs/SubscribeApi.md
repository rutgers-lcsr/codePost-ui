# SubscribeApi

All URIs are relative to _http://localhost_

| Method                               | HTTP request         | Description |
| ------------------------------------ | -------------------- | ----------- |
| [**create**](SubscribeApi.md#create) | **POST** /subscribe/ |             |

## create

> SubscribeToEmailListResponse create(subscribeToEmailListRequest)

### Example

```ts
import {
  Configuration,
  SubscribeApi,
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
    // Configure HTTP bearer authorization: jwtAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new SubscribeApi(config);

  const body = {
    // SubscribeToEmailListRequest
    subscribeToEmailListRequest: ...,
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

| Name                            | Type                                                          | Description | Notes |
| ------------------------------- | ------------------------------------------------------------- | ----------- | ----- |
| **subscribeToEmailListRequest** | [SubscribeToEmailListRequest](SubscribeToEmailListRequest.md) |             |       |

### Return type

[**SubscribeToEmailListResponse**](SubscribeToEmailListResponse.md)

### Authorization

[basicAuth](../README.md#basicAuth), [tokenAuth](../README.md#tokenAuth), [cookieAuth](../README.md#cookieAuth), [jwtAuth](../README.md#jwtAuth)

### HTTP request headers

- **Content-Type**: `application/json`, `application/x-www-form-urlencoded`, `multipart/form-data`
- **Accept**: `application/json`

### HTTP response details

| Status code | Description | Response headers |
| ----------- | ----------- | ---------------- |
| **200**     |             | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
